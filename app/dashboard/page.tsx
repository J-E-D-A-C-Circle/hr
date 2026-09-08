"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SidebarLayout from "@/components/SidebarLayout";
import StatusBadge from "@/components/StatusBadge";
import RenewModal from "@/components/RenewModal";
import {
  Users,
  AlertTriangle,
  Clock,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Download,
  UserPlus,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Building,
} from "lucide-react";
import { formatDateReadable } from "@/lib/status";

export default function DashboardPage() {
  const [data, setData] = useState<{
    totalStaff: number;
    statusCounts: Record<string, number>;
    upcomingExpirations: any[];
    departmentCounts: Record<string, number>;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Renew modal target
  const [renewTarget, setRenewTarget] = useState<any | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load dashboard data");
      }
      setData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const counts = data?.statusCounts || {
    Active: 0,
    "Expiring Soon": 0,
    Expired: 0,
    Terminated: 0,
  };

  return (
    <SidebarLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Contract Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Rolling 6-month temporary staff contract tracking & payroll status
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/staff?add=true"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Staff</span>
            </Link>
            <Link
              href="/import"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Import Excel</span>
            </Link>
            <Link
              href="/export"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
            >
              <Download className="h-4 w-4" />
              <span>Export Monthly</span>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </span>
            <button onClick={fetchDashboard} className="underline font-semibold">
              Retry
            </button>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Active Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-800 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Contracts
              </span>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/60">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {loading ? "..." : counts["Active"]}
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Current Active Staff
              </span>
            </div>
          </div>

          {/* Expiring Soon Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-300/70 dark:border-amber-900/60 shadow-xs relative overflow-hidden group hover:border-amber-400 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Expiring Soon (≤30 Days)
              </span>
              <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/60 animate-pulse">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                  {loading ? "..." : counts["Expiring Soon"]}
                </span>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  Requires Renewal Action
                </span>
              </div>
              <a
                href="/api/export?filter=expiring&export_type=expiring"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-[11px] font-bold shadow-xs transition"
                title="Download Excel sheet of expiring staff"
              >
                <Download className="h-3 w-3" />
                <span>Export Excel</span>
              </a>
            </div>
          </div>

          {/* Expired Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-800 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Expired Contracts
              </span>
              <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800/60">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                {loading ? "..." : counts["Expired"]}
              </span>
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                Lapsed Contracts
              </span>
            </div>
          </div>

          {/* Terminated Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-slate-400 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Terminated Staff
              </span>
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <UserX className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-700 dark:text-slate-300 tracking-tight">
                {loading ? "..." : counts["Terminated"]}
              </span>
              <span className="text-xs font-medium text-slate-500">
                Audit Record Preserved
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Expirations Alert Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/40 dark:bg-amber-950/20">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Action Required: Contracts Expiring Within 30 Days
                </h2>
                <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                  Review upcoming contract end dates and process 6-month renewals.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="/api/export?filter=expiring&export_type=expiring"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold shadow-xs transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Expiring Excel</span>
              </a>
              <Link
                href="/staff?status=expiring soon"
                className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading expiration alerts...</div>
            ) : !data?.upcomingExpirations || data.upcomingExpirations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
                <UserCheck className="h-8 w-8 text-emerald-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                  All Contracts Up To Date!
                </span>
                <span>No staff contracts are expiring in the next 30 days.</span>
              </div>
            ) : (
              data.upcomingExpirations.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                      {item.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/staff/${item.id}`}
                          className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 text-sm"
                        >
                          {item.full_name}
                        </Link>
                        <span className="font-mono text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {item.staff_code}
                        </span>
                        <StatusBadge status="Expiring Soon" daysRemaining={item.daysRemaining} size="sm" />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>{item.department || "Unassigned Dept"}</span>
                        <span>•</span>
                        <span>{item.role || "Staff Member"}</span>
                        <span>•</span>
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          Ends {formatDateReadable(item.end_date)} (Renewal #{item.renewal_number})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() =>
                        setRenewTarget({
                          id: item.id,
                          full_name: item.full_name,
                          staff_code: item.staff_code,
                          currentContract: {
                            end_date: item.end_date,
                            renewal_number: item.renewal_number,
                          },
                        })
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Renew Contract (+6 Mo)</span>
                    </button>
                    <Link
                      href={`/staff/${item.id}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Station Overview */}
        {data?.departmentCounts && Object.keys(data.departmentCounts).length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>Station Distribution</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(data.departmentCounts).map(([dept, count]) => (
                <div
                  key={dept}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{dept}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Renew Contract Modal */}
      <RenewModal
        isOpen={!!renewTarget}
        onClose={() => setRenewTarget(null)}
        staff={renewTarget}
        onSuccess={fetchDashboard}
      />
    </SidebarLayout>
  );
}
