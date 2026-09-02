"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, X, Calendar, UserCheck, ShieldAlert, AlertCircle, FileText, BookmarkPlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrentMonthYearString, getRecentMonthOptions } from "@/lib/status";

interface ValidateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any | null;
  onSuccess?: () => void;
}

export default function ValidateStaffModal({ isOpen, onClose, staff, onSuccess }: ValidateStaffModalProps) {
  const currentMonthStr = getCurrentMonthYearString();
  const monthOptions = getRecentMonthOptions(12);

  const [selectedBaseMonth, setSelectedBaseMonth] = useState<string>(currentMonthStr);
  const [isSupplementary, setIsSupplementary] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [isValidated, setIsValidated] = useState<boolean>(false);
  const [validationDetails, setValidationDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveMonth = isSupplementary
    ? `${selectedBaseMonth} (Supplementary)`
    : selectedBaseMonth;

  useEffect(() => {
    if (staff && isOpen) {
      checkValidationStatus(effectiveMonth);
    }
  }, [staff, selectedBaseMonth, isSupplementary, isOpen]);

  const checkValidationStatus = (month: string) => {
    if (!staff || !staff.validations) {
      setIsValidated(false);
      setValidationDetails(null);
      return;
    }

    const found = staff.validations.find((v: any) => v.month.toLowerCase() === month.toLowerCase());
    if (found) {
      setIsValidated(true);
      setValidationDetails(found);
      if (found.notes) setNotes(found.notes);
    } else {
      setIsValidated(false);
      setValidationDetails(null);
      setNotes("");
    }
  };

  if (!isOpen || !staff) return null;

  const handleToggleValidation = async () => {
    setLoading(true);
    setError(null);

    try {
      if (isValidated) {
        // Remove validation
        const res = await fetch("/api/staff/validate", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staff_id: staff.id,
            month: effectiveMonth,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to remove validation");
      } else {
        // Submit validation
        const res = await fetch("/api/staff/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staff_id: staff.id,
            month: effectiveMonth,
            notes: notes.trim() || (isSupplementary ? "Supplementary payment for skipped cycle" : null),
            validated_by: "HR Admin",
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to submit validation");
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const isExpiredOrTerminated = staff?.computedStatus === "Expired" || staff?.computedStatus === "Terminated";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Staff Validation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Validate employee for regular or supplementary payment export
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
        <div className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Employee Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 text-[11px]">
                {staff.staff_code || `EMP-${staff.id}`}
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                GH₵{staff.salary ? Number(staff.salary).toFixed(2) : "1,400.00"}
              </span>
            </div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              {staff.full_name}
            </h4>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
              <span>Station: <strong>{staff.department || "General"}</strong></span>
              <span>•</span>
              <span>Role: <strong>{staff.role || "Temporary Staff"}</strong></span>
            </div>
          </div>

          {/* Month Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              <span>Select Payment Validation Month</span>
            </label>
            <Select
              value={selectedBaseMonth}
              onValueChange={(val) => setSelectedBaseMonth(val)}
            >
              <SelectTrigger className="w-full h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold shadow-xs focus:ring-2 focus:ring-emerald-500">
                <SelectValue placeholder="Select Payment Validation Month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => {
                  const isCurrent = m === currentMonthStr;
                  return (
                    <SelectItem
                      key={m}
                      value={m}
                      className={
                        isCurrent
                          ? "font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/40"
                          : "font-medium text-slate-700 dark:text-slate-300"
                      }
                    >
                      {m} {isCurrent ? "✓ (Current Active Month)" : "(Past Month)"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Supplementary Toggle */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="supp-checkbox" className="flex items-center gap-2 cursor-pointer">
                <input
                  id="supp-checkbox"
                  type="checkbox"
                  checked={isSupplementary}
                  onChange={(e) => setIsSupplementary(e.target.checked)}
                  className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300 dark:border-amber-700 cursor-pointer"
                />
                <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 text-xs">
                  <BookmarkPlus className="h-4 w-4 text-amber-600" />
                  Supplementary Payment List
                </span>
              </label>
              {isSupplementary && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                  Supplementary Mode
                </span>
              )}
            </div>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-snug">
              Check this option to validate staff who were skipped or missed in a past payroll (e.g. skipped in July) so they can be included in a Supplementary Payout List.
            </p>
          </div>

          {/* Notes / Reason Input */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span>Validation Notes / Reason (Optional)</span>
            </label>
            <input
              type="text"
              placeholder={isSupplementary ? "e.g. Skipped in regular July payroll" : "e.g. Verified by HR Manager"}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>

          {/* Status Indicator Banner */}
          {isExpiredOrTerminated ? (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span>Validation Disabled ({staff.computedStatus} Staff)</span>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-relaxed">
                This employee's contract status is <strong>"{staff.computedStatus}"</strong>. Payment validation is strictly available for <strong>Active</strong> and <strong>Expiring Soon</strong> staff members only. Please renew contract first to enable validation.
              </p>
            </div>
          ) : isValidated ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs">
                <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Validated for {effectiveMonth}</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                This employee is verified and will be included in the {effectiveMonth} Payroll & SSNIT Payment Export.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs">
                <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Pending Validation for {effectiveMonth}</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Click <strong>"Validate Staff Member"</strong> below to confirm payment approval for {effectiveMonth}.
              </p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold text-xs transition"
          >
            Cancel
          </button>

          <button
            onClick={handleToggleValidation}
            disabled={loading || isExpiredOrTerminated}
            className={`px-5 py-2 rounded-xl font-bold text-xs text-white shadow-md transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
              isValidated
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {loading
                ? "Processing..."
                : isExpiredOrTerminated
                ? "Validation Disabled (Expired)"
                : isValidated
                ? "Remove Validation"
                : `Validate & Submit (${effectiveMonth})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

