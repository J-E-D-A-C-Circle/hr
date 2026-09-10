"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, DollarSign, Users, ShieldCheck, Activity, Building2 } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4 text-cyan-400" /> System Insights
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Cross-System Analytics</h1>
          <p className="text-xs text-slate-400">
            Financial distribution, headcount analysis, and retirement timeline projections.
          </p>
        </div>
      </div>

      {/* Grid of Analytical Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>TempStaff Payroll Budget</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            GHS {(stats?.tempstaff?.totalMonthlyPayroll || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400">
            Monthly gross allowance allocation for {stats?.tempstaff?.activeContracts || 0} active personnel.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Staff Tracked</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {((stats?.tempstaff?.totalStaff || 0) + (stats?.retirement?.totalStaff || 0)).toLocaleString()}
          </div>
          <p className="text-xs text-slate-400">
            Combined workforce footprint across both HR modules.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Retirement Risk Ratio</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400">
            {stats?.retirement?.activeStaff ? ((stats?.retirement?.dueThisYear / stats?.retirement?.activeStaff) * 100).toFixed(1) : "0.0"}%
          </div>
          <p className="text-xs text-slate-400">
            Percentage of active staff due for pension retirement within 12 months.
          </p>
        </div>
      </div>

      {/* Visual Analytics Representation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4 backdrop-blur-xl">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            System Distribution Summary
          </h3>
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300">TempStaff System Contracts</span>
                <span className="text-emerald-400 font-bold">{stats?.tempstaff?.activeContracts || 0} Personnel</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: "65%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300">Retirement Active Staff</span>
                <span className="text-blue-400 font-bold">{stats?.retirement?.activeStaff || 0} Staff</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: "35%" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4 backdrop-blur-xl">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Security & Account Coverage
          </h3>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="text-slate-400">Total System Administrators:</span>
              <span className="font-bold text-white">{stats?.users?.totalAdmins || 0} Accounts</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="text-slate-400">Total Retirement Portal Users:</span>
              <span className="font-bold text-white">{stats?.users?.totalRetirementUsers || 0} Accounts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total TempStaff Users:</span>
              <span className="font-bold text-white">{stats?.users?.totalTempstaffUsers || 0} Accounts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
