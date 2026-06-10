"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart3, MessageSquare } from "lucide-react";

const COLORS = {
  WHATSAPP: "#10b981", // Emerald
  SMS: "#3b82f6",      // Blue
  EMAIL: "#f59e0b",    // Amber
  RCS: "#a78bfa",      // Purple
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
      <div className="fade-in">
        <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px" }} className="gradient-text">
          Analytics
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "32px" }}>
          Aggregating channel response telemetry...
        </p>
        <div className="skeleton" style={{ height: "400px", borderRadius: "16px" }}></div>
      </div>
    );
  }

  const channelMetrics = channelsData?.data || [];

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em" }} className="gradient-text">
          Analytics
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          Interactive telemetry tracking performance across all messaging interfaces
        </p>
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
        {/* Deliveries Chart */}
        <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", color: "#f8fafc" }}>
            <BarChart3 size={18} style={{ color: "var(--accent)" }} /> Channel Performance (Deliveries)
          </h2>
          <div style={{ height: "300px", width: "100%", minWidth: 0, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis dataKey="channel" stroke="var(--text-muted)" tick={{ fill: "var(--text-secondary)", fontSize: 11, fontWeight: 500 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: "var(--text-secondary)", fontSize: 11, fontWeight: 500 }} />
                <RechartsTooltip
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  contentStyle={{ backgroundColor: "rgba(9, 9, 15, 0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#f8fafc", fontFamily: "var(--font-outfit)" }}
                />
                <Bar dataKey="delivered" radius={[4, 4, 0, 0]} barSize={36}>
                  {channelMetrics.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.channel as keyof typeof COLORS] || "var(--accent)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Open Rate Chart */}
        <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", color: "#f8fafc" }}>
            <MessageSquare size={18} style={{ color: "var(--accent)" }} /> Channel Effectiveness (Open Rate %)
          </h2>
          <div style={{ height: "300px", width: "100%", minWidth: 0, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={channelMetrics.map((c: any) => ({ ...c, openRate: c.delivered > 0 ? (c.opened / c.delivered) * 100 : 0 }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis dataKey="channel" stroke="var(--text-muted)" tick={{ fill: "var(--text-secondary)", fontSize: 11, fontWeight: 500 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: "var(--text-secondary)", fontSize: 11, fontWeight: 500 }} />
                <RechartsTooltip
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  contentStyle={{ backgroundColor: "rgba(9, 9, 15, 0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#f8fafc", fontFamily: "var(--font-outfit)" }}
                  formatter={(value: any) => [`${Number(value || 0).toFixed(1)}%`, 'Open Rate']}
                />
                <Bar dataKey="openRate" radius={[4, 4, 0, 0]} barSize={36}>
                  {channelMetrics.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.channel as keyof typeof COLORS] || "var(--accent)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Channels Table */}
      <div className="glass-card" style={{ overflowX: "auto" }}>
        <table style={{ minWidth: "700px" }}>
          <thead>
            <tr>
              <th>Channel Name</th>
              <th>Campaigns Run</th>
              <th>Dispatched</th>
              <th>Delivered</th>
              <th>Open Rate</th>
              <th>Gross Revenue</th>
            </tr>
          </thead>
          <tbody>
            {channelMetrics.map((c: any) => (
              <tr key={c.channel}>
                <td style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "10px", borderBottom: "none" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: COLORS[c.channel as keyof typeof COLORS] || "var(--accent)" }}></div>
                  <span style={{ color: "#f8fafc" }}>{c.channel}</span>
                </td>
                <td style={{ color: "var(--text-secondary)" }}>{c.campaigns}</td>
                <td style={{ color: "var(--text-secondary)" }}>{c.sent.toLocaleString()}</td>
                <td style={{ color: "var(--text-secondary)" }}>{c.delivered.toLocaleString()}</td>
                <td style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                  {c.delivered > 0 ? ((c.opened / c.delivered) * 100).toFixed(1) : 0}%
                </td>
                <td style={{ fontWeight: 700, color: "var(--success)" }}>
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
