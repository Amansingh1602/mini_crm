"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudienceController = void 0;
const audience_service_1 = require("../services/audience.service");
const error_1 = require("../middleware/error");
class AudienceController {
    static async generate(req, res) {
        const { query } = req.body;
        const data = await audience_service_1.AudienceService.generateAudienceFromQuery(query);
        res.status(201).json({ success: true, data });
    }
    static async getAll(_req, res) {
        const data = await audience_service_1.AudienceService.getAllAudiences();
        res.json({ success: true, data });
    }
    static async getById(req, res) {
        const data = await audience_service_1.AudienceService.getAudienceById(req.params.id);
        if (!data) {
            throw new error_1.NotFoundError('Audience', req.params.id);
        }
        res.json({ success: true, data });
    }
    static async delete(req, res) {
        const deleted = await audience_service_1.AudienceService.deleteAudience(req.params.id);
        if (!deleted) {
            throw new error_1.NotFoundError('Audience', req.params.id);
        }
        res.json({ success: true, message: 'Audience deleted' });
    }
}
exports.AudienceController = AudienceController;
//# sourceMappingURL=audience.controller.js.map