"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart3, MessageSquare, Send } from "lucide-react";

const COLORS = {
  WHATSAPP: "#22c55e",
  SMS: "#3b82f6",
  EMAIL: "#eab308",
  RCS: "#a78bfa",
};

export default function AnalyticsPage() {
  const { data: channelsData, isLoading: isLoadingChannels } = useQuery({
    queryKey: ["analytics", "channels"],
    queryFn: analyticsApi.channels,
  });

  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: analyticsApi.dashboard,
  });

  const isLoading = isLoadingChannels || isLoadingDashboard;

  if (isLoading) {
    return (
      <div>
        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "24px" }} className="gradient-text">Analytics</h1>
        <div className="skeleton" style={{ height: "400px", borderRadius: "16px" }}></div>
      </div>
    );
  }

  const channelMetrics = channelsData?.data || [];
  const overview = dashboardData?.data?.overview;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700 }} className="gradient-text">Analytics</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Performance across all channels and campaigns</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div className="glass-card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <BarChart3 size={18} style={{ color: "var(--accent)" }} /> Channel Performance (Deliveries)
          </h2>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelMetrics} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="channel" stroke="var(--text-secondary)" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                <YAxis stroke="var(--text-secondary)" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                <RechartsTooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)" }}
                />
                <Bar dataKey="delivered" radius={[4, 4, 0, 0]}>
                  {channelMetrics.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.channel as keyof typeof COLORS] || "var(--accent)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <MessageSquare size={18} style={{ color: "var(--accent)" }} /> Channel Effectiveness (Open Rate %)
          </h2>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={channelMetrics.map((c: any) => ({ ...c, openRate: c.delivered > 0 ? (c.opened / c.delivered) * 100 : 0 }))}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="channel" stroke="var(--text-secondary)" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                <YAxis stroke="var(--text-secondary)" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                <RechartsTooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)" }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Open Rate']}
                />
                <Bar dataKey="openRate" radius={[4, 4, 0, 0]}>
                  {channelMetrics.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.channel as keyof typeof COLORS] || "var(--accent)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Channel Breakdown</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Channel</th>
              <th style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Campaigns</th>
              <th style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Sent</th>
              <th style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Delivered</th>
              <th style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Open Rate</th>
              <th style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Revenue Generated</th>
            </tr>
          </thead>
          <tbody>
            {channelMetrics.map((c: any) => (
              <tr key={c.channel} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "16px", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: COLORS[c.channel as keyof typeof COLORS] || "var(--accent)" }}></div>
                  {c.channel}
                </td>
                <td style={{ padding: "16px", color: "var(--text-secondary)" }}>{c.campaigns}</td>
                <td style={{ padding: "16px", color: "var(--text-secondary)" }}>{c.sent.toLocaleString()}</td>
                <td style={{ padding: "16px", color: "var(--text-secondary)" }}>{c.delivered.toLocaleString()}</td>
                <td style={{ padding: "16px", color: "var(--text-secondary)" }}>
                  {c.delivered > 0 ? ((c.opened / c.delivered) * 100).toFixed(1) : 0}%
                </td>
                <td style={{ padding: "16px", fontWeight: 500, color: "var(--success)" }}>
                  ₹{c.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
