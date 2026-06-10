import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { CustomerController } from '../controllers/customer.controller';
import { asyncHandler, validate } from '../middleware/error';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const customerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  city: z.string().optional(),
  sortBy: z.enum(['name', 'totalSpent', 'lastPurchaseDate', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

router.get('/', validate(customerQuerySchema, 'query'), asyncHandler(CustomerController.getAll));
router.get('/:id', asyncHandler(CustomerController.getById));
router.post('/upload', upload.single('file'), asyncHandler(CustomerController.upload));
router.post('/seed', asyncHandler(CustomerController.seed));

export default router;
