import { Queue } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../lib/logger';

export const QUEUE_NAMES = {
  SEND_COMMUNICATION: 'send-communication',
  PROCESS_RECEIPT: 'process-receipt',
  DEAD_LETTER: 'dead-letter-queue',
} as const;

// BullMQ manages its own IORedis connections internally.
// We parse the REDIS_URL and pass plain connection options to avoid
// version mismatches between the project's ioredis and bullmq's bundled ioredis.

function parseRedisUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      db: parsed.pathname ? parseInt(parsed.pathname.slice(1) || '0', 10) : 0,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

function getConnectionConfig() {
  return {
    ...parseRedisUrl(env.REDIS_URL),
    maxRetriesPerRequest: null as null,
    enableReadyCheck: false,
  };
}

let sendQueue: Queue | null = null;
let receiptQueue: Queue | null = null;
let dlqQueue: Queue | null = null;

export function getSendQueue(): Queue {
  if (!sendQueue) {
    sendQueue = new Queue(QUEUE_NAMES.SEND_COMMUNICATION, {
      connection: getConnectionConfig(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 200 },
      },
    });
    logger.info('Send queue initialized');
  }
  return sendQueue;
}

export function getReceiptQueue(): Queue {
  if (!receiptQueue) {
    receiptQueue = new Queue(QUEUE_NAMES.PROCESS_RECEIPT, {
      connection: getConnectionConfig(),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 500 },
      },
    });
    logger.info('Receipt queue initialized');
  }
  return receiptQueue;
}

export function getDeadLetterQueue(): Queue {
  if (!dlqQueue) {
    dlqQueue = new Queue(QUEUE_NAMES.DEAD_LETTER, {
      connection: getConnectionConfig(),
      defaultJobOptions: {
        removeOnComplete: false,
        removeOnFail: false,
      },
    });
    logger.info('Dead letter queue initialized');
  }
  return dlqQueue;
}

export function getConnectionOptions() {
  return getConnectionConfig();
}

export async function closeQueues(): Promise<void> {
  const queues = [sendQueue, receiptQueue, dlqQueue].filter(Boolean) as Queue[];
  await Promise.all(queues.map((q) => q.close()));
  sendQueue = null;
  receiptQueue = null;
  dlqQueue = null;
  logger.info('All queues closed');
}
