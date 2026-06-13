import { z } from 'zod';
import { logger } from '../lib/logger';
import { Customer } from '../models/Customer';
import { Campaign } from '../models/Campaign';
import { CampaignAnalytics } from '../models/CampaignAnalytics';
import { Communication } from '../models/Communication';
import { CHANNELS } from '../config/constants';
import { env } from '../config/env';
import { getGroqClient } from '../lib/openai';

export interface AudienceFilters {
  minTotalSpent?: number;
  maxTotalSpent?: number;
  cities?: string[];
  genders?: string[];
  minAge?: number;
  maxAge?: number;
  lastPurchaseBefore?: string;
  lastPurchaseAfter?: string;
  orderCategories?: string[];
  minOrderCount?: number;
  maxOrderCount?: number;
}

const audienceSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  filters: z.object({
    minTotalSpent: z.number().optional(),
    maxTotalSpent: z.number().optional(),
    cities: z.array(z.string()).optional(),
    genders: z.array(z.string()).optional(),
    minAge: z.number().optional(),
    maxAge: z.number().optional(),
    lastPurchaseBefore: z.string().optional(),
    lastPurchaseAfter: z.string().optional(),
  }),
  reasoning: z.string().min(1),
});

const campaignSchema = z.object({
  title: z.string().min(1),
  offer: z.string().min(1),
  message: z.string().min(1),
  cta: z.string().min(1),
  channel: z.enum([CHANNELS.WHATSAPP, CHANNELS.SMS, CHANNELS.EMAIL, CHANNELS.RCS]),
  audienceReasoning: z.string().min(1),
  messageReasoning: z.string().min(1),
  channelReasoning: z.string().min(1),
  offerReasoning: z.string().min(1),
  predictedMetrics: z.object({
    deliveryRate: z.number().min(0).max(1),
    openRate: z.number().min(0).max(1),
    ctr: z.number().min(0).max(1),
    conversionRate: z.number().min(0).max(1),
  }),
});

const insightSchema = z.object({
  insights: z.array(z.object({
    insight: z.string().min(1),
    category: z.string().min(1),
    severity: z.string().min(1),
    recommendation: z.string().min(1),
  })).min(1),
  nextCampaignSuggestion: z.string().min(1),
});

function hasConfiguredGroqKey(): boolean {
  return Boolean(env.GROQ_API_KEY);
}

function isJsonObjectString(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith('{') && trimmed.endsWith('}');
}

function extractJson(content: string): string {
  const trimmed = content.trim();
  if (isJsonObjectString(trimmed)) return trimmed;

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error('AI response did not contain JSON');
}

function parseAiJson<T>(content: string, schema: z.ZodType<T>): T {
  const parsed = JSON.parse(extractJson(content));
  return schema.parse(parsed);
}

async function chatJson(prompt: string): Promise<string> {
  const client = getGroqClient();
  const response = await client.chat.completions.create({
    model: env.GROQ_MODEL,
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: 'You are a CRM growth strategist. Return only valid JSON and no markdown.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Groq API response was empty');
  }

  return content;
}



export function buildWhereClause(filters: any): any {
  let parsedFilters: AudienceFilters = {};
  if (typeof filters === 'string') {
    try {
      parsedFilters = JSON.parse(filters);
    } catch {
      parsedFilters = {};
    }
  } else {
    parsedFilters = filters || {};
  }

  const where: any = {};
  if (parsedFilters.minTotalSpent) {
    where.totalSpent = { $gte: parsedFilters.minTotalSpent };
  }
  if (parsedFilters.maxTotalSpent) {
    where.totalSpent = { ...(where.totalSpent || {}), $lte: parsedFilters.maxTotalSpent };
  }
  if (parsedFilters.cities?.length) {
    where.city = { $in: parsedFilters.cities };
  }
  if (parsedFilters.genders?.length) {
    where.gender = { $in: parsedFilters.genders };
  }
  if (parsedFilters.minAge !== undefined || parsedFilters.maxAge !== undefined) {
    where.age = {};
    if (parsedFilters.minAge !== undefined) {
      where.age.$gte = parsedFilters.minAge;
    }
    if (parsedFilters.maxAge !== undefined) {
      where.age.$lte = parsedFilters.maxAge;
    }
  }
  if (parsedFilters.lastPurchaseBefore || parsedFilters.lastPurchaseAfter) {
    where.lastPurchaseDate = {};
    if (parsedFilters.lastPurchaseBefore) {
      const beforeDate = new Date(parsedFilters.lastPurchaseBefore);
      if (!isNaN(beforeDate.getTime())) {
        where.lastPurchaseDate.$lte = beforeDate;
      }
    }
    if (parsedFilters.lastPurchaseAfter) {
      const afterDate = new Date(parsedFilters.lastPurchaseAfter);
      if (!isNaN(afterDate.getTime())) {
        where.lastPurchaseDate.$gte = afterDate;
      }
    }
    // Remove lastPurchaseDate if no valid dates were added
    if (Object.keys(where.lastPurchaseDate).length === 0) {
      delete where.lastPurchaseDate;
    }
  }
  return where;
}

