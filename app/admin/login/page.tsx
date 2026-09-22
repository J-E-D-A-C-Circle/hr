"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Database,
  Activity,
} from "lucide-react";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check if super admin session already exists
  useEffect(() => {
    fetch("/api/admin/auth")
      .then((res) => {
        if (res.ok) {
          router.replace("/admin/dashboard");
        } else {
          setCheckingSession(false);
        }
      })
      .catch(() => setCheckingSession(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setError("Please enter your Super Admin username/email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernameOrEmail: usernameOrEmail.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Authentication failed. Invalid Super Admin credentials.");
        setLoading(false);
        return;
      }

      window.location.href = "/admin/dashboard";
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-cyan-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 lg:p-8 font-sans relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-cyan-200/40 via-teal-100/40 to-blue-200/30 rounded-full blur-[120px] pointer-events-none" />

      {/* Dedicated Super Admin Login Card */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-200 grid grid-cols-1 lg:grid-cols-2 overflow-hidden relative z-10">

        {/* ── Left Dynamic Branding Panel ── */}
        <div className="p-8 lg:p-12 bg-gradient-to-br from-cyan-50 via-teal-50 to-cyan-100/60 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-8">
            {/* Header / Authority Logo */}
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center shadow-md shrink-0">
                <Image src="/oop.png" alt="DVLA Logo" width={48} height={48} className="object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900 tracking-wide">DVLA GHANA</h1>
                <p className="text-[11px] text-cyan-700 font-semibold uppercase tracking-widest">
                  Driver &amp; Vehicle Licensing Authority
                </p>
              </div>
            </div>

            {/* Portal Information */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-cyan-100 border-cyan-200 text-xs font-bold text-cyan-800">
                <ShieldCheck className="w-4 h-4 text-cyan-700" />
                <span>Super Admin Panel</span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                Super Admin Command Panel
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed">
                Central administrative panel for cross-system user accounts, global audit logs, database backups, and security governance.
              </p>

              {/* Security Feature Highlights */}
              <div className="pt-2 flex flex-wrap gap-2">
                {["System Backups", "Cross-Portal Audit", "User Provisioning", "Master Config"].map((feat) => (
                  <span
                    key={feat}
                    className="px-2.5 py-1 text-[10px] font-bold bg-white text-cyan-900 border border-cyan-200 rounded-full uppercase tracking-wide flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3 h-3 text-cyan-600" />
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200/80">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-600 animate-pulse" />
              <span>Super Administrator Portal &bull; Restricted High-Level Access</span>
            </div>
          </div>
        </div>

        {/* ── Right Login Form Panel ── */}
        <div className="p-8 lg:p-12 bg-white flex flex-col justify-center">
          <div className="mb-6 space-y-1">
            <h3 className="text-xl font-bold text-slate-900">Administrator Sign In</h3>
            <p className="text-xs text-slate-500">
              Enter your Super Admin credentials to unlock governance controls.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email input */}
            <div>
              <label htmlFor="admin-username" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admin Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="admin-username"
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Enter administrator username or email"
                  autoComplete="username"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 transition focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 transition focus:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Authenticating Administrator...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Super Admin</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 text-center space-y-1">
            <p className="text-[11px] text-slate-500">
              Need access to standard HR portals? <a href="/login" className="text-cyan-700 font-semibold hover:underline">Go to System Access Login</a>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
