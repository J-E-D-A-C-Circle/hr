"use client";

import React, { useState, useEffect, useMemo } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import StatusBadge from "@/components/StatusBadge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Download,
  FileSpreadsheet,
  Filter,
  Building,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { formatDateReadable, getCurrentMonthYearString, getRecentMonthOptions } from "@/lib/status";

export default function ExportPage() {
  const currentMonthStr = getCurrentMonthYearString();
  const recentMonths = getRecentMonthOptions(12);

  const [filter, setFilter] = useState("currently_employed");
  const [department, setDepartment] = useState("");
  const [exportType, setExportType] = useState("payroll");
  const [validationMonth, setValidationMonth] = useState(currentMonthStr);
  const [search, setSearch] = useState("");
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [summaryOverview, setSummaryOverview] = useState<any>(null);
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Pagination State (25 items per page)
  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, department, exportType, validationMonth, search]);

  const filteredPreviewData = useMemo(() => {
    if (!search.trim()) return previewData;
    const q = search.toLowerCase();
    return previewData.filter((item) => {
      const matchName = item.full_name?.toLowerCase().includes(q);
      const matchCode = item.staff_code?.toLowerCase().includes(q);
      const matchDept = item.department?.toLowerCase().includes(q);
      const matchRole = item.role?.toLowerCase().includes(q);
      const matchBank = item.bank_name?.toLowerCase().includes(q) || item.bank_account?.toLowerCase().includes(q);
      const matchSsnit = item.ssnit_no?.toLowerCase().includes(q);
      return matchName || matchCode || matchDept || matchRole || matchBank || matchSsnit;
    });
  }, [previewData, search]);

  const totalPages = Math.max(1, Math.ceil(filteredPreviewData.length / PAGE_SIZE));

  const paginatedExportData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPreviewData.slice(start, start + PAGE_SIZE);
  }, [filteredPreviewData, currentPage]);

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        filter,
        department,
        export_type: exportType,
        validation_month: validationMonth,
        format: "json",
      });
      const res = await fetch(`/api/export?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setPreviewData(json.data);
        setSummaryOverview(json.summaryOverview || null);
        setReconciliation(json.reconciliation || null);
      }
    } catch (err: any) {
      console.error("Preview fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [filter, department, exportType, validationMonth]);

  const handleDownloadExcel = () => {
    const params = new URLSearchParams({
      filter,
      department,
      export_type: exportType,
      validation_month: validationMonth,
      format: "excel",
    });
    window.open(`/api/export?${params.toString()}`, "_blank");
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="h-6 w-6 text-emerald-600" />
              <span>Monthly Payroll & Statutory Export</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Extract validated staff payment lists in <strong>GRA Monthly PAYE Tax Extract</strong>, <strong>Monthly Payroll Computation</strong>, <strong>SSNIT Statutory Contribution</strong>, <strong>Petra Tier 2</strong>, or <strong>Payroll Payment</strong> formats
            </p>
          </div>

          <button
            onClick={handleDownloadExcel}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition self-start sm:self-auto"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>
              {exportType === "expiring"
                ? "Download Expiring & Expired Staff Excel (.xlsx)"
                : exportType === "petra"
                ? "Download Petra Tier 2 Excel (PETRA.xlsx)"
                : exportType === "gra"
                ? "Download GRA Monthly PAYE Tax Schedule (GRA-PORTAL.xlsx)"
                : exportType === "computation"
                ? "Download Monthly Computation Excel (.xlsx)"
                : exportType === "payroll"
                ? "Download Payroll Payment Excel (.xlsx)"
                : exportType === "ssnit"
                ? "Download SSNIT Contribution Excel (.xlsx)"
                : "Download Standard Export (.xlsx)"}
            </span>
          </button>
        </div>

        {/* Export Format Selector Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* GRA PAYE Extract Card */}
          <div
            onClick={() => setExportType("gra")}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              exportType === "gra"
                ? "bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Building className="h-4 w-4 text-blue-600" />
                GRA PAYE Tax Extract
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-200">
                GRA-PORTAL.xlsx
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              Official 29-Column GRA Monthly Tax Deductions Schedule
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Formatted for direct GRA Tax Portal upload with Ghana Card No, Basic Salary, Taxable Income, & Income Tax (GH₵122.28).
            </p>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-blue-100 dark:border-blue-900/40 text-[11px] font-bold text-blue-600 dark:text-blue-400">
              <span>{exportType === "gra" ? "Selected Format ✓" : "Click to Select"}</span>
              <Download className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Monthly Payroll Computation Card */}
          <div
            onClick={() => setExportType("computation")}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              exportType === "computation"
                ? "bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Monthly Temp Computation
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-200">
                Multi-Sheet
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              Full Temp Staff Computation Master Workbook
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Contains Reconciliation Summary, Salary Register, PAYE Computation, and GRA- PORTAL sheets in one file.
            </p>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-emerald-100 dark:border-emerald-900/40 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span>{exportType === "computation" ? "Selected Format ✓" : "Click to Select"}</span>
              <Download className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* SSNIT Statutory Schedule Card */}
          <div
            onClick={() => setExportType("ssnit")}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              exportType === "ssnit"
                ? "bg-teal-50/80 dark:bg-teal-950/50 border-teal-500 ring-2 ring-teal-500/20 shadow-md"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-800"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                SSNIT Statutory Schedule
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/80 text-teal-700 dark:text-teal-200">
                Tier 1 (18.5%)
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              Official SSNIT Tier 1 Contribution Schedule
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Includes SSNIT Nos, 5.5% Employee deduction, 13.0% Employer match, and total Tier 1 contributions.
            </p>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-teal-100 dark:border-teal-900/40 text-[11px] font-bold text-teal-600 dark:text-teal-400">
              <span>{exportType === "ssnit" ? "Selected Format ✓" : "Click to Select"}</span>
              <Download className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Petra Tier 2 Card */}
          <div
            onClick={() => setExportType("petra")}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              exportType === "petra"
                ? "bg-purple-50/80 dark:bg-purple-950/50 border-purple-500 ring-2 ring-purple-500/20 shadow-md"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-purple-600" />
                Petra Tier 2 Format
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-200">
                PETRA.xlsx
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              Mandatory Tier 2 Pension Contribution Schedule
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Parsed Staff Name, Ghana Card, SSNIT No, Basic Salary, and 5% Tier 2 Pension contribution.
            </p>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-purple-100 dark:border-purple-900/40 text-[11px] font-bold text-purple-600 dark:text-purple-400">
              <span>{exportType === "petra" ? "Selected Format ✓" : "Click to Select"}</span>
              <Download className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Payroll Payment Card */}
          <div
            onClick={() => setExportType("payroll")}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              exportType === "payroll"
                ? "bg-slate-100 dark:bg-slate-800 border-slate-500 ring-2 ring-slate-500/20 shadow-md"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-slate-600" />
                Bank Payroll Payment
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Bank Payout
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              Bank Payment Disbursement Schedule
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Bank names, branch codes, account numbers, and net take-home pay for direct bank transfers.
            </p>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span>{exportType === "payroll" ? "Selected Format ✓" : "Click to Select"}</span>
              <Download className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Expiring Staff Card */}
          <div
            onClick={() => setExportType("expiring")}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              exportType === "expiring"
                ? "bg-amber-50/80 dark:bg-amber-950/50 border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-amber-600" />
                Expiring Staff Audit
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-200">
                Audit List
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              Expiring Soon & Expired Staff Directory
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Filter staff whose 6-month contracts are expiring within 30 days or already expired.
            </p>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-amber-100 dark:border-amber-900/40 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <span>{exportType === "expiring" ? "Selected Format ✓" : "Click to Select"}</span>
              <Download className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-500" />
            <span>Export Criteria & Payment Format Selection</span>
          </h2>

          {validationMonth.includes("(Supplementary)") && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>Supplementary List Mode Active:</strong> Filtering records specifically validated for <strong>"{validationMonth}"</strong>.
                </span>
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 shrink-0">
                Supplementary Payout
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Excel Payment Format
              </label>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Payment Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expiring" className="font-bold text-amber-600 dark:text-amber-400">
                    Expiring Soon & Expired Staff Directory
                  </SelectItem>
                  <SelectItem value="gra" className="font-bold text-blue-600 dark:text-blue-400">
                    GRA Monthly PAYE Tax Extract (GRA-PORTAL.xlsx)
                  </SelectItem>
                  <SelectItem value="petra" className="font-bold text-emerald-600 dark:text-emerald-400">
                    Petra Tier 2 Contribution Format (PETRA.xlsx)
                  </SelectItem>
                  <SelectItem value="computation">
                    Monthly Payroll Computation Format (TEMP COMPUTATION)
                  </SelectItem>
                  <SelectItem value="payroll">
                    Monthly Payroll Payment Format
                  </SelectItem>
                  <SelectItem value="ssnit">
                    SSNIT Statutory Contribution Format
                  </SelectItem>
                  <SelectItem value="standard">
                    Standard Full Data Directory Export
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Validated Payment Month Filter
              </label>
              <Select value={validationMonth} onValueChange={setValidationMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="All Validated & Active Staff" />
                </SelectTrigger>
                <SelectContent>
                  {recentMonths.map((m, idx) => {
                    const isCurrent = idx === 0;
                    return (
                      <React.Fragment key={m}>
                        <SelectItem
                          value={m}
                          className={
                            isCurrent
                              ? "font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/40"
                              : "font-medium text-slate-700 dark:text-slate-300"
                          }
                        >
                          Validated for {m} {isCurrent ? "(Current Regular Payroll)" : "(Regular)"}
                        </SelectItem>
                        <SelectItem
                          value={`${m} (Supplementary)`}
                          className="font-bold text-amber-600 dark:text-amber-400"
                        >
                          {m} (Supplementary Payout List)
                        </SelectItem>
                      </React.Fragment>
                    );
                  })}
                  <SelectItem value="">All Active / Employed Staff (No Month Filter)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employment Status Selection
              </label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Currently Employed (Active + Expiring Soon)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="currently_employed">
                    Currently Employed (Active + Expiring Soon)
                  </SelectItem>
                  <SelectItem value="active">Active Contracts Only</SelectItem>
                  <SelectItem value="expiring">Expiring Soon (≤30 Days) Only</SelectItem>
                  <SelectItem value="expired">Expired Contracts Only</SelectItem>
                  <SelectItem value="terminated">Terminated Staff Only</SelectItem>
                  <SelectItem value="all">All Records (Full Database)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Search Specific Employee
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search name, staff code, bank account, ssnit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Station Filter (Optional)
              </label>
              <input
                type="text"
                placeholder="Leave blank for All Stations"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>



        {/* Live Export Preview Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-3">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-emerald-500" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Export Data Live Preview
                </h3>
                <p className="text-xs text-slate-500">
                  Showing {filteredPreviewData.length} records matching search & filter criteria
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadExcel}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm self-start sm:self-auto"
            >
              Export Now
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="p-3">Staff Code</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Dept & Role</th>
                  <th className="p-3">Bank Details</th>
                  <th className="p-3">Monthly Salary</th>
                  <th className="p-3">End Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Loading preview...
                    </td>
                  </tr>
                ) : previewData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No records match the selected export filter.
                    </td>
                  </tr>
                ) : (
                  paginatedExportData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {item.staff_code || `EMP-${item.id}`}
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{item.full_name}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {item.department || "N/A"} / {item.role || "N/A"}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.bank_name || "N/A"}{item.bank_branch ? ` (${item.bank_branch})` : ""}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {item.bank_account || "N/A"}
                        </div>
                      </td>
                      <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                        {item.salary ? `GH₵${Number(item.salary).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "GH₵0.00"}
                      </td>
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                        {item.currentContract ? formatDateReadable(item.currentContract.end_date) : "N/A"}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={item.computedStatus} size="sm" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 25-Item Pagination Controls Footer Bar */}
          {previewData.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-950/40">
              <div className="text-slate-500 dark:text-slate-400 font-medium">
                Showing <strong>{Math.min((currentPage - 1) * PAGE_SIZE + 1, previewData.length)}</strong> to{" "}
                <strong>{Math.min(currentPage * PAGE_SIZE, previewData.length)}</strong> of{" "}
                <strong>{previewData.length}</strong> staff records for export
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
