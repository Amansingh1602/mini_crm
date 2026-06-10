"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = getRedis;
exports.closeRedis = closeRedis;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../config/env");
const logger_1 = require("./logger");
let redis = null;
function getRedis() {
    if (!redis) {
        redis = new ioredis_1.default(env_1.env.REDIS_URL, {
            maxRetriesPerRequest: null, // Required by BullMQ
            enableReadyCheck: false,
            retryStrategy: (times) => {
                if (times > 10) {
                    logger_1.logger.error('Redis: max retries reached, giving up');
                    return null;
                }
                const delay = Math.min(times * 200, 5000);
                logger_1.logger.warn({ attempt: times, delay }, 'Redis: retrying connection');
                return delay;
            },
        });
        redis.on('connect', () => logger_1.logger.info('Redis connected'));
        redis.on('error', (err) => logger_1.logger.error({ err }, 'Redis error'));
        redis.on('close', () => logger_1.logger.warn('Redis connection closed'));
    }
    return redis;
}
async function closeRedis() {
    if (redis) {
        await redis.quit();
        redis = null;
    }
}
exports.default = getRedis;
//# sourceMappingURL=redis.js.map