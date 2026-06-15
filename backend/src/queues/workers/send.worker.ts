import { Worker, Job } from 'bullmq';
import { logger } from '../../lib/logger';
import { env } from '../../config/env';
import { Communication } from '../../models/Communication';
import { CampaignAnalytics } from '../../models/CampaignAnalytics';
import { simulateDelivery } from '../../lib/channel/simulator';
import { getDeadLetterQueue, getConnectionOptions, QUEUE_NAMES } from '../queue';

let sendWorker: Worker | null = null;

interface SendJobData {
  communicationId: string;
  campaignId: string;
  customerId: string;
  channel: string;
  message: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
}

const MAX_SEND_ATTEMPTS = 3;

export function startSendWorker(): Worker {
  sendWorker = new Worker<SendJobData>(
    QUEUE_NAMES.SEND_COMMUNICATION,
    async (job: Job<SendJobData>) => {
      const { communicationId, campaignId, customerId, channel, message, customerEmail, customerPhone, customerName } = job.data;

      logger.info({ jobId: job.id, communicationId, channel, attempt: job.attemptsMade + 1 }, 'Processing send job');

      try {
        // Call the merged channel simulator directly
        await simulateDelivery({
          communicationId,
          campaignId,
          customerId,
          channel,
          message,
          recipient: {
            email: customerEmail,
            phone: customerPhone,
            name: customerName,
          },
        });

        await Communication.findByIdAndUpdate(communicationId, {
          status: 'SENT',
          sentAt: new Date()
        });

        await CampaignAnalytics.findOneAndUpdate(
          { campaignId },
          { $inc: { sent: 1 }, $setOnInsert: { total: 1 } },
          { upsert: true }
        );

        logger.info({ communicationId }, 'Communication sent to channel simulator');
      } catch (error: any) {
        logger.error({ err: error, communicationId, attempt: job.attemptsMade + 1 }, 'Failed to send communication');

        // If this is the final attempt, mark as failed and move to DLQ
        if (job.attemptsMade + 1 >= MAX_SEND_ATTEMPTS) {
          await Communication.findByIdAndUpdate(communicationId, {
            status: 'FAILED',
            failedAt: new Date()
          });

          await CampaignAnalytics.findOneAndUpdate(
            { campaignId },
            { $inc: { failed: 1 }, $setOnInsert: { total: 1 } },
            { upsert: true }
          );

          await getDeadLetterQueue().add('failed-send', {
            ...job.data,
            error: error.message,
            failedAt: new Date().toISOString(),
            attempts: job.attemptsMade + 1,
          });

          logger.warn({ communicationId }, 'Send exhausted all retries, moved to DLQ');
        }

        // Re-throw so BullMQ retries with exponential backoff
        throw error;
      }
    },
    {
      connection: getConnectionOptions(),
      concurrency: 10,
    }
  );

  sendWorker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Send job completed');
  });

  sendWorker.on('failed', (job, err) => {
    logger.warn({ jobId: job?.id, err: err.message, attempt: job?.attemptsMade }, 'Send job failed');
  });

  sendWorker.on('error', (err) => {
    logger.error({ err }, 'Send worker error');
  });

  logger.info('Send worker started');
  return sendWorker;
}

export async function stopSendWorker(): Promise<void> {
  if (sendWorker) {
    await sendWorker.close();
    sendWorker = null;
    logger.info('Send worker stopped');
  }
}
