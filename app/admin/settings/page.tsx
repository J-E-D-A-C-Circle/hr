"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  CheckCircle,
  AlertCircle,
  Building2,
  ShieldAlert,
  Loader2,
  Database,
  Download,
  Calendar,
  Clock,
  RefreshCw,
  HardDrive,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Settings states
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

  // Backup vault states
  const [backups, setBackups] = useState<any[]>([]);
  const [backupSchedule, setBackupSchedule] = useState<any>(null);

  const fetchSettingsAndBackups = async () => {
    try {
      setLoading(true);
      const [settingsRes, backupRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/admin/backup"),
      ]);

      const settingsData = await settingsRes.json();
      const backupData = await backupRes.json();

      if (settingsData.success && settingsData.settings) {
        if (settingsData.settings.tempstaff) {
          setTempstaff({
            ssnit_employee_rate: String(settingsData.settings.tempstaff.ssnit_employee_rate || "5.5"),
            ssnit_employer_rate: String(settingsData.settings.tempstaff.ssnit_employer_rate || "13.0"),
            petra_employee_rate: String(settingsData.settings.tempstaff.petra_employee_rate || "5.0"),
            petra_employer_rate: String(settingsData.settings.tempstaff.petra_employer_rate || "5.0"),
          });
        }
        if (settingsData.settings.retirement) {
          setRetirement({
            noticeWindowDays: String(settingsData.settings.retirement.noticeWindowDays || "365"),
            defaultRetirementAge: String(settingsData.settings.retirement.defaultRetirementAge || "60"),
            maintenanceMode: String(settingsData.settings.retirement.maintenanceMode || "false"),
          });
        }
      }

      if (backupData.success) {
        setBackups(backupData.backups || []);
        setBackupSchedule(backupData.schedule || null);
      }
    } catch {
      console.error("Failed to load settings or backups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndBackups();
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

  const handleTriggerBackup = async () => {
    setBackupLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: `Instant database backup created: ${data.backup.fileName}` });
        fetchSettingsAndBackups();
      } else {
        setMessage({ type: "error", text: data.error || "Backup generation failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to trigger instant backup." });
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold uppercase tracking-wider">
            <Settings className="w-4 h-4 text-cyan-400" /> CMS Engine & Database Vault
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Rules & Database Backups</h1>
          <p className="text-xs text-slate-400">
            Configure statutory SSNIT deduction rates, retirement alert windows, and bi-weekly automated database backups.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {message.text}
          </div>
        </div>
      )}

      {/* DATABASE BACKUP VAULT & BI-WEEKLY SCHEDULE SECTION */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-5 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Automated Bi-Weekly Database Vault
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated 14-day database snapshot schedule with instant SQL download archive.
            </p>
          </div>

          <button
            onClick={handleTriggerBackup}
            disabled={backupLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
          >
            {backupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
            Generate Instant Database Backup
          </button>
        </div>

        {/* Schedule KPI status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Automated Schedule
            </div>
            <div className="text-sm font-bold text-white">Bi-Weekly (Every 14 Days)</div>
            <p className="text-[11px] text-slate-500">Scheduled at Midnight GMT</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> Next Automated Snapshot
            </div>
            <div className="text-sm font-bold text-cyan-400">
              {backupSchedule?.nextBackup
                ? new Date(backupSchedule.nextBackup).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Scheduled"}
            </div>
            <p className="text-[11px] text-slate-500">Auto-clean 90-day retention</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Database className="w-3.5 h-3.5 text-emerald-400" /> Backup Vault Storage
            </div>
            <div className="text-sm font-bold text-emerald-400">
              {backups.length} SQL Snapshot Files
            </div>
            <p className="text-[11px] text-slate-500">Available for instant download</p>
          </div>
        </div>

        {/* Backups List Table */}
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 text-xs font-semibold text-slate-300">
            Available SQL Backup Archive Files
          </div>

          <div className="divide-y divide-slate-800/60 font-mono text-xs">
            {backups.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-sans text-xs">
                No backup snapshots stored yet. Click "Generate Instant Database Backup" above to create one now.
              </div>
            ) : (
              backups.map((b) => (
                <div key={b.fileName} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-900/40 transition">
                  <div>
                    <div className="font-semibold text-white font-mono text-xs">{b.fileName}</div>
                    <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                      Created on {new Date(b.createdAt).toLocaleString("en-GB")} • Size: <b className="text-cyan-400">{b.sizeFormatted}</b>
                    </div>
                  </div>

                  <a
                    href={`/api/admin/backup/download?file=${encodeURIComponent(b.fileName)}`}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-sans font-semibold transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download SQL
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

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
