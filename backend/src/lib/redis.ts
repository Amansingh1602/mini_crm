import IORedis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

let redis: IORedis | null = null;

export function getRedis(): IORedis {
  if (!redis) {
    redis = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      retryStrategy: (times: number) => {
        if (times > 10) {
          logger.error('Redis: max retries reached, giving up');
          return null;
        }
        const delay = Math.min(times * 200, 5000);
        logger.warn({ attempt: times, delay }, 'Redis: retrying connection');
        return delay;
      },
    });

    redis.on('connect', () => logger.info('Redis connected'));
    redis.on('error', (err) => logger.error({ err }, 'Redis error'));
    redis.on('close', () => logger.warn('Redis connection closed'));
  }
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export default getRedis;
