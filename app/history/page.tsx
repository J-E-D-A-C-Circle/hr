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

  const yearOptions = Array.from(
    { length: Math.max(5, currentYear - 2023 + 2) },
    (_, i) => String(2023 + i)
  );

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header & Date Range Selectors */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Report (.xlsx)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Historical Summary Statistical Overview & Staff Strength Movement Cards */}
        {metrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summary Statistical Overview Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span>SUMMARY STATISTICAL OVERVIEW ({metrics.monthLabel} {metrics.targetYear})</span>
                </h3>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Monthly Computation
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Total Validated Staff Strength:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{metrics.totalValidatedStaffStrength || metrics.totalStaffStrength} Employees</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Total Monthly Gross Payroll:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">GH₵{(metrics.totalGrossSalary || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Total Employer NSSF Contribution (13%):</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">GH₵{(metrics.totalEmployerNSSF13 || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Total Employer Cost of Employment:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">GH₵{(metrics.totalCostOfEmployment || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Total Net Payout to Staff Bank Accounts:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">GH₵{(metrics.totalNetSalary || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Staff Strength Reconciliation Table (Teal Highlight matching screenshot) */}
            {metrics.reconciliation && (
              <div className="bg-teal-700/90 dark:bg-teal-950 text-white rounded-2xl border border-teal-600/40 p-6 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-teal-500/40 pb-2.5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal-100 flex items-center gap-2">
                    <Users className="h-4 w-4 text-teal-200" />
                    <span>Staff Strength Movement & Reconciliation</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-800/80 text-teal-100 uppercase">
                    Excel Match
                  </span>
                </div>

                <div className="divide-y divide-teal-600/30 text-xs">
                  <div className="py-1.5 flex justify-between items-center">
                    <span>Total staff strength As At {metrics.reconciliation.prevMonthEndDateStr || "31/07/2026"}</span>
                    <span className="font-mono font-bold">{metrics.reconciliation.basePrevMonth}</span>
                  </div>
                  <div className="py-1.5 flex justify-between items-center">
                    <span>Add June Supplementary</span>
                    <span className="font-mono font-bold text-teal-200">+{metrics.reconciliation.juneSupplementary}</span>
                  </div>
                  <div className="py-1.5 flex justify-between items-center font-bold bg-teal-800/40 px-2 rounded">
                    <span>Total Staff Strength</span>
                    <span className="font-mono">{metrics.reconciliation.totalBase}</span>
                  </div>
                  <div className="py-1.5 flex justify-between items-center">
                    <span>Additions in {metrics.monthLabel}</span>
                    <span className="font-mono font-bold text-emerald-200">+{metrics.reconciliation.additions}</span>
                  </div>
                  <div className="py-1.5 flex justify-between items-center">
                    <span>Renewal in {metrics.reconciliation.prevMonthLabel || "July"}</span>
                    <span className="font-mono font-bold">{metrics.reconciliation.renewals}</span>
                  </div>
                  <div className="py-1 text-[11px] font-bold uppercase tracking-wider text-teal-200">
                    Less:
                  </div>
                  <div className="py-1.5 flex justify-between items-center pl-3">
                    <span>Expired/Terminated ({metrics.monthLabel})</span>
                    <span className="font-mono text-rose-200">-{metrics.reconciliation.expiredTerminated}</span>
                  </div>
                  <div className="py-1.5 flex justify-between items-center pl-3">
                    <span>Validation on Hold</span>
                    <span className="font-mono text-amber-200">-{metrics.reconciliation.validationOnHold}</span>
                  </div>
                  <div className="py-1.5 flex justify-between items-center font-bold bg-teal-800/40 px-2 rounded text-rose-100">
                    <span>Total Attrition</span>
                    <span className="font-mono">-{metrics.reconciliation.totalAttrition}</span>
                  </div>
                  <div className="pt-2 flex justify-between items-center font-black text-sm bg-teal-900/60 p-2.5 rounded-xl border border-teal-400/40">
                    <span>Total Staff Strength As At {metrics.reconciliation.currentMonthEndDateStr || "31/08/2026"}</span>
                    <span className="font-mono text-white text-base">{metrics.reconciliation.currentTotal}</span>
                  </div>
                </div>
              </div>
            )}
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
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
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
