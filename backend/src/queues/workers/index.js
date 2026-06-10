"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUEUE_NAMES = exports.getDeadLetterQueue = exports.getReceiptQueue = exports.getSendQueue = void 0;
exports.startWorkers = startWorkers;
exports.stopWorkers = stopWorkers;
const send_worker_1 = require("./send.worker");
const receipt_worker_1 = require("./receipt.worker");
async function startWorkers() {
    (0, send_worker_1.startSendWorker)();
    (0, receipt_worker_1.startReceiptWorker)();
}
async function stopWorkers() {
    await (0, send_worker_1.stopSendWorker)();
    await (0, receipt_worker_1.stopReceiptWorker)();
}
var queue_1 = require("../queue");
Object.defineProperty(exports, "getSendQueue", { enumerable: true, get: function () { return queue_1.getSendQueue; } });
Object.defineProperty(exports, "getReceiptQueue", { enumerable: true, get: function () { return queue_1.getReceiptQueue; } });
Object.defineProperty(exports, "getDeadLetterQueue", { enumerable: true, get: function () { return queue_1.getDeadLetterQueue; } });
Object.defineProperty(exports, "QUEUE_NAMES", { enumerable: true, get: function () { return queue_1.QUEUE_NAMES; } });
//# sourceMappingURL=index.js.map