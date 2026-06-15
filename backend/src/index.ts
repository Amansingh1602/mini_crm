import { createServer } from 'http';
import app from './app';
import { env, validateEnv } from './config/env';
import { logger } from './lib/logger';
import { connectDB, disconnectDB } from './lib/mongoose';
import { startWorkers, stopWorkers } from './queues/workers';
import { initSocket } from './lib/socket';
import { closeRedis } from './lib/redis';

async function main() {
  validateEnv();

  // Connect to database (non-blocking — server starts even if DB is down)
  try {
    await connectDB();
  } catch (err) {
    logger.warn({ err }, 'Database connection failed — server will start without DB');
  }

  // Start BullMQ workers
  try {
    await startWorkers();
    logger.info('Queue workers started');
  } catch (err) {
    logger.warn({ err }, 'Queue workers failed to start');
  }

  // Create HTTP server and initialize socket
  const server = createServer(app);
  initSocket(server);

  // Start server
  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, '≡ƒÜÇ Xeno CRM API running');
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down gracefully...');
    
    server.close(async () => {
      await stopWorkers();
      await closeRedis();
      await disconnectDB();
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
