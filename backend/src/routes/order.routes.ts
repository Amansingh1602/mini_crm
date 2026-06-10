import { Router } from 'express';
import { z } from 'zod';
import { OrderController } from '../controllers/order.controller';
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

router.get('/', validate(orderQuerySchema, 'query'), asyncHandler(OrderController.getAll));
router.get('/stats', asyncHandler(OrderController.getStats));

export default router;
