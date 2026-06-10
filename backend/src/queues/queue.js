"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUEUE_NAMES = void 0;
exports.getSendQueue = getSendQueue;
exports.getReceiptQueue = getReceiptQueue;
exports.getDeadLetterQueue = getDeadLetterQueue;
const events_1 = require("events");
const logger_1 = require("../lib/logger");
exports.QUEUE_NAMES = {
    SEND_COMMUNICATION: 'send-communication',
    PROCESS_RECEIPT: 'process-receipt',
};
class MockQueue extends events_1.EventEmitter {
    name;
    constructor(name) {
        super();
        this.name = name;
    }
    async add(jobName, data, opts = {}) {
        logger_1.logger.debug({ queue: this.name, jobName, data, opts }, 'Added job to mock queue');
        // Run asynchronously
        setTimeout(() => {
            this.emit('job', { id: opts.jobId || Math.random().toString(), data, attemptsMade: 0, opts });
        }, 100);
    }
}
const sendQueue = new MockQueue(exports.QUEUE_NAMES.SEND_COMMUNICATION);
const receiptQueue = new MockQueue(exports.QUEUE_NAMES.PROCESS_RECEIPT);
const dlqQueue = new MockQueue('dead-letter-queue');
function getSendQueue() {
    return sendQueue;
}
function getReceiptQueue() {
    return receiptQueue;
}
function getDeadLetterQueue() {
    return dlqQueue;
}
//# sourceMappingURL=queue.js.map