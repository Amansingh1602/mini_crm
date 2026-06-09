import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, NotFoundError } from '../middleware/error';

const router = Router();

// ─── GET /api/analytics/dashboard ─────────────────────────
// Overview metrics for the dashboard

router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const [
      totalCustomers,
      totalOrders,
      totalCampaigns,
      totalRevenue,
      activeCampaigns,
      recentCampaigns,
      channelStats,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.order.count(),
      prisma.campaign.count(),
      prisma.order.aggregate({ _sum: { amount: true } }),
      prisma.campaign.count({ where: { status: 'RUNNING' } }),
      prisma.campaign.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { analytics: true, audience: { select: { name: true } } },
      }),
      prisma.campaign.groupBy({
        by: ['channel'],
        _count: true,
      }),
    ]);

    // Aggregate analytics across all campaigns
    const allAnalytics = await prisma.campaignAnalytics.aggregate({
      _sum: {
        sent: true,
        delivered: true,
        failed: true,
        opened: true,
        read: true,
        clicked: true,
        purchased: true,
        revenue: true,
      },
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalCustomers,
          totalOrders,
          totalCampaigns,
          activeCampaigns,
          totalRevenue: totalRevenue._sum.amount || 0,
          campaignRevenue: allAnalytics._sum.revenue || 0,
        },
        communicationMetrics: {
          sent: allAnalytics._sum.sent || 0,
          delivered: allAnalytics._sum.delivered || 0,
          failed: allAnalytics._sum.failed || 0,
          opened: allAnalytics._sum.opened || 0,
          read: allAnalytics._sum.read || 0,
          clicked: allAnalytics._sum.clicked || 0,
          purchased: allAnalytics._sum.purchased || 0,
        },
        recentCampaigns,
        channelDistribution: channelStats,
      },
    });
  })
);

// ─── GET /api/analytics/campaigns/:id ─────────────────────
// Detailed campaign analytics with funnel

router.get(
  '/campaigns/:id',
  asyncHandler(async (req, res) => {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        analytics: true,
        audience: true,
        insights: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!campaign) throw new NotFoundError('Campaign', req.params.id);

    // Communication status breakdown
    const statusBreakdown = await prisma.communication.groupBy({
      by: ['status'],
      where: { campaignId: req.params.id },
      _count: true,
    });

    // Event timeline
    const eventTimeline = await prisma.communicationEvent.findMany({
      where: { communication: { campaignId: req.params.id } },
      orderBy: { timestamp: 'asc' },
      select: { type: true, timestamp: true },
    });

    // Calculate rates
    const a = campaign.analytics;
    const total = a?.sent || 1;
    const rates = {
      deliveryRate: a ? (a.delivered / total * 100).toFixed(1) : '0',
      failureRate: a ? (a.failed / total * 100).toFixed(1) : '0',
      openRate: a && a.delivered > 0 ? (a.opened / a.delivered * 100).toFixed(1) : '0',
      readRate: a && a.opened > 0 ? (a.read / a.opened * 100).toFixed(1) : '0',
      ctr: a && a.delivered > 0 ? (a.clicked / a.delivered * 100).toFixed(1) : '0',
      conversionRate: a && a.clicked > 0 ? (a.purchased / a.clicked * 100).toFixed(1) : '0',
    };

    // Funnel data
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
        campaign,
        rates,
        funnel,
        statusBreakdown,
        eventTimeline,
      },
    });
  })
);

// ─── GET /api/analytics/channels ──────────────────────────
// Channel comparison

router.get(
  '/channels',
  asyncHandler(async (_req, res) => {
    const channelStats = await prisma.campaign.groupBy({
      by: ['channel'],
      _count: true,
    });

    // Get aggregated analytics per channel
    const channels = ['WHATSAPP', 'SMS', 'EMAIL', 'RCS'];
    const channelAnalytics = await Promise.all(
      channels.map(async (channel) => {
        const campaigns = await prisma.campaign.findMany({
          where: { channel: channel as any },
          select: { id: true },
        });

        const campaignIds = campaigns.map((c) => c.id);

        if (campaignIds.length === 0) {
          return { channel, campaigns: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, purchased: 0, revenue: 0 };
        }

        const analytics = await prisma.campaignAnalytics.aggregate({
          where: { campaignId: { in: campaignIds } },
          _sum: {
            sent: true,
            delivered: true,
            failed: true,
            opened: true,
            read: true,
            clicked: true,
            purchased: true,
            revenue: true,
          },
        });

        return {
          channel,
          campaigns: campaignIds.length,
          sent: analytics._sum.sent || 0,
          delivered: analytics._sum.delivered || 0,
          opened: analytics._sum.opened || 0,
          clicked: analytics._sum.clicked || 0,
          purchased: analytics._sum.purchased || 0,
          revenue: analytics._sum.revenue || 0,
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
