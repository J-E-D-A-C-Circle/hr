'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Building2,
  FileText,
  Printer,
  Award,
  CheckCircle2,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

import { Application } from '@/lib/types/admin';
import ShadcnSelect from '@/components/ui/ShadcnSelect';

interface PersonnelTabProps {
  applications: Application[];
  onSelectApplication: (id: number) => void;
  onExportCSV: (items: Application[]) => void;
}

export default function PersonnelTab({
  applications,
  onSelectApplication,
  onExportCSV
}: PersonnelTabProps) {
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const approvedPersonnel = applications.filter((a) => a.status === 'approved');

  // Unique list of assigned stations
  const stationsSet = new Set<string>();
  approvedPersonnel.forEach((p) => {
    if (p.posting_station) stationsSet.add(p.posting_station);
  });
  const stations = Array.from(stationsSet);

  const stationOptions = [
    { value: 'all', label: 'All Stations', badge: approvedPersonnel.length },
    ...stations.map((st) => ({
      value: st,
      label: st,
      badge: approvedPersonnel.filter((p) => p.posting_station === st).length,
    })),
  ];

  const filteredPersonnel = approvedPersonnel.filter((person) => {
    if (selectedStation !== 'all' && person.posting_station !== selectedStation) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const fullName = `${person.first_name} ${person.middle_name || ''} ${person.last_name}`.toLowerCase();
      const nss = (person.nss_number || '').toLowerCase();
      const email = (person.email || '').toLowerCase();
      const station = (person.posting_station || '').toLowerCase();
      if (!fullName.includes(q) && !nss.includes(q) && !email.includes(q) && !station.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-[#0d5c2e] border border-emerald-200">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{approvedPersonnel.length}</span>
            <p className="text-xs text-slate-500 font-medium">Total Posted Personnel</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{stations.length}</span>
            <p className="text-xs text-slate-500 font-medium">Active Deployment Stations</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">2026/2027</span>
            <p className="text-xs text-slate-500 font-medium">Service Year</p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Station Selector with ShadcnSelect */}
          <div className="w-full sm:w-64">
            <ShadcnSelect
              options={stationOptions}
              value={selectedStation}
              onChange={setSelectedStation}
              placeholder="Filter by Station..."
            />
          </div>

          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search personnel roster..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0d5c2e]"
            />
          </div>
        </div>

        <button
          onClick={() => onExportCSV(filteredPersonnel)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 border border-slate-200 transition-colors"
        >
          <Download className="w-4 h-4 text-[#0d5c2e]" />
          Export Personnel Roster
        </button>
      </div>

      {/* Personnel Grid / Roster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPersonnel.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-400 text-sm font-medium">
            No active personnel match your selected filters.
          </div>
        ) : (
          filteredPersonnel.map((person) => (
            <div
              key={person.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#0d5c2e]/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0d5c2e] to-emerald-700 flex items-center justify-center font-black text-white text-sm shadow">
                      {(person.first_name || 'A').charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#0d5c2e] transition-colors">
                        {person.first_name} {person.middle_name || ''} {person.last_name}
                      </h4>
                      <span className="text-xs font-mono text-[#0d5c2e] font-bold">{person.nss_number}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-50 text-[#0d5c2e] border border-emerald-200">
                    Active
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-700 font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Station:</span>
                    <span className="font-bold text-slate-900 truncate">{person.posting_station || 'Head Office'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-semibold text-slate-700 truncate">{person.posting_department || 'General Admin'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-slate-500 truncate">{person.email}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  Approved: {person.reviewed_at ? formatDate(person.reviewed_at) : 'Recent'}
                </span>
                <button
                  onClick={() => onSelectApplication(person.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d5c2e] hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Dossier & Letter
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
