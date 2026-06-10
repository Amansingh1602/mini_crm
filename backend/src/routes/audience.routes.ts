import { Router } from 'express';
import { z } from 'zod';
import { AudienceController } from '../controllers/audience.controller';
import { asyncHandler, validate } from '../middleware/error';
import { aiLimiter } from '../middleware/rateLimit';

const router = Router();

router.post(
  '/generate',
  aiLimiter,
  validate(z.object({ query: z.string().min(5).max(500) })),
  asyncHandler(AudienceController.generate)
);

router.get('/', asyncHandler(AudienceController.getAll));
router.get('/:id', asyncHandler(AudienceController.getById));
router.delete('/:id', asyncHandler(AudienceController.delete));

export default router;
