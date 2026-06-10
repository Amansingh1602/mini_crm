"use client";

import { useQuery } from "@tanstack/react-query";
import { campaignApi } from "@/lib/api";
import { Megaphone, Target, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CampaignsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: campaignApi.list,
  });

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em" }} className="gradient-text">
            Campaigns
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Monitor and execute all automated customer marketing campaigns
          </p>
        </div>
        <Link href="/agent" className="btn-primary" style={{ textDecoration: "none" }}>
          Create Campaign
        </Link>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: "90px", borderRadius: "16px" }}></div>
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="glass-card" style={{ padding: "64px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Megaphone size={24} style={{ color: "var(--text-muted)", margin: "auto" }} />
          </div>
          <div>
            <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "15px" }}>No marketing campaigns yet</div>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
              Work with the AI Agent to build, approve, and execute campaigns.
            </p>
          </div>
          <Link href="/agent" className="btn-secondary" style={{ marginTop: "8px", textDecoration: "none" }}>
            Create Campaign with AI
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {data?.data.map((campaign: any) => {
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
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "inherit",
                  borderLeft: `4px solid ${borderColor}`,
                }}
              >
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc" }}>{campaign.title}</h3>
                    <span className={`badge badge-${campaign.status.toLowerCase()}`}>{campaign.status}</span>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", fontSize: "12px", color: "var(--text-secondary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Target size={13} style={{ color: "var(--text-muted)" }} /> 
                      <span>{campaign.audience?.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Megaphone size={13} style={{ color: "var(--text-muted)" }} /> 
                      <span style={{ textTransform: "uppercase", fontWeight: 600, fontSize: "11px" }}>{campaign.channel}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={13} style={{ color: "var(--text-muted)" }} /> 
                      <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
                  {campaign.analytics && (
                    <div style={{ display: "flex", gap: "24px", textAlign: "center" }}>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>
                          {campaign.analytics.sent.toLocaleString()}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginTop: "2px" }}>
                          Sent
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--success)" }}>
                          {campaign.analytics.delivered > 0 ? Math.round((campaign.analytics.opened / campaign.analytics.delivered) * 100) : 0}%
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginTop: "2px" }}>
                          Open Rate
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ArrowRight size={16} style={{ color: "var(--text-muted)" }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
