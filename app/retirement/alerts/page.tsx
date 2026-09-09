"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, RefreshCw, Eye, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function AlertCenterPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const pageSize = 8;

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/retirement/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAlertScan = async () => {
    setScanning(true);
    setScanMessage(null);
    try {
      const res = await fetch("/api/retirement/alerts", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setScanMessage(data.message);
        fetchAlerts();
      }
    } catch (e) {
      setScanMessage("Scan execution failed.");
    } finally {
      setScanning(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/retirement/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  const totalPages = Math.ceil(alerts.length / pageSize) || 1;
  const paginatedAlerts = alerts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Bell size={20} />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Milestone Alert Center</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated milestone tracking for 5 years, 3 years, 1 year, and 6 months before statutory retirement age 60.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
            >
              Mark All as Read
            </button>
          )}

          <button
            onClick={handleRunAlertScan}
            disabled={scanning}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-2 shadow-md"
          >
            <RefreshCw size={15} className={scanning ? "animate-spin" : ""} />
            <span>{scanning ? "Scanning Workforce..." : "Run Milestone Scan"}</span>
          </button>
        </div>
      </div>

      {scanMessage && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs flex items-center gap-2 font-semibold">
          <Sparkles size={16} />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Alert Feed */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading milestone alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No milestone alerts triggered yet. Click "Run Milestone Scan" to evaluate active staff.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {paginatedAlerts.map((a) => (
              <div
                key={a.id}
                className={`p-4 flex items-center justify-between transition ${
                  a.status === "UNREAD" ? "bg-amber-50/40 dark:bg-amber-950/20 font-medium" : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-xl font-bold">
                    <Bell size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {a.staff?.fullName} ({a.staff?.staffId})
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        {a.milestone.replace("_", " ")} MILESTONE
                      </span>
                      {a.status === "UNREAD" && (
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                      )}
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1">
                      {a.staff?.departmentName || "General Directorate"} &bull; {a.staff?.jobTitle} &bull; Retires in{" "}
                      <strong className="text-slate-900 dark:text-slate-100 font-mono">{a.timeRemainingFormatted}</strong> ({a.retirementDateFormatted})
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Triggered {format(new Date(a.triggeredAt), "dd MMM yyyy, HH:mm")}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/retirement/staff/${a.staffId}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 shrink-0"
                >
                  <Eye size={13} />
                  <span>View Staff</span>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Page {page} of {totalPages} ({alerts.length} total alerts)</span>
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
