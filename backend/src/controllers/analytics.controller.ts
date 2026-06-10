import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { NotFoundError } from '../middleware/error';

export class AnalyticsController {
  static async getDashboard(_req: Request, res: Response) {
    const data = await AnalyticsService.getDashboardMetrics();
    res.json({ success: true, data });
  }

  static async getCampaignAnalytics(req: Request, res: Response) {
    const data = await AnalyticsService.getCampaignAnalytics(req.params.id);
    if (!data) {
      throw new NotFoundError('Campaign', req.params.id);
    }
    res.json({ success: true, data });
  }

  static async getChannelAnalytics(_req: Request, res: Response) {
    const data = await AnalyticsService.getChannelAnalytics();
    res.json({ success: true, data });
  }
}
