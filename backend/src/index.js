"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const logger_1 = require("./lib/logger");
const mongoose_1 = require("./lib/mongoose");
const workers_1 = require("./queues/workers");
const socket_1 = require("./lib/socket");
async function main() {
    (0, env_1.validateEnv)();
    // Connect to database
    await (0, mongoose_1.connectDB)();
    logger_1.logger.info('Database connected');
    // Start BullMQ workers
    try {
        await (0, workers_1.startWorkers)();
        logger_1.logger.info('Queue workers started');
    }
    catch (err) {
        logger_1.logger.warn({ err }, 'Queue workers failed to start');
    }
    // Create HTTP server and initialize socket
    const server = (0, http_1.createServer)(app_1.default);
    (0, socket_1.initSocket)(server);
    // Start server
    server.listen(env_1.env.PORT, () => {
        logger_1.logger.info({ port: env_1.env.PORT, env: env_1.env.NODE_ENV }, '🚀 Xeno CRM API running');
    });
    // Graceful shutdown
    const shutdown = async (signal) => {
        logger_1.logger.info({ signal }, 'Shutting down gracefully...');
        server.close(async () => {
            await (0, workers_1.stopWorkers)();
            await (0, mongoose_1.disconnectDB)();
            logger_1.logger.info('All connections closed');
            process.exit(0);
        });
        // Force shutdown after 10s
        setTimeout(() => {
            logger_1.logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
main().catch((err) => {
    logger_1.logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
});
//# sourceMappingURL=index.js.map