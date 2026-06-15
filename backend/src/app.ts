import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/error';
import { logger } from './lib/logger';
import { getDBStatus } from './lib/mongoose';
import customerRoutes from './routes/customer.routes';
import orderRoutes from './routes/order.routes';
import audienceRoutes from './routes/audience.routes';
import campaignRoutes from './routes/campaign.routes';
import receiptRoutes from './routes/receipt.routes';
import analyticsRoutes from './routes/analytics.routes';
import authRoutes from './routes/auth.routes';
import channelRoutes from './routes/channel.routes';
import { auth } from './middleware/auth';

const app = express();

// ΓöÇΓöÇΓöÇ Security & Parsing ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ΓöÇΓöÇΓöÇ Request Logging ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

// ΓöÇΓöÇΓöÇ Rate Limiting ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

app.use('/api/', apiLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  const db = getDBStatus();
  res.json({
    status: db.isConnected ? 'ok' : 'degraded',
    service: 'xeno-crm',
    database: db.isConnected ? 'connected' : 'disconnected',
    ...(db.connectionError ? { dbError: db.connectionError } : {}),
    timestamp: new Date().toISOString(),
  });
});

// ─── Database Status Middleware ───────────────────────────────────────────────

app.use('/api/', (req, res, next) => {
  const db = getDBStatus();
  if (!db.isConnected) {
    res.status(503).json({
      success: false,
      error: 'Database is currently unavailable. Please ensure your MongoDB Atlas IP whitelist includes your current IP address, then restart the backend.',
      code: 'DB_UNAVAILABLE',
      hint: 'Go to MongoDB Atlas → Network Access → Add your current IP',
    });
    return;
  }
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/customers', auth, customerRoutes);
app.use('/api/orders', auth, orderRoutes);
app.use('/api/audiences', auth, audienceRoutes);
app.use('/api/campaigns', auth, campaignRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/analytics', auth, analyticsRoutes);
app.use('/api/channel', channelRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' });
});

// ΓöÇΓöÇΓöÇ Error Handler ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

app.use(errorHandler);

export default app;
