"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // If already logged in, skip straight to dashboard
  useEffect(() => {
    fetch("/api/auth/check")
      .then((res) => {
        if (res.ok) router.replace("/dashboard");
        else setCheckingSession(false);
      })
      .catch(() => setCheckingSession(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setError("Please enter your username/email and password.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid passcode. Please try again.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="w-full max-w-4xl bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">

        {/* ── Left Branding Panel ── */}
        <div className="p-8 lg:p-12 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Logo + Org Name */}
            <div className="flex items-center gap-3 relative">
              <div className="h-14 w-14 rounded-xl bg-white/10 border border-white/10 p-1.5 flex items-center justify-center shadow-lg shrink-0">
                <img src="/oop.png" alt="DVLA Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white tracking-wide">DVLA GHANA</h1>
                <p className="text-[11px] text-emerald-400 font-semibold uppercase tracking-widest">
                  Driver &amp; Vehicle Licensing Authority
                </p>
              </div>
            </div>

            {/* Title */}
            <div className="mt-12 space-y-4 relative">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Temporary Staff<br />Management Portal
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Official HR portal for managing DVLA temporary staff, 6-month rolling contracts,
                SSNIT deductions, payroll exports, and audit logs.
              </p>
              <div className="pt-4 flex flex-wrap gap-2">
                {["Contract Tracking", "SSNIT Deductions", "Payroll Export", "Audit Logs"].map((f) => (
                  <span
                    key={f}
                    className="px-2.5 py-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full uppercase tracking-wide"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Internal HR Network &bull; Access Restricted</span>
            </div>
          </div>
        </div>

        {/* ── Right Login Form Panel ── */}
        <div className="p-8 lg:p-12 bg-slate-950 flex flex-col justify-center">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">HR Staff Sign In</h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter your HR administrator passcode to access the portal.
            </p>
          </div>

          {/* Role Badge */}
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg w-fit">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">HR Manager</span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username-input" className="block text-xs font-medium text-slate-300 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  id="username-input"
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="hr.admin or admin@dvla.gov.gh"
                  autoComplete="username"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password-input" className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-lg shadow-md shadow-emerald-900/40 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-900 text-center space-y-2">
            <p className="text-[11px] text-slate-500">Forgot your passcode? Contact your IT administrator.</p>
            <a
              href="/retirement/login"
              className="text-[11px] text-slate-500 hover:text-amber-400 transition underline underline-offset-2"
            >
              → Access Retirement Tracking System
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
