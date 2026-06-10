import { EventEmitter } from 'events';
import { logger } from '../lib/logger';

export const QUEUE_NAMES = {
  SEND_COMMUNICATION: 'send-communication',
  PROCESS_RECEIPT: 'process-receipt',
};

class MockQueue extends EventEmitter {
  name: string;
  constructor(name: string) {
    super();
    this.name = name;
  }
  async add(jobName: string, data: any, opts: any = {}) {
    logger.debug({ queue: this.name, jobName, data, opts }, 'Added job to mock queue');
    // Run asynchronously
    setTimeout(() => {
      this.emit('job', { id: opts.jobId || Math.random().toString(), data, attemptsMade: 0, opts });
    }, 100);
  }
}

const sendQueue = new MockQueue(QUEUE_NAMES.SEND_COMMUNICATION);
const receiptQueue = new MockQueue(QUEUE_NAMES.PROCESS_RECEIPT);
const dlqQueue = new MockQueue('dead-letter-queue');

export function getSendQueue() {
  return sendQueue;
}

export function getReceiptQueue() {
  return receiptQueue;
}

export function getDeadLetterQueue() {
  return dlqQueue;
}
