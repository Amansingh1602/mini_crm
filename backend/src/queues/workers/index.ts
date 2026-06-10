import { startSendWorker, stopSendWorker } from './send.worker';
import { startReceiptWorker, stopReceiptWorker } from './receipt.worker';
import { QUEUE_NAMES, getSendQueue, getReceiptQueue, getDeadLetterQueue } from '../queue';

export async function startWorkers(): Promise<void> {
  startSendWorker();
  startReceiptWorker();
}

export async function stopWorkers(): Promise<void> {
  await stopSendWorker();
  await stopReceiptWorker();
}

export { getSendQueue, getReceiptQueue, getDeadLetterQueue, QUEUE_NAMES } from '../queue';
