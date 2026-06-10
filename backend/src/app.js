"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const rateLimit_1 = require("./middleware/rateLimit");
const error_1 = require("./middleware/error");
const logger_1 = require("./lib/logger");
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const audience_routes_1 = __importDefault(require("./routes/audience.routes"));
const campaign_routes_1 = __importDefault(require("./routes/campaign.routes"));
const receipt_routes_1 = __importDefault(require("./routes/receipt.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const app = (0, express_1.default)();
// ─── Security & Parsing ──────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ─── Request Logging ─────────────────────────────────────
app.use((req, _res, next) => {
    logger_1.logger.info({ method: req.method, url: req.url }, 'Incoming request');
    next();
});
// ─── Rate Limiting ────────────────────────────────────────
app.use('/api/', rateLimit_1.apiLimiter);
// ─── Health Check ─────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'xeno-crm', timestamp: new Date().toISOString() });
});
// ─── Routes ───────────────────────────────────────────────
app.use('/api/customers', customer_routes_1.default);
app.use('/api/orders', order_routes_1.default);
app.use('/api/audiences', audience_routes_1.default);
app.use('/api/campaigns', campaign_routes_1.default);
app.use('/api/receipts', receipt_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
// ─── 404 Handler ──────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' });
});
// ─── Error Handler ────────────────────────────────────────
app.use(error_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map