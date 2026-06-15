import dotenv from 'dotenv';
dotenv.config();

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3001',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Groq AI
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_BASE_URL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

  // Auth Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'xeno-crm-super-secret-key-change-me',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
} as const;

// Validate required env vars
export function validateEnv(): void {
  const required = ['DATABASE_URL'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`⚠️  Missing env vars: ${missing.join(', ')}. Some features may not work.`);
  }
}
