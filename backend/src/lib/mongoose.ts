import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from './logger';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || env.DATABASE_URL;
    if (!mongoUri) {
      throw new Error('MONGODB_URI or DATABASE_URL is not defined in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    logger.info('MongoDB connected successfully via Mongoose');
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to connect to MongoDB');
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};
