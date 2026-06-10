"use client";

import { useState, useRef, useEffect } from "react";
import { campaignApi } from "@/lib/api";
import {
  Sparkles,
  Send,
  ArrowRight,
  Loader2,
  ThumbsUp,
  Zap,
  Rocket,
} from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  type: "user" | "ai" | "system";
  content: string;
  data?: any;
  step?: string;
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "system",
      content: "Welcome to the Autonomous Campaign Planner. Describe your marketing goal and I'll handle everything — audience selection, message crafting, channel optimization, and campaign creation.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [campaignResult, setCampaignResult] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (msg: Omit<Message, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: Date.now().toString() + Math.random() }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const goal = input.trim();
    setInput("");
    addMessage({ type: "user", content: goal });
    setIsProcessing(true);

    try {
      // Step 1: Analyzing
      setCurrentStep("Analyzing your goal...");
      addMessage({
        type: "ai",
        content: "🔍 **Analyzing your business goal...** I'm examining your customer data to identify the right audience and strategy.",
        step: "analyzing",
      });

      await new Promise((r) => setTimeout(r, 800));

      // Step 2: Autonomous Campaign Agent
      setCurrentStep("Building audience & campaign...");
      addMessage({
        type: "ai",
        content: "🤖 **AI Agent activated.** Generating audience, crafting message, selecting channel, and predicting performance...",
        step: "generating",
      });

      const result = await campaignApi.autonomous(goal);
      const { campaign, audience } = result.data;

      setCampaignResult(result.data);

      // Step 3: Audience Result
      addMessage({
        type: "ai",
        content: `### 🎯 Audience Identified\n\n**${audience.name}**\n\n${audience.reasoning}\n\n**Matching customers:** ${audience.customerCount}`,
        step: "audience",
        data: audience,
      });

      await new Promise((r) => setTimeout(r, 400));

      // Step 4: Campaign Result
      const predictedMetrics = campaign.predictedMetrics;
      addMessage({
        type: "ai",
        content: `### 📣 Campaign Created\n\n**${campaign.title}**\n\n**Channel:** ${campaign.channel}\n**Offer:** ${campaign.offer || "N/A"}\n**CTA:** ${campaign.cta || "N/A"}\n\n**Message:**\n> ${campaign.message}\n\n---\n\n**Why this audience:** ${campaign.audienceReasoning}\n\n**Why this message:** ${campaign.messageReasoning}\n\n**Why ${campaign.channel}:** ${campaign.channelReasoning}\n\n**Why this offer:** ${campaign.offerReasoning}`,
        step: "campaign",
        data: campaign,
      });

      await new Promise((r) => setTimeout(r, 400));

      // Step 5: Predictions
      if (predictedMetrics) {
        addMessage({
          type: "ai",
          content: `### 📊 Predicted Performance\n\n| Metric | Prediction |\n|--------|------------|\n| Delivery Rate | ${(predictedMetrics.deliveryRate * 100).toFixed(0)}% |\n| Open Rate | ${(predictedMetrics.openRate * 100).toFixed(0)}% |\n| CTR | ${(predictedMetrics.ctr * 100).toFixed(0)}% |\n| Conversion | ${(predictedMetrics.conversionRate * 100).toFixed(0)}% |\n\nCampaign is in **DRAFT** status. Approve it to proceed.`,
          step: "prediction",
        });
      }

      setCurrentStep(null);
    } catch (error: any) {
      addMessage({
        type: "system",
        content: `❌ Error: ${error.message || "Failed to generate campaign. Please check your database connection and try again."}`,
      });
      setCurrentStep(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!campaignResult?.campaign?.id) return;
    setIsProcessing(true);

    try {
      await campaignApi.approve(campaignResult.campaign.id);
      addMessage({
        type: "ai",
        content: "✅ **Campaign approved!** Ready to launch. Hit 'Launch Campaign' to start sending.",
        step: "approved",
      });
    } catch (err: any) {
      addMessage({ type: "system", content: `❌ Approval failed: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLaunch = async () => {
    if (!campaignResult?.campaign?.id) return;
    setIsProcessing(true);

    try {
      const result = await campaignApi.launch(campaignResult.campaign.id);
      addMessage({
        type: "ai",
        content: `🚀 **Campaign launched!**\n\n- **Customers targeted:** ${result.data.customersTargeted}\n- **Communications enqueued:** ${result.data.communicationsEnqueued}\n\nThe Channel Service is now simulating delivery. Check the [Analytics page](/analytics) to track real-time performance.\n\nOnce the campaign completes, I can analyze the results and recommend your next campaign.`,
        step: "launched",
      });
      setCampaignResult(null);
    } catch (err: any) {
      addMessage({ type: "system", content: `❌ Launch failed: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fade-in" style={{ height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)",
            }}
          >
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em" }} className="gradient-text">
              Autonomous Campaign Agent
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "2px" }}>
              Describe a business goal → AI handles targeting, copywriting, and deployment
            </p>
          </div>
        </div>
      </div>

      {/* Messages viewport */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          paddingBottom: "24px",
          paddingRight: "4px",
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.type === "user";
          const isSystem = msg.type === "system";

          return (
            <div
              key={msg.id}
              className="slide-up"
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: isUser ? "65%" : "85%",
                  padding: isSystem ? "12px 18px" : "18px 22px",
                  borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: isUser
                    ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                    : isSystem
                    ? "rgba(6, 182, 212, 0.05)"
                    : "rgba(13, 13, 22, 0.45)",
                  border: isUser
                    ? "none"
                    : isSystem
                    ? "1px solid rgba(6, 182, 212, 0.15)"
                    : "1px solid rgba(255, 255, 255, 0.05)",
                  borderLeft: msg.type === "ai" ? "3px solid var(--accent)" : undefined,
                  boxShadow: isSystem ? "none" : "0 4px 20px rgba(0, 0, 0, 0.3)",
                  color: isSystem
                    ? "#22d3ee"
                    : isUser
                    ? "#ffffff"
                    : "var(--text-primary)",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                }}
                dangerouslySetInnerHTML={{
                  __html: formatMarkdown(msg.content),
                }}
              />
            </div>
          );
        })}

        {/* Typing indicator */}
        {isProcessing && currentStep && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 8px" }} className="slide-up">
            <div style={{ display: "flex", gap: "4px" }}>
              <div className="typing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)" }} />
              <div className="typing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)" }} />
              <div className="typing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)" }} />
            </div>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>{currentStep}</span>
          </div>
        )}

        {/* Action Buttons */}
        {campaignResult && !isProcessing && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", padding: "12px 4px" }} className="slide-up">
            <button onClick={handleApprove} className="btn-primary" style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.2)" }}>
              <ThumbsUp size={16} />
              Approve Campaign
            </button>
            <button onClick={handleLaunch} className="btn-primary">
              <Rocket size={16} />
              Launch Campaign
            </button>
            <Link
              href={`/campaigns/${campaignResult.campaign.id}`}
              className="btn-secondary"
              style={{ textDecoration: "none" }}
            >
              <span>View Details</span>
              <ArrowRight size={14} style={{ color: "var(--text-secondary)" }} />
            </Link>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts (only show when no message sent) */}
      {messages.length <= 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          {[
            "Bring back customers who haven't purchased in 60 days",
            "Increase repeat purchases from high-value customers",
            "Launch a flash sale for customers in Mumbai and Delhi",
            "Re-engage customers who abandoned their carts recently",
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="glass-card"
              style={{
                padding: "16px",
                textAlign: "left",
                fontSize: "13px",
                color: "var(--text-secondary)",
                cursor: "pointer",
                border: "1px solid var(--border)",
                background: "rgba(13, 13, 22, 0.4)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                transition: "all 0.3s ease",
              }}
            >
              <Zap size={14} style={{ color: "var(--accent)" }} />
              <div style={{ fontWeight: 500, lineHeight: 1.4 }}>{prompt}</div>
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "12px", paddingTop: "20px", borderTop: "1px solid var(--border)", background: "transparent" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your marketing goal... e.g., 'Win back dormant customers with a special offer'"
          className="input-base"
          style={{ flex: 1 }}
          disabled={isProcessing}
        />
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="btn-primary"
          style={{ padding: "0 22px", height: "50px" }}
        >
          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(/### (.*)/g, '<h3 style="font-size:16px;font-weight:700;margin:12px 0 6px 0;color:#f8fafc">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#ffffff;font-weight:600">$1</strong>')
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>")
    .replace(/> (.*)/g, '<blockquote style="border-left:3px solid var(--accent);padding:10px 16px;margin:12px 0;background:rgba(255,255,255,0.02);border-radius:0 8px 8px 0;font-style:italic;color:var(--text-secondary)">$1</blockquote>')
    .replace(/\|(.*)\|/g, (match) => {
      if (match.includes("---")) return "";
      const cells = match.split("|").filter(Boolean);
      return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.02);font-size:13px">${cells
        .map((c, i) => `<span style="font-weight:${i === 0 ? "500" : "700"};color:${i === 0 ? "var(--text-secondary)" : "var(--accent)"}">${c.trim()}</span>`)
        .join("")}</div>`;
    });
}
