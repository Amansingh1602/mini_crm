import { Order } from '../models/Order';
import { Customer } from '../models/Customer';
import { Campaign } from '../models/Campaign';
import { Audience } from '../models/Audience';
import { CampaignAnalytics } from '../models/CampaignAnalytics';
import { Communication } from '../models/Communication';
import { COMMUNICATION_STATUS } from '../config/constants';

export class AnalyticsService {
  static async getDashboardMetrics() {
    const [
      totalCustomers,
      totalOrders,
      totalRevenue,
      totalCampaigns,
      recentCampaigns,
      audienceStats
    ] = await Promise.all([
      Customer.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
      Campaign.countDocuments(),
      Campaign.find().sort({ createdAt: -1 }).limit(5).populate('audienceId', 'name customerCount'),
      Audience.aggregate([
        { $group: { _id: null, totalAudiences: { $sum: 1 }, totalCustomersInAudiences: { $sum: "$customerCount" } } }
      ])
    ]);

    return {
      customers: totalCustomers,
      orders: totalOrders,
      revenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      campaigns: totalCampaigns,
      recentCampaigns: recentCampaigns.map(c => {
        const obj = c.toObject() as any;
        obj.audience = obj.audienceId;
        delete obj.audienceId;
        return obj;
      }),
      audiences: audienceStats.length > 0 ? audienceStats[0].totalAudiences : 0,
    };
  }

  static async getCampaignAnalytics(campaignId: string) {
    const [analytics, channelStats] = await Promise.all([
      CampaignAnalytics.findOne({ campaignId }),
      Communication.aggregate([
        { $match: { campaignId } },
        { $group: { _id: "$channel", count: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ["$status", COMMUNICATION_STATUS.DELIVERED] }, 1, 0] } } } }
      ])
    ]);
    return { analytics, channelStats };
  }

  static async getChannelAnalytics() {
    return Communication.aggregate([
      { $group: {
          _id: "$channel",
          total: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ["$status", COMMUNICATION_STATUS.DELIVERED] }, 1, 0] } },
          opened: { $sum: { $cond: [{ $eq: ["$status", COMMUNICATION_STATUS.OPENED] }, 1, 0] } },
          clicked: { $sum: { $cond: [{ $eq: ["$status", COMMUNICATION_STATUS.CLICKED] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ["$status", COMMUNICATION_STATUS.FAILED] }, 1, 0] } },
      }}
    ]);
  }
}