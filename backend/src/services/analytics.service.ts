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
      audienceStats,
      communicationStats
    ] = await Promise.all([
      Customer.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
      Campaign.countDocuments(),
      Campaign.find().sort({ createdAt: -1 }).limit(5).populate('audienceId', 'name customerCount'),
      Audience.aggregate([
        { $group: { _id: null, totalAudiences: { $sum: 1 }, totalCustomersInAudiences: { $sum: "$customerCount" } } }
      ]),
      Communication.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            sent: { $sum: { $cond: [{ $in: ["$status", [COMMUNICATION_STATUS.SENT, COMMUNICATION_STATUS.DELIVERED, COMMUNICATION_STATUS.OPENED, COMMUNICATION_STATUS.READ, COMMUNICATION_STATUS.CLICKED, COMMUNICATION_STATUS.PURCHASED]] }, 1, 0] } },
            delivered: { $sum: { $cond: [{ $in: ["$status", [COMMUNICATION_STATUS.DELIVERED, COMMUNICATION_STATUS.OPENED, COMMUNICATION_STATUS.READ, COMMUNICATION_STATUS.CLICKED, COMMUNICATION_STATUS.PURCHASED]] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ["$status", COMMUNICATION_STATUS.FAILED] }, 1, 0] } },
            opened: { $sum: { $cond: [{ $in: ["$status", [COMMUNICATION_STATUS.OPENED, COMMUNICATION_STATUS.READ, COMMUNICATION_STATUS.CLICKED, COMMUNICATION_STATUS.PURCHASED]] }, 1, 0] } },
            clicked: { $sum: { $cond: [{ $in: ["$status", [COMMUNICATION_STATUS.CLICKED, COMMUNICATION_STATUS.PURCHASED]] }, 1, 0] } },
            purchased: { $sum: { $cond: [{ $eq: ["$status", COMMUNICATION_STATUS.PURCHASED] }, 1, 0] } },
          }
        }
      ])
    ]);

    const commStats = communicationStats.length > 0 ? communicationStats[0] : {
      total: 0, sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0, purchased: 0
    };

    return {
      overview: {
        totalCustomers,
        totalOrders,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        totalCampaigns,
        totalAudiences: audienceStats.length > 0 ? audienceStats[0].totalAudiences : 0,
      },
      communicationMetrics: {
        total: commStats.total,
        sent: commStats.sent,
        delivered: commStats.delivered,
        failed: commStats.failed,
        opened: commStats.opened,
        clicked: commStats.clicked,
        purchased: commStats.purchased,
      },
      recentCampaigns: recentCampaigns.map(c => {
        const obj = c.toObject() as any;
        obj.audience = obj.audienceId;
        delete obj.audienceId;
        return obj;
      }),
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