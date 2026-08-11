"use client";

import { useState } from "react";
import { X, AlertCircle, CheckCircle2, PauseCircle, DollarSign } from "lucide-react";

interface PaymentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any | null;
  onSuccess: () => void;
}

export function PaymentStatusModal({
  isOpen,
  onClose,
  staff,
  onSuccess,
}: PaymentStatusModalProps) {
  const [status, setStatus] = useState<"paid" | "unpaid">("unpaid");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !staff) return null;

  const currentStatus = staff.payment_status || "paid";

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/staff/${staff.id}/payment-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_status: status,
          unpaid_reason: status === "unpaid" ? reason || "Payment On Hold" : null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update payment status");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
            <PauseCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Update Monthly Payment Status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Set payroll payout status for current cycle
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="text-slate-500 mb-0.5">Staff Member:</div>
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              {staff.full_name} <span className="font-mono text-slate-400">({staff.staff_code || `#${staff.id}`})</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Current Status:{" "}
              <strong className={currentStatus === "paid" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                {currentStatus === "paid" ? "Paid" : `Unpaid (${staff.unpaid_reason || "On Hold"})`}
              </strong>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Payout Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus("paid")}
                className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition ${
                  status === "paid"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Mark Paid</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus("unpaid")}
                className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition ${
                  status === "unpaid"
                    ? "bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <PauseCircle className="h-4 w-4" />
                <span>Unpaid / On Hold</span>
              </button>
            </div>
          </div>

          {status === "unpaid" && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Non-Payment / Hold
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Leave without pay, Delayed documentation, Zero hours"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Payment Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
