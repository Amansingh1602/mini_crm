import { getOpenAI } from '../lib/openai';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { Prisma } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────

export interface AudienceGenerationResult {
  name: string;
  description: string;
  filters: AudienceFilters;
  reasoning: string;
  estimatedCount: number;
}

export interface AudienceFilters {
  minTotalSpent?: number;
  maxTotalSpent?: number;
  cities?: string[];
  genders?: string[];
  minAge?: number;
  maxAge?: number;
  lastPurchaseBefore?: string; // ISO date
  lastPurchaseAfter?: string;
  orderCategories?: string[];
  minOrderCount?: number;
  maxOrderCount?: number;
}

export interface CampaignGenerationResult {
  title: string;
  offer: string;
  message: string;
  cta: string;
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'RCS';
  audienceReasoning: string;
  messageReasoning: string;
  channelReasoning: string;
  offerReasoning: string;
  predictedMetrics: {
    deliveryRate: number;
    openRate: number;
    ctr: number;
    conversionRate: number;
  };
}

export interface AutonomousResult {
  audience: AudienceGenerationResult;
  campaign: CampaignGenerationResult;
}

export interface InsightResult {
  insights: Array<{
    insight: string;
    category: 'audience' | 'message' | 'channel' | 'offer' | 'timing' | 'general';
    severity: 'info' | 'warning' | 'critical';
    recommendation: string;
  }>;
  nextCampaignSuggestion: string;
}

// ─── Data Context Helper ──────────────────────────────────
// Gives the AI real data about the customer base for grounded reasoning

