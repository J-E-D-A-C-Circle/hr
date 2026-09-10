"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Eye, EyeOff, Lock, User, AlertCircle, ArrowRight } from "lucide-react";

export default function RetirementLoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setError("Please enter your username/email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/retirement/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed.");
        setLoading(false);
        return;
      }

      window.location.href = "/retirement";
    } catch (err: any) {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="w-full max-w-4xl bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Left Visual Branding Panel */}
        <div className="p-8 lg:p-12 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/10 p-1 flex items-center justify-center shadow-lg shrink-0">
                <img src="/oop.png" alt="DVLA Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white tracking-wide">DVLA GHANA</h1>
                <p className="text-[11px] text-amber-400 font-semibold uppercase tracking-widest">
                  Driver & Vehicle Licensing Authority
                </p>
              </div>
            </div>

            <div className="mt-12 space-y-4">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Staff Retirement Tracking System
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Official Head Office Portal for statutory retirement tracking, employee tenure analytics, alert milestone tracking, and HR Directorate reports.
              </p>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Internal Enterprise Network &bull; Statutory Age 60 Rules Active</span>
            </div>
          </div>
        </div>

        {/* Right Login Form */}
        <div className="p-8 lg:p-12 bg-slate-950 flex flex-col justify-center">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">HR Directorate Sign In</h3>
            <p className="text-xs text-slate-400 mt-1">Enter your authorized DVLA HR credentials.</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Username or Official Email</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="admin@dvla.gov.gh"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-10 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-amber-500 focus:ring-0"
                />
                <span>Remember this device</span>
              </label>
              <span className="text-slate-500 text-[11px]">Contact IT for pass resets</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In to Portal"}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-900 text-center">
            <p className="text-[11px] text-slate-500">Contact IT for password resets.</p>
            <a
              href="/login"
              className="text-[11px] text-slate-500 hover:text-emerald-400 transition underline underline-offset-2"
            >
              → Access Temporary Staff Portal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
