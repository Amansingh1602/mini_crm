"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const error_1 = require("../middleware/error");
const router = (0, express_1.Router)();
router.get('/dashboard', (0, error_1.asyncHandler)(analytics_controller_1.AnalyticsController.getDashboard));
router.get('/campaigns/:id', (0, error_1.asyncHandler)(analytics_controller_1.AnalyticsController.getCampaignAnalytics));
router.get('/channels', (0, error_1.asyncHandler)(analytics_controller_1.AnalyticsController.getChannelAnalytics));
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map