import { startSendWorker, stopSendWorker } from './workers/send.worker';
import { startReceiptWorker, stopReceiptWorker } from './workers/receipt.worker';
import { closeQueues } from './queue';

export async function startWorkers(): Promise<void> {
  startSendWorker();
  startReceiptWorker();
}

export async function stopWorkers(): Promise<void> {
  await stopSendWorker();
  await stopReceiptWorker();
  await closeQueues();
}

export { getSendQueue, getReceiptQueue, getDeadLetterQueue, QUEUE_NAMES } from './queue';
