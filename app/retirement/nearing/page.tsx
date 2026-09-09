"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Eye, FileSpreadsheet, Filter, Search, Calendar, ChevronRight, ChevronLeft } from "lucide-react";

export default function NearingRetirementPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Year filter & Pagination states
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  useEffect(() => {
    fetchNearingStaff();
  }, []);

  const fetchNearingStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/retirement/staff?status=NEARING_RETIREMENT&limit=200");
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

  // Filter staff by selected year remaining
  const filteredStaff = staffList.filter((staff) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        staff.fullName.toLowerCase().includes(q) ||
        staff.staffId.toLowerCase().includes(q) ||
        (staff.departmentName && staff.departmentName.toLowerCase().includes(q)) ||
        (staff.jobTitle && staff.jobTitle.toLowerCase().includes(q));
      if (!match) return false;
    }

    const yrs = staff.yearsRemaining;

    if (selectedYearFilter === "ALL") return true;
    if (selectedYearFilter === "1") return yrs === 1 || (yrs === 0 && staff.monthsRemaining >= 12);
    if (selectedYearFilter === "2") return yrs === 2;
    if (selectedYearFilter === "3") return yrs === 3;
    if (selectedYearFilter === "4") return yrs === 4;
    if (selectedYearFilter === "5") return yrs === 5;
    if (selectedYearFilter === "1-3") return yrs >= 1 && yrs <= 3;
    if (selectedYearFilter === "3-5") return yrs >= 3 && yrs <= 5;

    return true;
  });

  const totalPages = Math.ceil(filteredStaff.length / pageSize) || 1;
  const paginatedStaff = filteredStaff.slice((page - 1) * pageSize, page * pageSize);

  // Counts by exact years
  const year1Count = staffList.filter((s) => s.yearsRemaining === 1).length;
  const year2Count = staffList.filter((s) => s.yearsRemaining === 2).length;
  const year3Count = staffList.filter((s) => s.yearsRemaining === 3).length;
  const year4Count = staffList.filter((s) => s.yearsRemaining === 4).length;
  const year5Count = staffList.filter((s) => s.yearsRemaining === 5).length;

  return (
    <div className="space-y-6 pb-12 bg-white dark:bg-slate-950 p-2 sm:p-4 rounded-2xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-950/60 rounded-xl text-yellow-700 dark:text-yellow-400">
              <Clock size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Staff Nearing Retirement</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Filter personnel with 1 to 5 years remaining before statutory retirement (Age 60).
          </p>
        </div>

        <a
          href="/api/retirement/reports?type=upcoming&export=excel"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white border-2 border-yellow-400 text-slate-900 hover:bg-yellow-50 transition flex items-center gap-2 shadow-xs"
        >
          <FileSpreadsheet size={16} className="text-yellow-600" />
          <span>Export Nearing Staff List</span>
        </a>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => { setSelectedYearFilter("ALL"); setPage(1); }}
          className={`p-3.5 rounded-xl border text-left transition ${
            selectedYearFilter === "ALL"
              ? "bg-yellow-400 border-yellow-500 text-slate-950 shadow font-bold"
              : "bg-white border-slate-200 text-slate-700 hover:border-yellow-400"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider">All Nearing</p>
          <p className="text-xl font-black mt-1">{staffList.length}</p>
          <p className="text-[10px] opacity-80">1 to 5 Years</p>
        </button>

        <button
          onClick={() => { setSelectedYearFilter("1"); setPage(1); }}
          className={`p-3.5 rounded-xl border text-left transition ${
            selectedYearFilter === "1"
              ? "bg-yellow-400 border-yellow-500 text-slate-950 shadow font-bold"
              : "bg-white border-slate-200 text-slate-700 hover:border-yellow-400"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider">1 Year Left</p>
          <p className="text-xl font-black text-yellow-700 mt-1">{year1Count}</p>
          <p className="text-[10px] text-slate-500">Highest Urgency</p>
        </button>

        <button
          onClick={() => { setSelectedYearFilter("2"); setPage(1); }}
          className={`p-3.5 rounded-xl border text-left transition ${
            selectedYearFilter === "2"
              ? "bg-yellow-400 border-yellow-500 text-slate-950 shadow font-bold"
              : "bg-white border-slate-200 text-slate-700 hover:border-yellow-400"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider">2 Years Left</p>
          <p className="text-xl font-black text-yellow-700 mt-1">{year2Count}</p>
          <p className="text-[10px] text-slate-500">24-36 Months</p>
        </button>

        <button
          onClick={() => { setSelectedYearFilter("3"); setPage(1); }}
          className={`p-3.5 rounded-xl border text-left transition ${
            selectedYearFilter === "3"
              ? "bg-yellow-400 border-yellow-500 text-slate-950 shadow font-bold"
              : "bg-white border-slate-200 text-slate-700 hover:border-yellow-400"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider">3 Years Left</p>
          <p className="text-xl font-black text-yellow-700 mt-1">{year3Count}</p>
          <p className="text-[10px] text-slate-500">36-48 Months</p>
        </button>

        <button
          onClick={() => { setSelectedYearFilter("4"); setPage(1); }}
          className={`p-3.5 rounded-xl border text-left transition ${
            selectedYearFilter === "4"
              ? "bg-yellow-400 border-yellow-500 text-slate-950 shadow font-bold"
              : "bg-white border-slate-200 text-slate-700 hover:border-yellow-400"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider">4 Years Left</p>
          <p className="text-xl font-black text-slate-900 mt-1">{year4Count}</p>
          <p className="text-[10px] text-slate-500">48-60 Months</p>
        </button>

        <button
          onClick={() => { setSelectedYearFilter("5"); setPage(1); }}
          className={`p-3.5 rounded-xl border text-left transition ${
            selectedYearFilter === "5"
              ? "bg-yellow-400 border-yellow-500 text-slate-950 shadow font-bold"
              : "bg-white border-slate-200 text-slate-700 hover:border-yellow-400"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider">5 Years Left</p>
          <p className="text-xl font-black text-slate-900 mt-1">{year5Count}</p>
          <p className="text-[10px] text-slate-500">60 Months</p>
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white border border-yellow-200 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-yellow-600" />
          <span className="text-xs font-bold text-slate-800">Filter by Years Remaining:</span>
          <select
            value={selectedYearFilter}
            onChange={(e) => { setSelectedYearFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-xs font-bold bg-yellow-50 border border-yellow-300 rounded-lg outline-none text-slate-900"
          >
            <option value="ALL">All Nearing Staff (1 to 5 Years)</option>
            <option value="1">Exactly 1 Year Remaining</option>
            <option value="2">Exactly 2 Years Remaining</option>
            <option value="3">Exactly 3 Years Remaining</option>
            <option value="4">Exactly 4 Years Remaining</option>
            <option value="5">Exactly 5 Years Remaining</option>
            <option value="1-3">1 to 3 Years Remaining</option>
            <option value="3-5">3 to 5 Years Remaining</option>
          </select>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search name, ID, department..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading staff list...</div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">No staff records match the selected year filter.</p>
            <button
              onClick={() => {
                setSelectedYearFilter("ALL");
                setSearchQuery("");
                setPage(1);
              }}
              className="mt-2 text-xs font-bold text-yellow-600 hover:underline"
            >
              Clear Filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-6">Staff ID</th>
                  <th className="py-3.5 px-6">Staff Name</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Job Title</th>
                  <th className="py-3.5 px-6">Current Age</th>
                  <th className="py-3.5 px-6">Statutory Exit Date</th>
                  <th className="py-3.5 px-6">Years Remaining</th>
                  <th className="py-3.5 px-6">Status Badge</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {paginatedStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-yellow-50/40 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">{staff.staffId}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">{staff.fullName}</td>
                    <td className="py-4 px-6 text-slate-600">{staff.departmentName || "N/A"}</td>
                    <td className="py-4 px-6 text-slate-600">{staff.jobTitle}</td>
                    <td className="py-4 px-6 font-mono">{staff.currentAgeFormatted}</td>
                    <td className="py-4 px-6 font-mono font-semibold">{staff.retirementDateFormatted}</td>
                    <td className="py-4 px-6">
                      <span className="font-mono font-black text-yellow-800 bg-yellow-100 border border-yellow-300 px-2.5 py-1 rounded-lg">
                        {staff.timeRemainingFormatted}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-yellow-400 text-slate-950 border border-yellow-500 uppercase tracking-wider">
                        Nearing ({staff.yearsRemaining}y Left)
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/retirement/staff/${staff.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-yellow-300 text-slate-900 transition"
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
          <span>Showing page {page} of {totalPages} ({filteredStaff.length} matching staff)</span>
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
