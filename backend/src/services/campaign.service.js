"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignService = void 0;
const Campaign_1 = require("../models/Campaign");
const Audience_1 = require("../models/Audience");
const Customer_1 = require("../models/Customer");
const Communication_1 = require("../models/Communication");
const CampaignAnalytics_1 = require("../models/CampaignAnalytics");
const CampaignInsight_1 = require("../models/CampaignInsight");
const ai_service_1 = require("./ai.service");
const workers_1 = require("../queues/workers");
const logger_1 = require("../lib/logger");
const constants_1 = require("../config/constants");
class CampaignService {
    static async generateCampaign(goal, audienceId) {
        let audienceContext;
        if (audienceId) {
            const audience = await Audience_1.Audience.findById(audienceId);
            if (!audience)
                return null;
            audienceContext = {
                name: audience.name,
                count: audience.customerCount,
                filters: audience.filters,
                reasoning: audience.reasoning,
            };
        }
        const result = await (0, ai_service_1.generateCampaign)(goal, audienceContext);
        let finalAudienceId = audienceId;
        if (!finalAudienceId) {
            const audience = await Audience_1.Audience.create({
                name: `Auto: ${result.title}`,
                description: `Auto-generated for campaign: ${result.title}`,
                filters: "{}",
                reasoning: result.audienceReasoning || "Auto-generated",
                customerCount: 0,
            });
            finalAudienceId = audience._id;
        }
        const campaign = await Campaign_1.Campaign.create({
            audienceId: finalAudienceId,
            title: result.title,
            goal,
            offer: result.offer,
            message: result.message,
            cta: result.cta,
            channel: result.channel,
            status: constants_1.CAMPAIGN_STATUS.DRAFT,
            predictedMetrics: result.predictedMetrics,
            audienceReasoning: result.audienceReasoning,
            messageReasoning: result.messageReasoning,
            channelReasoning: result.channelReasoning,
            offerReasoning: result.offerReasoning,
        });
        return campaign.populate('audienceId');
    }
    static async autonomousAgent(goal) {
        const result = await (0, ai_service_1.autonomousCampaignAgent)(goal);
        const audience = await Audience_1.Audience.create({
            name: result.audience.name,
            description: result.audience.description,
            filters: result.audience.filters,
            reasoning: result.audience.reasoning,
            customerCount: result.audience.estimatedCount,
        });
        const campaign = await Campaign_1.Campaign.create({
            audienceId: audience._id,
            title: result.campaign.title,
            goal,
            offer: result.campaign.offer,
            message: result.campaign.message,
            cta: result.campaign.cta,
            channel: result.campaign.channel,
            status: constants_1.CAMPAIGN_STATUS.DRAFT,
            predictedMetrics: result.campaign.predictedMetrics,
            audienceReasoning: result.campaign.audienceReasoning,
            messageReasoning: result.campaign.messageReasoning,
            channelReasoning: result.campaign.channelReasoning,
            offerReasoning: result.campaign.offerReasoning,
        });
        return {
            campaign,
            audience,
            aiReasoning: {
                audience: result.audience.reasoning,
                message: result.campaign.messageReasoning,
                channel: result.campaign.channelReasoning,
                offer: result.campaign.offerReasoning,
            },
        };
    }
    static async getAllCampaigns() {
        const campaigns = await Campaign_1.Campaign.find()
            .sort({ createdAt: -1 })
            .populate('audienceId', 'name customerCount');
        return Promise.all(campaigns.map(async (camp) => {
            const obj = camp.toObject();
            obj.audience = obj.audienceId;
            delete obj.audienceId;
            const analytics = await CampaignAnalytics_1.CampaignAnalytics.findOne({ campaignId: camp._id });
            obj.analytics = analytics;
            const commCount = await Communication_1.Communication.countDocuments({ campaignId: camp._id });
            obj._count = { communications: commCount };
            return obj;
        }));
    }
    static async getCampaignById(id) {
        const campaign = await Campaign_1.Campaign.findById(id).populate('audienceId');
        if (!campaign)
            return null;
        const obj = campaign.toObject();
        obj.audience = obj.audienceId;
        delete obj.audienceId;
        obj.analytics = await CampaignAnalytics_1.CampaignAnalytics.findOne({ campaignId: campaign._id });
        obj.insights = await CampaignInsight_1.CampaignInsight.find({ campaignId: campaign._id }).sort({ createdAt: -1 });
        obj._count = { communications: await Communication_1.Communication.countDocuments({ campaignId: campaign._id }) };
        return obj;
    }
    static async approveCampaign(id) {
        const campaign = await Campaign_1.Campaign.findById(id);
        if (!campaign)
            return { status: 404, message: 'Campaign not found' };
        if (campaign.status !== constants_1.CAMPAIGN_STATUS.DRAFT) {
            return { status: 400, message: `Campaign cannot be approved — current status: ${campaign.status}` };
        }
        campaign.status = constants_1.CAMPAIGN_STATUS.APPROVED;
        await campaign.save();
        return { status: 200, campaign };
    }
    static async launchCampaign(id) {
        const campaign = await Campaign_1.Campaign.findById(id).populate('audienceId');
        if (!campaign)
            return { status: 404, message: 'Campaign not found' };
        if (campaign.status !== constants_1.CAMPAIGN_STATUS.APPROVED) {
            return { status: 400, message: `Campaign must be APPROVED to launch. Current: ${campaign.status}` };
        }
        const audience = campaign.audienceId;
        const whereClause = (0, ai_service_1.buildWhereClause)(audience.filters);
        const customers = await Customer_1.Customer.find(whereClause).select('name email phone');
        if (customers.length === 0) {
            return { status: 400, message: 'No customers match the audience filters' };
        }
        campaign.status = constants_1.CAMPAIGN_STATUS.RUNNING;
        campaign.launchedAt = new Date();
        await campaign.save();
        await CampaignAnalytics_1.CampaignAnalytics.findOneAndUpdate({ campaignId: campaign._id }, { $setOnInsert: { campaignId: campaign._id }, $set: { total: customers.length } }, { upsert: true, new: true });
        const sendQueue = (0, workers_1.getSendQueue)();
        let enqueued = 0;
        for (const customer of customers) {
            const personalizedMessage = campaign.message.replace(/\{\{name\}\}/gi, customer.name);
            const communication = await Communication_1.Communication.create({
                campaignId: campaign._id,
                customerId: customer._id,
                channel: campaign.channel,
                message: personalizedMessage,
                status: constants_1.COMMUNICATION_STATUS.PENDING,
            });
            await sendQueue.add('send', {
                communicationId: communication._id,
                campaignId: campaign._id,
                customerId: customer._id,
                channel: campaign.channel,
                message: personalizedMessage,
                customerEmail: customer.email,
                customerPhone: customer.phone || '',
                customerName: customer.name,
            }, { jobId: `send-${communication._id}` });
            enqueued++;
        }
        logger_1.logger.info({ campaignId: campaign.id, enqueued }, 'Campaign launched');
        return {
            status: 200,
            data: {
                campaignId: campaign.id,
                status: constants_1.CAMPAIGN_STATUS.RUNNING,
                customersTargeted: customers.length,
                communicationsEnqueued: enqueued,
            }
        };
    }
    static async generateInsights(id) {
        const result = await (0, ai_service_1.generateInsights)(id);
        for (const insight of result.insights) {
            await CampaignInsight_1.CampaignInsight.create({
                campaignId: id,
                insight: insight.insight,
                category: insight.category,
                severity: insight.severity,
                recommendation: insight.recommendation,
            });
        }
        return {
            insights: result.insights,
            nextCampaignSuggestion: result.nextCampaignSuggestion,
        };
    }
}
exports.CampaignService = CampaignService;
//# sourceMappingURL=campaign.service.js.map