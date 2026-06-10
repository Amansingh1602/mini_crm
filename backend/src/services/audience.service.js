"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudienceService = void 0;
const Audience_1 = require("../models/Audience");
const Customer_1 = require("../models/Customer");
const Campaign_1 = require("../models/Campaign");
const ai_service_1 = require("./ai.service");
class AudienceService {
    static async generateAudienceFromQuery(query) {
        const result = await (0, ai_service_1.generateAudience)(query);
        const audience = await Audience_1.Audience.create({
            name: result.name,
            description: result.description,
            filters: result.filters,
            reasoning: result.reasoning,
            customerCount: result.estimatedCount,
        });
        return {
            ...audience.toObject(),
            estimatedCount: result.estimatedCount,
        };
    }
    static async getAllAudiences() {
        const audiences = await Audience_1.Audience.find().sort({ createdAt: -1 });
        return Promise.all(audiences.map(async (aud) => {
            const obj = aud.toObject();
            const count = await Campaign_1.Campaign.countDocuments({ audienceId: aud._id });
            obj._count = { campaigns: count };
            return obj;
        }));
    }
    static async getAudienceById(id) {
        const audience = await Audience_1.Audience.findById(id);
        if (!audience)
            return null;
        const campaigns = await Campaign_1.Campaign.find({ audienceId: audience._id }).sort({ createdAt: -1 });
        const whereClause = (0, ai_service_1.buildWhereClause)(audience.filters);
        const customers = await Customer_1.Customer.find(whereClause)
            .sort({ totalSpent: -1 })
            .limit(50)
            .select('name email city totalSpent lastPurchaseDate');
        const totalCount = await Customer_1.Customer.countDocuments(whereClause);
        return {
            ...audience.toObject(),
            campaigns,
            customerCount: totalCount,
            sampleCustomers: customers,
        };
    }
    static async deleteAudience(id) {
        const result = await Audience_1.Audience.findByIdAndDelete(id);
        return result !== null;
    }
}
exports.AudienceService = AudienceService;
//# sourceMappingURL=audience.service.js.map