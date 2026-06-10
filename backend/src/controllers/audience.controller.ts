import { Request, Response } from 'express';
import { AudienceService } from '../services/audience.service';
import { NotFoundError } from '../middleware/error';

export class AudienceController {
  static async generate(req: Request, res: Response) {
    const { query } = req.body;
    const data = await AudienceService.generateAudienceFromQuery(query);
    res.status(201).json({ success: true, data });
  }

  static async getAll(_req: Request, res: Response) {
    const data = await AudienceService.getAllAudiences();
    res.json({ success: true, data });
  }

  static async getById(req: Request, res: Response) {
    const id = req.params.id as string;
    const data = await AudienceService.getAudienceById(id);
    if (!data) {
      throw new NotFoundError('Audience', id);
    }
    res.json({ success: true, data });
  }

  static async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    const deleted = await AudienceService.deleteAudience(id);
    if (!deleted) {
      throw new NotFoundError('Audience', id);
    }
    res.json({ success: true, message: 'Audience deleted' });
  }
}
