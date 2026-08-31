"use client";

import React, { useEffect, useState } from "react";
import { FileText, CheckCircle2, Clock, Activity, ShieldCheck, Sparkles, ArrowRight, FileCode2 } from "lucide-react";

interface DashboardViewProps {
  onNavigateTab: (tab: any) => void;
}

const StatCard: React.FC<{
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  valueColor?: string;
}> = ({ label, value, sub, icon: Icon, iconColor, iconBg, valueColor }) => (
  <div className="card p-5 flex items-start justify-between gap-4">
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-3)" }}>
        {label}
      </p>
      <p
        className="text-2xl font-bold mt-1.5 tabular-nums"
        style={{ color: valueColor ?? "var(--color-text-1)" }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1 font-medium" style={{ color: "var(--color-text-3)" }}>
          {sub}
        </p>
      )}
    </div>
    <div className={`p-2.5 rounded-lg shrink-0 ${iconBg}`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
  </div>
);

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => { if (d.success) setMetrics(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-24 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  const QUICK_ACTIONS = [
    { label: "Generate & Preview Letter", tab: "generator",  icon: FileText },
    { label: "Edit Letter Templates",     tab: "templates",  icon: FileCode2 },
    { label: "Digital HR Archive",        tab: "archive",    icon: ShieldCheck },
    { label: "System Audit Logs",         tab: "audit",      icon: Activity },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-xl p-6 bg-blue-600 text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)" }}
        />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold tracking-tight">DVLA HR Letters Portal</h2>
            <p className="text-sm text-blue-100 mt-1 max-w-md">
              Digitized document issuance, live previewing, multi-step approval workflows, and QR-verified archiving.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab("generator")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-white text-blue-700 hover:bg-blue-50 transition-all duration-150 shadow-sm cursor-pointer shrink-0 border-0 outline-none"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            Open Letter Generator
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Letters Generated"
          value={(metrics?.issuedLetters ?? 0) + (metrics?.pendingApprovals ?? 0)}
          sub="All time documents"
          icon={FileText}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Pending Approvals"
          value={metrics?.pendingApprovals ?? 0}
          sub="Awaiting signature"
          icon={Clock}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          label="Letters Issued"
          value={metrics?.issuedLetters ?? 0}
          sub={`${metrics?.acknowledgmentRate ?? 0}% acknowledgment rate`}
          icon={CheckCircle2}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Active Templates"
          value={metrics?.totalTemplates ?? 7}
          sub="Standardized letter formats"
          icon={FileCode2}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* ── Activity + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit Feed */}
        <div className="card lg:col-span-2 overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--color-text-1)" }}>
              <Activity className="w-4 h-4 text-blue-500" /> Recent Activity
            </h3>
            <button
              onClick={() => onNavigateTab("audit")}
              className="text-xs font-semibold text-blue-500 hover:text-blue-400 transition flex items-center gap-1 cursor-pointer"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {metrics?.recentAudits?.length > 0 ? (
              metrics.recentAudits.slice(0, 6).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="p-1.5 rounded-lg shrink-0 bg-blue-500/10 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-1)" }}>
                      {log.action}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-3)" }}>
                      {log.details}
                    </p>
                    <p className="text-[11px] mt-1 font-mono" style={{ color: "var(--color-text-4)" }}>
                      {log.actorName} · {log.actorRole} · {new Date(log.createdAt).toLocaleString("en-GB")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-10 text-center" style={{ color: "var(--color-text-4)" }}>
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No activity logs yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>Quick Actions</h3>
          </div>
          <div className="p-2 space-y-0.5">
            {QUICK_ACTIONS.map(({ label, tab, icon: Icon }) => (
              <button
                key={tab}
                onClick={() => onNavigateTab(tab)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer text-left group"
                style={{ color: "var(--color-text-2)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-border-subtle)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-blue-500 shrink-0" />
                  {label}
                </span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: "var(--color-text-4)" }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
