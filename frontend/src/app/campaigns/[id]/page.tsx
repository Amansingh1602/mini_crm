"use client";

import { useQuery } from "@tanstack/react-query";
import { campaignApi } from "@/lib/api";
import { useParams } from "next/navigation";
import { Megaphone, Target, ArrowLeft, BrainCircuit, Rocket, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [isProcessing, setIsProcessing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => campaignApi.getById(id),
    refetchInterval: (query) => (query.state.data?.data?.status === "RUNNING" ? 3000 : false),
  });

  const campaign = data?.data;

  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      await campaignApi.approve(id);
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLaunch = async () => {
    try {
      setIsProcessing(true);
      await campaignApi.launch(id);
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="skeleton" style={{ height: "400px" }}></div>;
  }

  if (!campaign) {
    return <div>Campaign not found</div>;
  }

  return (
    <div className="fade-in">
      <Link href="/campaigns" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", textDecoration: "none", marginBottom: "20px", fontSize: "14px" }}>
        <ArrowLeft size={16} /> Back to Campaigns
      </Link>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <h1 style={{ fontSize: "28px", fontWeight: 700 }} className="gradient-text">{campaign.title}</h1>
            <span className={`badge badge-${campaign.status.toLowerCase()}`}>{campaign.status}</span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "600px" }}>{campaign.goal}</p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {campaign.status === "DRAFT" && (
            <button onClick={handleApprove} disabled={isProcessing} className="btn-primary" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
              <ThumbsUp size={16} /> Approve
            </button>
          )}
          {campaign.status === "APPROVED" && (
            <button onClick={handleLaunch} disabled={isProcessing} className="btn-primary">
              <Rocket size={16} /> Launch Campaign
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        {/* Main Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Message Preview */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Megaphone size={18} style={{ color: "var(--accent)" }} /> Message Content
            </h2>
            <div style={{ padding: "16px", background: "var(--bg-hover)", borderRadius: "12px", border: "1px solid var(--border)", whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: 1.6 }}>
              {campaign.message}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginTop: "16px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Channel</div>
                <div style={{ fontWeight: 500 }}>{campaign.channel}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Offer</div>
                <div style={{ fontWeight: 500 }}>{campaign.offer || "None"}</div>
              </div>
            </div>
          </div>

          {/* AI Reasoning */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <BrainCircuit size={18} style={{ color: "var(--accent)" }} /> AI Reasoning
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 600, marginBottom: "4px" }}>WHY THIS AUDIENCE</div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{campaign.audienceReasoning}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 600, marginBottom: "4px" }}>WHY THIS MESSAGE</div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{campaign.messageReasoning}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 600, marginBottom: "4px" }}>WHY {campaign.channel}</div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{campaign.channelReasoning}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Audience Summary */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Target size={18} style={{ color: "var(--accent)" }} /> Audience
            </h2>
            <div style={{ fontWeight: 500, marginBottom: "4px" }}>{campaign.audience.name}</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--accent)" }}>{campaign.audience.customerCount.toLocaleString()}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Targeted Customers</div>
          </div>

          {/* Real-time Analytics */}
          {campaign.analytics && (
            <div className="glass-card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Performance</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { label: "Sent", value: campaign.analytics.sent, color: "var(--info)" },
                  { label: "Delivered", value: campaign.analytics.delivered, color: "var(--success)" },
                  { label: "Opened", value: campaign.analytics.opened, color: "var(--warning)" },
                  { label: "Clicked", value: campaign.analytics.clicked, color: "var(--accent)" },
                  { label: "Purchased", value: campaign.analytics.purchased, color: "#a78bfa" },
                  { label: "Failed", value: campaign.analytics.failed, color: "var(--danger)" },
                ].map((stat) => (
                  <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{stat.label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ fontSize: "14px", fontWeight: 600 }}>{stat.value.toLocaleString()}</div>
                      {campaign.analytics.sent > 0 && stat.label !== "Sent" && (
                        <div style={{ fontSize: "11px", color: stat.color, width: "36px", textAlign: "right" }}>
                          {Math.round((stat.value / campaign.analytics.sent) * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
