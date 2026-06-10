"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startReceiptWorker = startReceiptWorker;
exports.stopReceiptWorker = stopReceiptWorker;
const logger_1 = require("../../lib/logger");
const CommunicationEvent_1 = require("../../models/CommunicationEvent");
const Communication_1 = require("../../models/Communication");
const CampaignAnalytics_1 = require("../../models/CampaignAnalytics");
const Campaign_1 = require("../../models/Campaign");
const queue_1 = require("../queue");
const EVENT_TO_STATUS = {
    SENT: 'SENT',
    DELIVERED: 'DELIVERED',
    FAILED: 'FAILED',
    OPENED: 'OPENED',
    READ: 'READ',
    CLICKED: 'CLICKED',
    PURCHASED: 'PURCHASED',
};
const EVENT_TO_TIMESTAMP_FIELD = {
    SENT: 'sentAt',
    DELIVERED: 'deliveredAt',
    FAILED: 'failedAt',
    OPENED: 'openedAt',
    READ: 'readAt',
    CLICKED: 'clickedAt',
    PURCHASED: 'purchasedAt',
};
const EVENT_TO_ANALYTICS_FIELD = {
    DELIVERED: 'delivered',
    FAILED: 'failed',
    OPENED: 'opened',
    READ: 'read',
    CLICKED: 'clicked',
    PURCHASED: 'purchased',
};
function startReceiptWorker() {
    const queue = (0, queue_1.getReceiptQueue)();
    queue.on('job', async (job) => {
        const { communicationId, campaignId, type, timestamp, idempotencyKey, metadata } = job.data;
        logger_1.logger.info({ jobId: job.id, communicationId, type, idempotencyKey }, 'Processing receipt');
        try {
            const existing = await CommunicationEvent_1.CommunicationEvent.findOne({ idempotencyKey });
            if (existing) {
                logger_1.logger.info({ idempotencyKey }, 'Duplicate event, skipping');
                return;
            }
            await CommunicationEvent_1.CommunicationEvent.create({
                communicationId,
                type: type,
                timestamp: new Date(timestamp),
                idempotencyKey,
                metadata: metadata ? JSON.stringify(metadata) : null,
            });
            const status = EVENT_TO_STATUS[type];
            const timestampField = EVENT_TO_TIMESTAMP_FIELD[type];
            if (status && timestampField) {
                await Communication_1.Communication.findByIdAndUpdate(communicationId, {
                    status,
                    [timestampField]: new Date(timestamp),
                });
            }
            const analyticsField = EVENT_TO_ANALYTICS_FIELD[type];
            if (analyticsField) {
                const updateData = {
                    $inc: { [analyticsField]: 1 },
                };
                if (type === 'PURCHASED' && metadata && typeof metadata.orderAmount === 'number') {
                    updateData.$inc.revenue = metadata.orderAmount;
                }
                await CampaignAnalytics_1.CampaignAnalytics.findOneAndUpdate({ campaignId }, updateData, { upsert: true });
                const { emitAnalyticsUpdate } = require('../../../lib/socket');
                emitAnalyticsUpdate(campaignId);
            }
            const campaign = await Campaign_1.Campaign.findById(campaignId);
            if (campaign?.status === 'RUNNING') {
                const pendingCount = await Communication_1.Communication.countDocuments({
                    campaignId,
                    status: { $in: ['PENDING', 'SENT'] },
                });
                if (pendingCount === 0) {
                    campaign.status = 'COMPLETED';
                    campaign.completedAt = new Date();
                    await campaign.save();
                    logger_1.logger.info({ campaignId }, 'Campaign completed — all communications processed');
                }
            }
            logger_1.logger.info({ communicationId, type }, 'Receipt processed successfully');
        }
        catch (err) {
            logger_1.logger.error({ jobId: job.id, err }, 'Receipt job failed');
            (0, queue_1.getDeadLetterQueue)().add('failed-receipt', {
                ...job.data,
                error: err.message,
                failedAt: new Date().toISOString(),
            }).catch(() => { });
        }
    });
    return queue;
}
function stopReceiptWorker() {
    return Promise.resolve();
}
//# sourceMappingURL=receipt.worker.js.map