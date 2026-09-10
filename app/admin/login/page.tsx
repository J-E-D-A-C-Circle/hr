"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, User, KeyRound, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Authentication failed. Please check credentials.");
        setLoading(false);
        return;
      }

      window.location.href = "/admin/dashboard";
    } catch (err: any) {
      setError("An unexpected connection error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0E17] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Glass Card */}
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-2xl p-8 relative z-10 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-2xl blur opacity-40 animate-pulse" />
            <div className="relative w-16 h-16 bg-slate-950 border border-slate-700/60 rounded-2xl p-2 flex items-center justify-center shadow-inner">
              <Image
                src="/oop.png"
                alt="DVLA Logo"
                width={56}
                height={56}
                className="object-contain"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Unified Super Admin Command
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              DVLA HR Command Center
            </h1>
            <p className="text-xs text-slate-400">
              Top-level system administration & user management portal
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Username or Email
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="e.g. hr.admin or admin@dvla.gov.gh"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-medium py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating Command Session...
              </>
            ) : (
              <>
                Access Command Center
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800/60 text-center text-[11px] text-slate-500 space-y-1">
          <p>© {new Date().getFullYear()} Driver and Vehicle Licensing Authority (DVLA)</p>
          <p className="flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-slate-600" /> Authorized HR Super Administrators Only
          </p>
        </div>
      </div>
    </div>
  );
}
