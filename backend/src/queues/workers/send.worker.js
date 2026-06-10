"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSendWorker = startSendWorker;
exports.stopSendWorker = stopSendWorker;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../../lib/logger");
const env_1 = require("../../config/env");
const Communication_1 = require("../../models/Communication");
const CampaignAnalytics_1 = require("../../models/CampaignAnalytics");
const queue_1 = require("../queue");
function startSendWorker() {
    const queue = (0, queue_1.getSendQueue)();
    queue.on('job', async (job) => {
        const { communicationId, campaignId, customerId, channel, message, customerEmail, customerPhone, customerName } = job.data;
        logger_1.logger.info({ jobId: job.id, communicationId, channel }, 'Processing send job');
        try {
            const response = await axios_1.default.post(`${env_1.env.CHANNEL_SERVICE_URL || 'http://localhost:3002'}/send`, {
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
                callbackUrl: env_1.env.CRM_CALLBACK_URL || 'http://localhost:3001/api/receipts',
            }, {
                timeout: 10000,
                headers: { 'Content-Type': 'application/json' },
            });
            await Communication_1.Communication.findByIdAndUpdate(communicationId, {
                status: 'SENT',
                sentAt: new Date()
            });
            await CampaignAnalytics_1.CampaignAnalytics.findOneAndUpdate({ campaignId }, { $inc: { sent: 1 }, $setOnInsert: { total: 1 } }, { upsert: true });
            logger_1.logger.info({ communicationId, channelResponse: response.data }, 'Communication sent to channel service');
        }
        catch (error) {
            logger_1.logger.error({ err: error, communicationId }, 'Failed to send communication');
            await Communication_1.Communication.findByIdAndUpdate(communicationId, {
                status: 'FAILED',
                failedAt: new Date()
            });
            await CampaignAnalytics_1.CampaignAnalytics.findOneAndUpdate({ campaignId }, { $inc: { failed: 1 }, $setOnInsert: { total: 1 } }, { upsert: true });
            await (0, queue_1.getDeadLetterQueue)().add('failed-send', {
                ...job.data,
                error: error.message,
                failedAt: new Date().toISOString(),
                attempts: job.attemptsMade + 1,
            });
        }
    });
    return queue;
}
function stopSendWorker() {
    return Promise.resolve();
}
//# sourceMappingURL=send.worker.js.map