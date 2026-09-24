"use client";

import React, { useState, useEffect } from "react";
import { Settings, ShieldCheck, Bell, Save, CheckCircle2, Sliders, Server, Mail, UserCog } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    statutory_retirement_age: "60",
    alert_5years: true,
    alert_3years: true,
    alert_1year: true,
    alert_6months: true,
    email_notifications: true,
    daily_digest: false,
    default_staff_tab: "all",
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
    return <div className="p-8 text-xs text-slate-500 animate-pulse">Loading system settings...</div>;
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-2xl shadow-xs">
          <Settings size={22} />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            System Settings & Controls
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure statutory retirement rules, notification triggers, and portal preferences.
          </p>
        </div>
      </div>

      {savedMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-bold shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Statutory Retirement Age Rule */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Statutory Pension & Retirement Rule
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Statutory Retirement Age (Compulsory)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value="60 Years (Fixed)"
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Per Public Services Commission & Ghana Statutory Retirement Act, compulsory exit age is set at 60 years.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Default Staff Directory Tab</label>
              <Select
                value={settings.default_staff_tab}
                onValueChange={(val) => setSettings({ ...settings, default_staff_tab: val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Default View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff Directory</SelectItem>
                  <SelectItem value="due">Due This Year (&lt;1 Year)</SelectItem>
                  <SelectItem value="nearing">Nearing Retirement (1-5 Years)</SelectItem>
                  <SelectItem value="retired">Retired Staff Archive</SelectItem>
                  <SelectItem value="departments">Stations & Departments</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Sets the initial sub-tab displayed when opening the Staff Directory module.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Milestone Alert Triggers (Slider Switches) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Milestone Alert Triggers (Slider Switches)
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Auto-scan active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">5-Year Milestone Warning</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Alert HR when staff reach 5 years before exit</p>
              </div>
              <Switch
                checked={settings.alert_5years}
                onCheckedChange={(checked) => setSettings({ ...settings, alert_5years: checked })}
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">3-Year Milestone Warning</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Alert HR when staff reach 3 years before exit</p>
              </div>
              <Switch
                checked={settings.alert_3years}
                onCheckedChange={(checked) => setSettings({ ...settings, alert_3years: checked })}
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">1-Year Milestone Urgent Notice</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Trigger pension clearance workflow at 12 months</p>
              </div>
              <Switch
                checked={settings.alert_1year}
                onCheckedChange={(checked) => setSettings({ ...settings, alert_1year: checked })}
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">6-Month Critical Exit Trigger</p>
                <p className="text-[11px] text-slate-500 mt-0.5">High priority exit clearance processing</p>
              </div>
              <Switch
                checked={settings.alert_6months}
                onCheckedChange={(checked) => setSettings({ ...settings, alert_6months: checked })}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Email Notification Preferences */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Mail className="h-5 w-5 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Notification Preferences
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Email Notifications</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Send automated milestone alerts to HR email</p>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Daily Digest Email</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Daily summary report of upcoming exit dates</p>
              </div>
              <Switch
                checked={settings.daily_digest}
                onCheckedChange={(checked) => setSettings({ ...settings, daily_digest: checked })}
              />
            </div>
          </div>
        </div>

        {/* Card 4: System Environment Info */}
        {systemInfo && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Server className="h-5 w-5 text-slate-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                System Information
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Application</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{systemInfo.appName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Version</span>
                <span className="font-mono font-bold text-amber-600">{systemInfo.version}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Authority</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{systemInfo.headOffice}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Environment</span>
                <span className="font-mono text-emerald-600 uppercase font-bold">{systemInfo.environment}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Save size={16} />
            <span>{saving ? "Saving Settings..." : "Save Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
