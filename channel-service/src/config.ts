import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || '3002', 10),
  CRM_CALLBACK_URL: process.env.CRM_CALLBACK_URL || 'http://localhost:3001/api/receipts',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