async function getDataContext(): Promise<string> {
  const [
    customerCount,
    cityDistribution,
    genderDistribution,
    spendStats,
    categoryDistribution,
    recentCustomers,
    dormantCustomers,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.groupBy({ by: ['city'], _count: true, orderBy: { _count: { city: 'desc' } }, take: 10 }),
    prisma.customer.groupBy({ by: ['gender'], _count: true }),
    prisma.customer.aggregate({ _avg: { totalSpent: true, age: true }, _max: { totalSpent: true }, _min: { totalSpent: true } }),
    prisma.order.groupBy({ by: ['category'], _count: true, _sum: { amount: true }, orderBy: { _count: { category: 'desc' } }, take: 10 }),
    prisma.customer.count({ where: { lastPurchaseDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    prisma.customer.count({ where: { lastPurchaseDate: { lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } } }),
  ]);

  return `
CUSTOMER DATABASE SUMMARY:
- Total customers: ${customerCount}
- Customers active in last 30 days: ${recentCustomers}
- Dormant customers (no purchase in 60+ days): ${dormantCustomers}
- Cities: ${cityDistribution.map(c => `${c.city || 'Unknown'} (${c._count})`).join(', ')}
- Gender: ${genderDistribution.map(g => `${g.gender || 'Unknown'} (${g._count})`).join(', ')}
- Avg spend: ₹${Math.round(spendStats._avg.totalSpent || 0)}, Max: ₹${Math.round(spendStats._max.totalSpent || 0)}, Min: ₹${Math.round(spendStats._min.totalSpent || 0)}
- Avg age: ${Math.round(spendStats._avg.age || 0)}
- Top categories: ${categoryDistribution.map(c => `${c.category} (${c._count} orders, ₹${Math.round(c._sum.amount || 0)})`).join(', ')}
`.trim();
}

// ─── AI Audience Builder ──────────────────────────────────

export async function generateAudience(naturalLanguageQuery: string): Promise<AudienceGenerationResult> {
  const openai = getOpenAI();
  const dataContext = await getDataContext();

  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an AI audience segmentation engine for a marketing CRM. Given a natural language description of a target audience, you must generate structured filters to query the customer database.

${dataContext}

AVAILABLE FILTER FIELDS:
- minTotalSpent / maxTotalSpent: Filter by customer lifetime spend (in ₹)
- cities: Array of city names (case-insensitive match)
- genders: Array of genders ("Male", "Female", "Other")
- minAge / maxAge: Age range
- lastPurchaseBefore / lastPurchaseAfter: ISO date strings for purchase recency
- orderCategories: Array of product categories the customer has ordered from
- minOrderCount / maxOrderCount: Number of orders placed

RULES:
1. Generate filters that best match the user's intent
2. Be specific but not overly restrictive
3. Provide clear reasoning for each filter choice
4. Estimate the count based on the data summary above
5. Generate a descriptive audience name
6. Respond in valid JSON only

RESPONSE FORMAT:
{
  "name": "Descriptive Audience Name",
  "description": "One-line description",
  "filters": { ... filter fields ... },
  "reasoning": "2-3 sentences explaining why these filters match the user's intent and what behavior patterns they capture",
  "estimatedCount": number
}`
      },
      {
        role: 'user',
        content: naturalLanguageQuery,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('AI returned empty response');

  const result = JSON.parse(content) as AudienceGenerationResult;

  // Validate required fields
  if (!result.name || !result.filters || !result.reasoning) {
    throw new Error('AI response missing required fields');
  }

  // Get actual count from database
  const whereClause = buildWhereClause(result.filters);
  const actualCount = await prisma.customer.count({ where: whereClause });
  result.estimatedCount = actualCount;

  logger.info({ query: naturalLanguageQuery, audience: result.name, count: actualCount }, 'Audience generated');

  return result;
}

// ─── AI Campaign Generator ───────────────────────────────

export async function generateCampaign(
  goal: string,
  audienceContext?: { name: string; count: number; filters: AudienceFilters; reasoning: string }
): Promise<CampaignGenerationResult> {
  const openai = getOpenAI();
  const dataContext = await getDataContext();

  const audienceInfo = audienceContext
    ? `\nTARGET AUDIENCE:\n- Name: ${audienceContext.name}\n- Size: ${audienceContext.count} customers\n- Filters: ${JSON.stringify(audienceContext.filters)}\n- Reasoning: ${audienceContext.reasoning}`
    : '';

  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.5,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an AI campaign strategist for a D2C brand's marketing CRM. Given a campaign goal and audience context, generate a complete campaign strategy.

${dataContext}
${audienceInfo}

AVAILABLE CHANNELS: WHATSAPP, SMS, EMAIL, RCS

CHANNEL SELECTION GUIDELINES:
- WHATSAPP: Best for personalized, conversational messages. High open rates. Good for offers and re-engagement.
- SMS: Best for urgent, time-sensitive messages. Short format. Good for flash sales.
- EMAIL: Best for detailed content, product showcases. Good for newsletters and loyalty programs.
- RCS: Best for rich media messages. Good for product catalogs and interactive content.

RULES:
1. Campaign must directly address the stated goal
2. Message should be personalized and compelling (use {{name}} for personalization)
3. Offer should be realistic and actionable
4. Predict performance metrics conservatively
5. Explain EVERY decision (audience, message, channel, offer)
6. Keep messages concise and actionable

RESPONSE FORMAT:
{
  "title": "Campaign Title",
  "offer": "e.g., 20% off on next purchase",
  "message": "The actual message to send (use {{name}} for personalization)",
  "cta": "Call to action text",
  "channel": "WHATSAPP" | "SMS" | "EMAIL" | "RCS",
  "audienceReasoning": "Why this audience fits the goal",
  "messageReasoning": "Why this message will resonate",
  "channelReasoning": "Why this channel is optimal",
  "offerReasoning": "Why this offer will drive action",
  "predictedMetrics": {
    "deliveryRate": 0.0-1.0,
    "openRate": 0.0-1.0,
    "ctr": 0.0-1.0,
    "conversionRate": 0.0-1.0
  }
}`
      },
      {
        role: 'user',
        content: goal,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('AI returned empty response');

  const result = JSON.parse(content) as CampaignGenerationResult;

  // Validate channel
  const validChannels = ['WHATSAPP', 'SMS', 'EMAIL', 'RCS'];
  if (!validChannels.includes(result.channel)) {
    result.channel = 'WHATSAPP'; // Safe default
  }

  logger.info({ goal, title: result.title, channel: result.channel }, 'Campaign generated');

  return result;
}

// ─── Autonomous Campaign Agent ────────────────────────────
// Flagship feature: Single prompt → full campaign pipeline

export async function autonomousCampaignAgent(goal: string): Promise<AutonomousResult> {
  logger.info({ goal }, 'Autonomous agent started');

  // Step 1: Generate audience from goal
  const audience = await generateAudience(goal);

  // Step 2: Generate campaign with audience context
  const campaign = await generateCampaign(goal, {
    name: audience.name,
    count: audience.estimatedCount,
    filters: audience.filters,
    reasoning: audience.reasoning,
  });

  logger.info(
    { goal, audience: audience.name, campaign: campaign.title },
    'Autonomous agent completed'
  );

  return { audience, campaign };
}

// ─── AI Campaign Insights ─────────────────────────────────

export async function generateInsights(campaignId: string): Promise<InsightResult> {
  const openai = getOpenAI();

  // Fetch campaign data with analytics
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      analytics: true,
      audience: true,
    },
  });

  if (!campaign) throw new Error('Campaign not found');
  if (!campaign.analytics) throw new Error('No analytics data available');

  const analytics = campaign.analytics;
  const total = analytics.total || analytics.sent || 1;

  const metrics = {
    deliveryRate: ((analytics.delivered / total) * 100).toFixed(1),
    failureRate: ((analytics.failed / total) * 100).toFixed(1),
    openRate: analytics.delivered > 0 ? ((analytics.opened / analytics.delivered) * 100).toFixed(1) : '0',
    readRate: analytics.opened > 0 ? ((analytics.read / analytics.opened) * 100).toFixed(1) : '0',
    ctr: analytics.delivered > 0 ? ((analytics.clicked / analytics.delivered) * 100).toFixed(1) : '0',
    conversionRate: analytics.clicked > 0 ? ((analytics.purchased / analytics.clicked) * 100).toFixed(1) : '0',
    revenue: analytics.revenue,
  };

  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an AI marketing analyst. Analyze campaign performance data and generate actionable insights.

