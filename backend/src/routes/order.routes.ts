import { Router } from 'express';
import { z } from 'zod';
import { Order } from '../models/Order';
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

router.get(
  '/',
  validate(orderQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, customerId, category, sortBy, sortOrder } = req.query as any;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (category) where.category = { $regex: new RegExp(`^${category}$`, 'i') };

    const sortConfig: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [orders, total] = await Promise.all([
      Order.find(where)
        .sort(sortConfig)
        .skip(skip)
        .limit(limit)
        .populate('customerId', 'name email'),
      Order.countDocuments(where),
    ]);

    const formattedOrders = orders.map(order => {
      const obj = order.toObject() as any;
      obj.customer = obj.customerId;
      delete obj.customerId;
      return obj;
    });

    res.json({
      success: true,
      data: formattedOrders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [totalOrders, amountAgg, categoryStats] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, totalAmount: { $sum: "$amount" } } }]),
      Order.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 }, sumAmount: { $sum: "$amount" }, avgAmount: { $avg: "$amount" } } },
        { $sort: { sumAmount: -1 } },
        { $project: { category: "$_id", _count: "$count", _sum: { amount: "$sumAmount" }, _avg: { amount: "$avgAmount" }, _id: 0 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: amountAgg.length > 0 ? amountAgg[0].totalAmount : 0,
        categories: categoryStats,
      },
    });
  })
);

export default router;
