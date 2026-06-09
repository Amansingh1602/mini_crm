import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, validate, NotFoundError } from '../middleware/error';
import { aiLimiter } from '../middleware/rateLimit';
import { generateAudience, buildWhereClause } from '../services/ai.service';
import { logger } from '../lib/logger';

const router = Router();

// ─── POST /api/audiences/generate ─────────────────────────
// AI Audience Builder — Natural language → audience

router.post(
  '/generate',
  aiLimiter,
  validate(z.object({ query: z.string().min(5).max(500) })),
  asyncHandler(async (req, res) => {
    const { query } = req.body;

    logger.info({ query }, 'Generating audience from natural language');

    const result = await generateAudience(query);

    // Persist audience
    const audience = await prisma.audience.create({
      data: {
        name: result.name,
        description: result.description,
        filters: result.filters as any,
        reasoning: result.reasoning,
        customerCount: result.estimatedCount,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...audience,
        estimatedCount: result.estimatedCount,
      },
    });
  })
);

// ─── GET /api/audiences ───────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const audiences = await prisma.audience.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { campaigns: true } } },
    });

    res.json({ success: true, data: audiences });
  })
);

// ─── GET /api/audiences/:id ──────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const audience = await prisma.audience.findUnique({
      where: { id: req.params.id },
      include: { campaigns: { orderBy: { createdAt: 'desc' } } },
    });

    if (!audience) throw new NotFoundError('Audience', req.params.id);

    // Fetch matching customers
    const whereClause = buildWhereClause(audience.filters as any);
    const customers = await prisma.customer.findMany({
      where: whereClause,
      take: 50,
      orderBy: { totalSpent: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        totalSpent: true,
        lastPurchaseDate: true,
      },
    });

    const totalCount = await prisma.customer.count({ where: whereClause });

    res.json({
      success: true,
      data: {
        ...audience,
        customerCount: totalCount,
        sampleCustomers: customers,
      },
    });
  })
);

// ─── DELETE /api/audiences/:id ────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.audience.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Audience deleted' });
  })
);

export default router;