export async function generateAudience(query: string) {
  logger.info({ query }, 'Generating audience via Groq');

  if (!hasConfiguredGroqKey()) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const content = await chatJson(`
Create a customer audience for this request: ${query}

Return JSON with this shape:
{
  "name": string,
  "description": string,
  "filters": {
    "minTotalSpent"?: number,
    "maxTotalSpent"?: number,
    "cities"?: string[],
    "genders"?: string[],
    "minAge"?: number,
    "maxAge"?: number,
    "lastPurchaseBefore"?: string (YYYY-MM-DD format),
    "lastPurchaseAfter"?: string (YYYY-MM-DD format)
  },
  "reasoning": string
}

Use only filters that can be applied directly to customer fields.
Only use valid dates in YYYY-MM-DD format for date fields.`);

  const result = parseAiJson(content, audienceSchema);
  const estimatedCount = await Customer.countDocuments(buildWhereClause(result.filters));

  return {
    name: result.name,
    description: result.description,
    filters: JSON.stringify(result.filters),
    reasoning: result.reasoning,
    estimatedCount,
  };
}

export async function generateCampaign(goal: string, audienceContext?: any) {
  logger.info({ goal }, 'Generating campaign via Groq');

  if (!hasConfiguredGroqKey()) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const content = await chatJson(`
Write a campaign for this goal: ${goal}

Audience context: ${JSON.stringify(audienceContext || {}, null, 2)}

Return JSON with this shape:
{
  "title": string,
  "offer": string,
  "message": string,
  "cta": string,
  "channel": "WHATSAPP" | "SMS" | "EMAIL" | "RCS",
  "audienceReasoning": string,
  "messageReasoning": string,
  "channelReasoning": string,
  "offerReasoning": string,
  "predictedMetrics": {
    "deliveryRate": number,
    "openRate": number,
    "ctr": number,
    "conversionRate": number
  }
}

Use {{name}} in the message where personalization makes sense.`);

  const result = parseAiJson(content, campaignSchema);

  return {
    title: result.title,
    offer: result.offer,
    message: result.message,
    cta: result.cta,
    channel: result.channel,
    audienceReasoning: result.audienceReasoning,
    messageReasoning: result.messageReasoning,
    channelReasoning: result.channelReasoning,
    offerReasoning: result.offerReasoning,
    predictedMetrics: JSON.stringify(result.predictedMetrics),
  };
}

export async function autonomousCampaignAgent(goal: string) {
  logger.info({ goal }, 'Autonomous agent started');
  const audience = await generateAudience(goal);
  const campaign = await generateCampaign(goal, audience);
  return { audience, campaign };
}

export async function generateInsights(campaignId: string) {
  logger.info({ campaignId }, 'Generating insights via Groq');

  if (!hasConfiguredGroqKey()) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const [campaign, analytics, communications] = await Promise.all([
    Campaign.findById(campaignId).populate('audienceId'),
    CampaignAnalytics.findOne({ campaignId }),
    Communication.find({ campaignId }).sort({ createdAt: -1 }).limit(10).select('channel status message createdAt'),
  ]);

  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  const content = await chatJson(`
Analyze this campaign and produce actionable insights.

Campaign:
${JSON.stringify(campaign.toObject(), null, 2)}

Analytics:
${JSON.stringify(analytics?.toObject?.() ?? analytics ?? null, null, 2)}

Recent communications:
${JSON.stringify(communications.map((communication) => communication.toObject()), null, 2)}

Return JSON with this shape:
{
  "insights": [
    {
      "insight": string,
      "category": string,
      "severity": string,
      "recommendation": string
    }
  ],
  "nextCampaignSuggestion": string
}

Focus on conversion, engagement, and channel performance.`);

  return parseAiJson(content, insightSchema);
}
