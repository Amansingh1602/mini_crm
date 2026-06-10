"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignController = void 0;
const campaign_service_1 = require("../services/campaign.service");
const error_1 = require("../middleware/error");
class CampaignController {
    static async generate(req, res) {
        const { goal, audienceId } = req.body;
        const data = await campaign_service_1.CampaignService.generateCampaign(goal, audienceId);
        if (!data) {
            throw new error_1.NotFoundError('Audience', audienceId);
        }
        res.status(201).json({ success: true, data });
    }
    static async autonomous(req, res) {
        const { goal } = req.body;
        const data = await campaign_service_1.CampaignService.autonomousAgent(goal);
        res.status(201).json({ success: true, data });
    }
    static async getAll(_req, res) {
        const data = await campaign_service_1.CampaignService.getAllCampaigns();
        res.json({ success: true, data });
    }
    static async getById(req, res) {
        const data = await campaign_service_1.CampaignService.getCampaignById(req.params.id);
        if (!data)
            throw new error_1.NotFoundError('Campaign', req.params.id);
        res.json({ success: true, data });
    }
    static async approve(req, res) {
        const result = await campaign_service_1.CampaignService.approveCampaign(req.params.id);
        if (result.status === 404)
            throw new error_1.NotFoundError('Campaign', req.params.id);
        if (result.status === 400)
            throw new error_1.AppError(400, result.message);
        res.json({ success: true, data: result.campaign });
    }
    static async launch(req, res) {
        const result = await campaign_service_1.CampaignService.launchCampaign(req.params.id);
        if (result.status === 404)
            throw new error_1.NotFoundError('Campaign', req.params.id);
        if (result.status === 400)
            throw new error_1.AppError(400, result.message);
        res.json({ success: true, data: result.data });
    }
    static async insights(req, res) {
        const data = await campaign_service_1.CampaignService.generateInsights(req.params.id);
        res.json({ success: true, data });
    }
}
exports.CampaignController = CampaignController;
//# sourceMappingURL=campaign.controller.js.map