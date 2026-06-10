"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
exports.validateEnv = validateEnv;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    // Server
    PORT: parseInt(process.env.PORT || '3001', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    // Database
    DATABASE_URL: process.env.DATABASE_URL || '',
    // Redis
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    // OpenAI
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    // Channel Service
    CHANNEL_SERVICE_URL: process.env.CHANNEL_SERVICE_URL || 'http://localhost:3002',
    // CRM Callback URL (for channel service to call back)
    CRM_CALLBACK_URL: process.env.CRM_CALLBACK_URL || 'http://localhost:3001/api/receipts',
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
};
// Validate required env vars
function validateEnv() {
    const required = ['DATABASE_URL'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.warn(`⚠️  Missing env vars: ${missing.join(', ')}. Some features may not work.`);
    }
}
//# sourceMappingURL=env.js.map