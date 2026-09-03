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
              Extract validated staff payment lists in <strong>Monthly Payroll Computation</strong>, <strong>Monthly Payroll Payment</strong>, or <strong>SSNIT Statutory Contribution</strong> formats
            </p>
          </div>

          <button
            onClick={handleDownloadExcel}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition self-start sm:self-auto"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>
              {exportType === "petra"
                ? "Download Petra Tier 2 Excel (PETRA.xlsx)"
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
