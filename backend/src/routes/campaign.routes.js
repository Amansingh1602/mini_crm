"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const campaign_controller_1 = require("../controllers/campaign.controller");
const error_1 = require("../middleware/error");
const rateLimit_1 = require("../middleware/rateLimit");
const router = (0, express_1.Router)();
router.post('/generate', rateLimit_1.aiLimiter, (0, error_1.validate)(zod_1.z.object({
    goal: zod_1.z.string().min(5).max(500),
    audienceId: zod_1.z.string().optional(),
})), (0, error_1.asyncHandler)(campaign_controller_1.CampaignController.generate));
router.post('/autonomous', rateLimit_1.aiLimiter, (0, error_1.validate)(zod_1.z.object({ goal: zod_1.z.string().min(5).max(500) })), (0, error_1.asyncHandler)(campaign_controller_1.CampaignController.autonomous));
router.get('/', (0, error_1.asyncHandler)(campaign_controller_1.CampaignController.getAll));
router.get('/:id', (0, error_1.asyncHandler)(campaign_controller_1.CampaignController.getById));
router.post('/:id/approve', (0, error_1.asyncHandler)(campaign_controller_1.CampaignController.approve));
router.post('/:id/launch', (0, error_1.asyncHandler)(campaign_controller_1.CampaignController.launch));
router.post('/:id/insights', rateLimit_1.aiLimiter, (0, error_1.asyncHandler)(campaign_controller_1.CampaignController.insights));
exports.default = router;
//# sourceMappingURL=campaign.routes.js.map