"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import SidebarLayout from "@/components/SidebarLayout";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Clock,
  User,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { formatDateTimeDDMMYYYY } from "@/lib/status";

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("2026");

  // Role Guard Check
  useEffect(() => {
    fetch("/api/auth/check")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.role === "HR Officer") {
          router.push("/dashboard");
        }
      })
      .catch(() => {});
  }, [router]);

  // Pagination State (25 items per page)
  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [actionFilter, search, monthFilter, yearFilter]);

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return logs.slice(start, start + PAGE_SIZE);
  }, [logs, currentPage]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const actionParam = actionFilter !== "all" ? actionFilter : "";
      const searchParam = search.trim();
      const res = await fetch(
        `/api/audit-logs?action=${encodeURIComponent(actionParam)}&search=${encodeURIComponent(searchParam)}&month=${monthFilter}&year=${yearFilter}`
      );
      const json = await res.json();
      if (res.ok && json.success) {
        setLogs(json.data);
      }
    } catch (error) {
      console.error("Fetch audit logs error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, search, monthFilter, yearFilter]);

  const handleExportCSV = () => {
    if (!logs || logs.length === 0) return;
    const headers = ["Log ID", "Timestamp", "User Name", "User Role", "Action Type", "Event Details", "Staff ID"];
    const rows = logs.map((log) => [
      log.id,
      `"${new Date(log.created_at).toLocaleString("en-GB")}"`,
      `"${log.user_name || ""}"`,
      `"${log.user_role || ""}"`,
      `"${log.action || ""}"`,
      `"${(log.details || "").replace(/"/g, '""')}"`,
      log.staff_id || "",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TempStaff_Audit_Logs_${yearFilter}_${monthFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <span>System Audit Logs & Activity History</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Immutably tracking all system actions, contract renewals, terminations, reinstatements & payment holds.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleExportCSV}
              disabled={logs.length === 0}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              <span>Export Audit Logs (CSV)</span>
            </button>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition"
            >
              <RefreshCw className="h-4 w-4 text-emerald-500" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search details or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            />
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Month Filter */}
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              <SelectItem value="1">January</SelectItem>
              <SelectItem value="2">February</SelectItem>
              <SelectItem value="3">March</SelectItem>
              <SelectItem value="4">April</SelectItem>
              <SelectItem value="5">May</SelectItem>
              <SelectItem value="6">June</SelectItem>
              <SelectItem value="7">July</SelectItem>
              <SelectItem value="8">August</SelectItem>
              <SelectItem value="9">September</SelectItem>
              <SelectItem value="10">October</SelectItem>
              <SelectItem value="11">November</SelectItem>
              <SelectItem value="12">December</SelectItem>
            </SelectContent>
          </Select>

          {/* Year Filter */}
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>

          {/* Action Filter */}
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="BULK_RENEW">Bulk Renewals</SelectItem>
              <SelectItem value="RENEW">Renewals</SelectItem>
              <SelectItem value="SUBMIT_EDIT_FOR_APPROVAL">Edit Requests</SelectItem>
              <SelectItem value="APPROVE_EDIT">Approved Edits</SelectItem>
              <SelectItem value="STATION_TRANSFER">Station Transfers</SelectItem>
              <SelectItem value="PAYMENT_STATUS_CHANGE">Payment Holds</SelectItem>
              <SelectItem value="TERMINATE">Terminations</SelectItem>
              <SelectItem value="REINSTATE">Reinstatements</SelectItem>
              <SelectItem value="CREATE">Staff Enrollments</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">User & Role</th>
                  <th className="p-3.5">Action Type</th>
                  <th className="p-3.5">Event Details</th>
                  <th className="p-3.5 text-right">Staff Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Fetching system activity history...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No audit events recorded for this search filter.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{formatDateTimeDDMMYYYY(log.created_at)}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{log.user_name}</div>
                        <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {log.user_role}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          log.action === "BULK_RENEW" || log.action === "RENEW"
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : log.action === "TERMINATE"
                            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                            : log.action === "REINSTATE"
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        }`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200 leading-normal">
                        {log.details}
                      </td>

                      <td className="p-3.5 text-right">
                        {log.staff_id ? (
                          <Link
                            href={`/staff/${log.staff_id}`}
                            className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold text-[11px]"
                          >
                            View Staff Profile
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 25-Item Pagination Footer Bar */}
          {logs.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-950/40">
              <div className="text-slate-500 dark:text-slate-400 font-medium">
                Showing <strong>{Math.min((currentPage - 1) * PAGE_SIZE + 1, logs.length)}</strong> to{" "}
                <strong>{Math.min(currentPage * PAGE_SIZE, logs.length)}</strong> of{" "}
                <strong>{logs.length}</strong> system audit events
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
