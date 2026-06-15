import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from './logger';

let isConnected = false;
let connectionError: string | null = null;

export const getDBStatus = () => ({ isConnected, connectionError });

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || env.DATABASE_URL;
  if (!mongoUri) {
    connectionError = 'MONGODB_URI or DATABASE_URL is not defined in environment variables';
    logger.error(connectionError);
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    isConnected = true;
    connectionError = null;
    logger.info('MongoDB connected successfully via Mongoose');
  } catch (error: any) {
    isConnected = false;
    connectionError = error.message || 'Failed to connect to MongoDB';
    logger.error({ err: error }, 'Failed to connect to MongoDB — server will start without DB');
  }

  // Listen for disconnect/reconnect events
  mongoose.connection.on('connected', () => {
    isConnected = true;
    connectionError = null;
    logger.info('MongoDB reconnected');
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    isConnected = false;
    connectionError = err.message;
    logger.error({ err }, 'MongoDB connection error');
  });
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  }
};
