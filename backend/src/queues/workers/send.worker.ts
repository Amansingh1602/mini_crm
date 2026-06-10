import axios from 'axios';
import { logger } from '../../lib/logger';
import { env } from '../../config/env';
import { Communication } from '../../models/Communication';
import { CampaignAnalytics } from '../../models/CampaignAnalytics';
import { getSendQueue, getDeadLetterQueue } from '../queue';

export function startSendWorker() {
  const queue = getSendQueue();

  queue.on('job', async (job: any) => {
    const { communicationId, campaignId, customerId, channel, message, customerEmail, customerPhone, customerName } = job.data;

    logger.info({ jobId: job.id, communicationId, channel }, 'Processing send job');

    try {
      const response = await axios.post(
        `${env.CHANNEL_SERVICE_URL || 'http://localhost:3002'}/send`,
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
          callbackUrl: env.CRM_CALLBACK_URL || 'http://localhost:3001/api/receipts',
        },
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      await Communication.findByIdAndUpdate(communicationId, {
        status: 'SENT',
        sentAt: new Date()
      });

      await CampaignAnalytics.findOneAndUpdate(
        { campaignId },
        { $inc: { sent: 1 }, $setOnInsert: { total: 1 } },
        { upsert: true }
      );

      logger.info({ communicationId, channelResponse: response.data }, 'Communication sent to channel service');
    } catch (error: any) {
      logger.error({ err: error, communicationId }, 'Failed to send communication');

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
    }
  });

  return queue;
}

export function stopSendWorker(): Promise<void> {
  return Promise.resolve();
}
