"use client";

import { useState, useRef, useEffect } from "react";
import { campaignApi, audienceApi } from "@/lib/api";
import {
  Sparkles,
  Send,
  Users,
  Megaphone,
  MessageSquare,
  Target,
  TrendingUp,
  CheckCircle2,
  Rocket,
  ArrowRight,
  Loader2,
  ThumbsUp,
  Zap,
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
      const { campaign, audience, aiReasoning } = result.data;

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
        content: `❌ Error: ${error.message || "Failed to generate campaign. Please check your API key and try again."}`,
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
    <div className="fade-in" style={{ height: "calc(100vh - 48px)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700 }} className="gradient-text">
              Autonomous Campaign Agent
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
              Describe a goal → AI builds the entire campaign
            </p>
          </div>
        </div>
      </div>

      {/* Example Prompts */}
      {messages.length <= 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "10px", marginBottom: "20px" }}>
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
                padding: "14px 16px",
                textAlign: "left",
                fontSize: "13px",
                color: "var(--text-secondary)",
                cursor: "pointer",
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
              }}
            >
              <Zap size={14} style={{ color: "var(--accent)", marginBottom: "6px" }} />
              <div>{prompt}</div>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          paddingBottom: "16px",
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="slide-up"
            style={{
              display: "flex",
              justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: msg.type === "user" ? "60%" : "85%",
                padding: "14px 18px",
                borderRadius: msg.type === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background:
                  msg.type === "user"
                    ? "linear-gradient(135deg, #6366f1, #7c3aed)"
                    : msg.type === "system"
                    ? "rgba(59, 130, 246, 0.1)"
                    : "var(--bg-card)",
                border: msg.type === "ai" ? "1px solid var(--border)" : "none",
                color: msg.type === "user" ? "white" : "var(--text-primary)",
                fontSize: "14px",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
              }}
              dangerouslySetInnerHTML={{
                __html: formatMarkdown(msg.content),
              }}
            />
          </div>
        ))}

        {/* Typing indicator */}
        {isProcessing && currentStep && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              <div className="typing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)" }} />
              <div className="typing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)" }} />
              <div className="typing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)" }} />
            </div>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{currentStep}</span>
          </div>
        )}

        {/* Action Buttons */}
        {campaignResult && !isProcessing && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", padding: "8px 0" }}>
            <button onClick={handleApprove} className="btn-primary" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
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
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
            >
              View Details <ArrowRight size={14} />
            </Link>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "12px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
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
          style={{ padding: "12px 20px" }}
        >
          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(/### (.*)/g, '<h3 style="font-size:16px;font-weight:700;margin:8px 0">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>")
    .replace(/> (.*)/g, '<blockquote style="border-left:3px solid var(--accent);padding:8px 12px;margin:8px 0;background:var(--bg-hover);border-radius:0 8px 8px 0;font-style:italic">$1</blockquote>')
    .replace(/\|(.*)\|/g, (match) => {
      if (match.includes("---")) return "";
      const cells = match.split("|").filter(Boolean);
      return `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px">${cells
        .map((c) => `<span>${c.trim()}</span>`)
        .join("")}</div>`;
    });
}
