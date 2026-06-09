import app from './app';
import { env, validateEnv } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { closeRedis } from './lib/redis';
import { startWorkers, stopWorkers } from './queues/workers';

async function main() {
  validateEnv();

  // Connect to database
  await prisma.$connect();
  logger.info('Database connected');

  // Start BullMQ workers
  try {
    await startWorkers();
    logger.info('Queue workers started');
  } catch (err) {
    logger.warn({ err }, 'Queue workers failed to start (Redis may not be available)');
  }

  // Start server
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, '🚀 Xeno CRM API running');
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down gracefully...');
    
    server.close(async () => {
      await stopWorkers();
      await closeRedis();
      await prisma.$disconnect();
      logger.info('All connections closed');
      process.exit(0);
    });

    // Force shutdown after 10s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
