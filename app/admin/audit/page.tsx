"use client";

import React, { useState, useEffect } from "react";
import { ScrollText, Search, Download, RefreshCw, Loader2 } from "lucide-react";

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
    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${styles[system] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {labels[system] || system}
    </span>
  );
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [systemFilter, setSystemFilter] = useState<"ALL" | "TEMPSTAFF" | "RETIREMENT" | "HR_LETTERS">("ALL");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/audit?limit=200");
      const data = await res.json();
      if (data.success) setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSystem = systemFilter === "ALL" || log.system === systemFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      log.userName?.toLowerCase().includes(q) ||
      log.userRole?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q);
    return matchesSystem && matchesSearch;
  });

  const handleExportCSV = () => {
    const headers = ["ID", "System", "User", "Role", "Action", "Details", "Date"];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.system,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.action}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
      `"${new Date(l.createdAt).toISOString()}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dvla_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: "ALL", label: "All Systems" },
    { id: "TEMPSTAFF", label: "TempStaff" },
    { id: "RETIREMENT", label: "Retirement" },
    { id: "HR_LETTERS", label: "HR Letters" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-600 font-semibold uppercase tracking-wider">
            <ScrollText className="w-4 h-4 text-cyan-500" /> Compliance Stream
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Combined Cross-System Audit Log</h1>
          <p className="text-xs text-gray-500">
            Real-time event stream aggregating security, staff creation, and contract operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium border border-gray-200 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Stream
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-gray-100 border border-gray-200 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSystemFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                systemFilter === tab.id
                  ? "bg-white text-cyan-700 shadow border border-gray-200"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action or details..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">System</th>
                <th className="py-3.5 px-4">User & Role</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 font-sans">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-cyan-500 mb-2" />
                    Fetching audit event stream...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 font-sans">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-GB")}
                    </td>
                    <td className="py-3 px-4">
                      <SystemBadge system={log.system} />
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="font-semibold text-gray-900">{log.userName}</span>
                      <span className="text-gray-400 text-[11px] block">{log.userRole}</span>
                    </td>
                    <td className="py-3 px-4 text-cyan-600 font-bold font-sans">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-sans leading-relaxed">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
