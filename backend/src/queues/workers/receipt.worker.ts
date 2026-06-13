import { Worker, Job } from 'bullmq';
import { logger } from '../../lib/logger';
import { CommunicationEvent } from '../../models/CommunicationEvent';
import { Communication } from '../../models/Communication';
import { CampaignAnalytics } from '../../models/CampaignAnalytics';
import { Campaign } from '../../models/Campaign';
import { emitAnalyticsUpdate } from '../../lib/socket';
import { getDeadLetterQueue, getConnectionOptions, QUEUE_NAMES } from '../queue';

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

interface ReceiptJobData {
  communicationId: string;
  campaignId: string;
  type: string;
  timestamp: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
}

const MAX_RECEIPT_ATTEMPTS = 5;

let receiptWorker: Worker | null = null;

export function startReceiptWorker(): Worker {
  receiptWorker = new Worker<ReceiptJobData>(
    QUEUE_NAMES.PROCESS_RECEIPT,
    async (job: Job<ReceiptJobData>) => {
      const { communicationId, campaignId, type, timestamp, idempotencyKey, metadata } = job.data;

      logger.info({ jobId: job.id, communicationId, type, idempotencyKey }, 'Processing receipt');

      try {
        // ─── Atomic idempotency check ─────────────────────────────
        // Use create() inside try/catch and rely on the unique index
        // on idempotencyKey to atomically detect duplicates.
        // This eliminates the race condition of findOne + create.
        const eventData: Record<string, any> = {
          communicationId,
          type: type,
          timestamp: new Date(timestamp),
          idempotencyKey,
        };
        if (metadata) {
          eventData.metadata = JSON.stringify(metadata);
        }

        try {
          await CommunicationEvent.create(eventData);
        } catch (createErr: any) {
          // MongoDB duplicate key error code = 11000
          if (createErr.code === 11000) {
            logger.info({ idempotencyKey }, 'Duplicate event detected atomically, skipping');
            return; // Idempotent — skip processing
          }
          throw createErr; // Re-throw non-duplicate errors
        }

        // ─── Update communication status ──────────────────────────
        const status = EVENT_TO_STATUS[type];
        const timestampField = EVENT_TO_TIMESTAMP_FIELD[type];

        if (status && timestampField) {
          await Communication.findByIdAndUpdate(communicationId, {
            status,
            [timestampField]: new Date(timestamp),
          });
        }

        // ─── Update campaign analytics ────────────────────────────
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

          emitAnalyticsUpdate(campaignId);
        }

        // ─── Check if campaign is complete ────────────────────────
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

        // On final attempt, push to DLQ
        if (job.attemptsMade + 1 >= MAX_RECEIPT_ATTEMPTS) {
          await getDeadLetterQueue().add('failed-receipt', {
            ...job.data,
            error: err.message,
            failedAt: new Date().toISOString(),
          }).catch(() => {});

          logger.warn({ communicationId, type }, 'Receipt exhausted all retries, moved to DLQ');
        }

        throw err; // Re-throw so BullMQ retries
      }
    },
    {
      connection: getConnectionOptions(),
      concurrency: 20,
    }
  );

  receiptWorker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Receipt job completed');
  });

  receiptWorker.on('failed', (job, err) => {
    logger.warn({ jobId: job?.id, err: err.message, attempt: job?.attemptsMade }, 'Receipt job failed');
  });

  receiptWorker.on('error', (err) => {
    logger.error({ err }, 'Receipt worker error');
  });

  logger.info('Receipt worker started');
  return receiptWorker;
}

export async function stopReceiptWorker(): Promise<void> {
  if (receiptWorker) {
    await receiptWorker.close();
    receiptWorker = null;
    logger.info('Receipt worker stopped');
  }
}
