"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Copy, GitMerge, Trash2, X, AlertCircle, CheckCircle2, User, Building, Calendar, Hash } from "lucide-react";
import { formatDateReadable } from "@/lib/status";

interface MergeDuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any | null;
  allStaff: any[];
  onSuccess?: () => void;
}

export default function MergeDuplicateModal({
  isOpen,
  onClose,
  staff,
  allStaff,
  onSuccess,
}: MergeDuplicateModalProps) {
  const [selectedDuplicateId, setSelectedDuplicateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Find matching duplicates for the target staff member
  const matchingDuplicates = useMemo(() => {
    if (!staff) return [];

    const targetCode = staff.staff_code ? staff.staff_code.trim().toLowerCase() : null;
    const targetName = staff.full_name ? staff.full_name.trim().toLowerCase() : null;
    const targetSsnit = staff.ssnit_no ? staff.ssnit_no.trim().toLowerCase() : null;

    return allStaff.filter((item) => {
      if (item.id === staff.id) return false;

      const codeMatch = targetCode && item.staff_code && item.staff_code.trim().toLowerCase() === targetCode;
      const nameMatch = targetName && item.full_name && item.full_name.trim().toLowerCase() === targetName;
      const ssnitMatch = targetSsnit && item.ssnit_no && item.ssnit_no.trim().toLowerCase() === targetSsnit;

      return codeMatch || nameMatch || ssnitMatch;
    });
  }, [staff, allStaff]);

  useEffect(() => {
    if (matchingDuplicates.length > 0) {
      setSelectedDuplicateId(matchingDuplicates[0].id);
    } else {
      setSelectedDuplicateId(null);
    }
    setError(null);
    setSuccessMsg(null);
  }, [staff, matchingDuplicates]);

  if (!isOpen || !staff) return null;

  const duplicateStaff = allStaff.find((s) => s.id === selectedDuplicateId) || matchingDuplicates[0];

  const handleMergeRecords = async () => {
    if (!duplicateStaff) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/staff/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary_id: staff.id,
          duplicate_id: duplicateStaff.id,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to merge records");
      }

      setSuccessMsg(`Successfully merged staff records! Duplicate #${duplicateStaff.id} has been combined and removed.`);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDuplicate = async (idToDelete: number) => {
    if (!confirm("Are you sure you want to permanently delete this duplicate staff record?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/staff/${idToDelete}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete duplicate record");
      }

      setSuccessMsg(`Duplicate staff record #${idToDelete} deleted successfully.`);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to delete duplicate staff member.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-300 dark:border-amber-800">
              <GitMerge className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Manage Duplicate Staff Record</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compare, merge non-empty details into one clean record, or delete the duplicate entry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {matchingDuplicates.length === 0 ? (
            <div className="p-6 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <p className="font-semibold text-sm">No duplicate records detected for this staff member.</p>
              <p className="text-xs">If you wish to delete this record directly, click below:</p>
              <button
                onClick={() => handleDeleteDuplicate(staff.id)}
                className="mt-3 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Record #{staff.id}</span>
              </button>
            </div>
          ) : (
            <>
              {/* Duplicate Selector if multiple */}
              {matchingDuplicates.length > 1 && (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Found {matchingDuplicates.length} matching duplicate records. Select one to compare/merge:
                  </span>
                  <select
                    value={selectedDuplicateId || ""}
                    onChange={(e) => setSelectedDuplicateId(Number(e.target.value))}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  >
                    {matchingDuplicates.map((dup) => (
                      <option key={dup.id} value={dup.id}>
                        {dup.full_name} ({dup.staff_code || `EMP-${dup.id}`})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Side by side comparison */}
              {duplicateStaff && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Primary Record */}
                  <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-indigo-500/40 space-y-2.5 relative">
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider inline-block">
                      Primary Record (To Keep)
                    </span>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      {staff.full_name}
                    </h4>
                    <div className="space-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <div>Code: <strong className="text-slate-900 dark:text-white">{staff.staff_code || `EMP-${staff.id}`}</strong></div>
                      <div>SSNIT: <strong className="text-indigo-600 dark:text-indigo-400">{staff.ssnit_no || "N/A"}</strong></div>
                      <div>NIA: <strong className="text-emerald-600 dark:text-emerald-400">{staff.nia_number || "N/A"}</strong></div>
                      <div>Station: <strong>{staff.department || "N/A"}</strong></div>
                      <div>Salary: <strong>GH₵{staff.salary ? Number(staff.salary).toFixed(2) : "1,400.00"}</strong></div>
                    </div>
                  </div>

                  {/* Duplicate Record */}
                  <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border-2 border-rose-400/40 space-y-2.5 relative">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] uppercase tracking-wider inline-block">
                        Duplicate Record (To Merge/Delete)
                      </span>
                      <button
                        onClick={() => handleDeleteDuplicate(duplicateStaff.id)}
                        title="Delete this duplicate record directly"
                        className="text-rose-600 dark:text-rose-400 hover:text-rose-800 font-bold text-[11px] flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      {duplicateStaff.full_name}
                    </h4>
                    <div className="space-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <div>Code: <strong className="text-slate-900 dark:text-white">{duplicateStaff.staff_code || `EMP-${duplicateStaff.id}`}</strong></div>
                      <div>SSNIT: <strong className="text-indigo-600 dark:text-indigo-400">{duplicateStaff.ssnit_no || "N/A"}</strong></div>
                      <div>NIA: <strong className="text-emerald-600 dark:text-emerald-400">{duplicateStaff.nia_number || "N/A"}</strong></div>
                      <div>Station: <strong>{duplicateStaff.department || "N/A"}</strong></div>
                      <div>Salary: <strong>GH₵{duplicateStaff.salary ? Number(duplicateStaff.salary).toFixed(2) : "1,400.00"}</strong></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold text-xs transition"
          >
            Cancel
          </button>

          {duplicateStaff && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDeleteDuplicate(duplicateStaff.id)}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Duplicate</span>
              </button>

              <button
                onClick={handleMergeRecords}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <GitMerge className="h-4 w-4" />
                <span>{loading ? "Merging..." : "Merge Records into One"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
