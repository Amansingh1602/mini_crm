import { Request, Response } from 'express';
import { CampaignService } from '../services/campaign.service';
import { NotFoundError, AppError } from '../middleware/error';

export class CampaignController {
  static async generate(req: Request, res: Response) {
    const { goal, audienceId } = req.body;
    const data = await CampaignService.generateCampaign(goal, audienceId);
    if (!data) {
      throw new NotFoundError('Audience', audienceId);
    }
    res.status(201).json({ success: true, data });
  }

  static async autonomous(req: Request, res: Response) {
    const { goal } = req.body;
    const data = await CampaignService.autonomousAgent(goal);
    res.status(201).json({ success: true, data });
  }

  static async getAll(_req: Request, res: Response) {
    const data = await CampaignService.getAllCampaigns();
    res.json({ success: true, data });
  }

  static async getById(req: Request, res: Response) {
    const data = await CampaignService.getCampaignById(req.params.id);
    if (!data) throw new NotFoundError('Campaign', req.params.id);
    res.json({ success: true, data });
  }

  static async approve(req: Request, res: Response) {
    const result = await CampaignService.approveCampaign(req.params.id);
    if (result.status === 404) throw new NotFoundError('Campaign', req.params.id);
    if (result.status === 400) throw new AppError(400, result.message!);
    res.json({ success: true, data: result.campaign });
  }

  static async launch(req: Request, res: Response) {
    const result = await CampaignService.launchCampaign(req.params.id);
    if (result.status === 404) throw new NotFoundError('Campaign', req.params.id);
    if (result.status === 400) throw new AppError(400, result.message!);
    res.json({ success: true, data: result.data });
  }

  static async insights(req: Request, res: Response) {
    const data = await CampaignService.generateInsights(req.params.id);
    res.json({ success: true, data });
  }
}
