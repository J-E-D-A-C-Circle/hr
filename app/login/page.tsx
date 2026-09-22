"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  Clock,
  Users,
  CheckCircle2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SystemKey = "TEMPSTAFF" | "RETIREMENT" | "HR_LETTERS";

interface SystemConfig {
  id: SystemKey;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  icon: React.ElementType;
  accentColor: string;
  bgGradient: string;
  badgeBg: string;
  badgeText: string;
  borderFocus: string;
  buttonBg: string;
  features: string[];
}

const SYSTEMS: Record<SystemKey, SystemConfig> = {
  TEMPSTAFF: {
    id: "TEMPSTAFF",
    title: "TempStaff Management Portal",
    subtitle: "6-Month Rolling Contracts & Payroll",
    description: "Official DVLA portal for tracking temporary staff, contract renewals, SSNIT deductions, and monthly payroll validation.",
    badge: "TempStaff Portal",
    icon: Users,
    accentColor: "emerald",
    bgGradient: "from-emerald-50 via-teal-50 to-emerald-100/60",
    badgeBg: "bg-emerald-100 border-emerald-200",
    badgeText: "text-emerald-800",
    borderFocus: "focus:border-emerald-600 focus:ring-emerald-500/20",
    buttonBg: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30",
    features: ["Contract Tracking", "SSNIT Tier 1 & 3", "Payroll Export", "Staff Auditing"],
  },
  RETIREMENT: {
    id: "RETIREMENT",
    title: "Retirement Tracking System",
    subtitle: "Statutory Age 60 & Tenure Analytics",
    description: "Statutory retirement tracking portal monitoring employee age milestones, exit timelines, and pension projections.",
    badge: "Retirement Tracking",
    icon: Clock,
    accentColor: "amber",
    bgGradient: "from-amber-50 via-orange-50 to-amber-100/60",
    badgeBg: "bg-amber-100 border-amber-200",
    badgeText: "text-amber-800",
    borderFocus: "focus:border-amber-600 focus:ring-amber-500/20",
    buttonBg: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30",
    features: ["Retirement Milestones", "Tenure Analytics", "Alert Notifications", "Exit Projections"],
  },
  HR_LETTERS: {
    id: "HR_LETTERS",
    title: "HR Letters & Documents System",
    subtitle: "Digital Signatures & Appointment Verification",
    description: "Enterprise issuance portal for official appointment letters, promotions, digital signatures, and QR code verification.",
    badge: "HR Letters System",
    icon: FileText,
    accentColor: "emerald",
    bgGradient: "from-emerald-50 via-green-50 to-teal-100/60",
    badgeBg: "bg-emerald-100 border-emerald-200",
    badgeText: "text-emerald-800",
    borderFocus: "focus:border-emerald-600 focus:ring-emerald-500/20",
    buttonBg: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30",
    features: ["Appointment Letters", "Digital Signatures", "QR Code Verification", "Official Templates"],
  },
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSys = (searchParams.get("system")?.toUpperCase() as SystemKey) || "TEMPSTAFF";

  const [selectedSystem, setSelectedSystem] = useState<SystemKey>(
    SYSTEMS[initialSys] ? initialSys : "TEMPSTAFF"
  );
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check if session exists on load
  useEffect(() => {
    fetch("/api/auth/check")
      .then((res) => {
        if (res.ok) router.replace("/dashboard");
        else setCheckingSession(false);
      })
      .catch(() => setCheckingSession(false));
  }, [router]);

  const activeConfig = SYSTEMS[selectedSystem] || SYSTEMS.TEMPSTAFF;
  const ActiveIcon = activeConfig.icon;

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
        body: JSON.stringify({
          system: selectedSystem,
          usernameOrEmail,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Authentication failed for the selected interface.");
        setLoading(false);
        return;
      }

      window.location.href = data.redirectUrl || "/dashboard";
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 lg:p-8 font-sans relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-emerald-200/40 via-teal-100/40 to-emerald-300/30 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Single Light Mode Login Card */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-200 grid grid-cols-1 lg:grid-cols-2 overflow-hidden relative z-10">

        {/* ── Left Dynamic Branding Panel ── */}
        <div className={`p-8 lg:p-12 bg-gradient-to-br ${activeConfig.bgGradient} border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between relative overflow-hidden transition-all duration-500`}>
          <div className="space-y-8">
            {/* Header / Authority Logo */}
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center shadow-md shrink-0">
                <img src="/oop.png" alt="DVLA Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900 tracking-wide">DVLA GHANA</h1>
                <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-widest">
                  Driver &amp; Vehicle Licensing Authority
                </p>
              </div>
            </div>

            {/* Dynamic Portal Information */}
            <div className="space-y-4">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${activeConfig.badgeBg} text-xs font-bold ${activeConfig.badgeText}`}>
                <ActiveIcon className="w-4 h-4 text-emerald-700" />
                <span>{activeConfig.badge}</span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {activeConfig.title}
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed">
                {activeConfig.description}
              </p>

              {/* Dynamic Feature Tags */}
              <div className="pt-2 flex flex-wrap gap-2">
                {activeConfig.features.map((feat) => (
                  <span
                    key={feat}
                    className="px-2.5 py-1 text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200 rounded-full uppercase tracking-wide flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200/80">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>DVLA HR Enterprise Network &bull; System Access Restricted</span>
            </div>
          </div>
        </div>

        {/* ── Right Login Form Panel (Light Mode) ── */}
        <div className="p-8 lg:p-12 bg-white flex flex-col justify-center">
          <div className="mb-6 space-y-1">
            <h3 className="text-xl font-bold text-slate-900">Unified Sign In</h3>
            <p className="text-xs text-slate-500">
              Select target system interface &amp; enter your credentials.
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

            {/* ── Shadcn UI System Access Dropdown ── */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>System Access</span>
                <span className="text-[10px] text-emerald-700 font-medium">Required Verification</span>
              </label>

              <Select
                value={selectedSystem}
                onValueChange={(val) => {
                  setSelectedSystem(val as SystemKey);
                  setError(null);
                }}
              >
                <SelectTrigger className="w-full bg-slate-50 border-slate-300 rounded-xl h-11 text-xs lg:text-sm font-semibold text-slate-900 focus:bg-white">
                  <SelectValue placeholder="Select System Access" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEMPSTAFF">🏢 TempStaff Management Portal</SelectItem>
                  <SelectItem value="RETIREMENT">👴 Retirement Tracking System</SelectItem>
                  <SelectItem value="HR_LETTERS">📄 HR Letters &amp; Appointment System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Username input */}
            <div>
              <label htmlFor="username-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="username-input"
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Enter your assigned username or email"
                  autoComplete="username"
                  className={`w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none ${activeConfig.borderFocus} transition focus:bg-white`}
                  required
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label htmlFor="password-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none ${activeConfig.borderFocus} transition focus:bg-white`}
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
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${activeConfig.buttonBg}`}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Verifying System Access...</span>
                </>
              ) : (
                <>
                  <span>Sign In to {activeConfig.badge}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Info note */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center space-y-1">
            <p className="text-[11px] text-slate-500">
              Need access to another portal or forgot credentials? Contact IT Administrator.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
