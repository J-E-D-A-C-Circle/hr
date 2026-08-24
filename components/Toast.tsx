"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id?: string;
  type: ToastType;
  title?: string;
  message: string;
  onClose: () => void;
  duration?: number; // ms
}

export default function Toast({
  type,
  title,
  message,
  onClose,
  duration = 3500,
}: ToastProps) {
  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: "bg-emerald-900/90 dark:bg-emerald-950/95 border-emerald-500/50 text-emerald-100",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
      badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    },
    error: {
      bg: "bg-rose-900/90 dark:bg-rose-950/95 border-rose-500/50 text-rose-100",
      icon: <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />,
      badge: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
    },
    warning: {
      bg: "bg-amber-900/90 dark:bg-amber-950/95 border-amber-500/50 text-amber-100",
      icon: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
      badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    },
    info: {
      bg: "bg-indigo-900/90 dark:bg-indigo-950/95 border-indigo-500/50 text-indigo-100",
      icon: <Info className="h-5 w-5 text-indigo-400 shrink-0" />,
      badge: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
    },
  }[type];

  return (
    <div className="fixed bottom-6 right-6 z-[100] max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div
        className={`p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex items-start gap-3 relative overflow-hidden ${styles.bg}`}
      >
        {styles.icon}
        <div className="flex-1 pr-6 space-y-0.5">
          {title && <h4 className="font-bold text-xs uppercase tracking-wider">{title}</h4>}
          <p className="text-xs leading-relaxed font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
