import { Queue } from 'bullmq';
import { getRedis } from '../lib/redis';
import { logger } from '../lib/logger';

// ─── Queue Names ──────────────────────────────────────────

export const QUEUE_NAMES = {
  SEND_COMMUNICATION: 'send-communication',
  PROCESS_RECEIPT: 'process-receipt',
  DEAD_LETTER: 'dead-letter',
} as const;

// ─── Queue Instances ──────────────────────────────────────

let sendQueue: Queue | null = null;
let receiptQueue: Queue | null = null;
let deadLetterQueue: Queue | null = null;

export function getSendQueue(): Queue {
  if (!sendQueue) {
    sendQueue = new Queue(QUEUE_NAMES.SEND_COMMUNICATION, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
    logger.info('Send queue initialized');
  }
  return sendQueue;
}

export function getReceiptQueue(): Queue {
  if (!receiptQueue) {
    receiptQueue = new Queue(QUEUE_NAMES.PROCESS_RECEIPT, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
    logger.info('Receipt queue initialized');
  }
  return receiptQueue;
}

export function getDeadLetterQueue(): Queue {
  if (!deadLetterQueue) {
    deadLetterQueue = new Queue(QUEUE_NAMES.DEAD_LETTER, {
      connection: getRedis(),
    });
    logger.info('Dead letter queue initialized');
  }
  return deadLetterQueue;
}

export async function closeQueues(): Promise<void> {
  await sendQueue?.close();
  await receiptQueue?.close();
  await deadLetterQueue?.close();
  sendQueue = null;
  receiptQueue = null;
  deadLetterQueue = null;
}
