"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenAI = getOpenAI;
const openai_1 = __importDefault(require("openai"));
const env_1 = require("../config/env");
let openaiClient = null;
function getOpenAI() {
    if (!openaiClient) {
        openaiClient = new openai_1.default({
            apiKey: env_1.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}
exports.default = getOpenAI;
//# sourceMappingURL=openai.js.map