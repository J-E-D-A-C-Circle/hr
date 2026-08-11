"use client";

import React, { useState, useEffect } from "react";
import { UserCheck, Calendar, DollarSign, ArrowRight, CheckCircle2, AlertCircle, X, Building } from "lucide-react";
import { calculateEndDate, formatDateToISO, formatDateReadable } from "@/lib/status";

interface ReinstateModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: {
    id: number;
    full_name: string;
    staff_code?: string | null;
    salary?: number | null;
    department?: string | null;
    role?: string | null;
  } | null;
  onSuccess: () => void;
}

export default function ReinstateModal({ isOpen, onClose, staff, onSuccess }: ReinstateModalProps) {
  const [grossSalary, setGrossSalary] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(formatDateToISO(new Date()));
  const [computedEndDate, setComputedEndDate] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [department, setDepartment] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (staff) {
      setGrossSalary(staff.salary ? String(staff.salary) : "1400");
      setRole(staff.role || "");
      setDepartment(staff.department || "");
    }
  }, [staff]);

  useEffect(() => {
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) {
        const endObj = calculateEndDate(d);
        setComputedEndDate(formatDateReadable(endObj));
      }
    }
  }, [startDate]);

  if (!isOpen || !staff) return null;

  const handleReinstate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!grossSalary || parseFloat(grossSalary) <= 0) {
      setError("Please enter a valid Gross Monthly Salary amount.");
      return;
    }
    if (!startDate) {
      setError("Please select a new contract start date.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/staff/${staff.id}/reinstate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_gross_salary: grossSalary,
          new_start_date: startDate,
          role,
          department,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to reinstate staff member.");
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
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Reinstate Terminated Staff
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Restore employee from archive & start new 6-month contract
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleReinstate} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 mb-0.5">Staff Member:</div>
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              {staff.full_name} <span className="font-mono text-slate-400">({staff.staff_code || `#${staff.id}`})</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Gross Monthly Salary (GH₵) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                required
                value={grossSalary}
                onChange={(e) => setGrossSalary(e.target.value)}
                placeholder="1400.00"
                className="w-full pl-9 pr-3 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <DollarSign className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Contract Start Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <Calendar className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New End Date (+6 Mo)
              </label>
              <div className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5 h-[38px]">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{computedEndDate || "Calculating..."}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Station / Location (Optional Update)
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Operations"
                className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role (Optional Update)
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Systems Analyst"
                className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300">
            <strong>Note:</strong> Reinstating will remove the staff member from the Archived list, create a new active 6-month rolling contract, and add them back to active payroll & Petra insurance lists.
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
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {loading ? "Reinstating..." : "Confirm Reinstatement"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
