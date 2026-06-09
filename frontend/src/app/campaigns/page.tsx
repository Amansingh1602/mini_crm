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
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700 }} className="gradient-text">Campaigns</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>All marketing campaigns</p>
        </div>
        <Link href="/agent" className="btn-primary">
          Create Campaign
        </Link>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "12px" }}></div>
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
          <Megaphone size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
          <div style={{ color: "var(--text-secondary)" }}>No campaigns found. Create one using the AI Agent.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {data?.data.map((campaign: any) => (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}`}
              className="glass-card hover:bg-white/5"
              style={{ padding: "20px", display: "flex", alignItems: "center", textDecoration: "none", color: "inherit", transition: "background 0.2s" }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 600 }}>{campaign.title}</h3>
                  <span className={`badge badge-${campaign.status.toLowerCase()}`}>{campaign.status}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Target size={14} /> {campaign.audience?.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Megaphone size={14} /> {campaign.channel}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Clock size={14} /> {new Date(campaign.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              {campaign.analytics && (
                <div style={{ display: "flex", gap: "24px", marginRight: "24px", textAlign: "center" }}>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 600 }}>{campaign.analytics.sent}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Sent</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--success)" }}>
                      {campaign.analytics.delivered > 0 ? Math.round((campaign.analytics.opened / campaign.analytics.delivered) * 100) : 0}%
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Open Rate</div>
                  </div>
                </div>
              )}
              
              <ArrowRight size={20} style={{ color: "var(--text-muted)" }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
