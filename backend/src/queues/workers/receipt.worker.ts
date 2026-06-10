import { logger } from '../../lib/logger';
import { CommunicationEvent } from '../../models/CommunicationEvent';
import { Communication } from '../../models/Communication';
import { CampaignAnalytics } from '../../models/CampaignAnalytics';
import { Campaign } from '../../models/Campaign';
import { getReceiptQueue, getDeadLetterQueue } from '../queue';

const EVENT_TO_STATUS: Record<string, string> = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  OPENED: 'OPENED',
  READ: 'READ',
  CLICKED: 'CLICKED',
  PURCHASED: 'PURCHASED',
};

const EVENT_TO_TIMESTAMP_FIELD: Record<string, string> = {
  SENT: 'sentAt',
  DELIVERED: 'deliveredAt',
  FAILED: 'failedAt',
  OPENED: 'openedAt',
  READ: 'readAt',
  CLICKED: 'clickedAt',
  PURCHASED: 'purchasedAt',
};

const EVENT_TO_ANALYTICS_FIELD: Record<string, string> = {
  DELIVERED: 'delivered',
  FAILED: 'failed',
  OPENED: 'opened',
  READ: 'read',
  CLICKED: 'clicked',
  PURCHASED: 'purchased',
};

export function startReceiptWorker() {
  const queue = getReceiptQueue();

  queue.on('job', async (job: any) => {
    const { communicationId, campaignId, type, timestamp, idempotencyKey, metadata } = job.data;

    logger.info({ jobId: job.id, communicationId, type, idempotencyKey }, 'Processing receipt');

    try {
      const existing = await CommunicationEvent.findOne({ idempotencyKey });

      if (existing) {
        logger.info({ idempotencyKey }, 'Duplicate event, skipping');
        return;
      }

      await CommunicationEvent.create({
        communicationId,
        type: type,
        timestamp: new Date(timestamp),
        idempotencyKey,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });

      const status = EVENT_TO_STATUS[type];
      const timestampField = EVENT_TO_TIMESTAMP_FIELD[type];

      if (status && timestampField) {
        await Communication.findByIdAndUpdate(communicationId, {
          status,
          [timestampField]: new Date(timestamp),
        });
      }

      const analyticsField = EVENT_TO_ANALYTICS_FIELD[type];
      if (analyticsField) {
        const updateData: Record<string, any> = {
          $inc: { [analyticsField]: 1 },
        };

        if (type === 'PURCHASED' && metadata && typeof metadata.orderAmount === 'number') {
          updateData.$inc.revenue = metadata.orderAmount;
        }

        await CampaignAnalytics.findOneAndUpdate(
          { campaignId },
          updateData,
          { upsert: true }
        );

        const { emitAnalyticsUpdate } = require('../../../lib/socket');
        emitAnalyticsUpdate(campaignId);
      }

      const campaign = await Campaign.findById(campaignId);

      if (campaign?.status === 'RUNNING') {
        const pendingCount = await Communication.countDocuments({
          campaignId,
          status: { $in: ['PENDING', 'SENT'] },
        });

        if (pendingCount === 0) {
          campaign.status = 'COMPLETED';
          campaign.completedAt = new Date();
          await campaign.save();
          logger.info({ campaignId }, 'Campaign completed — all communications processed');
        }
      }

      logger.info({ communicationId, type }, 'Receipt processed successfully');
    } catch (err: any) {
      logger.error({ jobId: job.id, err }, 'Receipt job failed');
      getDeadLetterQueue().add('failed-receipt', {
        ...job.data,
        error: err.message,
        failedAt: new Date().toISOString(),
      }).catch(() => {});
    }
  });

  return queue;
}

export function stopReceiptWorker(): Promise<void> {
  return Promise.resolve();
}
