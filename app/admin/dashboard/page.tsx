"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  UserCheck,
  Clock,
  ShieldCheck,
  ExternalLink,
  Activity,
  Server,
  AlertTriangle,
  Megaphone,
  RefreshCw,
  Plus,
  FileText,
  CheckCircle2,
  PenTool,
  Archive,
  Database,
} from "lucide-react";

function SystemBadge({ system }: { system: string }) {
  const styles: Record<string, string> = {
    TEMPSTAFF: "bg-emerald-100 text-emerald-700 border-emerald-200",
    RETIREMENT: "bg-blue-100 text-blue-700 border-blue-200",
    HR_LETTERS: "bg-green-100 text-green-700 border-green-200",
  };
  const labels: Record<string, string> = {
    TEMPSTAFF: "TempStaff",
    RETIREMENT: "Retirement",
    HR_LETTERS: "HR Letters",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 border ${styles[system] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {labels[system] || system}
    </span>
  );
}

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
        fetch("/api/admin/audit?limit=8"),
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

  useEffect(() => { fetchDashboardData(); }, []);

  const stat = (val: any) => loading ? "…" : (val ?? 0).toLocaleString();

  return (
    <div className="space-y-6">

      {/* ── Welcome Banner ── */}
      <div className="relative bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-50 rounded-full blur-3xl pointer-events-none opacity-60" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-cyan-600 font-semibold uppercase tracking-wider">
              <Activity className="w-4 h-4" /> Executive Overview
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Mission Control</h1>
            <p className="text-xs text-gray-500 max-w-xl">
              Unified Super Admin dashboard across DVLA TempStaff, Retirement, and HR Letters systems.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium border border-gray-200 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-cyan-500" : "text-gray-500"}`} />
              Refresh Metrics
            </button>
            <Link
              href="/admin/users?action=new"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-sm shadow-cyan-200 transition"
            >
              <Plus className="w-4 h-4" /> Add User
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* TempStaff */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">TempStaff Portal</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">{stat(data?.tempstaff?.activeContracts)}</div>
            <p className="text-[11px] text-gray-500 mt-1">Active Contracts ({stat(data?.tempstaff?.totalStaff)} Staff)</p>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Monthly Payroll:</span>
            <span className="font-bold text-emerald-600">
              GHS {(data?.tempstaff?.totalMonthlyPayroll || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Retirement */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Retirement Portal</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">{stat(data?.retirement?.activeStaff)}</div>
            <p className="text-[11px] text-gray-500 mt-1">Active Personnel ({stat(data?.retirement?.totalDepartments)} Depts)</p>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Due Within 1 Year:</span>
            <span className="font-bold text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {stat(data?.retirement?.dueThisYear)} Retiring
            </span>
          </div>
        </div>

        {/* HR Letters */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">HR Letters Portal</span>
            <div className="p-2 rounded-xl bg-green-50 text-green-600 border border-green-100">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">{stat(data?.hrLetters?.totalLetters)}</div>
            <p className="text-[11px] text-gray-500 mt-1">
              Total Letters &bull; {stat(data?.hrLetters?.issued)} Issued
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Pending Approval:</span>
            <span className="font-bold text-amber-600">{stat(data?.hrLetters?.pendingApproval)} Letters</span>
          </div>
        </div>

        {/* All Users */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">System Accounts</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">{stat(data?.users?.grandTotalUsers)}</div>
            <p className="text-[11px] text-gray-500 mt-1">Total Authorized Accounts</p>
          </div>
          <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-1 text-[11px] text-gray-400">
            <span>TempStaff: <b className="text-gray-700">{data?.users?.totalTempstaffUsers ?? 0}</b></span>
            <span>Retirement: <b className="text-gray-700">{data?.users?.totalRetirementUsers ?? 0}</b></span>
            <span>HR Letters: <b className="text-gray-700">{data?.users?.totalHrLettersUsers ?? 0}</b></span>
            <span>Admins: <b className="text-gray-700">{data?.users?.totalAdmins ?? 0}</b></span>
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left (2 cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Portal Launchpad */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-500" /> Subsystem Portal Launchpad
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Direct tunnel access to all three DVLA HR portals.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* TempStaff Card */}
              <div className="bg-gray-50 border border-emerald-200 hover:border-emerald-400 rounded-xl p-4 space-y-3 transition group">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-sm">TS</div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 group-hover:text-emerald-700 transition leading-tight">TempStaff</h3>
                    <p className="text-[10px] text-gray-500">Payroll & Contracts</p>
                  </div>
                </div>
                <div className="space-y-1 text-[11px] text-gray-500">
                  <div className="flex items-center gap-1.5"><Briefcase className="w-3 h-3 text-emerald-500" /> {stat(data?.tempstaff?.activeContracts)} active contracts</div>
                  <div className="flex items-center gap-1.5"><Users className="w-3 h-3 text-emerald-500" /> {stat(data?.tempstaff?.totalStaff)} personnel</div>
                </div>
                <Link href="/dashboard" target="_blank" className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition">
                  Open <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Retirement Card */}
              <div className="bg-gray-50 border border-blue-200 hover:border-blue-400 rounded-xl p-4 space-y-3 transition group">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">RM</div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 group-hover:text-blue-700 transition leading-tight">Retirement</h3>
                    <p className="text-[10px] text-gray-500">Pensions & Clearance</p>
                  </div>
                </div>
                <div className="space-y-1 text-[11px] text-gray-500">
                  <div className="flex items-center gap-1.5"><UserCheck className="w-3 h-3 text-blue-500" /> {stat(data?.retirement?.activeStaff)} active staff</div>
                  <div className="flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 text-amber-500" /> {stat(data?.retirement?.dueThisYear)} retiring soon</div>
                </div>
                <Link href="/retirement" target="_blank" className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition">
                  Open <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* HR Letters Card */}
              <div className="bg-gray-50 border border-green-200 hover:border-green-400 rounded-xl p-4 space-y-3 transition group">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center text-green-700 font-bold text-sm">HL</div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 group-hover:text-green-700 transition leading-tight">HR Letters</h3>
                    <p className="text-[10px] text-gray-500">Documents & Signatures</p>
                  </div>
                </div>
                <div className="space-y-1 text-[11px] text-gray-500">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> {stat(data?.hrLetters?.issued)} letters issued</div>
                  <div className="flex items-center gap-1.5"><PenTool className="w-3 h-3 text-amber-500" /> {stat(data?.hrLetters?.pendingApproval)} awaiting approval</div>
                </div>
                <Link href="/hrletters/dashboard" target="_blank" className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition">
                  Open <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Audit Log Stream */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-500" /> Unified Live Audit Stream
                </h2>
                <p className="text-xs text-gray-500">Real-time events merged from all three portals</p>
              </div>
              <Link href="/admin/audit" className="text-xs text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1">
                View All Logs →
              </Link>
            </div>

            <div className="space-y-2">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">No recent system audit events.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs hover:bg-gray-100 transition">
                    <div className="flex items-start gap-2.5">
                      <SystemBadge system={log.system} />
                      <div>
                        <div className="font-semibold text-gray-800">
                          {log.userName} <span className="text-gray-400 font-normal">({log.userRole})</span>
                        </div>
                        <p className="text-gray-500 text-[11px] mt-0.5">{log.action}: {log.details}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0 font-mono whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right (1 col) */}
        <div className="space-y-6">

          {/* System Health */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-500" /> System Health
            </h2>
            <div className="space-y-3">
              {[
                { label: "Database Engine", value: "HEALTHY", sub: `Latency: ${data?.system?.dbLatencyMs ?? 0}ms`, valueClass: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
                { label: "Active Announcements", value: String(data?.system?.activeAnnouncements ?? 0), sub: "Broadcast banners", valueClass: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
                { label: "Total HR Accounts", value: String(data?.users?.grandTotalUsers ?? 0), sub: "Across all portals", valueClass: "text-cyan-600", bg: "bg-cyan-50 border-cyan-100" },
              ].map(({ label, value, sub, valueClass, bg }) => (
                <div key={label} className={`flex items-center justify-between p-3 rounded-xl border ${bg}`}>
                  <div>
                    <p className="text-[11px] text-gray-700 font-medium">{label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                  </div>
                  <span className={`text-xs font-bold ${valueClass}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-gray-900">Quick Actions</h2>
            <div className="space-y-1.5">
              {[
                { label: "User Management", href: "/admin/users", icon: Users, color: "text-cyan-500" },
                { label: "Announcements", href: "/admin/announcements", icon: Megaphone, color: "text-amber-500" },
                { label: "System CMS", href: "/admin/cms", icon: Database, color: "text-blue-500" },
                { label: "Compliance & Audit", href: "/admin/audit", icon: Archive, color: "text-emerald-500" },
              ].map(({ label, href, icon: Icon, color }) => (
                <Link
                  key={href}
                  href={href}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-200 transition"
                >
                  <span>{label}</span>
                  <Icon className={`w-4 h-4 ${color}`} />
                </Link>
              ))}
            </div>
          </div>

          {/* Access Notice */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-500" /> Access Notice
              </h2>
              <Link href="/admin/announcements" className="text-xs text-cyan-600 hover:text-cyan-700 font-medium">Manage</Link>
            </div>
            <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-100 space-y-1.5">
              <p className="text-xs font-semibold text-cyan-700">Super Admin Session Active</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Full governance access across TempStaff, Retirement, and HR Letters portals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
