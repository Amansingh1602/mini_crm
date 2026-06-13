"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Zap, Mail, Lock, User, AlertCircle, Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { signup, error: authError, clearError } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setFormError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setFormError("");

    try {
      await signup({ name, email, password });
      router.push("/");
    } catch (err: any) {
      setFormError(err.message || "Sign up failed.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "24px",
      fontFamily: "var(--font-jakarta), sans-serif",
      background: "var(--bg-primary)",
    }}>
      <div className="glass-card fade-in" style={{
        width: "100%",
        maxWidth: "400px",
        padding: "32px",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Zap size={20} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em", color: "#f8fafc" }}>
              Create an account
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
              Get started with your AI-Native CRM platform
            </p>
          </div>
        </div>

        {/* Error Alerts */}
        {(formError || authError) && (
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "10px 14px",
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.15)",
            borderRadius: "8px",
            color: "#fca5a5",
            fontSize: "12.5px",
          }}>
            <AlertCircle size={15} style={{ marginTop: "1.5px", flexShrink: 0 }} />
            <span>{formError || authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--text-secondary)" }}>
              Full Name
            </label>
            <div style={{ position: "relative" }}>
              <User size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "#f3f4f6",
                  fontSize: "13.5px",
                  outline: "none",
                  transition: "all 0.15s",
                }}
                className="auth-input"
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--text-secondary)" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "#f3f4f6",
                  fontSize: "13.5px",
                  outline: "none",
                  transition: "all 0.15s",
                }}
                className="auth-input"
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--text-secondary)" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "#f3f4f6",
                  fontSize: "13.5px",
                  outline: "none",
                  transition: "all 0.15s",
                }}
                className="auth-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              padding: "10px",
              borderRadius: "8px",
              fontSize: "13.5px",
              fontWeight: 500,
              width: "100%",
              marginTop: "4px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : "Sign Up"}
          </button>
        </form>

        {/* Toggle link */}
        <div style={{ textAlign: "center", fontSize: "13px", color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }} className="hover-underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
