"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText, PenTool, CheckCircle2, Clock, Archive, AlertCircle,
  TrendingUp, Sparkles, Calendar, ArrowRight,
} from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
  PENDING_APPROVAL: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
  APPROVED: "bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400",
  ISSUED: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
  ACKNOWLEDGED: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400",
  REJECTED: "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400",
};

export default function HrLettersDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hrletters/analytics")
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = format(new Date(), "EEEE, dd MMMM yyyy");

  const statusCards = [
    { label: "Total Letters", value: data?.totalLetters || 0, icon: FileText, color: "emerald", href: "/hrletters/archive" },
    { label: "Pending Approval", value: data?.statusCounts?.PENDING_APPROVAL || 0, icon: Clock, color: "amber", href: "/hrletters/archive?status=PENDING_APPROVAL" },
    { label: "Approved", value: data?.statusCounts?.APPROVED || 0, icon: CheckCircle2, color: "teal", href: "/hrletters/archive?status=APPROVED" },
    { label: "Issued", value: data?.statusCounts?.ISSUED || 0, icon: Archive, color: "emerald", href: "/hrletters/archive?status=ISSUED" },
  ];

  const typeLabels: Record<string, string> = {
    APPOINTMENT: "Appointment",
    PROMOTION: "Promotion",
    CONFIRMATION: "Confirmation",
    TRANSFER: "Transfer",
    WARNING: "Warning",
    LEAVE_APPROVAL: "Leave Approval",
    CONTRACT_RENEWAL: "Contract Renewal",
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
        </div>
        <div className="h-56 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-emerald-700 text-white rounded-2xl p-6 lg:p-8 shadow-lg border border-emerald-600 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold text-slate-950 uppercase tracking-widest bg-yellow-400 px-2.5 py-1 rounded-full shadow-xs inline-block mb-2">
            DVLA Head Office — HR Directorate
          </span>
          <h2 className="text-xl lg:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-300" />
            HR Letters Generator
          </h2>
          <p className="text-xs text-emerald-100 mt-1 font-medium">Compose, approve, sign and issue official DVLA HR letters.</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-emerald-800/80 font-bold px-4 py-2 rounded-xl border border-emerald-500/60 shrink-0 text-yellow-300 shadow-xs">
          <Calendar className="h-4 w-4 text-yellow-400" />
          <span>{today}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card) => {
          const Icon = card.icon;
          const colorMap: Record<string, string> = {
            emerald: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600",
            amber: "bg-amber-50 dark:bg-amber-950/40 text-amber-600",
            teal: "bg-teal-50 dark:bg-teal-950/40 text-teal-600",
            emerald: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600",
          };
          const valColorMap: Record<string, string> = {
            emerald: "text-emerald-600",
            amber: "text-amber-600",
            teal: "text-teal-600",
            emerald: "text-emerald-600",
          };
          return (
            <Link
              key={card.label}
              href={card.href}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</span>
                <div className={`p-2 rounded-xl ${colorMap[card.color]}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{card.value}</span>
                <ArrowRight size={14} className={`${valColorMap[card.color]} group-hover:translate-x-1 transition-transform`} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions + Letter Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/hrletters/generate"
              className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition group"
            >
              <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                <PenTool size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Generate New Letter</p>
                <p className="text-[11px] text-slate-500">Compose & customize an official letter</p>
              </div>
              <ArrowRight size={14} className="ml-auto text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/hrletters/archive?status=PENDING_APPROVAL"
              className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 transition group"
            >
              <div className="p-2 rounded-lg bg-amber-600 text-white shrink-0">
                <AlertCircle size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Review Pending Letters
                  {(data?.statusCounts?.PENDING_APPROVAL || 0) > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-full bg-amber-600 text-white font-black">
                      {data.statusCounts.PENDING_APPROVAL}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-slate-500">Approve or reject queued letters</p>
              </div>
              <ArrowRight size={14} className="ml-auto text-amber-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/hrletters/templates"
              className="flex items-center gap-3 p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/40 hover:bg-teal-100 transition group"
            >
              <div className="p-2 rounded-lg bg-teal-600 text-white shrink-0">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Manage Templates</p>
                <p className="text-[11px] text-slate-500">Create and edit letter templates</p>
              </div>
              <ArrowRight size={14} className="ml-auto text-teal-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Letter Types Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Letters by Type</h3>
            <TrendingUp size={16} className="text-slate-400" />
          </div>
          {data?.typeCounts && Object.keys(data.typeCounts).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(data.typeCounts as Record<string, number>)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([type, count]) => {
                  const total = data.totalLetters || 1;
                  const pct = Math.round(((count as number) / total) * 100);
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{typeLabels[type] || type}</span>
                        <span className="font-mono text-slate-500">{count as number} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <FileText size={32} className="mb-2 opacity-30" />
              <p className="text-xs">No letters generated yet.</p>
              <Link href="/hrletters/generate" className="mt-2 text-xs text-emerald-500 font-semibold hover:underline">Generate your first letter →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Audit Activity */}
      {data?.recentAuditLogs?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {data.recentAuditLogs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{log.actorName}</span>
                  <span className="text-slate-500 mx-1">—</span>
                  <span className="text-slate-600 dark:text-slate-400">{log.details}</span>
                </div>
                <span className="ml-auto text-slate-400 whitespace-nowrap shrink-0">
                  {format(new Date(log.createdAt), "dd MMM, HH:mm")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
