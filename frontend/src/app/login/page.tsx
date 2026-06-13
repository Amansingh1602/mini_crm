"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Zap, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, error: authError, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleGuestLogin = async () => {
    setLoading(true);
    setFormError("");
    try {
      await login({ email: "guest@xeno.com", password: "guest123" });
      router.push("/");
    } catch (err: any) {
      setFormError(err.message || "Guest Login failed.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setFormError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setFormError("");

    try {
      await login({ email, password });
      router.push("/");
    } catch (err: any) {
      setFormError(err.message || "Invalid email or password.");
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
              Welcome back
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
              Sign in to your Xeno CRM command center
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

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                placeholder="••••••••"
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
            {loading ? <Loader2 size={15} className="animate-spin" /> : "Sign In"}
          </button>

          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
            className="btn-secondary"
            style={{
              padding: "10px",
              borderRadius: "8px",
              fontSize: "13.5px",
              fontWeight: 500,
              width: "100%",
              marginTop: "8px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            Sign In as Guest (Bypass)
          </button>
        </form>



        {/* Toggle link */}
        <div style={{ textAlign: "center", fontSize: "13px", color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
          <Link href="/signup" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }} className="hover-underline">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
