"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  UserCheck,
  Building2,
  Clock,
  ShieldCheck,
  ExternalLink,
  Activity,
  Server,
  TrendingUp,
  AlertTriangle,
  Megaphone,
  RefreshCw,
  Plus,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, logsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/audit?limit=6"),
      ]);

      const statsData = await statsRes.json();
      const logsData = await logsRes.json();

      if (statsData.success) setData(statsData.metrics);
      if (logsData.success) setLogs(logsData.logs || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold uppercase tracking-wider">
            <Activity className="w-4 h-4 text-cyan-400" /> Executive Overview
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            System Mission Control
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Unified management interface across DVLA TempStaff Payroll & Retirement Portal Systems.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-cyan-400" : ""}`} />
            Refresh Realtime Metrics
          </button>
          <Link
            href="/admin/users?action=new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add System User
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TempStaff Active Payroll */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">TempStaff System</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">
              {loading ? "..." : (data?.tempstaff?.activeContracts || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Active Contracts ({data?.tempstaff?.totalStaff || 0} Total Personnel)
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Monthly Payroll:</span>
            <span className="font-bold text-emerald-400">
              GHS {(data?.tempstaff?.totalMonthlyPayroll || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card 2: Retirement System Status */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Retirement System</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">
              {loading ? "..." : (data?.retirement?.activeStaff || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Active Personnel ({data?.retirement?.totalDepartments || 0} Depts & Stations)
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Due Within 1 Year:</span>
            <span className="font-bold text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              {data?.retirement?.dueThisYear || 0} Retiring Soon
            </span>
          </div>
        </div>

        {/* Card 3: Total System Users */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Cross User Management</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">
              {loading ? "..." : (data?.users?.grandTotalUsers || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Authorized Portal System Accounts
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Admins: <b className="text-white">{data?.users?.totalAdmins || 0}</b></span>
            <span>Retirement: <b className="text-white">{data?.users?.totalRetirementUsers || 0}</b></span>
            <span>TempStaff: <b className="text-white">{data?.users?.totalTempstaffUsers || 0}</b></span>
          </div>
        </div>

        {/* Card 4: System Health Gauge */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Database & Engine</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-400 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              HEALTHY
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              MySQL 127.0.0.1:3307 (`tempstaff_db`)
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Query Response:</span>
            <span className="font-mono text-cyan-400 font-bold">{data?.system?.dbLatencyMs || 0} ms</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Subsystem Launchpad & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): System Launchpad Cards */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Subsystem Direct Tunnel Launcher */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Subsystem Direct Tunnel Launchpad
            </h2>
            <p className="text-xs text-slate-400">
              Direct access portal tunnels to inspect or manage individual application views.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* TempStaff Launch Card */}
              <div className="bg-slate-950/80 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl p-5 space-y-4 transition group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                      TS
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition">
                        TempStaff System
                      </h3>
                      <p className="text-[11px] text-slate-400">Payroll, SSNIT & Contracts</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Manage temporary personnel, contract renewals, allowance calculations, and tier deductions.
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Route: `/dashboard`</span>
                  <Link
                    href="/dashboard"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition cursor-pointer"
                  >
                    Open System
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Retirement Launch Card */}
              <div className="bg-slate-950/80 border border-blue-500/20 hover:border-blue-500/40 rounded-xl p-5 space-y-4 transition group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                      RM
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition">
                        Retirement Portal
                      </h3>
                      <p className="text-[11px] text-slate-400">Pensions & Clearance</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Monitor pension clearance milestones, staff age forecasting, station departments, and alert triggers.
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Route: `/retirement`</span>
                  <Link
                    href="/retirement"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition cursor-pointer"
                  >
                    Open Portal
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Combined Audit Log Stream */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Unified Live Audit Stream
                </h2>
                <p className="text-xs text-slate-400">Real-time system events merged from all portals</p>
              </div>
              <Link
                href="/admin/audit"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                View Full Audit Logs &rarr;
              </Link>
            </div>

            <div className="space-y-2.5">
              {logs.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">No recent system audit events logged.</div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 mt-0.5 ${
                          log.system === "TEMPSTAFF"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {log.system}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-200">
                          {log.userName} <span className="text-slate-500 font-normal">({log.userRole})</span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5">{log.action}: {log.details}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): System Announcements & Admin Shortcuts */}
        <div className="space-y-6">
          {/* Global Announcement Banner CMS Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-cyan-400" />
                Global Banners
              </h2>
              <Link href="/admin/announcements" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
                Manage
              </Link>
            </div>
            <p className="text-xs text-slate-400">
              Broadcast active message banners across application dashboards.
            </p>

            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                System Notice Active
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Super Admin command center connected to DVLA `tempstaff_db` MySQL service.
              </p>
            </div>
          </div>

          {/* Quick Management Tools */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-3">
            <h2 className="text-base font-bold text-white">System Tools</h2>
            <div className="space-y-2 pt-1">
              <Link
                href="/admin/users"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-medium text-slate-200 hover:border-slate-700 transition"
              >
                <span>Unified User Management</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </Link>
              <Link
                href="/admin/settings"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-medium text-slate-200 hover:border-slate-700 transition"
              >
                <span>Deduction & Rules CMS</span>
                <Building2 className="w-4 h-4 text-indigo-400" />
              </Link>
              <Link
                href="/admin/audit"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-medium text-slate-200 hover:border-slate-700 transition"
              >
                <span>Compliance & Audit Stream</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
