"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, Calendar, ArrowRight, CheckCircle2, AlertCircle, X } from "lucide-react";
import { calculateEndDate, formatDateForInput, parseFlexibleDate } from "@/lib/status";
import DateInput from "@/components/DateInput";

interface RenewModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: {
    id: number;
    full_name: string;
    staff_code?: string | null;
    currentContract?: {
      end_date: string | Date;
      renewal_number: number;
    } | null;
  } | null;
  onSuccess: () => void;
}

export default function RenewModal({ isOpen, onClose, staff, onSuccess }: RenewModalProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (staff?.currentContract?.end_date) {
      const oldEndDateStr = formatDateForInput(staff.currentContract.end_date);
      setStartDate(oldEndDateStr);

      const oldEndObj = parseFlexibleDate(staff.currentContract.end_date);
      if (oldEndObj) {
        const newEndObj = calculateEndDate(oldEndObj);
        setEndDate(formatDateForInput(newEndObj));
      }
    }
  }, [staff]);

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (val) {
      const d = parseFlexibleDate(val);
      if (d && !isNaN(d.getTime())) {
        const newEndObj = calculateEndDate(d);
        setEndDate(formatDateForInput(newEndObj));
      }
    }
  };

  if (!isOpen || !staff) return null;

  const currentRenewalNumber = staff.currentContract?.renewal_number || 1;
  const nextRenewalNumber = currentRenewalNumber + 1;

  const handleRenew = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/staff/${staff.id}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custom_start_date: startDate,
          custom_end_date: endDate,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to renew contract.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Renew Temporary Contract
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Contract Period Extension (Editable End Date)
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-500">Staff Member:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {staff.full_name} ({staff.staff_code || `#${staff.id}`})
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Contract Cycle:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Renewal #{nextRenewalNumber} (Previous: #{currentRenewalNumber})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Start Date (DD/MM/YYYY)
              </label>
              <DateInput
                value={startDate}
                onChange={handleStartDateChange}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New End Date (DD/MM/YYYY) (Editable)
              </label>
              <DateInput
                value={endDate}
                onChange={(val) => setEndDate(val)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                iconColor="text-emerald-500"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/30">
            <strong>Note:</strong> Submitting will mark current Contract #{currentRenewalNumber} as historical (<code className="font-mono">is_current = FALSE</code>) and insert a new active contract row for 6 months.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRenew}
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Confirm Renewal #{nextRenewalNumber}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
