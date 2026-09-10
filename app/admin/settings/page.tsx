"use client";

import React, { useState, useEffect } from "react";
import { Settings, Save, CheckCircle, AlertCircle, Building2, ShieldAlert, Loader2 } from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [tempstaff, setTempstaff] = useState({
    ssnit_employee_rate: "5.5",
    ssnit_employer_rate: "13.0",
    petra_employee_rate: "5.0",
    petra_employer_rate: "5.0",
  });

  const [retirement, setRetirement] = useState({
    noticeWindowDays: "365",
    defaultRetirementAge: "60",
    maintenanceMode: "false",
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          if (data.settings.tempstaff) {
            setTempstaff({
              ssnit_employee_rate: String(data.settings.tempstaff.ssnit_employee_rate || "5.5"),
              ssnit_employer_rate: String(data.settings.tempstaff.ssnit_employer_rate || "13.0"),
              petra_employee_rate: String(data.settings.tempstaff.petra_employee_rate || "5.0"),
              petra_employer_rate: String(data.settings.tempstaff.petra_employer_rate || "5.0"),
            });
          }
          if (data.settings.retirement) {
            setRetirement({
              noticeWindowDays: String(data.settings.retirement.noticeWindowDays || "365"),
              defaultRetirementAge: String(data.settings.retirement.defaultRetirementAge || "60"),
              maintenanceMode: String(data.settings.retirement.maintenanceMode || "false"),
            });
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempstaff, retirement }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: "Global system settings updated successfully." });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update settings" });
      }
    } catch {
      setMessage({ type: "error", text: "Connection error while saving settings." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold uppercase tracking-wider">
            <Settings className="w-4 h-4 text-cyan-400" /> CMS Engine
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Rules & Global Settings</h1>
          <p className="text-xs text-slate-400">
            Configure statutory SSNIT deduction rates, retirement alert windows, and maintenance mode toggles.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-cyan-400 mb-2" />
          Loading settings...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* TempStaff Deduction CMS Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4 backdrop-blur-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Building2 className="w-4 h-4 text-emerald-400" />
              TempStaff Statutory & Pension Deduction Rates
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">SSNIT Employee Tier 1 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={tempstaff.ssnit_employee_rate}
                  onChange={(e) => setTempstaff({ ...tempstaff, ssnit_employee_rate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">SSNIT Employer Tier 1 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={tempstaff.ssnit_employer_rate}
                  onChange={(e) => setTempstaff({ ...tempstaff, ssnit_employer_rate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Petra Pension Tier 3 Employee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={tempstaff.petra_employee_rate}
                  onChange={(e) => setTempstaff({ ...tempstaff, petra_employee_rate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Petra Pension Tier 3 Employer (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={tempstaff.petra_employer_rate}
                  onChange={(e) => setTempstaff({ ...tempstaff, petra_employer_rate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Retirement Rules CMS Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4 backdrop-blur-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              Retirement System Parameters & Alerts
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Retirement Notice Window (Days)</label>
                <input
                  type="number"
                  value={retirement.noticeWindowDays}
                  onChange={(e) => setRetirement({ ...retirement, noticeWindowDays: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Default Mandatory Retirement Age (Years)</label>
                <input
                  type="number"
                  value={retirement.defaultRetirementAge}
                  onChange={(e) => setRetirement({ ...retirement, defaultRetirementAge: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save All Configuration Settings
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
