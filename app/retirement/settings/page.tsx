"use client";

import React, { useState, useEffect } from "react";
import { Settings, ShieldCheck, Bell, Save, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    statutory_retirement_age: "60",
    alert_milestones: "5_YEARS,3_YEARS,1_YEAR,6_MONTHS",
    email_notifications: "enabled",
  });
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/retirement/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.systemInfo) setSystemInfo(data.systemInfo);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMessage(null);
    try {
      const res = await fetch("/api/retirement/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        setSavedMessage("Settings saved successfully.");
        setTimeout(() => setSavedMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-xs text-slate-500 animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
        <Settings size={20} className="text-amber-500" />
        <h2 className="text-xl font-bold tracking-tight">System Settings & Rules</h2>
      </div>

      {savedMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 size={16} />
          <span>{savedMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Statutory Retirement Age Rules */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
            Statutory Retirement Rule
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Statutory Pension Age</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value="60 Years"
                  disabled
                  className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                In accordance with Public Services Commission & Ghana Statutory Retirement Act, compulsory retirement age is fixed at 60 years.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Calculation Rule</label>
              <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                Retirement Date is dynamically computed as the exact date an employee turns 60 (DOB + 60 Years). All status tags (Active, Nearing, Due, Retired) update automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Milestone Alert Triggers */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
            Milestone Alert Configuration
          </h3>

          <div className="space-y-3 text-xs">
            <p className="text-slate-500">Configure automated alert triggers for HR Officers:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {["5_YEARS", "3_YEARS", "1_YEAR", "6_MONTHS"].map((ms) => (
                <label key={ms} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 cursor-pointer font-bold">
                  <input type="checkbox" defaultChecked className="rounded text-amber-500" />
                  <span>{ms.replace("_", " ")}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: System Environment Info */}
        {systemInfo && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              System Environment & Information
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Application Name</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{systemInfo.appName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Version</span>
                <span className="font-mono font-bold text-amber-600">{systemInfo.version}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Head Office</span>
                <span className="font-semibold">{systemInfo.headOffice}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Environment</span>
                <span className="font-mono text-emerald-600 uppercase font-bold">{systemInfo.environment}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
          >
            <Save size={16} />
            <span>{saving ? "Saving Settings..." : "Save Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
