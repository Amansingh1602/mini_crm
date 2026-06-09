import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import { z } from 'zod';
import { config } from './config';
import { simulateDelivery } from './simulator';

const app = express();

const logger = pino({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: config.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' } }
    : undefined,
  base: { service: 'xeno-channel' },
});

// ─── Middleware ────────────────────────────────────────────

app.use(helmet());
app.use(cors());
app.use(express.json());

// ─── Request Logging ──────────────────────────────────────

app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'Channel service request');
  next();
});

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

// ─── Metrics ──────────────────────────────────────────────

let stats = {
  totalReceived: 0,
  activeSimulations: 0,
  totalCompleted: 0,
};

// ─── Routes ───────────────────────────────────────────────

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'xeno-channel-service',
    timestamp: new Date().toISOString(),
    stats,
  });
});

// POST /send — Accept communication for simulated delivery
app.post('/send', async (req, res) => {
  try {
    const data = sendSchema.parse(req.body);

    stats.totalReceived++;
    stats.activeSimulations++;

    logger.info(
      { communicationId: data.communicationId, channel: data.channel, recipient: data.recipient.name },
      'Communication accepted for delivery simulation'
    );

    // Start async simulation (non-blocking)
    simulateDelivery(data).finally(() => {
      stats.activeSimulations--;
      stats.totalCompleted++;
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
      logger.error({ err }, 'Send endpoint error');
      res.status(500).json({ success: false, error: 'Internal error' });
    }
  }
});

// GET /stats — Service metrics
app.get('/stats', (_req, res) => {
  res.json({ success: true, data: stats });
});

// ─── Start Server ─────────────────────────────────────────

app.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, '📡 Xeno Channel Service running');
});

export default app;
