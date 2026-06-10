"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analytics_service_1 = require("../services/analytics.service");
const error_1 = require("../middleware/error");
class AnalyticsController {
    static async getDashboard(_req, res) {
        const data = await analytics_service_1.AnalyticsService.getDashboardMetrics();
        res.json({ success: true, data });
    }
    static async getCampaignAnalytics(req, res) {
        const data = await analytics_service_1.AnalyticsService.getCampaignAnalytics(req.params.id);
        if (!data) {
            throw new error_1.NotFoundError('Campaign', req.params.id);
        }
        res.json({ success: true, data });
    }
    static async getChannelAnalytics(_req, res) {
        const data = await analytics_service_1.AnalyticsService.getChannelAnalytics();
        res.json({ success: true, data });
    }
}
exports.AnalyticsController = AnalyticsController;
//# sourceMappingURL=analytics.controller.js.map