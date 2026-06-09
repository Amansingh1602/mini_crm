import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, validate, NotFoundError, AppError } from '../middleware/error';
import { aiLimiter } from '../middleware/rateLimit';
import {
  generateCampaign,
  autonomousCampaignAgent,
  generateInsights,
  buildWhereClause,
} from '../services/ai.service';
import { getSendQueue } from '../queues/workers';
import { logger } from '../lib/logger';

const router = Router();

// ─── POST /api/campaigns/generate ─────────────────────────
// AI Campaign Generator — goal → campaign draft

router.post(
  '/generate',
  aiLimiter,
  validate(
    z.object({
      goal: z.string().min(5).max(500),
      audienceId: z.string().optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const { goal, audienceId } = req.body;

    let audienceContext;
    if (audienceId) {
      const audience = await prisma.audience.findUnique({ where: { id: audienceId } });
      if (!audience) throw new NotFoundError('Audience', audienceId);
      audienceContext = {
        name: audience.name,
        count: audience.customerCount,
        filters: audience.filters as any,
        reasoning: audience.reasoning,
      };
    }

    const result = await generateCampaign(goal, audienceContext);

    // Need an audience — use provided or create one
    let finalAudienceId = audienceId;
    if (!finalAudienceId) {
      // Create a default audience if none provided
      const audience = await prisma.audience.create({
        data: {
          name: `Auto: ${result.title}`,
          description: `Auto-generated for campaign: ${result.title}`,
          filters: {},
          reasoning: result.audienceReasoning,
          customerCount: 0,
        },
      });
      finalAudienceId = audience.id;
    }

    const campaign = await prisma.campaign.create({
      data: {
        audienceId: finalAudienceId!,
        title: result.title,
        goal,
        offer: result.offer,
        message: result.message,
        cta: result.cta,
        channel: result.channel,
        status: 'DRAFT',
        predictedMetrics: result.predictedMetrics as any,
        audienceReasoning: result.audienceReasoning,
        messageReasoning: result.messageReasoning,
        channelReasoning: result.channelReasoning,
        offerReasoning: result.offerReasoning,
      },
      include: { audience: true },
    });

    res.status(201).json({ success: true, data: campaign });
  })
);

// ─── POST /api/campaigns/autonomous ───────────────────────
// Flagship: Single goal → full campaign pipeline

router.post(
  '/autonomous',
  aiLimiter,
  validate(z.object({ goal: z.string().min(5).max(500) })),
  asyncHandler(async (req, res) => {
    const { goal } = req.body;

    logger.info({ goal }, '🤖 Autonomous Campaign Agent activated');

    const result = await autonomousCampaignAgent(goal);

    // Persist audience
    const audience = await prisma.audience.create({
      data: {
        name: result.audience.name,
        description: result.audience.description,
        filters: result.audience.filters as any,
        reasoning: result.audience.reasoning,
        customerCount: result.audience.estimatedCount,
      },
    });

    // Persist campaign
    const campaign = await prisma.campaign.create({
      data: {
        audienceId: audience.id,
        title: result.campaign.title,
        goal,
        offer: result.campaign.offer,
        message: result.campaign.message,
        cta: result.campaign.cta,
        channel: result.campaign.channel,
        status: 'DRAFT',
        predictedMetrics: result.campaign.predictedMetrics as any,
        audienceReasoning: result.campaign.audienceReasoning,
        messageReasoning: result.campaign.messageReasoning,
        channelReasoning: result.campaign.channelReasoning,
        offerReasoning: result.campaign.offerReasoning,
      },
      include: { audience: true },
    });

    logger.info({ campaignId: campaign.id, audience: audience.name }, '🤖 Autonomous campaign created');

    res.status(201).json({
      success: true,
      data: {
        campaign,
        audience,
        aiReasoning: {
          audience: result.audience.reasoning,
          message: result.campaign.messageReasoning,
          channel: result.campaign.channelReasoning,
          offer: result.campaign.offerReasoning,
        },
      },
    });
  })
);

// ─── GET /api/campaigns ───────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        audience: { select: { name: true, customerCount: true } },
        analytics: true,
        _count: { select: { communications: true } },
      },
    });

    res.json({ success: true, data: campaigns });
  })
);

