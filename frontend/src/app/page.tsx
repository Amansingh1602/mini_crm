"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsApi, customerApi } from "@/lib/api";
import { io } from "socket.io-client";
import {
  Users,
  ShoppingCart,
  Megaphone,
  TrendingUp,
  ArrowUpRight,
  Send,
  CheckCircle2,
  XCircle,
  Eye,
  MousePointerClick,
  DollarSign,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const queryClient = useQueryClient();

  // Setup real-time analytics stream via WebSocket
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001");

    socket.on("connect", () => {
      console.log("Connected to real-time analytics stream");
    });

    socket.on("campaignAnalyticsUpdated", (data) => {
      console.log("Received live analytics update:", data);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: analyticsApi.dashboard,
  });

  const d = dashboard?.data;

  const statCards = d?.overview
    ? [
        { label: "Total Customers", value: (d.overview.totalCustomers ?? 0).toLocaleString(), icon: Users, color: "#6366f1", glowColor: "rgba(99, 102, 241, 0.15)" },
        { label: "Total Orders", value: (d.overview.totalOrders ?? 0).toLocaleString(), icon: ShoppingCart, color: "#10b981", glowColor: "rgba(16, 185, 129, 0.15)" },
        { label: "Campaigns Active", value: (d.overview.totalCampaigns ?? 0).toLocaleString(), icon: Megaphone, color: "#f59e0b", glowColor: "rgba(245, 158, 11, 0.15)" },
        { label: "Revenue Generated", value: `₹${((d.overview.totalRevenue ?? 0) / 1000).toFixed(0)}K`, icon: TrendingUp, color: "#a78bfa", glowColor: "rgba(167, 139, 250, 0.15)" },
      ]
    : [];

  const commMetrics = d?.communicationMetrics;
  const metricCards = commMetrics
    ? [
        { label: "Sent", value: commMetrics.sent ?? 0, icon: Send, color: "#3b82f6" },
        { label: "Delivered", value: commMetrics.delivered ?? 0, icon: CheckCircle2, color: "#10b981" },
        { label: "Failed", value: commMetrics.failed ?? 0, icon: XCircle, color: "#ef4444" },
        { label: "Opened", value: commMetrics.opened ?? 0, icon: Eye, color: "#f59e0b" },
        { label: "Clicked", value: commMetrics.clicked ?? 0, icon: MousePointerClick, color: "#f97316" },
        { label: "Purchased", value: commMetrics.purchased ?? 0, icon: DollarSign, color: "#a78bfa" },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="fade-in">
        <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "8px" }} className="gradient-text">
          Dashboard
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "32px" }}>
          Loading your marketing intelligence console...
        </p>
        <div className="dashboard-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: "130px", borderRadius: "16px" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em" }} className="gradient-text">
            Dashboard
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Your AI-powered marketing command center
          </p>
        </div>
        <Link href="/agent" className="btn-primary pulse-glow" style={{ textDecoration: "none" }}>
          <Sparkles size={16} />
          Launch AI Agent
        </Link>
      </div>

      {/* Overview Stats */}
      <div>
        <div className="dashboard-grid">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="glass-card"
                style={{
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "16px",
                  borderLeft: `3px solid ${card.color}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.02em" }}>
                    {card.label}
                  </span>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: card.glowColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={18} style={{ color: card.color }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.02em", color: "#f8fafc" }}>
                    {card.value}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                    <span style={{ color: card.color, fontWeight: 600 }}>Active</span> monitoring
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Communication Metrics */}
      {metricCards.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            Communication Funnel
          </h2>
          <div className="metrics-grid">
            {metricCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="glass-card"
                  style={{
                    padding: "20px 16px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: `${card.color}10`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={16} style={{ color: card.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.01em" }}>
                      {card.value.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>
                      {card.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Campaigns */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            Recent Campaigns
          </h2>
          <Link href="/campaigns" style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
            View all campaigns <ArrowUpRight size={14} />
          </Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {d?.recentCampaigns?.length > 0 ? (
            d.recentCampaigns.map((campaign: any) => {
              // Highlight border based on status
              const statusColors = {
                draft: "rgba(148, 163, 184, 0.3)",
                approved: "rgba(6, 182, 212, 0.3)",
                running: "rgba(245, 158, 11, 0.3)",
                completed: "rgba(16, 185, 129, 0.3)",
                failed: "rgba(239, 68, 68, 0.3)",
              };
              const borderColor = statusColors[campaign.status.toLowerCase() as keyof typeof statusColors] || "var(--border)";
              
              return (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="glass-card"
                  style={{
                    padding: "18px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    textDecoration: "none",
                    color: "inherit",
                    borderLeft: `4px solid ${borderColor}`,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ fontWeight: 600, fontSize: "15px", color: "#f8fafc" }}>{campaign.title}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{campaign.audience?.name}</span>
                      <span style={{ color: "rgba(255,255,255,0.1)" }}>•</span>
                      <span style={{ textTransform: "uppercase", fontWeight: 600, fontSize: "10px", color: "var(--text-secondary)" }}>
                        {campaign.channel}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    {campaign.analytics && (
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
                        {campaign.analytics.sent.toLocaleString()} sent
                      </div>
                    )}
                    <span className={`badge badge-${campaign.status.toLowerCase()}`}>
                      {campaign.status}
                    </span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="glass-card" style={{ padding: "48px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Megaphone size={24} style={{ color: "var(--text-muted)", margin: "auto" }} />
              </div>
              <div>
                <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "15px" }}>No campaigns yet</div>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
                  Use the AI Agent to build your first autonomous marketing sequence.
                </p>
              </div>
              <Link href="/agent" className="btn-secondary" style={{ marginTop: "8px", textDecoration: "none" }}>
                <Sparkles size={14} style={{ color: "var(--accent)" }} /> Set up with AI
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {(!d || d.overview.totalCustomers === 0) && (
        <div className="glass-card" style={{ padding: "32px", textAlign: "center", border: "1px dashed rgba(99, 102, 241, 0.4)", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={24} style={{ color: "var(--accent)" }} />
          </div>
          <div style={{ maxWidth: "480px" }}>
            <div style={{ fontWeight: 700, fontSize: "18px", color: "#f8fafc", marginBottom: "6px" }}>Initialize Database</div>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.5" }}>
              Seed your dashboard with 500 mock customers, custom orders, and order histories to test the AI Campaign Engine in real time.
            </p>
          </div>
          <SeedButton />
        </div>
      )}
    </div>
  );
}

function SeedButton() {
  const { mutate, isPending } = useMutation({
    mutationFn: () => customerApi.seed(500),
    onSuccess: () => {
      window.location.reload();
    },
    onError: (err) => {
      console.error("Seed failed:", err);
    },
  });

  return (
    <button onClick={() => mutate()} className="btn-primary" disabled={isPending}>
      {isPending ? "Initializing..." : "Seed 500 Customers & Orders"}
    </button>
  );
}
