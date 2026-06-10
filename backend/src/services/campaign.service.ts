import { Campaign } from '../models/Campaign';
import { Audience } from '../models/Audience';
import { CampaignAnalytics } from '../models/CampaignAnalytics';
import { CampaignInsight } from '../models/CampaignInsight';
import { Communication } from '../models/Communication';
import { AIService } from './ai.service';
import { queueService } from '../queues/queue';
import { CAMPAIGN_STATUS, COMMUNICATION_STATUS } from '../config/constants';
import { Types } from 'mongoose';

export class CampaignService {
  static async generateCampaign(goal: string, audienceId?: string) {
    let audience;
    if (audienceId) {
      audience = await Audience.findById(audienceId);
    }

    if (!audience) {
      const audiences = await Audience.find().limit(10);
      const suggestions = await AIService.generateAudience(goal);
      const match = audiences.find(a => a.name.toLowerCase().includes(suggestions.name.toLowerCase()));
      if (match) {
        audience = match;
      } else {
        audience = await Audience.create({
          name: suggestions.name,
          description: suggestions.description,
          filters: suggestions.filters,
          reasoning: suggestions.reasoning,
          customerCount: Math.floor(Math.random() * 1000) + 100,
        });
      }
    }

    const content = await AIService.generateCampaignContent(goal, audience.name);

    const campaign = await Campaign.create({
      title: `${goal.substring(0, 30)}... Campaign`,
      goal,
      audienceId: audience._id,
      channel: content.channel,
      message: content.message,
      offer: content.offer,
      cta: content.cta,
      status: CAMPAIGN_STATUS.DRAFT,
      predictedMetrics: content.predictedMetrics,
      aiReasoning: content.reasoning,
    });

    await CampaignAnalytics.create({
      campaignId: campaign._id,
      total: audience.customerCount,
      sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0, purchased: 0, revenue: 0,
    });

    const populated = await Campaign.findById(campaign._id).populate('audienceId');
    const result = populated?.toObject() as any;
    if (result) {
      result.audience = result.audienceId;
      delete result.audienceId;
    }
    return result;
  }

  static async generateAutonomous(goal: string) {
    const strategy = await AIService.generateCampaignStrategy(goal);
    
    const audience = await Audience.create({
      name: strategy.audience.name,
      description: strategy.audience.description,
      filters: strategy.audience.filters,
      reasoning: strategy.audience.reasoning,
      customerCount: Math.floor(Math.random() * 1000) + 500,
    });

    const campaign = await Campaign.create({
      title: strategy.title,
      goal,
      audienceId: audience._id,
      channel: strategy.channel,
      message: strategy.message,
      status: CAMPAIGN_STATUS.DRAFT,
      predictedMetrics: strategy.predictedMetrics,
      aiReasoning: strategy.reasoning,
    });

    await CampaignAnalytics.create({
      campaignId: campaign._id,
      total: audience.customerCount,
      sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0, purchased: 0, revenue: 0,
    });

    const populated = await Campaign.findById(campaign._id).populate('audienceId');
    const result = populated?.toObject() as any;
    if (result) {
      result.audience = result.audienceId;
      delete result.audienceId;
    }
    return result;
  }

  static async getCampaigns() {
    const campaigns = await Campaign.find().sort({ createdAt: -1 }).populate('audienceId');
    return campaigns.map(c => {
      const obj = c.toObject() as any;
      obj.audience = obj.audienceId;
      delete obj.audienceId;
      return obj;
    });
  }

  static async getCampaignById(id: string) {
    const [campaign, analytics, insights] = await Promise.all([
      Campaign.findById(id).populate('audienceId'),
      CampaignAnalytics.findOne({ campaignId: new Types.ObjectId(id) }),
      CampaignInsight.find({ campaignId: new Types.ObjectId(id) }).sort({ createdAt: -1 }),
    ]);

    if (!campaign) return null;

    const result = campaign.toObject() as any;
    result.audience = result.audienceId;
    delete result.audienceId;
    result.analytics = analytics;
    result.insights = insights;

    return result;
  }

  static async approveCampaign(id: string) {
    const campaign = await Campaign.findByIdAndUpdate(
      id,
      { status: CAMPAIGN_STATUS.APPROVED },
      { new: true }
    );
    return campaign;
  }

  static async launchCampaign(id: string) {
    const campaign = await Campaign.findById(id).populate('audienceId');
    if (!campaign) throw new Error('Campaign not found');

    campaign.status = CAMPAIGN_STATUS.ACTIVE;
    await campaign.save();

    await queueService.addCampaignJob({
      campaignId: campaign._id.toString(),
      audienceId: (campaign.audienceId as any)._id.toString(),
      message: campaign.message,
      channel: campaign.channel,
      totalCustomers: (campaign.audienceId as any).customerCount,
    });

    return campaign;
  }

  static async generateInsights(id: string) {
    const [campaign, analytics] = await Promise.all([
      Campaign.findById(id),
      CampaignAnalytics.findOne({ campaignId: new Types.ObjectId(id) }),
    ]);

    if (!campaign || !analytics) throw new Error('Not found');

    const insightsList = await AIService.analyzeCampaignPerformance(campaign.toObject(), analytics.toObject());
    
    await CampaignInsight.deleteMany({ campaignId: new Types.ObjectId(id) });
    const created = await CampaignInsight.insertMany(
      insightsList.map(i => ({ ...i, campaignId: campaign._id }))
    );

    return created;
  }
}