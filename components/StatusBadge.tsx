import React from "react";
import { ContractStatus } from "@/lib/status";

interface StatusBadgeProps {
  status: ContractStatus | string;
  daysRemaining?: number | null;
  size?: "sm" | "md" | "lg";
}

export default function StatusBadge({ status, daysRemaining, size = "md" }: StatusBadgeProps) {
  let badgeStyles = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  let dotColor = "bg-slate-400";
  let label = status;

  switch (status) {
    case "Active":
      badgeStyles = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60";
      dotColor = "bg-emerald-500 animate-pulse";
      break;
    case "Expiring Soon":
      badgeStyles = "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60";
      dotColor = "bg-amber-500 animate-ping";
      label = daysRemaining !== undefined && daysRemaining !== null
        ? `Expiring Soon (${daysRemaining}d left)`
        : "Expiring Soon";
      break;
    case "Expired":
      badgeStyles = "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60";
      dotColor = "bg-rose-500";
      label = daysRemaining !== undefined && daysRemaining !== null && daysRemaining < 0
        ? `Expired (${Math.abs(daysRemaining)}d ago)`
        : "Expired";
      break;
    case "Terminated":
      badgeStyles = "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-slate-300 dark:border-slate-800";
      dotColor = "bg-slate-400";
      break;
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3.5 py-1.5 text-sm font-semibold",
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${badgeStyles} ${sizeClasses} shadow-2xs transition-all`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
}
