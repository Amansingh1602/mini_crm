import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/error';
import { logger } from './lib/logger';
import customerRoutes from './routes/customer.routes';
import orderRoutes from './routes/order.routes';
import audienceRoutes from './routes/audience.routes';
import campaignRoutes from './routes/campaign.routes';
import receiptRoutes from './routes/receipt.routes';
import analyticsRoutes from './routes/analytics.routes';

const app = express();

// ─── Security & Parsing ──────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logging ─────────────────────────────────────

app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

// ─── Rate Limiting ────────────────────────────────────────

app.use('/api/', apiLimiter);

// ─── Health Check ─────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'xeno-crm', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────

app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/audiences', audienceRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── 404 Handler ──────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' });
});

// ─── Error Handler ────────────────────────────────────────

app.use(errorHandler);

export default app;
