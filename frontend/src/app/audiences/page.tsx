"use client";

import { useQuery } from "@tanstack/react-query";
import { audienceApi } from "@/lib/api";
import { Target, Users, Calendar } from "lucide-react";
import Link from "next/link";

export default function AudiencesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["audiences"],
    queryFn: audienceApi.list,
  });

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em" }} className="gradient-text">
            Audiences
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            View and manage AI-generated dynamic customer cohorts
          </p>
        </div>
        <Link href="/agent" className="btn-primary" style={{ textDecoration: "none" }}>
          Generate Dynamic Cohort
        </Link>
      </div>

      {isLoading ? (
        <div className="audience-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: "180px", borderRadius: "16px" }}></div>
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="glass-card" style={{ padding: "64px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Target size={24} style={{ color: "var(--text-muted)", margin: "auto" }} />
          </div>
          <div>
            <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "15px" }}>No audiences segmented yet</div>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
              Utilize the AI Agent to run queries on your database and segment users.
            </p>
          </div>
          <Link href="/agent" className="btn-secondary" style={{ marginTop: "8px", textDecoration: "none" }}>
            Launch Planner
          </Link>
        </div>
      ) : (
        <div className="audience-grid">
          {data?.data.map((audience: any) => (
            <div
              key={audience.id}
              className="glass-card"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "rgba(99, 102, 241, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Target size={20} style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc" }}>{audience.name}</h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      marginTop: "6px",
                      lineHeight: "1.5",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {audience.reasoning}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "8px",
                  paddingTop: "14px",
                  borderTop: "1px solid var(--border)",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "var(--text-secondary)" }}>
                  <Users size={14} style={{ color: "var(--accent)" }} />
                  {audience.customerCount.toLocaleString()} targeted
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={13} />
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
