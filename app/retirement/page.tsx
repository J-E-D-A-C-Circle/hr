"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  AlertTriangle,
  UserCheck,
  Building2,
  Calendar,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

export default function RetirementDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingPage, setUpcomingPage] = useState(1);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/retirement/staff?limit=100");
      if (res.ok) {
        const result = await res.json();
        const staffList: any[] = result.staff || [];
        const departments: any[] = result.departments || [];

        const activeStaff = staffList.filter((s) => s.computedStatus === "ACTIVE");
        const nearingStaff = staffList.filter((s) => s.computedStatus === "NEARING_RETIREMENT");
        const dueStaff = staffList.filter((s) => s.computedStatus === "DUE_THIS_YEAR");
        const retiredStaff = staffList.filter((s) => s.computedStatus === "RETIRED");

        const totalCount = staffList.length || 1;

        // Group by urgency timeline
        const within6m = staffList.filter((s) => s.monthsRemaining > 0 && s.monthsRemaining <= 6);
        const within6to12m = staffList.filter((s) => s.monthsRemaining > 6 && s.monthsRemaining <= 12);
        const within1to3y = staffList.filter((s) => s.monthsRemaining > 12 && s.monthsRemaining <= 36);
        const within3to5y = staffList.filter((s) => s.monthsRemaining > 36 && s.monthsRemaining <= 60);

        // Upcoming sorted by closest retirement date
        const upcomingList = [...dueStaff, ...nearingStaff]
          .sort((a, b) => new Date(a.retirementDate).getTime() - new Date(b.retirementDate).getTime())
          .slice(0, 8);

        // Department exposure breakdown
        const deptBreakdown = departments.map((d) => {
          const dStaff = staffList.filter((s) => s.departmentId === d.id);
          return {
            id: d.id,
            name: d.name,
            code: d.code,
            total: dStaff.length,
            active: dStaff.filter((s) => s.computedStatus === "ACTIVE").length,
            nearing: dStaff.filter((s) => s.computedStatus === "NEARING_RETIREMENT").length,
            due: dStaff.filter((s) => s.computedStatus === "DUE_THIS_YEAR").length,
            retired: dStaff.filter((s) => s.computedStatus === "RETIRED").length,
          };
        });

        // Find department with highest upcoming retirements
        const highestDept = [...deptBreakdown].sort((a, b) => b.due + b.nearing - (a.due + a.nearing))[0];

        setData({
          counts: {
            total: totalCount,
            active: activeStaff.length,
            nearing: nearingStaff.length,
            due: dueStaff.length,
            retired: retiredStaff.length,
          },
          percentages: {
            active: Math.round((activeStaff.length / totalCount) * 100),
            nearing: Math.round((nearingStaff.length / totalCount) * 100),
            due: Math.round((dueStaff.length / totalCount) * 100),
            retired: Math.round((retiredStaff.length / totalCount) * 100),
          },
          timeline: { within6m, within6to12m, within1to3y, within3to5y },
          upcomingList,
          deptBreakdown,
          highestDept,
        });
      }
    } catch (e) {
      console.error("Dashboard error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  const todayFormatted = format(new Date(), "EEEE, dd MMMM yyyy");

  const upcomingLimit = 5;
  const totalUpcomingPages = Math.ceil((data?.upcomingList?.length || 0) / upcomingLimit) || 1;
  const paginatedUpcoming = (data?.upcomingList || []).slice(
    (upcomingPage - 1) * upcomingLimit,
    upcomingPage * upcomingLimit
  );

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Welcome Section (Emerald Green matching sidebar) */}
      <div className="bg-emerald-800 text-white rounded-2xl p-6 lg:p-8 shadow-lg border border-emerald-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold text-slate-950 uppercase tracking-widest bg-yellow-400 px-2.5 py-1 rounded-full shadow-xs inline-block mb-2">
            DVLA Head Office — HR Directorate
          </span>
          <h2 className="text-xl lg:text-2xl font-black tracking-tight text-white">Good day, HR Analytics</h2>
          <p className="text-xs text-emerald-100 mt-1 font-medium">Here is your live DVLA statutory retirement overview and urgency matrix.</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-emerald-900/80 font-bold px-4 py-2 rounded-xl border border-emerald-600/80 shrink-0 text-yellow-300 shadow-xs">
          <Calendar className="h-4 w-4 text-yellow-400" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Staff */}
        <Link
          href="/retirement/staff?status=ACTIVE"
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Staff</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{data.counts.active}</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              {data.percentages.active}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 group-hover:text-amber-600 transition">
            <span>More than 5 years remaining</span>
            <ArrowRight size={12} />
          </p>
        </Link>

        {/* Card 2: Nearing Retirement */}
        <Link
          href="/retirement/nearing"
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nearing Retirement</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{data.counts.nearing}</span>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
              {data.percentages.nearing}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 group-hover:text-amber-600 transition">
            <span>1 to 5 years remaining</span>
            <ArrowRight size={12} />
          </p>
        </Link>

        {/* Card 3: Due This Year */}
        <Link
          href="/retirement/due-this-year"
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-xs hover:shadow-md transition group bg-gradient-to-b from-rose-50/20 to-transparent"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Due This Year</span>
            <div className="p-2 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-xl">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{data.counts.due}</span>
            <span className="text-xs font-bold text-rose-600 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
              {data.percentages.due}%
            </span>
          </div>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-2 flex items-center gap-1 group-hover:underline">
            <span>Less than 12 months remaining</span>
            <ArrowRight size={12} />
          </p>
        </Link>

        {/* Card 4: Retired Staff */}
        <Link
          href="/retirement/retired"
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Retired Records</span>
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{data.counts.retired}</span>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {data.percentages.retired}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 group-hover:text-amber-600 transition">
            <span>Historical exited staff archive</span>
            <ArrowRight size={12} />
          </p>
        </Link>
      </div>

      {/* 3. Dashboard Intelligence Context Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-amber-900 dark:text-amber-300">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">HR Intelligence Insight</h4>
            <p className="text-xs mt-0.5">
              <strong className="font-semibold">{data.counts.due} staff members</strong> are retiring within the next 12 months.{" "}
              {data.highestDept && (
                <>
                  <strong className="font-semibold">{data.highestDept.name}</strong> has the highest retirement exposure ({data.highestDept.due + data.highestDept.nearing} approaching).
                </>
              )}
            </p>
          </div>
        </div>
        <Link
          href="/retirement/reports?type=upcoming"
          className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl transition shadow-xs whitespace-nowrap"
        >
          View Exposure Report &rarr;
        </Link>
      </div>

      {/* 4. Retirement Overview Visual Breakdown & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Visual Donut/Distribution Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-1">
              Retirement Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-6">Categorization of overall DVLA workforce tenure.</p>

            {/* Custom Clean Visual Bar */}
            <div className="space-y-4">
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div style={{ width: `${data.percentages.active}%` }} className="bg-emerald-500 h-full" title="Active" />
                <div style={{ width: `${data.percentages.active}%` }} className="bg-emerald-500 h-full" title={`Active: ${data.percentages.active}%`} />
                <div style={{ width: `${data.percentages.nearingRetirement}%` }} className="bg-amber-500 h-full" title={`Nearing: ${data.percentages.nearingRetirement}%`} />
                <div style={{ width: `${data.percentages.dueThisYear}%` }} className="bg-rose-500 h-full" title={`Due: ${data.percentages.dueThisYear}%`} />
                <div style={{ width: `${data.percentages.retired}%` }} className="bg-slate-400 h-full" title={`Retired: ${data.percentages.retired}%`} />
              </div>

              {/* Legend Items */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Active (&gt; 5 Years)</span>
                  </div>
                  <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{data.counts.active} ({data.percentages.active}%)</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Nearing (1 &ndash; 5 Years)</span>
                  </div>
                  <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{data.counts.nearingRetirement} ({data.percentages.nearingRetirement}%)</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Due This Year (&lt; 1 Year)</span>
                  </div>
                  <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{data.counts.dueThisYear} ({data.percentages.dueThisYear}%)</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-slate-400" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Retired Archive</span>
                  </div>
                  <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{data.counts.retired} ({data.percentages.retired}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Urgency Timeline */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4">
            Retirement Urgency Timeline
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-center">
              <p className="text-[10px] font-bold text-rose-600 uppercase">Within 6m</p>
              <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{data.timeline.within6m.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-center">
              <p className="text-[10px] font-bold text-amber-700 uppercase">6-12m</p>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{data.timeline.within6to12m.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-[10px] font-bold text-slate-600 uppercase">1-3y</p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{data.timeline.within1to3y.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-[10px] font-bold text-slate-600 uppercase">3-5y</p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{data.timeline.within3to5y.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Upcoming Retirements Action Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Upcoming Retirements
            </h3>
            <p className="text-xs text-slate-500">Next staff members approaching statutory retirement age 60.</p>
          </div>
          <Link
            href="/retirement/staff"
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>View All Staff</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-6">Staff ID</th>
                <th className="py-3.5 px-6">Staff Name</th>
                <th className="py-3.5 px-6">Department</th>
                <th className="py-3.5 px-6">Job Title</th>
                <th className="py-3.5 px-6">Retirement Date</th>
                <th className="py-3.5 px-6">Time Remaining</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {paginatedUpcoming.map((staff: any) => (
                <tr key={staff.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-slate-100">{staff.staffId}</td>
                  <td className="py-4 px-6 font-semibold">{staff.fullName}</td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-400">{staff.departmentName || "N/A"}</td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-400">{staff.jobTitle}</td>
                  <td className="py-4 px-6 font-mono text-slate-700 dark:text-slate-300">{staff.retirementDateFormatted}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        staff.computedStatus === "DUE_THIS_YEAR"
                          ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                          : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400"
                      }`}
                    >
                      {staff.timeRemainingFormatted}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/retirement/staff/${staff.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                      <Eye size={13} />
                      <span>Profile</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page <strong className="text-slate-900 dark:text-slate-100">{upcomingPage}</strong> of <strong className="text-slate-900 dark:text-slate-100">{totalUpcomingPages}</strong> ({data.upcomingList.length} staff members total)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUpcomingPage((p) => Math.max(1, p - 1))}
              disabled={upcomingPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setUpcomingPage((p) => Math.min(totalUpcomingPages, p + 1))}
              disabled={upcomingPage === totalUpcomingPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* 6. Department Exposure Summary Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Department Exposure Summary
            </h3>
            <p className="text-xs text-slate-500">Retirement distribution by DVLA Directorate.</p>
          </div>
          <Link href="/retirement/reports?type=department" className="text-xs font-semibold text-amber-600 hover:underline">
            Export Department Exposure &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.deptBreakdown.map((dept: any) => (
            <div
              key={dept.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{dept.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300 font-bold">
                  {dept.code}
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs text-slate-500">Total Staff:</span>
                <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">{dept.total}</span>
              </div>
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="text-rose-600 font-semibold">Due This Year:</span>
                <span className="font-mono font-bold text-rose-600">{dept.due}</span>
              </div>
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="text-amber-600 font-semibold">Nearing (1-5y):</span>
                <span className="font-mono font-bold text-amber-600">{dept.nearing}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
