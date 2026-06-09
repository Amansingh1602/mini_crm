import { Worker, Job } from 'bullmq';
import { getRedis } from '../../lib/redis';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { QUEUE_NAMES, getDeadLetterQueue } from '../queue';
import { CommunicationStatus, EventType } from '@prisma/client';

interface ReceiptJobData {
  communicationId: string;
  campaignId: string;
  type: string;
  timestamp: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
}

// Maps event types to communication status fields
const EVENT_TO_STATUS: Record<string, CommunicationStatus> = {
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

let receiptWorker: Worker | null = null;

export function startReceiptWorker(): Worker {
  if (receiptWorker) return receiptWorker;

  receiptWorker = new Worker(
    QUEUE_NAMES.PROCESS_RECEIPT,
    async (job: Job<ReceiptJobData>) => {
      const { communicationId, campaignId, type, timestamp, idempotencyKey, metadata } = job.data;

      logger.info({ jobId: job.id, communicationId, type, idempotencyKey }, 'Processing receipt');

      // ─── Idempotency Check ───────────────────────────────
      const existing = await prisma.communicationEvent.findUnique({
        where: { idempotencyKey },
      });

      if (existing) {
        logger.info({ idempotencyKey }, 'Duplicate event, skipping');
        return; // Idempotent — safe to skip
      }

      // ─── Create Event (Append-Only Log) ──────────────────
      await prisma.communicationEvent.create({
        data: {
          communicationId,
          type: type as EventType,
          timestamp: new Date(timestamp),
          idempotencyKey,
          metadata: metadata ?? undefined,
        },
      });

      // ─── Update Communication Status ─────────────────────
      const status = EVENT_TO_STATUS[type];
      const timestampField = EVENT_TO_TIMESTAMP_FIELD[type];

      if (status && timestampField) {
        await prisma.communication.update({
          where: { id: communicationId },
          data: {
            status,
            [timestampField]: new Date(timestamp),
          },
        });
      }

      // ─── Update Campaign Analytics ───────────────────────
      const analyticsField = EVENT_TO_ANALYTICS_FIELD[type];
      if (analyticsField) {
        const updateData: Record<string, any> = {
          [analyticsField]: { increment: 1 },
        };

        // If PURCHASED, also add revenue
        if (type === 'PURCHASED' && metadata && typeof metadata.orderAmount === 'number') {
          updateData.revenue = { increment: metadata.orderAmount };
        }

        await prisma.campaignAnalytics.upsert({
          where: { campaignId },
          create: {
            campaignId,
            total: 0,
            [analyticsField]: 1,
            ...(type === 'PURCHASED' && metadata?.orderAmount
              ? { revenue: metadata.orderAmount as number }
              : {}),
          },
          update: updateData,
        });
      }

      // ─── Check Campaign Completion ───────────────────────
      // If all communications are in a terminal state, mark campaign as completed
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { status: true, _count: { select: { communications: true } } },
      });

      if (campaign?.status === 'RUNNING') {
        const pendingCount = await prisma.communication.count({
          where: {
            campaignId,
            status: { in: ['PENDING', 'SENT'] },
          },
        });

        if (pendingCount === 0) {
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'COMPLETED', completedAt: new Date() },
          });
          logger.info({ campaignId }, 'Campaign completed — all communications processed');
        }
      }

      logger.info({ communicationId, type }, 'Receipt processed successfully');
    },
    {
      connection: getRedis(),
      concurrency: 20,
    }
  );

  receiptWorker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Receipt job completed');
  });

  receiptWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Receipt job failed');

    // Move to DLQ after max retries
    if (job && job.attemptsMade >= (job.opts.attempts || 5)) {
      getDeadLetterQueue()
        .add('failed-receipt', {
          ...job.data,
          error: err.message,
          failedAt: new Date().toISOString(),
        })
        .catch((dlqErr) => logger.error({ dlqErr }, 'Failed to add to DLQ'));
    }
  });

  return receiptWorker;
}

export function stopReceiptWorker(): Promise<void> {
  if (receiptWorker) {
    const worker = receiptWorker;
    receiptWorker = null;
    return worker.close();
  }
  return Promise.resolve();
}
