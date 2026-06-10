"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.emitAnalyticsUpdate = emitAnalyticsUpdate;
const socket_io_1 = require("socket.io");
const env_1 = require("../config/env");
const logger_1 = require("./logger");
let io = null;
function initSocket(server) {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: env_1.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    io.on('connection', (socket) => {
        logger_1.logger.info({ socketId: socket.id }, 'Client connected to WebSocket');
        socket.on('disconnect', () => {
            logger_1.logger.info({ socketId: socket.id }, 'Client disconnected from WebSocket');
        });
    });
    logger_1.logger.info('WebSocket server initialized');
}
function emitAnalyticsUpdate(campaignId) {
    if (!io) {
        logger_1.logger.warn('Socket.io not initialized, skipping analytics update emit');
        return;
    }
    // Emitting to all connected clients that the analytics for this campaign have updated
    io.emit('campaignAnalyticsUpdated', { campaignId });
    logger_1.logger.debug({ campaignId }, 'Emitted campaignAnalyticsUpdated event');
}
//# sourceMappingURL=socket.js.map