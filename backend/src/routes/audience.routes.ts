import { Router } from 'express';
import { z } from 'zod';
import { Audience } from '../models/Audience';
import { Customer } from '../models/Customer';
import { Campaign } from '../models/Campaign';
import { asyncHandler, validate, NotFoundError } from '../middleware/error';
import { aiLimiter } from '../middleware/rateLimit';
import { generateAudience, buildWhereClause } from '../services/ai.service';
import { logger } from '../lib/logger';

const router = Router();

router.post(
  '/generate',
  aiLimiter,
  validate(z.object({ query: z.string().min(5).max(500) })),
  asyncHandler(async (req, res) => {
    const { query } = req.body;
    logger.info({ query }, 'Generating audience from natural language');
    const result = await generateAudience(query);

    const audience = await Audience.create({
      name: result.name,
      description: result.description,
      filters: result.filters,
      reasoning: result.reasoning,
      customerCount: result.estimatedCount,
    });

    res.status(201).json({
      success: true,
      data: {
        ...audience.toObject(),
        estimatedCount: result.estimatedCount,
      },
    });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const audiences = await Audience.find().sort({ createdAt: -1 });
    
    // We need to count campaigns for each audience
    const formattedAudiences = await Promise.all(audiences.map(async (aud) => {
      const obj = aud.toObject() as any;
      const count = await Campaign.countDocuments({ audienceId: aud._id });
      obj._count = { campaigns: count };
      return obj;
    }));

    res.json({ success: true, data: formattedAudiences });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const audience = await Audience.findById(req.params.id);
    if (!audience) throw new NotFoundError('Audience', req.params.id);

    const campaigns = await Campaign.find({ audienceId: audience._id }).sort({ createdAt: -1 });

    const whereClause = buildWhereClause(audience.filters as any);
    const customers = await Customer.find(whereClause)
      .sort({ totalSpent: -1 })
      .limit(50)
      .select('name email city totalSpent lastPurchaseDate');

    const totalCount = await Customer.countDocuments(whereClause);

    res.json({
      success: true,
      data: {
        ...audience.toObject(),
        campaigns,
        customerCount: totalCount,
        sampleCustomers: customers,
      },
    });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await Audience.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Audience deleted' });
  })
);

export default router;
