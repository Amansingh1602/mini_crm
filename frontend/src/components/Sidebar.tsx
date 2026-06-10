"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Target,
  Megaphone,
  BarChart3,
  Sparkles,
  Zap,
  Database,
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

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div
        className="sidebar-logo"
        style={{
          padding: "24px 20px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={20} color="white" />
          </div>
          <div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
              className="gradient-text"
            >
              Xeno CRM
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              Autonomous Campaign Planner
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-link"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: isActive ? 600 : 400,
                color: isActive
                  ? item.accent
                    ? "#a78bfa"
                    : "var(--text-primary)"
                  : "var(--text-secondary)",
                background: isActive
                  ? item.accent
                    ? "rgba(99, 102, 241, 0.1)"
                    : "var(--bg-hover)"
                  : "transparent",
                textDecoration: "none",
                transition: "all 0.2s",
                border: isActive && item.accent ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
              }}
            >
              <Icon
                size={18}
                style={{
                  color: isActive
                    ? item.accent
                      ? "#818cf8"
                      : "var(--accent)"
                    : "var(--text-muted)",
                }}
              />
              {item.label}
              {item.accent && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "9px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                    color: "white",
                    letterSpacing: "0.05em",
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
          padding: "16px 20px",
          borderTop: "1px solid var(--border)",
          fontSize: "11px",
          color: "var(--text-muted)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <Database size={12} />
          AI-Native CRM
        </div>
        <div>Built for Xeno SDE Internship</div>
      </div>
    </aside>
  );
}
