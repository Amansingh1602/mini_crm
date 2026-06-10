"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const queryClient = useQueryClient();

  // Setup real-time analytics stream via WebSocket
  useEffect(() => {
    // The backend runs on port 3001
    const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001");

    socket.on("connect", () => {
      console.log("Connected to real-time analytics stream");
    });

    socket.on("campaignAnalyticsUpdated", (data) => {
      console.log("Received live analytics update:", data);
      // Invalidate the dashboard query to trigger a background refetch
      // This will make the numbers tick up live!
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

  const statCards = d
    ? [
        { label: "Total Customers", value: d.overview.totalCustomers.toLocaleString(), icon: Users, color: "#6366f1" },
        { label: "Total Orders", value: d.overview.totalOrders.toLocaleString(), icon: ShoppingCart, color: "#22c55e" },
        { label: "Campaigns", value: d.overview.totalCampaigns.toLocaleString(), icon: Megaphone, color: "#eab308" },
        { label: "Revenue", value: `₹${(d.overview.totalRevenue / 1000).toFixed(0)}K`, icon: TrendingUp, color: "#a78bfa" },
      ]
    : [];

  const commMetrics = d?.communicationMetrics;
  const metricCards = commMetrics
    ? [
        { label: "Sent", value: commMetrics.sent, icon: Send, color: "#3b82f6" },
        { label: "Delivered", value: commMetrics.delivered, icon: CheckCircle2, color: "#22c55e" },
        { label: "Failed", value: commMetrics.failed, icon: XCircle, color: "#ef4444" },
        { label: "Opened", value: commMetrics.opened, icon: Eye, color: "#eab308" },
        { label: "Clicked", value: commMetrics.clicked, icon: MousePointerClick, color: "#f97316" },
        { label: "Purchased", value: commMetrics.purchased, icon: DollarSign, color: "#a78bfa" },
      ]
    : [];

  if (isLoading) {
    return (
      <div>
        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }} className="gradient-text">
          Dashboard
        </h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginTop: "24px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: "120px", borderRadius: "16px" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700 }} className="gradient-text">
            Dashboard
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Your AI-powered marketing command center
          </p>
        </div>
        <Link href="/agent" className="btn-primary pulse-glow">
          <Sparkles size={16} />
          Launch AI Agent
        </Link>
      </div>

      {/* Overview Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                    {card.value}
                  </div>
                </div>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: `${card.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={20} style={{ color: card.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Communication Metrics */}
      {metricCards.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "var(--text-primary)" }}>
            Communication Metrics
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
            {metricCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
                  <Icon size={20} style={{ color: card.color, margin: "0 auto 8px" }} />
                  <div style={{ fontSize: "22px", fontWeight: 700 }}>{card.value.toLocaleString()}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{card.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Campaigns */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Recent Campaigns</h2>
          <Link href="/campaigns" style={{ fontSize: "13px", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
            View all <ArrowUpRight size={14} />
          </Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {d?.recentCampaigns?.length > 0 ? (
            d.recentCampaigns.map((campaign: any) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="glass-card"
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>{campaign.title}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                    {campaign.audience?.name} • {campaign.channel}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {campaign.analytics && (
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {campaign.analytics.sent} sent
                    </div>
                  )}
                  <span className={`badge badge-${campaign.status.toLowerCase()}`}>
                    {campaign.status}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
              <Megaphone size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
              <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                No campaigns yet. Use the{" "}
                <Link href="/agent" style={{ color: "var(--accent)" }}>
                  AI Agent
                </Link>{" "}
                to create your first campaign.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {(!d || d.overview.totalCustomers === 0) && (
        <div className="glass-card" style={{ padding: "24px", marginTop: "24px", textAlign: "center", border: "1px dashed var(--accent)" }}>
          <Sparkles size={28} style={{ color: "var(--accent)", margin: "0 auto 12px" }} />
          <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: "8px" }}>Get Started</div>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "16px" }}>
            Seed your database with sample customers and orders to try the AI Campaign Planner.
          </p>
          <SeedButton />
        </div>
      )}
    </div>
  );
}

function SeedButton() {
  const { mutate, isPending } = useQuery({
    queryKey: ["seed-placeholder"],
    queryFn: () => Promise.resolve(null),
    enabled: false,
  });

  const handleSeed = async () => {
    try {
      await customerApi.seed(500);
      window.location.reload();
    } catch (err) {
      console.error("Seed failed:", err);
    }
  };

  return (
    <button onClick={handleSeed} className="btn-primary">
      Seed 500 Customers & Orders
    </button>
  );
}
