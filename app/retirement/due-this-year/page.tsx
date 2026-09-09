"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Eye, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react";

export default function DueThisYearPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  useEffect(() => {
    fetchDueStaff();
  }, []);

  const fetchDueStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/retirement/staff?status=DUE_THIS_YEAR&limit=200");
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const within6Months = staffList.filter((s) => s.monthsRemaining <= 6);
  const totalPages = Math.ceil(staffList.length / pageSize) || 1;
  const paginatedStaff = staffList.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 pb-12 bg-white dark:bg-slate-950 p-2 sm:p-4 rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 rounded-xl">
              <AlertTriangle size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Staff Due This Year</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personnel retiring within the next 12 months. Immediate HR clearance preparation required.
          </p>
        </div>

        <a
          href="/api/retirement/reports?type=upcoming&export=excel"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white border-2 border-yellow-400 text-slate-900 hover:bg-yellow-50 transition flex items-center gap-2 shadow-xs"
        >
          <FileSpreadsheet size={16} className="text-yellow-600" />
          <span>Export Urgent List</span>
        </a>
      </div>

      {/* Urgency Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-yellow-400 shadow-xs bg-gradient-to-r from-yellow-50/50 to-transparent">
          <p className="text-xs font-bold text-yellow-800 uppercase">Total Due Within 12 Months</p>
          <p className="text-3xl font-black text-slate-950 mt-1">{staffList.length}</p>
          <p className="text-[11px] text-yellow-800 mt-1 font-medium">Requires HR exit processing & pension clearance</p>
        </div>

        <div className="bg-yellow-50 p-5 rounded-2xl border-2 border-yellow-500 shadow-xs">
          <p className="text-xs font-bold text-yellow-900 uppercase">Critical (Within 6 Months)</p>
          <p className="text-3xl font-black text-slate-950 mt-1">{within6Months.length}</p>
          <p className="text-[11px] text-yellow-900 mt-1 font-medium">Highest urgency exit milestone</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading due staff list...</div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No staff members are due to retire in the current 12-month window.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-yellow-50 text-slate-800 font-bold border-b uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-6">Staff ID</th>
                  <th className="py-3.5 px-6">Staff Name</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Job Title</th>
                  <th className="py-3.5 px-6">Statutory Exit Date</th>
                  <th className="py-3.5 px-6">Time Remaining</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {paginatedStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-yellow-50/50 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">{staff.staffId}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">{staff.fullName}</td>
                    <td className="py-4 px-6 text-slate-600">{staff.departmentName || "N/A"}</td>
                    <td className="py-4 px-6 text-slate-600">{staff.jobTitle}</td>
                    <td className="py-4 px-6 font-mono font-bold text-yellow-800">{staff.retirementDateFormatted}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-yellow-400 text-slate-950 border border-yellow-500">
                        {staff.timeRemainingFormatted} remaining
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/retirement/staff/${staff.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-100 text-yellow-900 hover:bg-yellow-300 transition"
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
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Page {page} of {totalPages} ({staffList.length} total due staff)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
