import dotenv from 'dotenv';
dotenv.config();

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',

  // Channel Service
  CHANNEL_SERVICE_URL: process.env.CHANNEL_SERVICE_URL || 'http://localhost:3002',

  // CRM Callback URL (for channel service to call back)
  CRM_CALLBACK_URL: process.env.CRM_CALLBACK_URL || 'http://localhost:3001/api/receipts',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
} as const;

// Validate required env vars
export function validateEnv(): void {
  const required = ['DATABASE_URL'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`ΓÜá∩╕Å  Missing env vars: ${missing.join(', ')}. Some features may not work.`);
  }
}
