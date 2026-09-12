'use client';

import React from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Building,
  Award,
  Globe,
  Printer,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';

import { Application } from '@/lib/types/admin';

interface AnalyticsTabProps {
  applications: Application[];
  onExportCSV: (items: Application[]) => void;
}

export default function AnalyticsTab({ applications, onExportCSV }: AnalyticsTabProps) {
  const total = applications.length;
  const approved = applications.filter((a) => a.status === 'approved').length;
  const pending = applications.filter((a) => a.status === 'pending').length;
  const rejected = applications.filter((a) => a.status === 'rejected').length;
  const underReview = applications.filter((a) => a.status === 'under_review').length;

  // Region Breakdown
  const regionCounts: Record<string, number> = {};
  applications.forEach((a) => {
    const reg = a.region || 'Greater Accra';
    regionCounts[reg] = (regionCounts[reg] || 0) + 1;
  });

  const topRegions = Object.entries(regionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Institution Breakdown
  const institutionCounts: Record<string, number> = {};
  applications.forEach((a) => {
    const inst = a.institution_name || 'University of Ghana';
    institutionCounts[inst] = (institutionCounts[inst] || 0) + 1;
  });

  const topInstitutions = Object.entries(institutionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d5c2e] to-teal-900 border border-emerald-700/50 shadow-md text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-emerald-300" />
            <h2 className="text-xl font-extrabold text-white">Analytics & Executive Intelligence</h2>
          </div>
          <p className="text-xs text-emerald-100/90 font-medium">
            Real-time demographic and performance metrics for DVLA National Service Intake.
          </p>
        </div>

        <button
          onClick={() => onExportCSV(applications)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-[#0d5c2e] font-extrabold text-xs transition-all shadow-md"
        >
          <Download className="w-4 h-4 text-[#0d5c2e]" />
          Export Executive Report
        </button>
      </div>

      {/* Grid: Status Distribution & Regional Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Velocity & Distribution */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#0d5c2e]" />
              <h3 className="text-base font-extrabold text-slate-900">Application Status Breakdown</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono font-bold">Total: {total}</span>
          </div>

          {/* Progress Visual Bars */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-[#0d5c2e] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                </span>
                <span className="font-extrabold text-slate-900">
                  {approved} ({total > 0 ? Math.round((approved / total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-[#0d5c2e] h-full rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (approved / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                  <Clock className="w-3.5 h-3.5" /> Pending
                </span>
                <span className="font-extrabold text-slate-900">
                  {pending} ({total > 0 ? Math.round((pending / total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (pending / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-sky-700 font-bold">
                  <Clock className="w-3.5 h-3.5" /> Under Review
                </span>
                <span className="font-extrabold text-slate-900">
                  {underReview} ({total > 0 ? Math.round((underReview / total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (underReview / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-rose-700 font-bold">
                  <XCircle className="w-3.5 h-3.5" /> Rejected
                </span>
                <span className="font-extrabold text-slate-900">
                  {rejected} ({total > 0 ? Math.round((rejected / total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (rejected / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Regional Distribution */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-700" />
              <h3 className="text-base font-extrabold text-slate-900">Regional Origin Allocation</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Top Regions</span>
          </div>

          <div className="space-y-3">
            {topRegions.length === 0 ? (
              <div className="text-slate-400 text-xs py-8 text-center font-medium">No regional data</div>
            ) : (
              topRegions.map(([reg, count], idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="font-bold text-slate-800">{reg}</span>
                    <span className="font-extrabold text-[#0d5c2e]">{count} Applicants</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0d5c2e] h-full rounded-full"
                      style={{ width: `${total > 0 ? Math.round((count / total) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Institutions Grid */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Building className="w-5 h-5 text-amber-700" />
          <h3 className="text-base font-extrabold text-slate-900">Top Participating Institutions</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {topInstitutions.map(([inst, count], idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 truncate max-w-[160px]">{inst}</h4>
                <span className="text-[11px] text-slate-500 font-medium">Tertiary Institution</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#0d5c2e] border border-emerald-200 font-extrabold text-xs">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
