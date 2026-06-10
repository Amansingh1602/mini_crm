"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const Customer_1 = require("../models/Customer");
const Order_1 = require("../models/Order");
const Campaign_1 = require("../models/Campaign");
const CampaignAnalytics_1 = require("../models/CampaignAnalytics");
const CampaignInsight_1 = require("../models/CampaignInsight");
const Communication_1 = require("../models/Communication");
const CommunicationEvent_1 = require("../models/CommunicationEvent");
const constants_1 = require("../config/constants");
class AnalyticsService {
    static async getDashboardMetrics() {
        const [totalCustomers, totalOrders, totalCampaigns, totalRevenueAgg, activeCampaigns, recentCampaigns, channelStatsAgg, allAnalyticsAgg] = await Promise.all([
            Customer_1.Customer.countDocuments(),
            Order_1.Order.countDocuments(),
            Campaign_1.Campaign.countDocuments(),
            Order_1.Order.aggregate([{ $group: { _id: null, amount: { $sum: "$amount" } } }]),
            Campaign_1.Campaign.countDocuments({ status: constants_1.CAMPAIGN_STATUS.RUNNING }),
            Campaign_1.Campaign.find().sort({ createdAt: -1 }).limit(5).populate('audienceId', 'name'),
            Campaign_1.Campaign.aggregate([{ $group: { _id: "$channel", _count: { $sum: 1 } } }]),
            CampaignAnalytics_1.CampaignAnalytics.aggregate([{
                    $group: {
                        _id: null,
                        sent: { $sum: "$sent" },
                        delivered: { $sum: "$delivered" },
                        failed: { $sum: "$failed" },
                        opened: { $sum: "$opened" },
                        read: { $sum: "$read" },
                        clicked: { $sum: "$clicked" },
                        purchased: { $sum: "$purchased" },
                        revenue: { $sum: "$revenue" }
                    }
                }])
        ]);
        const formattedRecent = await Promise.all(recentCampaigns.map(async (c) => {
            const obj = c.toObject();
            obj.audience = obj.audienceId;
            delete obj.audienceId;
            obj.analytics = await CampaignAnalytics_1.CampaignAnalytics.findOne({ campaignId: c._id });
            return obj;
        }));
        const allAnalytics = allAnalyticsAgg[0] || {};
        const channelStats = channelStatsAgg.map(c => ({ channel: c._id, _count: c._count }));
        return {
            overview: {
                totalCustomers,
                totalOrders,
                totalCampaigns,
                activeCampaigns,
                totalRevenue: totalRevenueAgg[0]?.amount || 0,
                campaignRevenue: allAnalytics.revenue || 0,
            },
            communicationMetrics: {
                sent: allAnalytics.sent || 0,
                delivered: allAnalytics.delivered || 0,
                failed: allAnalytics.failed || 0,
                opened: allAnalytics.opened || 0,
                read: allAnalytics.read || 0,
                clicked: allAnalytics.clicked || 0,
                purchased: allAnalytics.purchased || 0,
            },
            recentCampaigns: formattedRecent,
            channelDistribution: channelStats,
        };
    }
    static async getCampaignAnalytics(campaignId) {
        const campaign = await Campaign_1.Campaign.findById(campaignId).populate('audienceId');
        if (!campaign)
            return null;
        const obj = campaign.toObject();
        obj.audience = obj.audienceId;
        delete obj.audienceId;
        const [analytics, insights, statusBreakdownAgg, comms] = await Promise.all([
            CampaignAnalytics_1.CampaignAnalytics.findOne({ campaignId }),
            CampaignInsight_1.CampaignInsight.find({ campaignId }).sort({ createdAt: -1 }),
            Communication_1.Communication.aggregate([
                { $match: { campaignId: campaign._id } },
                { $group: { _id: "$status", _count: { $sum: 1 } } }
            ]),
            Communication_1.Communication.find({ campaignId }).select('_id')
        ]);
        obj.analytics = analytics;
        obj.insights = insights;
        const statusBreakdown = statusBreakdownAgg.map(s => ({ status: s._id, _count: s._count }));
        const eventTimeline = await CommunicationEvent_1.CommunicationEvent.find({ communicationId: { $in: comms.map(c => c._id) } })
            .sort({ timestamp: 1 })
            .select('type timestamp');
        const a = analytics;
        const total = a?.sent || 1;
        const rates = {
            deliveryRate: a ? (a.delivered / total * 100).toFixed(1) : '0',
            failureRate: a ? (a.failed / total * 100).toFixed(1) : '0',
            openRate: a && a.delivered > 0 ? (a.opened / a.delivered * 100).toFixed(1) : '0',
            readRate: a && a.opened > 0 ? (a.read / a.opened * 100).toFixed(1) : '0',
            ctr: a && a.delivered > 0 ? (a.clicked / a.delivered * 100).toFixed(1) : '0',
            conversionRate: a && a.clicked > 0 ? (a.purchased / a.clicked * 100).toFixed(1) : '0',
        };
        const funnel = a
            ? [
                { stage: 'Sent', count: a.sent, percentage: 100 },
                { stage: 'Delivered', count: a.delivered, percentage: +(a.delivered / total * 100).toFixed(1) },
                { stage: 'Opened', count: a.opened, percentage: +(a.opened / total * 100).toFixed(1) },
                { stage: 'Read', count: a.read, percentage: +(a.read / total * 100).toFixed(1) },
                { stage: 'Clicked', count: a.clicked, percentage: +(a.clicked / total * 100).toFixed(1) },
                { stage: 'Purchased', count: a.purchased, percentage: +(a.purchased / total * 100).toFixed(1) },
            ]
            : [];
        return {
            campaign: obj,
            rates,
            funnel,
            statusBreakdown,
            eventTimeline,
        };
    }
    static async getChannelAnalytics() {
        const channels = Object.values(constants_1.CHANNELS);
        return Promise.all(channels.map(async (channel) => {
            const campaigns = await Campaign_1.Campaign.find({ channel }).select('_id');
            const campaignIds = campaigns.map((c) => c._id);
            if (campaignIds.length === 0) {
                return { channel, campaigns: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, purchased: 0, revenue: 0 };
            }
            const analyticsAgg = await CampaignAnalytics_1.CampaignAnalytics.aggregate([
                { $match: { campaignId: { $in: campaignIds } } },
                {
                    $group: {
                        _id: null,
                        sent: { $sum: "$sent" },
                        delivered: { $sum: "$delivered" },
                        failed: { $sum: "$failed" },
                        opened: { $sum: "$opened" },
                        read: { $sum: "$read" },
                        clicked: { $sum: "$clicked" },
                        purchased: { $sum: "$purchased" },
                        revenue: { $sum: "$revenue" }
                    }
                }
            ]);
            const analytics = analyticsAgg[0] || {};
            return {
                channel,
                campaigns: campaignIds.length,
                sent: analytics.sent || 0,
                delivered: analytics.delivered || 0,
                opened: analytics.opened || 0,
                clicked: analytics.clicked || 0,
                purchased: analytics.purchased || 0,
                revenue: analytics.revenue || 0,
            };
        }));
    }
}
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=analytics.service.js.map