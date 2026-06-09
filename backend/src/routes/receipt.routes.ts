import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate } from '../middleware/error';
import { getReceiptQueue } from '../queues/workers';
import { logger } from '../lib/logger';

const router = Router();

// ─── Receipt Schema ───────────────────────────────────────

const receiptSchema = z.object({
  communicationId: z.string(),
  campaignId: z.string(),
  type: z.enum(['SENT', 'DELIVERED', 'FAILED', 'OPENED', 'READ', 'CLICKED', 'PURCHASED']),
  timestamp: z.string().datetime(),
  idempotencyKey: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

const batchReceiptSchema = z.object({
  events: z.array(receiptSchema).min(1).max(100),
});

// ─── POST /api/receipts ───────────────────────────────────
// Receives delivery callbacks from Channel Service

router.post(
  '/',
  validate(receiptSchema),
  asyncHandler(async (req, res) => {
    const event = req.body;

    logger.info(
      { communicationId: event.communicationId, type: event.type, idempotencyKey: event.idempotencyKey },
      'Receipt received'
    );

    // Enqueue for reliable processing
    const queue = getReceiptQueue();
    await queue.add('process-receipt', event, {
      jobId: event.idempotencyKey, // Ensures idempotent queueing
    });

    res.status(202).json({
      success: true,
      message: 'Receipt accepted for processing',
      idempotencyKey: event.idempotencyKey,
    });
  })
);

// ─── POST /api/receipts/batch ─────────────────────────────
// Batch receipt processing for efficiency

router.post(
  '/batch',
  validate(batchReceiptSchema),
  asyncHandler(async (req, res) => {
    const { events } = req.body;

    const queue = getReceiptQueue();
    const results = [];

    for (const event of events) {
      try {
        await queue.add('process-receipt', event, {
          jobId: event.idempotencyKey,
        });
        results.push({ idempotencyKey: event.idempotencyKey, status: 'accepted' });
      } catch (err: any) {
        results.push({ idempotencyKey: event.idempotencyKey, status: 'failed', error: err.message });
      }
    }

    logger.info({ totalEvents: events.length }, 'Batch receipts processed');

    res.status(202).json({
      success: true,
      data: { processed: results.length, results },
    });
  })
);

export default router;
