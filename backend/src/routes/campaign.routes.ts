import { Router } from 'express';
import { z } from 'zod';
import { Campaign } from '../models/Campaign';
import { Audience } from '../models/Audience';
import { Customer } from '../models/Customer';
import { Communication } from '../models/Communication';
import { CampaignAnalytics } from '../models/CampaignAnalytics';
import { CampaignInsight } from '../models/CampaignInsight';
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
      const audience = await Audience.findById(audienceId);
      if (!audience) throw new NotFoundError('Audience', audienceId);
      audienceContext = {
        name: audience.name,
        count: audience.customerCount,
        filters: audience.filters,
        reasoning: audience.reasoning,
      };
    }

    const result = await generateCampaign(goal, audienceContext);

    let finalAudienceId = audienceId;
    if (!finalAudienceId) {
      const audience = await Audience.create({
        name: `Auto: ${result.title}`,
        description: `Auto-generated for campaign: ${result.title}`,
        filters: "{}",
        reasoning: result.audienceReasoning || "Auto-generated",
        customerCount: 0,
      });
      finalAudienceId = audience._id;
    }

    const campaign = await Campaign.create({
      audienceId: finalAudienceId,
      title: result.title,
      goal,
      offer: result.offer,
      message: result.message,
      cta: result.cta,
      channel: result.channel,
      status: 'DRAFT',
      predictedMetrics: result.predictedMetrics,
      audienceReasoning: result.audienceReasoning,
      messageReasoning: result.messageReasoning,
      channelReasoning: result.channelReasoning,
      offerReasoning: result.offerReasoning,
    });

    const populatedCampaign = await campaign.populate('audienceId');

    res.status(201).json({ success: true, data: populatedCampaign });
  })
);

router.post(
  '/autonomous',
  aiLimiter,
  validate(z.object({ goal: z.string().min(5).max(500) })),
  asyncHandler(async (req, res) => {
    const { goal } = req.body;

    logger.info({ goal }, '🤖 Autonomous Campaign Agent activated');

    const result = await autonomousCampaignAgent(goal);

    const audience = await Audience.create({
      name: result.audience.name,
      description: result.audience.description,
      filters: result.audience.filters,
      reasoning: result.audience.reasoning,
      customerCount: result.audience.estimatedCount,
    });

    const campaign = await Campaign.create({
      audienceId: audience._id,
      title: result.campaign.title,
      goal,
      offer: result.campaign.offer,
      message: result.campaign.message,
      cta: result.campaign.cta,
      channel: result.campaign.channel,
      status: 'DRAFT',
      predictedMetrics: result.campaign.predictedMetrics,
      audienceReasoning: result.campaign.audienceReasoning,
      messageReasoning: result.campaign.messageReasoning,
      channelReasoning: result.campaign.channelReasoning,
      offerReasoning: result.campaign.offerReasoning,
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

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const campaigns = await Campaign.find()
      .sort({ createdAt: -1 })
      .populate('audienceId', 'name customerCount');

    const formattedCampaigns = await Promise.all(campaigns.map(async (camp) => {
      const obj = camp.toObject() as any;
      obj.audience = obj.audienceId;
      delete obj.audienceId;
      
      const analytics = await CampaignAnalytics.findOne({ campaignId: camp._id });
      obj.analytics = analytics;

      const commCount = await Communication.countDocuments({ campaignId: camp._id });
      obj._count = { communications: commCount };
      
      return obj;
    }));

    res.json({ success: true, data: formattedCampaigns });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const campaign = await Campaign.findById(req.params.id)
      .populate('audienceId');

    if (!campaign) throw new NotFoundError('Campaign', req.params.id);

    const obj = campaign.toObject() as any;
    obj.audience = obj.audienceId;
    delete obj.audienceId;

    obj.analytics = await CampaignAnalytics.findOne({ campaignId: campaign._id });
    obj.insights = await CampaignInsight.find({ campaignId: campaign._id }).sort({ createdAt: -1 });
    obj._count = { communications: await Communication.countDocuments({ campaignId: campaign._id }) };

    res.json({ success: true, data: obj });
  })
);

router.post(
  '/:id/approve',
  asyncHandler(async (req, res) => {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) throw new NotFoundError('Campaign', req.params.id);
    if (campaign.status !== 'DRAFT') {
      throw new AppError(400, `Campaign cannot be approved — current status: ${campaign.status}`);
    }

    campaign.status = 'APPROVED';
    await campaign.save();

    res.json({ success: true, data: campaign });
  })
);

router.post(
  '/:id/launch',
  asyncHandler(async (req, res) => {
    const campaign = await Campaign.findById(req.params.id).populate('audienceId');

    if (!campaign) throw new NotFoundError('Campaign', req.params.id);
    if (campaign.status !== 'APPROVED') {
      throw new AppError(400, `Campaign must be APPROVED to launch. Current: ${campaign.status}`);
    }

    const audience = campaign.audienceId as any;
    const whereClause = buildWhereClause(audience.filters);
    const customers = await Customer.find(whereClause).select('name email phone');

    if (customers.length === 0) {
      throw new AppError(400, 'No customers match the audience filters');
    }

    campaign.status = 'RUNNING';
    campaign.launchedAt = new Date();
    await campaign.save();

    await CampaignAnalytics.findOneAndUpdate(
      { campaignId: campaign._id },
      { $setOnInsert: { campaignId: campaign._id }, $set: { total: customers.length } },
      { upsert: true, new: true }
    );

    const sendQueue = getSendQueue();
    let enqueued = 0;

    for (const customer of customers) {
      const personalizedMessage = campaign.message.replace(/\{\{name\}\}/gi, customer.name);

      const communication = await Communication.create({
        campaignId: campaign._id,
        customerId: customer._id,
        channel: campaign.channel,
        message: personalizedMessage,
        status: 'PENDING',
      });

      await sendQueue.add(
        'send',
        {
          communicationId: communication._id,
          campaignId: campaign._id,
          customerId: customer._id,
          channel: campaign.channel,
          message: personalizedMessage,
          customerEmail: customer.email,
          customerPhone: customer.phone || '',
          customerName: customer.name,
        },
        {
          jobId: `send-${communication._id}`,
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

router.post(
  '/:id/insights',
  aiLimiter,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await generateInsights(id);

    for (const insight of result.insights) {
      await CampaignInsight.create({
        campaignId: id,
        insight: insight.insight,
        category: insight.category,
        severity: insight.severity,
        recommendation: insight.recommendation,
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
