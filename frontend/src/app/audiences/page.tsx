"use client";

import { useQuery } from "@tanstack/react-query";
import { audienceApi } from "@/lib/api";
import { Target, Users, Clock } from "lucide-react";
import Link from "next/link";

export default function AudiencesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["audiences"],
    queryFn: audienceApi.list,
  });

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700 }} className="gradient-text">Audiences</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>AI-generated customer segments</p>
        </div>
        <Link href="/agent" className="btn-primary">
          Generate New Audience
        </Link>
      </div>

      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: "160px" }}></div>
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
          <Target size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
          <div style={{ color: "var(--text-secondary)" }}>No audiences found. Generate one using the AI Agent.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {data?.data.map((audience: any) => (
            <div key={audience.id} className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Target size={20} style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>{audience.name}</h3>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {audience.reasoning}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <Users size={14} />
                  {audience.customerCount.toLocaleString()} customers
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <Clock size={14} />
                  {new Date(audience.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
