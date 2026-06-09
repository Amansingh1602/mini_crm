import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

// Stricter limit for AI endpoints (cost-sensitive)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'AI request limit exceeded. Please wait before trying again.',
    code: 'AI_RATE_LIMIT_EXCEEDED',
  },
});