// ─── GET /api/campaigns/:id ──────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        audience: true,
        analytics: true,
        insights: { orderBy: { createdAt: 'desc' } },
        _count: { select: { communications: true } },
      },
    });

    if (!campaign) throw new NotFoundError('Campaign', req.params.id);

    res.json({ success: true, data: campaign });
  })
);

// ─── POST /api/campaigns/:id/approve ─────────────────────

router.post(
  '/:id/approve',
  asyncHandler(async (req, res) => {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
    });

    if (!campaign) throw new NotFoundError('Campaign', req.params.id);
    if (campaign.status !== 'DRAFT') {
      throw new AppError(400, `Campaign cannot be approved — current status: ${campaign.status}`);
    }

    const updated = await prisma.campaign.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED' },
    });

    res.json({ success: true, data: updated });
  })
);

// ─── POST /api/campaigns/:id/launch ──────────────────────

router.post(
  '/:id/launch',
  asyncHandler(async (req, res) => {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: { audience: true },
    });

    if (!campaign) throw new NotFoundError('Campaign', req.params.id);
    if (campaign.status !== 'APPROVED') {
      throw new AppError(400, `Campaign must be APPROVED to launch. Current: ${campaign.status}`);
    }

    // Get audience customers
    const whereClause = buildWhereClause(campaign.audience.filters as any);
    const customers = await prisma.customer.findMany({
      where: whereClause,
      select: { id: true, name: true, email: true, phone: true },
    });

    if (customers.length === 0) {
      throw new AppError(400, 'No customers match the audience filters');
    }

    // Update campaign status
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'RUNNING', launchedAt: new Date() },
    });

    // Initialize analytics
    await prisma.campaignAnalytics.upsert({
      where: { campaignId: campaign.id },
      create: { campaignId: campaign.id, total: customers.length },
      update: { total: customers.length },
    });

    // Create communications and enqueue send jobs
    const sendQueue = getSendQueue();
    let enqueued = 0;

    for (const customer of customers) {
      // Personalize message
      const personalizedMessage = campaign.message.replace(/\{\{name\}\}/gi, customer.name);

      // Create communication record
      const communication = await prisma.communication.create({
        data: {
          campaignId: campaign.id,
          customerId: customer.id,
          channel: campaign.channel,
          message: personalizedMessage,
          status: 'PENDING',
        },
      });

      // Enqueue send job
      await sendQueue.add(
        'send',
        {
          communicationId: communication.id,
          campaignId: campaign.id,
          customerId: customer.id,
          channel: campaign.channel,
          message: personalizedMessage,
          customerEmail: customer.email,
          customerPhone: customer.phone || '',
          customerName: customer.name,
        },
        {
          jobId: `send-${communication.id}`,
        }
      );

      enqueued++;
    }

    logger.info({ campaignId: campaign.id, enqueued }, 'Campaign launched');

    res.json({
      success: true,
      data: {
        campaignId: campaign.id,
        status: 'RUNNING',
        customersTargeted: customers.length,
        communicationsEnqueued: enqueued,
      },
    });
  })
);

// ─── POST /api/campaigns/:id/insights ────────────────────
// AI-powered campaign performance analysis

router.post(
  '/:id/insights',
  aiLimiter,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await generateInsights(id);

    // Persist insights
    for (const insight of result.insights) {
      await prisma.campaignInsight.create({
        data: {
          campaignId: id,
          insight: insight.insight,
          category: insight.category,
          severity: insight.severity,
          recommendation: insight.recommendation,
        },
      });
    }

    res.json({
      success: true,
      data: {
        insights: result.insights,
        nextCampaignSuggestion: result.nextCampaignSuggestion,
      },
    });
  })
);

export default router;
