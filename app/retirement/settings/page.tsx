"use client";

import React, { useState, useEffect } from "react";
import { Settings, ShieldCheck, Server, Lock, ExternalLink, Building2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import RetirementHeader from "@/components/retirement/RetirementHeader";

export default function SettingsPage() {
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/retirement/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.systemInfo) setSystemInfo(data.systemInfo);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-xs text-slate-500 animate-pulse">Loading system settings...</div>;
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <RetirementHeader
        icon={Settings}
        title="System Settings & Parameters"
        subtitle="Statutory retirement parameters, system rules, and head office authority details."
      />

      {/* Super Admin Notice Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-xl shrink-0">
            <Lock size={20} />
          </div>
          <div>
            <h3 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">
              Centralized User Access Management
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-400 mt-1 leading-relaxed">
              All HR user accounts, roles, and administrative credentials are managed centrally by Super Administrators in the Super Admin Portal.
            </p>
          </div>
        </div>
        <Link
          href="/admin/users"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-2 shrink-0 shadow-xs"
        >
          <span>Open Super Admin Portal</span>
          <ExternalLink size={14} />
        </Link>
      </div>

      {/* Card 1: Statutory Pension & Retirement Rule */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Statutory Pension Rule
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Statutory Retirement Age (Compulsory)
            </label>
            <input
              type="text"
              value="60 Years (Fixed)"
              disabled
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              In accordance with Public Services Commission & Ghana Statutory Act, compulsory exit age is set at 60 years.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Automatic Computation Rule</label>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Retirement Exit Date is dynamically computed as exact date turning 60 (<span className="font-mono font-bold text-slate-900 dark:text-slate-100">DOB + 60 Years</span>). Status tags update automatically.
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: System Environment & Info */}
      {systemInfo && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Server className="h-5 w-5 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              System Environment & Information
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Application Name</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{systemInfo.appName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Version</span>
              <span className="font-mono font-bold text-amber-600">{systemInfo.version}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Head Office</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{systemInfo.headOffice}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Environment</span>
              <span className="font-mono text-emerald-600 uppercase font-bold">{systemInfo.environment}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
