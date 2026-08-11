"use client";

import React, { useState, useEffect, useMemo } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  TrendingUp,
  Calendar,
  Users,
  UserPlus,
  Clock,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  DollarSign,
  FileSpreadsheet,
} from "lucide-react";
import { formatDateReadable } from "@/lib/status";

export default function HistoryAnalyticsPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState<string>(String(currentMonth));
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [staffData, setStaffData] = useState<any[]>([]);

  // Pagination State (25 items per page)
  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedMonth, search]);

  const totalPages = Math.max(1, Math.ceil(staffData.length / PAGE_SIZE));

  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return staffData.slice(start, start + PAGE_SIZE);
  }, [staffData, currentPage]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const q = search.trim() ? encodeURIComponent(search) : "";
      const res = await fetch(
        `/api/history?year=${selectedYear}&month=${selectedMonth}&search=${q}`
      );
      const json = await res.json();
      if (res.ok && json.success) {
        setMetrics(json.metrics);
        setStaffData(json.data);
      }
    } catch (err: any) {
      console.error("Fetch history error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedYear, selectedMonth, search]);

  const handleExportExcel = () => {
    const q = search.trim() ? encodeURIComponent(search) : "";
    window.open(
      `/api/history?year=${selectedYear}&month=${selectedMonth}&search=${q}&format=excel`,
      "_blank"
    );
  };

  const monthNames = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const yearOptions = ["2023", "2024", "2025", "2026", "2027"];

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header & Date Range Selectors */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span>History & Payroll Analytics</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select Year and Month to track historical staff strength, new additions, contract expirations, and net payroll lists
            </p>
          </div>

          {/* Year & Month Dropdown Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-36">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-44">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="self-end pb-0.5">
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Report (.xlsx)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Historical Summary Metric KPI Cards */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Staff Strength */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                <span>Total Staff Strength</span>
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {metrics.totalStaffStrength}
                </span>
                <span className="text-xs text-slate-400 font-medium">staff</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Active in <strong>{metrics.monthLabel} {metrics.targetYear}</strong>
              </p>
            </div>

            {/* Additions in Month */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                <span>Additions / New Joins</span>
                <UserPlus className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  +{metrics.additionsInMonth}
                </span>
                <span className="text-xs text-slate-400 font-medium">contracts</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Started in {metrics.monthLabel} {metrics.targetYear}
              </p>
            </div>

            {/* Expired / Attrition in Month */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                <span>Expirations / Attrition</span>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                  {metrics.expiredInMonth}
                </span>
                <span className="text-xs text-slate-400 font-medium">expired</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Window ends in {metrics.monthLabel} {metrics.targetYear}
              </p>
            </div>

            {/* Total Paid Payroll Net */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                <span>Total Net Payroll</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  GH₵{metrics.totalNetSalary.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Paid to {metrics.paidCount} staff members
              </p>
            </div>
          </div>
        )}

        {/* Historical Table & Search */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Historical Staff & Payroll Roster ({metrics?.monthLabel} {metrics?.targetYear})
              </h3>
              <p className="text-xs text-slate-500">
                Showing <strong>{staffData.length}</strong> staff records active during this period
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search historical name, code, SSNIT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Historical Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">Staff Member & SSNIT</th>
                  <th className="p-3">Station / Location</th>
                  <th className="p-3">Contract Period</th>
                  <th className="p-3">Renewal #</th>
                  <th className="p-3 text-slate-900 dark:text-white">Basic Salary</th>
                  <th className="p-3 text-slate-900 dark:text-white">SSNIT Emp (5.5%)</th>
                  <th className="p-3 text-slate-900 dark:text-white">GRA PAYE Tax</th>
                  <th className="p-3 text-slate-900 dark:text-white">Total Deductions</th>
                  <th className="p-3 text-emerald-700 dark:text-emerald-400">Net Take-Home Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Loading historical payroll data for {metrics?.monthLabel} {metrics?.targetYear}...
                    </td>
                  </tr>
                ) : staffData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No staff records found for {metrics?.monthLabel} {metrics?.targetYear}.
                    </td>
                  </tr>
                ) : (
                  paginatedStaff.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">{item.full_name}</div>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>{item.staff_code}</span>
                          {item.ssnit_no && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                              SSNIT: {item.ssnit_no}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{item.department}</td>

                      <td className="p-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {formatDateReadable(item.contract_start)}
                        </div>
                        <div className="text-[11px] text-slate-400">to {formatDateReadable(item.contract_end)}</div>
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                        #{item.renewal_number}
                      </td>

                      <td className="p-3 font-mono font-black text-slate-900 dark:text-white">
                        GH₵{item.salary.toFixed(2)}
                      </td>

                      <td className="p-3 font-mono font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950/50">
                        GH₵{item.ssnit_employee_amount.toFixed(2)}
                      </td>

                      <td className="p-3 font-mono font-black text-slate-900 dark:text-white">
                        GH₵{item.paye_tax_amount.toFixed(2)}
                      </td>

                      <td className="p-3 font-mono font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950/50">
                        GH₵{item.total_employee_deductions.toFixed(2)}
                      </td>

                      <td className="p-3 font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        GH₵{item.net_take_home_salary.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 25-Item Pagination Controls */}
          {staffData.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-950/40">
              <div className="text-slate-500 dark:text-slate-400 font-medium">
                Showing <strong>{Math.min((currentPage - 1) * PAGE_SIZE + 1, staffData.length)}</strong> to{" "}
                <strong>{Math.min(currentPage * PAGE_SIZE, staffData.length)}</strong> of{" "}
                <strong>{staffData.length}</strong> historical staff records
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  title="First Page"
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Previous Page"
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="px-3 py-1 font-bold text-slate-800 dark:text-slate-200">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Next Page"
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  title="Last Page"
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
