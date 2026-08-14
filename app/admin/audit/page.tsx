'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Search,
  Filter,
  User,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Upload,
  Bell,
  Database,
  Terminal,
  RefreshCw,
  Archive,
} from 'lucide-react';
import AuditZipExportModal from '@/components/AuditZipExportModal';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId?: string;
  timestamp: string;
  metadata?: string;
  actor?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function AuditPage() {
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showZipModal, setShowZipModal] = useState(false);

  const [actionFilter, setActionFilter] = useState('ALL');
  const [targetTypeFilter, setTargetTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== 'HR_ADMIN') {
          router.push('/upload');
        } else {
          loadAuditLogs();
        }
      });
  }, [actionFilter, targetTypeFilter]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'ALL') params.append('action', actionFilter);
      if (targetTypeFilter !== 'ALL') params.append('targetType', targetTypeFilter);
      if (searchQuery) params.append('q', searchQuery);

      const res = await fetch(`/api/audit?${params.toString()}`);
      const data = await res.json();
      if (data.auditLogs) {
        setLogs(data.auditLogs);
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const actionBadges: Record<string, string> = {
    UPLOAD: 'bg-teal-50 text-teal-700 border-teal-200',
    APPROVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECT: 'bg-rose-50 text-rose-700 border-rose-200',
    RESUBMIT: 'bg-amber-50 text-amber-700 border-amber-200',
    REMINDER_SENT: 'bg-purple-50 text-purple-700 border-purple-200',
    OVERDUE_NOTICE_SENT: 'bg-rose-50 text-rose-700 border-rose-200',
    LOGIN: 'bg-blue-50 text-blue-700 border-blue-200',
    BULK_IMPORT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  const roleLabels: Record<string, string> = {
    STATION_MANAGER: 'Station Manager',
    BRANCH_HEAD: 'Station Manager',
    HR_ADMIN: 'HR Admin',
    ADMIN: 'HR Admin',
    SYSADMIN: 'HR Admin',
    EXEC: 'HR Admin',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Zip Export Modal */}
      <AuditZipExportModal isOpen={showZipModal} onClose={() => setShowZipModal(false)} />

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 border border-emerald-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 flex items-center gap-1.5 shadow-2xs">
              <ShieldAlert className="h-3.5 w-3.5 text-emerald-300" />
              Activity Log
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-normal">Audit Trail Log</h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 font-normal max-w-2xl mt-1">
            Complete history of form uploads, approvals, rejections, and user logins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowZipModal(true)}
            className="px-4 py-2.5 text-xs font-normal rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Archive className="h-4 w-4 text-emerald-200" />
            <span>Download Zip Files for Audit</span>
          </button>

          <button
            onClick={loadAuditLogs}
            className="px-4 py-2.5 text-xs font-normal rounded-xl bg-emerald-950/80 hover:bg-emerald-950 text-white border border-emerald-800 transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 text-emerald-300" />
            <span>Refresh Audit Log</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadAuditLogs()}
            placeholder="Search user, action, or station..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-normal text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none"
          />
        </div>

        {/* Action Filter */}
        <div className="space-y-1 min-w-[140px]">
          <label className="block text-[11px] text-slate-500 font-normal">Action</label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Actions</SelectItem>
              <SelectItem value="UPLOAD">Form Upload</SelectItem>
              <SelectItem value="APPROVE">Approved</SelectItem>
              <SelectItem value="REJECT">Needs Correction</SelectItem>
              <SelectItem value="REMINDER_SENT">Reminder Sent</SelectItem>
              <SelectItem value="LOGIN">User Login</SelectItem>
              <SelectItem value="BULK_IMPORT">Bulk Import</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Target Type Filter */}
        <div className="space-y-1 min-w-[140px]">
          <label className="block text-[11px] text-slate-500 font-normal">Target Type</label>
          <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Targets</SelectItem>
              <SelectItem value="SUBMISSION">Form Submissions</SelectItem>
              <SelectItem value="BRANCH">Stations</SelectItem>
              <SelectItem value="USER">User Accounts</SelectItem>
              <SelectItem value="SYSTEM">System Process</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <th className="p-4 min-w-[160px]">Timestamp</th>
              <th className="p-4 min-w-[180px]">Actor</th>
              <th className="p-4">Action</th>
              <th className="p-4">Target Type</th>
              <th className="p-4">Metadata Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                  No audit log entries matching filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                let parsedMeta = null;
                if (log.metadata) {
                  try {
                    parsedMeta = JSON.parse(log.metadata);
                  } catch {
                    parsedMeta = log.metadata;
                  }
                }

                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-slate-600 whitespace-nowrap font-medium">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 text-slate-800">
                      {log.actor ? (
                        <div>
                          <div className="font-bold font-sans text-slate-900">{log.actor.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {log.actor.email} ({roleLabels[log.actor.role] || log.actor.role})
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-sans">System Process</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border font-sans ${
                          actionBadges[log.action] || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 font-sans font-bold">{log.targetType}</td>
                    <td className="p-4 text-slate-600 text-[11px] max-w-md">
                      {parsedMeta ? (
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-indigo-900 font-mono text-[10px] overflow-x-auto">
                          {JSON.stringify(parsedMeta, null, 1)}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
