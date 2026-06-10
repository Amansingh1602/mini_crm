import { Router } from 'express';
import { z } from 'zod';
import { CampaignController } from '../controllers/campaign.controller';
import { asyncHandler, validate } from '../middleware/error';
import { aiLimiter } from '../middleware/rateLimit';

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
  asyncHandler(CampaignController.generate)
);

router.post(
  '/autonomous',
  aiLimiter,
  validate(z.object({ goal: z.string().min(5).max(500) })),
  asyncHandler(CampaignController.autonomous)
);

router.get('/', asyncHandler(CampaignController.getAll));
router.get('/:id', asyncHandler(CampaignController.getById));
router.post('/:id/approve', asyncHandler(CampaignController.approve));
router.post('/:id/launch', asyncHandler(CampaignController.launch));

router.post(
  '/:id/insights',
  aiLimiter,
  asyncHandler(CampaignController.insights)
);

export default router;
