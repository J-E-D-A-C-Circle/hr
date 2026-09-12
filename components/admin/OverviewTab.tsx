'use client';

import React from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Building2,
  ArrowRight,
  ShieldCheck,
  Award,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Sparkles
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { AdminTabId } from './AdminSidebar';
import { Application } from '@/lib/types/admin';

interface StationStats {
  station: string;
  count: number;
}

interface OverviewTabProps {
  applications: Application[];
  onNavigateTab: (tab: AdminTabId) => void;
  onSelectApplication: (appId: number) => void;
  stationStats: StationStats[];
}

export default function OverviewTab({
  applications,
  onNavigateTab,
  onSelectApplication,
  stationStats
}: OverviewTabProps) {
  const total = applications.length;
  const pending = applications.filter((a) => a.status === 'pending').length;
  const underReview = applications.filter((a) => a.status === 'under_review').length;
  const approved = applications.filter((a) => a.status === 'approved').length;
  const rejected = applications.filter((a) => a.status === 'rejected').length;

  const pendingList = applications.filter((a) => a.status === 'pending').slice(0, 5);

  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d5c2e] via-emerald-800 to-teal-900 border border-emerald-700/50 p-6 md:p-8 shadow-lg text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-emerald-100 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>DVLA National Service Portal Command Center</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Executive Personnel Overview
            </h2>
            <p className="text-sm text-emerald-100/90 max-w-2xl font-medium">
              Monitor national service placements across DVLA head office and regional stations in real-time. Review pending applications and approve postings seamlessly.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab('applications')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-emerald-50 text-[#0d5c2e] font-extrabold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>Review Pending Desk</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Decorative background blur glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Applicants</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{total}</span>
            <span className="text-xs font-bold text-slate-500">100% Total Volume</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Pending Approval */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Review</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{pending + underReview}</span>
            <span className="text-xs font-bold text-amber-700">
              {total > 0 ? Math.round(((pending + underReview) / total) * 100) : 0}% Pending
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${total > 0 ? ((pending + underReview) / total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Approved Personnel */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Approved Personnel</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-[#0d5c2e] border border-emerald-200 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{approved}</span>
            <span className="text-xs font-bold text-[#0d5c2e]">{approvalRate}% Approved</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#0d5c2e] h-full rounded-full transition-all duration-500"
              style={{ width: `${approvalRate}%` }}
            />
          </div>
        </div>

        {/* Rejected Applications */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Rejected Applications</span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 group-hover:scale-110 transition-transform">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{rejected}</span>
            <span className="text-xs font-bold text-rose-700">
              {total > 0 ? Math.round((rejected / total) * 100) : 0}% Rejected
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${total > 0 ? (rejected / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Action Needed (Pending Queue) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Pending Action Items</h3>
                  <p className="text-xs text-slate-500 font-medium">Applications waiting for admin review & station placement</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('applications')}
                className="text-xs text-[#0d5c2e] hover:underline font-bold"
              >
                View All ({pending})
              </button>
            </div>

            {pendingList.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-sm font-medium">
                <CheckCircle2 className="w-8 h-8 text-[#0d5c2e] mx-auto mb-2" />
                All caught up! No pending applications requiring action.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingList.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 font-bold text-xs shrink-0">
                        {(app.first_name || 'A').charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-[#0d5c2e] transition-colors truncate">
                          {app.first_name} {app.middle_name || ''} {app.last_name}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-mono text-slate-700 font-semibold">{app.nss_number}</span>
                          <span>•</span>
                          <span>{app.region || 'Ghana'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                        {formatDate(app.created_at)}
                      </span>
                      <button
                        onClick={() => onSelectApplication(app.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#0d5c2e] hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Showing top {pendingList.length} urgent items</span>
            <button
              onClick={() => onNavigateTab('applications')}
              className="text-[#0d5c2e] font-bold hover:underline"
            >
              Open Full Applications Table →
            </button>
          </div>
        </div>

        {/* Station Deployment Stats */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-[#0d5c2e] border border-emerald-200">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Top DVLA Stations</h3>
                  <p className="text-xs text-slate-500 font-medium">Active personnel deployment</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('stations')}
                className="text-xs text-[#0d5c2e] font-bold hover:underline"
              >
                Manage
              </button>
            </div>

            {stationStats.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm font-medium">No station data available yet.</div>
            ) : (
              <div className="space-y-3">
                {stationStats.slice(0, 5).map((st, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 truncate">{st.station}</span>
                      <span className="font-extrabold text-[#0d5c2e]">{st.count} NSS</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#0d5c2e] h-full rounded-full"
                        style={{
                          width: `${approved > 0 ? Math.min(100, Math.round((st.count / approved) * 100)) : 0}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('personnel')}
              className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 text-center transition-colors"
            >
              Explore Full Personnel Directory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
