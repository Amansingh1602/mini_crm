import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { logger } from './logger';

let io: Server | null = null;

export function initSocket(server: HttpServer): void {
  io = new Server(server, {
    cors: {
      origin: (env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, ''),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info({ socketId: socket.id }, 'Client connected to WebSocket');

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client disconnected from WebSocket');
    });
  });

  logger.info('WebSocket server initialized');
}

export function emitAnalyticsUpdate(campaignId: string): void {
  if (!io) {
    logger.warn('Socket.io not initialized, skipping analytics update emit');
    return;
  }
  
  // Emitting to all connected clients that the analytics for this campaign have updated
  io.emit('campaignAnalyticsUpdated', { campaignId });
  logger.debug({ campaignId }, 'Emitted campaignAnalyticsUpdated event');
}
