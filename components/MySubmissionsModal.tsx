"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  User,
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  Filter,
} from "lucide-react";
import { formatDateReadable } from "@/lib/status";

interface MySubmissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewStaffDetail?: (staffItem: any) => void;
  currentUserName?: string;
}

export default function MySubmissionsModal({
  isOpen,
  onClose,
  onViewStaffDetail,
  currentUserName,
}: MySubmissionsModalProps) {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [search, setSearch] = useState("");

  const fetchStaffSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff");
      const json = await res.json();
      if (res.ok && json.success) {
        setStaffList(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load staff submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStaffSubmissions();
    }
  }, [isOpen]);

  // Counts
  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    staffList.forEach((s) => {
      const st = s.approval_status || "APPROVED";
      if (st === "PENDING_APPROVAL") pending++;
      else if (st === "REJECTED") rejected++;
      else approved++;
    });
    return { total: staffList.length, pending, approved, rejected };
  }, [staffList]);

  // Filtered submissions
  const filteredList = useMemo(() => {
    return staffList.filter((s) => {
      const st = s.approval_status || "APPROVED";
      if (statusTab === "PENDING" && st !== "PENDING_APPROVAL") return false;
      if (statusTab === "APPROVED" && st !== "APPROVED") return false;
      if (statusTab === "REJECTED" && st !== "REJECTED") return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = s.full_name?.toLowerCase().includes(q);
        const matchCode = s.staff_code?.toLowerCase().includes(q);
        const matchDept = s.department?.toLowerCase().includes(q);
        const matchRole = s.role?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDept && !matchRole) return false;
      }
      return true;
    });
  }, [staffList, statusTab, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Staff Entry & Submission Tracker
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track status of submitted staff records (Pending Approval, Approved & Rejected)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-4 gap-3 p-4 bg-slate-100/60 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800 shrink-0 text-xs">
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Created</span>
            <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">{counts.total}</span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending Review</span>
              <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
            </div>
            <span className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5 block">{counts.pending}</span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Approved</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5 block">{counts.approved}</span>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Rejected</span>
              <XCircle className="h-4 w-4 text-rose-600" />
            </div>
            <span className="text-lg font-black text-rose-700 dark:text-rose-300 mt-0.5 block">{counts.rejected}</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {[
              { id: "ALL", label: `All (${counts.total})` },
              { id: "PENDING", label: `Pending (${counts.pending})` },
              { id: "APPROVED", label: `Approved (${counts.approved})` },
              { id: "REJECTED", label: `Rejected (${counts.rejected})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setStatusTab(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  statusTab === t.id
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search staff name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Submissions List Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 font-medium">
              Loading staff submission status...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              No staff records found for this status tab.
            </div>
          ) : (
            filteredList.map((item) => {
              const status = item.approval_status || "APPROVED";
              const isPending = status === "PENDING_APPROVAL";
              const isRejected = status === "REJECTED";

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isPending
                      ? "border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20"
                      : isRejected
                      ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-800"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs shrink-0">
                      {(item.full_name || "S").charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {item.full_name}
                        </h4>
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.staff_code || `EMP-${item.id}`}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                        <span>Station: <strong>{item.department || "General Office"}</strong></span>
                        <span>•</span>
                        <span>Role: <strong>{item.role || "Temporary Staff"}</strong></span>
                        <span>•</span>
                        <span>Created: <strong>{formatDateReadable(item.created_at)}</strong></span>
                      </div>

                      {/* Rejection Note details if rejected */}
                      {isRejected && item.rejection_reason && (
                        <div className="mt-2 p-2 rounded-xl bg-rose-100/70 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-[11px] font-medium">
                          ⚠️ <strong>Rejection Reason:</strong> {item.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                    <div>
                      {isPending && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 shadow-xs">
                          <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                          <span>Pending Officer Review</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800 flex items-center gap-1.5 shadow-xs">
                          <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          <span>Submission Rejected</span>
                        </span>
                      )}
                      {!isPending && !isRejected && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 shadow-xs">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Approved & Active</span>
                        </span>
                      )}
                    </div>

                    {onViewStaffDetail && (
                      <button
                        onClick={() => onViewStaffDetail(item)}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="View Full Profile Details"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            Showing {filteredList.length} of {counts.total} staff entries
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
