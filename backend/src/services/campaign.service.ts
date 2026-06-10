import { Campaign } from '../models/Campaign';
import { Audience } from '../models/Audience';
import { Customer } from '../models/Customer';
import { Communication } from '../models/Communication';
import { CampaignAnalytics } from '../models/CampaignAnalytics';
import { CampaignInsight } from '../models/CampaignInsight';
import {
  generateCampaign,
  autonomousCampaignAgent,
  generateInsights,
  buildWhereClause,
} from './ai.service';
import { getSendQueue } from '../queues/queue';
import { logger } from '../lib/logger';
import { CAMPAIGN_STATUS, COMMUNICATION_STATUS } from '../config/constants';

export class CampaignService {
  static async generateCampaign(goal: string, audienceId?: string) {
    let audienceContext;
    if (audienceId) {
      const audience = await Audience.findById(audienceId);
      if (!audience) return null;
      audienceContext = {
        name: audience.name,
        count: audience.customerCount,
        filters: audience.filters,
        reasoning: audience.reasoning,
      };
    }

    const result = await generateCampaign(goal, audienceContext);
    let finalAudienceId = audienceId;
    if (!finalAudienceId) {
      const audience = await Audience.create({
        name: `Auto: ${result.title}`,
        description: `Auto-generated for campaign: ${result.title}`,
        filters: "{}",
        reasoning: result.audienceReasoning || "Auto-generated",
        customerCount: 0,
      });
      finalAudienceId = audience._id.toString();
    }

    const campaign = await Campaign.create({
      audienceId: finalAudienceId,
      title: result.title,
      goal,
      offer: result.offer,
      message: result.message,
      cta: result.cta,
      channel: result.channel,
      status: CAMPAIGN_STATUS.DRAFT,
      predictedMetrics: result.predictedMetrics,
      audienceReasoning: result.audienceReasoning,
      messageReasoning: result.messageReasoning,
      channelReasoning: result.channelReasoning,
      offerReasoning: result.offerReasoning,
    });

    return campaign.populate('audienceId');
  }

  static async generateAutonomous(goal: string) {
    const result = await autonomousCampaignAgent(goal);
    const audience = await Audience.create({
      name: result.audience.name,
      description: result.audience.description,
      filters: result.audience.filters,
      reasoning: result.audience.reasoning,
      customerCount: result.audience.estimatedCount,
    });

    const campaign = await Campaign.create({
      audienceId: audience._id,
      title: result.campaign.title,
      goal,
      offer: result.campaign.offer,
      message: result.campaign.message,
      cta: result.campaign.cta,
      channel: result.campaign.channel,
      status: CAMPAIGN_STATUS.DRAFT,
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

  static async getCampaigns() {
    const campaigns = await Campaign.find()
      .sort({ createdAt: -1 })
      .populate('audienceId', 'name customerCount');

    return Promise.all(
      campaigns.map(async (camp) => {
        const obj = camp.toObject() as any;
        obj.audience = obj.audienceId;
        delete obj.audienceId;
        const analytics = await CampaignAnalytics.findOne({ campaignId: camp._id });
        obj.analytics = analytics;
        const commCount = await Communication.countDocuments({ campaignId: camp._id });
        obj._count = { communications: commCount };
        return obj;
      })
    );
  }

  static async getCampaignById(id: string) {
    const campaign = await Campaign.findById(id).populate('audienceId');
    if (!campaign) return null;

    const obj = campaign.toObject() as any;
    obj.audience = obj.audienceId;
    delete obj.audienceId;
    obj.analytics = await CampaignAnalytics.findOne({ campaignId: campaign._id });
    obj.insights = await CampaignInsight.find({ campaignId: campaign._id }).sort({ createdAt: -1 });
    obj._count = { communications: await Communication.countDocuments({ campaignId: campaign._id }) };
    return obj;
  }

  static async approveCampaign(id: string) {
    const campaign = await Campaign.findById(id);
    if (!campaign) return { status: 404, message: 'Campaign not found' };
    if (campaign.status !== CAMPAIGN_STATUS.DRAFT) {
      return { status: 400, message: `Campaign cannot be approved — current status: ${campaign.status}` };
    }
    campaign.status = CAMPAIGN_STATUS.APPROVED;
    await campaign.save();
    return { status: 200, campaign };
  }

  static async launchCampaign(id: string) {
    const campaign = await Campaign.findById(id).populate('audienceId');
    if (!campaign) return { status: 404, message: 'Campaign not found' };
    if (campaign.status !== CAMPAIGN_STATUS.APPROVED) {
      return { status: 400, message: `Campaign must be APPROVED to launch. Current: ${campaign.status}` };
    }

    const audience = campaign.audienceId as any;
    const whereClause = buildWhereClause(audience.filters);
    const customers = await Customer.find(whereClause).select('name email phone');
    if (customers.length === 0) {
      return { status: 400, message: 'No customers match the audience filters' };
    }

    campaign.status = CAMPAIGN_STATUS.RUNNING;
    campaign.launchedAt = new Date();
    await campaign.save();

    await CampaignAnalytics.findOneAndUpdate(
      { campaignId: campaign._id },
      { $setOnInsert: { campaignId: campaign._id }, $set: { total: customers.length } },
      { upsert: true, new: true }
    );

    const sendQueue = getSendQueue();
    let enqueued = 0;
    for (const customer of customers) {
      const personalizedMessage = campaign.message.replace(/\{\{name\}\}/gi, customer.name);
      const communication = await Communication.create({
        campaignId: campaign._id,
        customerId: customer._id,
        channel: campaign.channel,
        message: personalizedMessage,
        status: COMMUNICATION_STATUS.PENDING,
      });

      await sendQueue.add('send', {
        communicationId: communication._id.toString(),
        campaignId: campaign._id.toString(),
        customerId: customer._id.toString(),
        channel: campaign.channel,
        message: personalizedMessage,
        customerEmail: customer.email,
        customerPhone: customer.phone || '',
        customerName: customer.name,
      }, { jobId: `send-${communication._id}` });

      enqueued++;
    }

    logger.info({ campaignId: campaign.id, enqueued }, 'Campaign launched');

    return {
      status: 200,
      data: {
        campaignId: campaign.id,
        status: CAMPAIGN_STATUS.RUNNING,
        customersTargeted: customers.length,
        communicationsEnqueued: enqueued,
      },
    };
  }

  static async generateInsights(id: string) {
    const result = await generateInsights(id);
    for (const insight of result.insights) {
      await CampaignInsight.create({
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