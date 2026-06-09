import { Worker, Job } from 'bullmq';
import axios from 'axios';
import { getRedis } from '../../lib/redis';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { env } from '../../config/env';
import { QUEUE_NAMES, getDeadLetterQueue } from '../queue';

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

let sendWorker: Worker | null = null;

export function startSendWorker(): Worker {
  if (sendWorker) return sendWorker;

  sendWorker = new Worker(
    QUEUE_NAMES.SEND_COMMUNICATION,
    async (job: Job<SendJobData>) => {
      const { communicationId, campaignId, customerId, channel, message, customerEmail, customerPhone, customerName } = job.data;

      logger.info({ jobId: job.id, communicationId, channel }, 'Processing send job');

      try {
        // Call Channel Service
        const response = await axios.post(
          `${env.CHANNEL_SERVICE_URL}/send`,
          {
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
            callbackUrl: env.CRM_CALLBACK_URL,
          },
          {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' },
          }
        );

        // Update communication status to SENT
        await prisma.communication.update({
          where: { id: communicationId },
          data: { status: 'SENT', sentAt: new Date() },
        });

        // Update analytics
        await prisma.campaignAnalytics.upsert({
          where: { campaignId },
          create: { campaignId, total: 1, sent: 1 },
          update: { sent: { increment: 1 } },
        });

        logger.info({ communicationId, channelResponse: response.data }, 'Communication sent to channel service');
      } catch (error: any) {
        logger.error({ err: error, communicationId }, 'Failed to send communication');

        // Update to FAILED on final attempt
        if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
          await prisma.communication.update({
            where: { id: communicationId },
            data: { status: 'FAILED', failedAt: new Date() },
          });

          await prisma.campaignAnalytics.upsert({
            where: { campaignId },
            create: { campaignId, total: 1, failed: 1 },
            update: { failed: { increment: 1 } },
          });

          // Move to Dead Letter Queue
          await getDeadLetterQueue().add('failed-send', {
            ...job.data,
            error: error.message,
            failedAt: new Date().toISOString(),
            attempts: job.attemptsMade + 1,
          });
        }

        throw error; // Re-throw to trigger retry
      }
    },
    {
      connection: getRedis(),
      concurrency: 10,
      limiter: {
        max: 50,
        duration: 1000, // 50 sends per second
      },
    }
  );

  sendWorker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Send job completed');
  });

  sendWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Send job failed');
  });

  return sendWorker;
}

export function stopSendWorker(): Promise<void> {
  if (sendWorker) {
    const worker = sendWorker;
    sendWorker = null;
    return worker.close();
  }
  return Promise.resolve();
}
