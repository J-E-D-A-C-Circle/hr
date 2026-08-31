"use client";
import React from "react";

type BadgeVariant = "success" | "warning" | "error" | "info" | "purple" | "muted" | "draft";

const variantMap: Record<BadgeVariant, string> = {
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  error:   "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  info:    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  purple:  "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  muted:   "bg-[--color-border-subtle] text-[--color-text-3] border-[--color-border]",
  draft:   "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

const dotMap: Record<BadgeVariant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error:   "bg-red-500",
  info:    "bg-blue-500",
  purple:  "bg-purple-500",
  muted:   "bg-[--color-text-4]",
  draft:   "bg-slate-400",
};

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = "muted", dot, children, className = "" }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${variantMap[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotMap[variant]}`} />}
      {children}
    </span>
  );
};

/** Map letter/recruitment status strings to badge variants */
export function statusToBadgeVariant(status: string): BadgeVariant {
  switch (status?.toUpperCase()) {
    case "ISSUED":
    case "CONFIRMED":
    case "HIRED":
    case "ACTIVE":
    case "SCHEDULED":    return "success";
    case "APPROVED":
    case "SHORTLISTED":  return "purple";
    case "PENDING_APPROVAL":
    case "SUBMITTED":
    case "PENDING":      return "warning";
    case "REJECTED":
    case "FAILED":       return "error";
    case "DRAFT":        return "draft";
    case "ARCHIVED":     return "muted";
    default:             return "info";
  }
}
