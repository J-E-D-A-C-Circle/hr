"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface RetirementHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  className?: string;
}

export default function RetirementHeader({
  icon: Icon,
  title,
  subtitle,
  action,
  className = "",
}: RetirementHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-2xl shadow-xs shrink-0">
          <Icon size={22} />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">{subtitle}</p>
        </div>
      </div>

      {action && <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">{action}</div>}
    </div>
  );
}
