"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, DollarSign, Users, Activity, Building2, ShieldCheck, FileText } from "lucide-react";

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.metrics);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const s = (val: any) => loading ? "…" : (val ?? 0).toLocaleString();

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-cyan-600 font-semibold uppercase tracking-wider">
          <BarChart3 className="w-4 h-4 text-cyan-500" /> System Insights
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">Cross-System Analytics</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Financial distribution, headcount analysis, and system-wide statistics.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>TempStaff Payroll Budget</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900">
            GHS {(stats?.tempstaff?.totalMonthlyPayroll || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-500">
            Monthly gross for {s(stats?.tempstaff?.activeContracts)} active personnel.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Total Staff Tracked</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900">
            {((stats?.tempstaff?.totalStaff || 0) + (stats?.retirement?.totalStaff || 0)).toLocaleString()}
          </div>
          <p className="text-xs text-gray-500">
            Combined workforce across TempStaff & Retirement.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Retirement Risk Ratio</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600">
            {stats?.retirement?.activeStaff
              ? ((stats.retirement.dueThisYear / stats.retirement.activeStaff) * 100).toFixed(1)
              : "0.0"}%
          </div>
          <p className="text-xs text-gray-500">
            Active staff retiring within 12 months.
          </p>
        </div>
      </div>

      {/* Charts / Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            System Distribution Summary
          </h3>
          <div className="space-y-4 pt-2">
            {[
              { label: "TempStaff Contracts", value: stats?.tempstaff?.activeContracts || 0, color: "bg-emerald-500", textColor: "text-emerald-600", pct: "65%" },
              { label: "Retirement Active Staff", value: stats?.retirement?.activeStaff || 0, color: "bg-blue-500", textColor: "text-blue-600", pct: "35%" },
              { label: "HR Letters Issued", value: stats?.hrLetters?.issued || 0, color: "bg-green-500", textColor: "text-green-600", pct: `${Math.min(100, ((stats?.hrLetters?.issued || 0) / Math.max(1, stats?.hrLetters?.totalLetters || 1)) * 100).toFixed(0)}%` },
            ].map(({ label, value, color, textColor, pct }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-700">{label}</span>
                  <span className={`font-bold ${textColor}`}>{value.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className={`${color} h-2 rounded-full transition-all`} style={{ width: pct }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-500" />
            Security & Account Coverage
          </h3>
          <div className="space-y-2 text-xs">
            {[
              { label: "Super Administrators", value: stats?.users?.totalAdmins || 0, color: "text-cyan-700", bg: "bg-cyan-50 border-cyan-100" },
              { label: "Retirement Portal Users", value: stats?.users?.totalRetirementUsers || 0, color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
              { label: "TempStaff Users", value: stats?.users?.totalTempstaffUsers || 0, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
              { label: "HR Letters Users", value: stats?.users?.totalHrLettersUsers || 0, color: "text-green-700", bg: "bg-green-50 border-green-100" },
              { label: "Total System Accounts", value: stats?.users?.grandTotalUsers || 0, color: "text-gray-900", bg: "bg-gray-50 border-gray-200" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`flex justify-between items-center p-3 rounded-xl border ${bg}`}>
                <span className="text-gray-600">{label}:</span>
                <span className={`font-bold ${color}`}>{value.toLocaleString()} Accounts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HR Letters Stats */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-green-500" />
          HR Letters Portal Breakdown
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Letters", value: stats?.hrLetters?.totalLetters || 0, color: "text-gray-900", bg: "bg-gray-50 border-gray-200" },
            { label: "Issued", value: stats?.hrLetters?.issued || 0, color: "text-green-700", bg: "bg-green-50 border-green-100" },
            { label: "Pending Approval", value: stats?.hrLetters?.pendingApproval || 0, color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
            { label: "Drafts", value: stats?.hrLetters?.drafts || 0, color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center ${bg}`}>
              <div className={`text-2xl font-extrabold ${color}`}>{value.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
