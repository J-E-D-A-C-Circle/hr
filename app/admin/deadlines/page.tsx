'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Calendar,
  Save,
  ShieldCheck,
} from 'lucide-react';

export default function DeadlinesPage() {
  const router = useRouter();

  const [cutoffDay, setCutoffDay] = useState(21);
  const [reminderDays, setReminderDays] = useState(3);
  const [loading, setLoading] = useState(true);

  const [saveSuccess, setSaveSuccess] = useState('');
  const [triggerMsg, setTriggerMsg] = useState('');
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== 'HR_ADMIN') {
          router.push('/upload');
        } else {
          loadDeadlineConfig();
        }
      });
  }, []);

  const loadDeadlineConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/deadlines');
      const data = await res.json();
      if (data.config) {
        setCutoffDay(data.config.cutoffDayOfMonth);
        setReminderDays(data.config.reminderDaysBefore);
      }
    } catch (e) {
      console.error('Failed to load deadline config:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess('');

    try {
      const res = await fetch('/api/admin/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cutoffDayOfMonth: cutoffDay, reminderDaysBefore: reminderDays }),
      });

      const data = await res.json();
      if (res.ok) {
        setSaveSuccess('Deadline settings saved successfully! Cutoff is set to day ' + cutoffDay + '.');
      } else {
        alert(data.error || 'Failed to save deadline settings');
      }
    } catch {
      alert('Error updating deadline settings');
    }
  };

  const handleTriggerReminders = async () => {
    setTriggering(true);
    setTriggerMsg('');

    try {
      const res = await fetch('/api/admin/reminders', {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok) {
        setTriggerMsg(data.message);
      } else {
        alert(data.error || 'Failed to dispatch reminders');
      }
    } catch {
      alert('Error triggering reminder engine');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 border border-emerald-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 flex items-center gap-1.5 shadow-2xs">
              <Clock className="h-3.5 w-3.5 text-emerald-300" />
              Automated Notification Rules
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-normal">Deadlines & Reminder Engine</h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 font-normal max-w-2xl mt-1">
            Configure monthly cutoff date, pre-cutoff reminders (T-3 days), overdue notice triggers, and automated notification logging.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Deadline Settings Form */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Monthly Cutoff Settings</h2>
                <p className="text-xs text-slate-500">Default cutoff is the 21st of each month</p>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{saveSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-2">
                  Monthly Cutoff Day (1 - 31)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    value={cutoffDay}
                    onChange={(e) => setCutoffDay(parseInt(e.target.value))}
                    className="w-32 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-bold focus:bg-white focus:border-purple-600 focus:outline-none"
                  />
                  <span className="text-slate-600 font-medium">st / th of each month</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Submissions received after this day are flagged as Overdue on the Executive Compliance Matrix.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-2">
                  Lead Days for Automated Reminders (T-Minus Days)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={15}
                    required
                    value={reminderDays}
                    onChange={(e) => setReminderDays(parseInt(e.target.value))}
                    className="w-32 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-bold focus:bg-white focus:border-purple-600 focus:outline-none"
                  />
                  <span className="text-slate-600 font-medium">days before cutoff</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Station managers with unsubmitted validations will receive automated notifications on day {cutoffDay - reminderDays}.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Deadline Configuration</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Trigger Manual/Automated Reminders */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Manual & Scheduled Reminder Trigger</h2>
                <p className="text-xs text-slate-500">Dispatch reminder notifications to unsubmitted stations</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              Clicking below will scan all 50+ station branches, identify any station managers who have not submitted for the current cycle, send reminder notices, and log each action to the central Audit Log.
            </p>

            {triggerMsg && (
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                <span>{triggerMsg}</span>
              </div>
            )}

            <button
              onClick={handleTriggerReminders}
              disabled={triggering}
              className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
              <span>{triggering ? 'Dispatching Notifications...' : 'Trigger Automated Reminders Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
