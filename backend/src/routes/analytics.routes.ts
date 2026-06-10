import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { asyncHandler } from '../middleware/error';

const router = Router();

router.get('/dashboard', asyncHandler(AnalyticsController.getDashboard));
router.get('/campaigns/:id', asyncHandler(AnalyticsController.getCampaignAnalytics));
router.get('/channels', asyncHandler(AnalyticsController.getChannelAnalytics));

export default router;
