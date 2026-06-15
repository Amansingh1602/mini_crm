import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { simulateDelivery, channelStats, SendRequest } from '../lib/channel/simulator';
import { logger } from '../lib/logger';

const router = Router();

// ─── Validation Schema ────────────────────────────────────

const sendSchema = z.object({
  communicationId: z.string(),
  campaignId: z.string(),
  customerId: z.string(),
  channel: z.enum(['WHATSAPP', 'SMS', 'EMAIL', 'RCS']),
  message: z.string(),
  recipient: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    name: z.string().optional(),
  }),
  callbackUrl: z.string().url().optional(),
});

// ─── Routes ───────────────────────────────────────────────

// Health check for channel service
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'xeno-channel-service',
    timestamp: new Date().toISOString(),
    stats: channelStats,
  });
});

// POST /send — Accept communication for simulated delivery
router.post('/send', async (req: Request, res: Response) => {
  try {
    const data = sendSchema.parse(req.body);

    channelStats.totalReceived++;
    channelStats.activeSimulations++;

    logger.info(
      { communicationId: data.communicationId, channel: data.channel, recipient: data.recipient.name },
      'Communication accepted for delivery simulation'
    );

    // Start async simulation (non-blocking)
    simulateDelivery(data as SendRequest).finally(() => {
      channelStats.activeSimulations--;
      channelStats.totalCompleted++;
    });

    // Return immediately — simulation happens in background
    res.status(202).json({
      success: true,
      message: 'Communication accepted for delivery',
      communicationId: data.communicationId,
      channel: data.channel,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: err.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: err.message || 'Internal server error',
      });
    }
  }
});

export default router;
