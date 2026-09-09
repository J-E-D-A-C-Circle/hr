"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UserCheck, Eye, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react";

export default function RetiredStaffPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  useEffect(() => {
    fetchRetiredStaff();
  }, []);

  const fetchRetiredStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/retirement/staff?status=RETIRED&limit=200");
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

  const totalPages = Math.ceil(staffList.length / pageSize) || 1;
  const paginatedStaff = staffList.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <UserCheck size={20} />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Retired Staff Archive</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Historical records of former DVLA staff members who have reached statutory age 60 and exited service.
          </p>
        </div>

        <a
          href="/api/retirement/reports?type=retired&export=excel"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition flex items-center gap-2 shadow-xs"
        >
          <FileSpreadsheet size={16} className="text-slate-600" />
          <span>Export Retired Archive</span>
        </a>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading historical retired staff...</div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No retired staff records in archive.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-6">Staff ID</th>
                  <th className="py-3.5 px-6">Staff Name</th>
                  <th className="py-3.5 px-6">Gender</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Last Job Title</th>
                  <th className="py-3.5 px-6">Statutory Exit Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {paginatedStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-slate-100">{staff.staffId}</td>
                    <td className="py-4 px-6 font-semibold">{staff.fullName}</td>
                    <td className="py-4 px-6 text-slate-500">{staff.gender}</td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400">{staff.departmentName || "N/A"}</td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400">{staff.jobTitle}</td>
                    <td className="py-4 px-6 font-mono text-slate-700 dark:text-slate-300">{staff.retirementDateFormatted}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                        Exited
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/retirement/staff/${staff.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
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
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Page {page} of {totalPages} ({staffList.length} retired records)</span>
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
