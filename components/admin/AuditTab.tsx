'use client';

import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, User, Clock, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { formatDateTime } from '@/lib/utils';
import { getValidAuthToken } from '@/lib/auth-client';

interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: number;
  details: string;
  created_at: string;
}

export default function AuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = getValidAuthToken();
      const res = await axios.get('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.logs) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.user_name || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.details || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d5c2e] to-teal-900 border border-emerald-700/50 shadow-md text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-emerald-300" />
            <h2 className="text-xl font-extrabold text-white">Audit & System Activity Logs</h2>
          </div>
          <p className="text-xs text-emerald-100/90 font-medium">
            Immutable tracking log of administrative reviews, status approvals, and station assignment modifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter logs..."
            className="px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0d5c2e]"
          />
          <button
            onClick={fetchLogs}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0d5c2e]' : 'text-slate-600'}`} />
          </button>
        </div>
      </div>

      {/* Logs Container */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0d5c2e] mx-auto mb-2" />
            Loading audit records...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            No audit records logged yet. Activity logs will appear automatically as administrators perform review actions.
          </div>
        ) : (
          <div className="relative border-l border-slate-200 ml-4 space-y-6">
            {filteredLogs.map((log) => (
              <div key={log.id} className="relative pl-6 group">
                {/* Timeline Dot */}
                <div className="absolute -left-2.5 top-1.5 w-5 h-5 rounded-full bg-white border-2 border-[#0d5c2e] flex items-center justify-center shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-[#0d5c2e]" />
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900">{log.user_name || 'System Admin'}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-50 text-[#0d5c2e] border border-emerald-200">
                        {log.action}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
