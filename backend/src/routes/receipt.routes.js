"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const error_1 = require("../middleware/error");
const workers_1 = require("../queues/workers");
const logger_1 = require("../lib/logger");
const router = (0, express_1.Router)();
// ─── Receipt Schema ───────────────────────────────────────
const receiptSchema = zod_1.z.object({
    communicationId: zod_1.z.string(),
    campaignId: zod_1.z.string(),
    type: zod_1.z.enum(['SENT', 'DELIVERED', 'FAILED', 'OPENED', 'READ', 'CLICKED', 'PURCHASED']),
    timestamp: zod_1.z.string().datetime(),
    idempotencyKey: zod_1.z.string(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
const batchReceiptSchema = zod_1.z.object({
    events: zod_1.z.array(receiptSchema).min(1).max(100),
});
// ─── POST /api/receipts ───────────────────────────────────
// Receives delivery callbacks from Channel Service
router.post('/', (0, error_1.validate)(receiptSchema), (0, error_1.asyncHandler)(async (req, res) => {
    const event = req.body;
    logger_1.logger.info({ communicationId: event.communicationId, type: event.type, idempotencyKey: event.idempotencyKey }, 'Receipt received');
    // Enqueue for reliable processing
    const queue = (0, workers_1.getReceiptQueue)();
    await queue.add('process-receipt', event, {
        jobId: event.idempotencyKey, // Ensures idempotent queueing
    });
    res.status(202).json({
        success: true,
        message: 'Receipt accepted for processing',
        idempotencyKey: event.idempotencyKey,
    });
}));
// ─── POST /api/receipts/batch ─────────────────────────────
// Batch receipt processing for efficiency
router.post('/batch', (0, error_1.validate)(batchReceiptSchema), (0, error_1.asyncHandler)(async (req, res) => {
    const { events } = req.body;
    const queue = (0, workers_1.getReceiptQueue)();
    const results = [];
    for (const event of events) {
        try {
            await queue.add('process-receipt', event, {
                jobId: event.idempotencyKey,
            });
            results.push({ idempotencyKey: event.idempotencyKey, status: 'accepted' });
        }
        catch (err) {
            results.push({ idempotencyKey: event.idempotencyKey, status: 'failed', error: err.message });
        }
    }
    logger_1.logger.info({ totalEvents: events.length }, 'Batch receipts processed');
    res.status(202).json({
        success: true,
        data: { processed: results.length, results },
    });
}));
exports.default = router;
//# sourceMappingURL=receipt.routes.js.map