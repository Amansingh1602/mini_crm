import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, validate } from '../middleware/error';

const router = Router();

const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  customerId: z.string().optional(),
  category: z.string().optional(),
  sortBy: z.enum(['amount', 'createdAt', 'category']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── GET /api/orders ──────────────────────────────────────

router.get(
  '/',
  validate(orderQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, customerId, category, sortBy, sortOrder } = req.query as any;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (category) where.category = { equals: category, mode: 'insensitive' };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { customer: { select: { name: true, email: true } } },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

// ─── GET /api/orders/stats ────────────────────────────────

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [totalOrders, totalRevenue, categoryStats] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { amount: true } }),
      prisma.order.groupBy({
        by: ['category'],
        _count: true,
        _sum: { amount: true },
        _avg: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: totalRevenue._sum.amount || 0,
        categories: categoryStats,
      },
    });
  })
);

export default router;
