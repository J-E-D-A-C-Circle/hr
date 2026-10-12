'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ToggleLeft, ToggleRight, Lock, Unlock, AlertTriangle } from 'lucide-react';

interface IntakeStatusToggleProps {
  className?: string;
  compact?: boolean;
}

export default function IntakeStatusToggle({ className = '', compact = false }: IntakeStatusToggleProps) {
  const [closed, setClosed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchStatus = async () => {
    try {
      const res = await axios.get('/api/portal-settings');
      setClosed(Boolean(res.data?.applicationsClosed));
    } catch (err) {
      console.warn('Failed to load portal intake status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggle = async () => {
    if (updating) return;
    const nextState = !closed;
    setUpdating(true);
    try {
      await axios.post('/api/portal-settings', { applicationsClosed: nextState });
      setClosed(nextState);
      if (nextState) {
        toast.success(
          'Applications intake CLOSED! Registrations are now blocked on /register.',
          { duration: 4000 }
        );
      } else {
        toast.success(
          'Applications intake OPENED! Registrations are now active.',
          { duration: 4000 }
        );
      }
    } catch (err: any) {
      toast.error('Failed to update intake status: ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400 font-medium ${className}`}>
        <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
        <span>Checking intake...</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={updating}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer select-none active:scale-95 disabled:opacity-50 ${
        closed
          ? 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300'
          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300'
      } ${className}`}
      title={
        closed
          ? 'Intake is CLOSED (Click to open registrations)'
          : 'Intake is OPEN (Click to close registrations)'
      }
    >
      <span className="flex items-center gap-1.5">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            closed ? 'bg-rose-600' : 'bg-emerald-600 animate-pulse'
          }`}
        />
        <span className="text-[11px] sm:text-xs">
          <span className="hidden sm:inline">Intake: </span>
          <strong className={closed ? 'text-rose-700' : 'text-[#008053]'}>{closed ? 'CLOSED' : 'OPEN'}</strong>
        </span>
      </span>

      {/* Pill Toggle Graphic */}
      <div
        className={`w-8 h-4.5 rounded-full flex items-center p-0.5 transition-colors ${
          closed ? 'bg-rose-600 justify-end' : 'bg-[#008053] justify-start'
        }`}
      >
        <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
      </div>
    </button>
  );
}
