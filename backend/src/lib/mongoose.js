"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const logger_1 = require("./logger");
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || env_1.env.DATABASE_URL;
        if (!mongoUri) {
            throw new Error('MONGODB_URI or DATABASE_URL is not defined in environment variables');
        }
        await mongoose_1.default.connect(mongoUri);
        logger_1.logger.info('MongoDB connected successfully via Mongoose');
    }
    catch (error) {
        logger_1.logger.fatal({ err: error }, 'Failed to connect to MongoDB');
        process.exit(1);
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    await mongoose_1.default.disconnect();
    logger_1.logger.info('MongoDB disconnected');
};
exports.disconnectDB = disconnectDB;
//# sourceMappingURL=mongoose.js.map