CAMPAIGN: "${campaign.title}"
GOAL: "${campaign.goal}"
CHANNEL: ${campaign.channel}
AUDIENCE: ${campaign.audience.name} (${campaign.audience.customerCount} customers)
MESSAGE: "${campaign.message}"
OFFER: "${campaign.offer || 'None'}"

PERFORMANCE METRICS:
- Total sent: ${analytics.sent}
- Delivered: ${analytics.delivered} (${metrics.deliveryRate}%)
- Failed: ${analytics.failed} (${metrics.failureRate}%)
- Opened: ${analytics.opened} (${metrics.openRate}% open rate)
- Read: ${analytics.read} (${metrics.readRate}% read rate)
- Clicked: ${analytics.clicked} (${metrics.ctr}% CTR)
- Purchased: ${analytics.purchased} (${metrics.conversionRate}% conversion)
- Revenue: ₹${analytics.revenue}

INDUSTRY BENCHMARKS (approximate):
- WhatsApp: 90% delivery, 70% open, 15% CTR, 3% conversion
- SMS: 95% delivery, 45% open, 8% CTR, 2% conversion
- Email: 85% delivery, 25% open, 5% CTR, 1.5% conversion
- RCS: 88% delivery, 60% open, 12% CTR, 2.5% conversion

RULES:
1. Generate 3-5 specific, actionable insights
2. Compare against benchmarks
3. Identify the weakest link in the funnel
4. Suggest specific improvements
5. Recommend a follow-up campaign

RESPONSE FORMAT:
{
  "insights": [
    {
      "insight": "Specific observation about the data",
      "category": "audience" | "message" | "channel" | "offer" | "timing" | "general",
      "severity": "info" | "warning" | "critical",
      "recommendation": "Specific action to take"
    }
  ],
  "nextCampaignSuggestion": "A specific follow-up campaign idea based on the analysis"
}`
      },
      {
        role: 'user',
        content: 'Analyze this campaign performance and provide insights.',
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('AI returned empty response');

  const result = JSON.parse(content) as InsightResult;

  logger.info({ campaignId, insightCount: result.insights.length }, 'Insights generated');

  return result;
}

// ─── Filter Builder ───────────────────────────────────────
// Converts AI-generated filters into Prisma WHERE clause

export function buildWhereClause(filters: AudienceFilters): Prisma.CustomerWhereInput {
  const where: Prisma.CustomerWhereInput = {};

  if (filters.minTotalSpent !== undefined || filters.maxTotalSpent !== undefined) {
    where.totalSpent = {};
    if (filters.minTotalSpent !== undefined) where.totalSpent.gte = filters.minTotalSpent;
    if (filters.maxTotalSpent !== undefined) where.totalSpent.lte = filters.maxTotalSpent;
  }

  if (filters.cities && filters.cities.length > 0) {
    where.city = { in: filters.cities, mode: 'insensitive' };
  }

  if (filters.genders && filters.genders.length > 0) {
    where.gender = { in: filters.genders };
  }

  if (filters.minAge !== undefined || filters.maxAge !== undefined) {
    where.age = {};
    if (filters.minAge !== undefined) where.age.gte = filters.minAge;
    if (filters.maxAge !== undefined) where.age.lte = filters.maxAge;
  }

  if (filters.lastPurchaseBefore) {
    where.lastPurchaseDate = {
      ...(where.lastPurchaseDate as object || {}),
      lt: new Date(filters.lastPurchaseBefore),
    };
  }

  if (filters.lastPurchaseAfter) {
    where.lastPurchaseDate = {
      ...(where.lastPurchaseDate as object || {}),
      gt: new Date(filters.lastPurchaseAfter),
    };
  }

  if (filters.orderCategories && filters.orderCategories.length > 0) {
    where.orders = {
      some: {
        category: { in: filters.orderCategories, mode: 'insensitive' },
      },
    };
  }

  if (filters.minOrderCount !== undefined) {
    where.orders = {
      ...(where.orders as object || {}),
    };
    // For order count filtering, we'll handle this at the query level
  }

  return where;
}
