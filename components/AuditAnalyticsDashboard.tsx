"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Building2,
  PieChart,
  TrendingUp,
  BarChart3,
  MapPin,
  Calendar,
  DollarSign,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";

export default function AuditAnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics");
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      } else {
        throw new Error(json.error || "Failed to load audit analytics");
      }
    } catch (err: any) {
      console.error("Analytics fetch error:", err);
      setError(err.message || "An error occurred loading analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-medium bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-500" />
        <span>Loading Demographic & Geographic Audit Analytics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-3xl border border-rose-200 dark:border-rose-800 font-semibold text-xs">
        {error || "Failed to load analytics data."}
      </div>
    );
  }

  const { summary, demographics, geographics } = data;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Roster</span>
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {summary.totalStaff}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5">
            <span>{summary.activeCount} Active</span> • <span>{summary.expiringCount} Expiring Soon</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Stations / Locations</span>
            <MapPin className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {geographics.totalStations}
          </div>
          <div className="text-[11px] font-semibold text-slate-500">
            Across Head Office & Regional Centers
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Monthly Gross Payroll</span>
            <DollarSign className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            GH₵{summary.totalGrossSalary.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] font-semibold text-slate-500">
            Employer NSSF (13%): GH₵{summary.totalEmployerNssf.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Approval Workflow</span>
            <UserCheck className="h-5 w-5 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {summary.approvedCount} Approved
          </div>
          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            {summary.pendingApprovalCount} Pending Officer Approval
          </div>
        </div>
      </div>

      {/* Demographic Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender & Salary Demographic */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="h-4 w-4 text-emerald-500" />
              <span>Gender & Salary Demographics</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">Audit Ratios</span>
          </div>

          {/* Gender Ratio Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300">
                Male: <strong>{demographics.gender.male}</strong> ({demographics.gender.malePercent}%)
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                Female: <strong>{demographics.gender.female}</strong> ({demographics.gender.femalePercent}%)
              </span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${demographics.gender.malePercent}%` }}
                className="bg-blue-600 h-full"
                title={`Male: ${demographics.gender.male}`}
              />
              <div
                style={{ width: `${demographics.gender.femalePercent}%` }}
                className="bg-pink-500 h-full"
                title={`Female: ${demographics.gender.female}`}
              />
            </div>
          </div>

          {/* Salary Bands Distribution */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Monthly Salary Band Breakdown
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 font-semibold block text-[11px]">&lt; GH₵ 1,400</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {demographics.salaryBands.under1400} Staff
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 font-semibold block text-[11px]">GH₵ 1,400 - 1,800</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {demographics.salaryBands.band1400to1800} Staff
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 font-semibold block text-[11px]">GH₵ 1,801 - 2,500</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {demographics.salaryBands.band1801to2500} Staff
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 font-semibold block text-[11px]">&gt; GH₵ 2,500</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {demographics.salaryBands.above2500} Staff
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Age Brackets Demographic */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-500" />
              <span>Age Group Demographics</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">Derived from DOB</span>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { label: "Under 25 Years", count: demographics.ageBrackets.under25, color: "bg-teal-500" },
              { label: "25 – 34 Years", count: demographics.ageBrackets.age25to34, color: "bg-emerald-600" },
              { label: "35 – 44 Years", count: demographics.ageBrackets.age35to44, color: "bg-blue-600" },
              { label: "45 – 54 Years", count: demographics.ageBrackets.age45to54, color: "bg-indigo-600" },
              { label: "55+ Years", count: demographics.ageBrackets.age55plus, color: "bg-amber-600" },
            ].map((bracket) => {
              const pct = summary.totalStaff
                ? Math.round((bracket.count / summary.totalStaff) * 100)
                : 0;
              return (
                <div key={bracket.label} className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{bracket.label}</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {bracket.count} Staff ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full ${bracket.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Geographic Station Distribution Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-500" />
            <span>Geographic Station Distribution & Expenditure Report</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">
            {geographics.totalStations} Stations Total
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-3">Station / Location</th>
                <th className="p-3">Total Headcount</th>
                <th className="p-3">Active Roster</th>
                <th className="p-3">Expiring Soon</th>
                <th className="p-3">Monthly Gross Payroll (GH₵)</th>
                <th className="p-3">Net Payout (GH₵)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {geographics.stations.map((st: any) => (
                <tr key={st.station} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-medium">
                  <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{st.station}</span>
                  </td>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{st.headcount}</td>
                  <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">{st.active}</td>
                  <td className="p-3 text-amber-600 dark:text-amber-400 font-bold">{st.expiring}</td>
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    GH₵{st.grossSalary.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    GH₵{st.netSalary.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
