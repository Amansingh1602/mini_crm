"use client";

import { useQuery } from "@tanstack/react-query";
import { campaignApi } from "@/lib/api";
import { useParams } from "next/navigation";
import { Megaphone, Target, ArrowLeft, BrainCircuit, Rocket, ThumbsUp, ChevronRight, BarChart3 } from "lucide-react";
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
    return (
      <div className="fade-in">
        <div className="skeleton" style={{ height: "40px", width: "140px", marginBottom: "20px" }} />
        <div className="skeleton" style={{ height: "300px", borderRadius: "16px" }} />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="fade-in" style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Campaign not found</h2>
        <Link href="/campaigns" className="btn-secondary" style={{ marginTop: "16px", textDecoration: "none" }}>
          Back to Campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Back Link */}
      <div>
        <Link href="/campaigns" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", textDecoration: "none", fontSize: "14px", fontWeight: 500, transition: "color 0.2s" }} className="hover:text-white">
          <ArrowLeft size={16} /> Back to Campaigns
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em" }} className="gradient-text">
              {campaign.title}
            </h1>
            <span className={`badge badge-${campaign.status.toLowerCase()}`}>{campaign.status}</span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "700px", lineHeight: "1.5" }}>
            {campaign.goal}
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {campaign.status === "DRAFT" && (
            <button onClick={handleApprove} disabled={isProcessing} className="btn-primary" style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.2)" }}>
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

      {/* Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        {/* Main Details Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Message Preview */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "#f8fafc" }}>
              <Megaphone size={18} style={{ color: "var(--accent)" }} /> Message Copywriter
            </h2>
            <div style={{ padding: "18px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "12px", border: "1px solid var(--border)", whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: 1.6, color: "var(--text-primary)" }}>
              {campaign.message}
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px", marginTop: "20px" }}>
              <div style={{ background: "rgba(255,255,255,0.01)", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.02em" }}>Channel</div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#f8fafc", marginTop: "4px" }}>{campaign.channel}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.01)", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.02em" }}>Offer Included</div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#f8fafc", marginTop: "4px" }}>{campaign.offer || "None"}</div>
              </div>
            </div>
          </div>

          {/* AI Reasoning */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "#f8fafc" }}>
              <BrainCircuit size={18} style={{ color: "var(--accent)" }} /> AI Planner Reasoning
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "6px" }}>Why this audience?</div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5" }}>{campaign.audienceReasoning}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "6px" }}>Why this copywriting strategy?</div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5" }}>{campaign.messageReasoning}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "6px" }}>Why channel {campaign.channel}?</div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5" }}>{campaign.channelReasoning}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Audience Summary Card */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "#f8fafc" }}>
              <Target size={18} style={{ color: "var(--accent)" }} /> Segment Audience
            </h2>
            <div>
              <div style={{ fontWeight: 700, fontSize: "16px", color: "#f8fafc" }}>{campaign.audience.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "14px" }}>
                <span style={{ fontSize: "36px", fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.02em" }}>
                  {campaign.audience.customerCount.toLocaleString()}
                </span>
                <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>Customers</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)", marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
                <span>Status:</span>
                <span style={{ color: "var(--success)", fontWeight: 600 }}>Active Dynamic Cohort</span>
              </div>
            </div>
          </div>

          {/* Performance Analytics Card */}
          {campaign.analytics && (
            <div className="glass-card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "#f8fafc" }}>
                <BarChart3 size={18} style={{ color: "var(--accent)" }} /> Campaign Performance
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { label: "Sent", value: campaign.analytics.sent, color: "var(--info)" },
                  { label: "Delivered", value: campaign.analytics.delivered, color: "var(--success)" },
                  { label: "Opened", value: campaign.analytics.opened, color: "var(--warning)" },
                  { label: "Clicked", value: campaign.analytics.clicked, color: "var(--accent)" },
                  { label: "Purchased", value: campaign.analytics.purchased, color: "#a78bfa" },
                  { label: "Failed", value: campaign.analytics.failed, color: "var(--danger)" },
                ].map((stat) => {
                  const percent = campaign.analytics.sent > 0 && stat.label !== "Sent"
                    ? Math.round((stat.value / campaign.analytics.sent) * 100)
                    : 0;

                  return (
                    <div key={stat.label} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                        <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{stat.label}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 700, color: "#f8fafc" }}>{stat.value.toLocaleString()}</span>
                          {campaign.analytics.sent > 0 && stat.label !== "Sent" && (
                            <span style={{ fontSize: "11px", color: stat.color, fontWeight: 600, width: "32px", textAlign: "right" }}>
                              {percent}%
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress Bar decoration */}
                      {stat.label !== "Sent" && (
                        <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.02)", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ width: `${percent}%`, height: "100%", background: stat.color, borderRadius: "2px", transition: "width 0.5s ease" }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
