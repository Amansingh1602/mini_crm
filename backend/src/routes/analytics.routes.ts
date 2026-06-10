import { Router } from 'express';
import { Customer } from '../models/Customer';
import { Order } from '../models/Order';
import { Campaign } from '../models/Campaign';
import { CampaignAnalytics } from '../models/CampaignAnalytics';
import { CampaignInsight } from '../models/CampaignInsight';
import { Communication } from '../models/Communication';
import { CommunicationEvent } from '../models/CommunicationEvent';
import { asyncHandler, NotFoundError } from '../middleware/error';

const router = Router();

router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const [
      totalCustomers,
      totalOrders,
      totalCampaigns,
      totalRevenueAgg,
      activeCampaigns,
      recentCampaigns,
      channelStatsAgg,
      allAnalyticsAgg
    ] = await Promise.all([
      Customer.countDocuments(),
      Order.countDocuments(),
      Campaign.countDocuments(),
      Order.aggregate([{ $group: { _id: null, amount: { $sum: "$amount" } } }]),
      Campaign.countDocuments({ status: 'RUNNING' }),
      Campaign.find().sort({ createdAt: -1 }).limit(5).populate('audienceId', 'name'),
      Campaign.aggregate([{ $group: { _id: "$channel", _count: { $sum: 1 } } }]),
      CampaignAnalytics.aggregate([{
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

    const formattedRecent = await Promise.all(recentCampaigns.map(async c => {
      const obj = c.toObject() as any;
      obj.audience = obj.audienceId;
      delete obj.audienceId;
      obj.analytics = await CampaignAnalytics.findOne({ campaignId: c._id });
      return obj;
    }));

    const allAnalytics = allAnalyticsAgg[0] || {};
    const channelStats = channelStatsAgg.map(c => ({ channel: c._id, _count: c._count }));

    res.json({
      success: true,
      data: {
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
      },
    });
  })
);

router.get(
  '/campaigns/:id',
  asyncHandler(async (req, res) => {
    const campaign = await Campaign.findById(req.params.id).populate('audienceId');

    if (!campaign) throw new NotFoundError('Campaign', req.params.id);

    const obj = campaign.toObject() as any;
    obj.audience = obj.audienceId;
    delete obj.audienceId;

    const [analytics, insights, statusBreakdownAgg, comms] = await Promise.all([
      CampaignAnalytics.findOne({ campaignId: campaign._id }),
      CampaignInsight.find({ campaignId: campaign._id }).sort({ createdAt: -1 }),
      Communication.aggregate([
        { $match: { campaignId: campaign._id } },
        { $group: { _id: "$status", _count: { $sum: 1 } } }
      ]),
      Communication.find({ campaignId: campaign._id }).select('_id')
    ]);

    obj.analytics = analytics;
    obj.insights = insights;

    const statusBreakdown = statusBreakdownAgg.map(s => ({ status: s._id, _count: s._count }));

    const eventTimeline = await CommunicationEvent.find({ communicationId: { $in: comms.map(c => c._id) } })
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

    res.json({
      success: true,
      data: {
        campaign: obj,
        rates,
        funnel,
        statusBreakdown,
        eventTimeline,
      },
    });
  })
);

router.get(
  '/channels',
  asyncHandler(async (_req, res) => {
    const channels = ['WHATSAPP', 'SMS', 'EMAIL', 'RCS'];
    const channelAnalytics = await Promise.all(
      channels.map(async (channel) => {
        const campaigns = await Campaign.find({ channel }).select('_id');
        const campaignIds = campaigns.map((c) => c._id);

        if (campaignIds.length === 0) {
          return { channel, campaigns: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, purchased: 0, revenue: 0 };
        }

        const analyticsAgg = await CampaignAnalytics.aggregate([
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
      })
    );

    res.json({
      success: true,
      data: channelAnalytics,
    });
  })
);

export default router;
