"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Target,
  Megaphone,
  BarChart3,
  Sparkles,
  Zap,
  Database,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agent", label: "AI Agent", icon: Sparkles, accent: true },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/audiences", label: "Audiences", icon: Target },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Sidebar Hamburger Trigger */}
      <button
        className="mobile-sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Sidebar Backdrop Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(false)}
      />

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Logo */}
        <div
          className="sidebar-logo"
          style={{
            padding: "28px 24px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
              }}
            >
              <Zap size={20} color="white" />
            </div>
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "#f8fafc",
                }}
              >
                Xeno <span style={{ color: "var(--accent)" }}>CRM</span>
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Autonomous AI Agent
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" style={{ flex: 1, padding: "24px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                onClick={() => setIsOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive
                    ? item.accent
                      ? "#c084fc"
                      : "#f8fafc"
                    : "var(--text-secondary)",
                  background: isActive
                    ? item.accent
                      ? "rgba(167, 139, 250, 0.08)"
                      : "rgba(255, 255, 255, 0.04)"
                    : "transparent",
                  borderLeft: isActive
                    ? item.accent
                      ? "3px solid #a78bfa"
                      : "3px solid var(--accent)"
                    : "3px solid transparent",
                  textDecoration: "none",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <Icon
                  size={18}
                  style={{
                    color: isActive
                      ? item.accent
                        ? "#a78bfa"
                        : "var(--accent)"
                      : "var(--text-muted)",
                    transition: "all 0.2s",
                  }}
                />
                <span>{item.label}</span>
                {item.accent && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      background: "linear-gradient(135deg, #a78bfa, #ec4899)",
                      color: "white",
                      letterSpacing: "0.05em",
                      boxShadow: "0 0 10px rgba(167, 139, 250, 0.4)",
                    }}
                  >
                    AI
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className="sidebar-footer"
          style={{
            padding: "20px 24px",
            borderTop: "1px solid var(--border)",
            fontSize: "11px",
            color: "var(--text-muted)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", fontWeight: 500, color: "var(--text-secondary)" }}>
            <Database size={12} style={{ color: "var(--accent)" }} />
            AI-Native Engine v1.0
          </div>
          <div>Built for Xeno SDE Internship</div>
        </div>
      </aside>
    </>
  );
}
