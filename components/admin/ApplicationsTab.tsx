'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Building2,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

import { Application } from '@/lib/types/admin';

interface ApplicationsTabProps {
  applications: Application[];
  onSelectApplication: (id: number) => void;
  onBulkAction: (action: 'approve' | 'reject', ids: number[]) => void;
  onExportCSV: (items: Application[]) => void;
  loading: boolean;
}

export default function ApplicationsTab({
  applications,
  onSelectApplication,
  onBulkAction,
  onExportCSV,
  loading
}: ApplicationsTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter logic
  const filtered = applications.filter((app) => {
    // Status filter
    if (statusFilter !== 'all' && app.status !== statusFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const fullName = `${app.first_name} ${app.middle_name || ''} ${app.last_name}`.toLowerCase();
      const nss = (app.nss_number || '').toLowerCase();
      const email = (app.email || '').toLowerCase();
      const station = (app.posting_station || '').toLowerCase();
      const region = (app.region || '').toLowerCase();
      if (!fullName.includes(q) && !nss.includes(q) && !email.includes(q) && !station.includes(q) && !region.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    let aVal = (a as any)[sortField] || '';
    let bVal = (b as any)[sortField] || '';

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Bulk select handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginated.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="w-3.5 h-3.5" />
            Under Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Control Bar: Tabs & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 overflow-x-auto custom-scrollbar">
          {[
            { id: 'all', label: 'All Applications', count: applications.length },
            { id: 'pending', label: 'Pending', count: applications.filter((a) => a.status === 'pending').length },
            { id: 'under_review', label: 'In Review', count: applications.filter((a) => a.status === 'under_review').length },
            { id: 'approved', label: 'Approved', count: applications.filter((a) => a.status === 'approved').length },
            { id: 'rejected', label: 'Rejected', count: applications.filter((a) => a.status === 'rejected').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-[#0d5c2e] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  statusFilter === tab.id ? 'bg-emerald-900/60 text-emerald-100' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Export Buttons */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Table..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0d5c2e]"
            />
          </div>

          <button
            onClick={() => onExportCSV(filtered)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors shrink-0"
          >
            <Download className="w-4 h-4 text-[#0d5c2e]" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (when selected) */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-slate-900 animate-slide-in-right">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#0d5c2e]">{selectedIds.length}</span>
            <span className="font-medium text-slate-700">applications selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBulkAction('approve', selectedIds)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d5c2e] hover:bg-emerald-800 text-white font-bold shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              Bulk Approve
            </button>
            <button
              onClick={() => onBulkAction('reject', selectedIds)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs"
            >
              <X className="w-3.5 h-3.5" />
              Bulk Reject
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && paginated.every((a) => selectedIds.includes(a.id))}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-[#0d5c2e] focus:ring-[#0d5c2e] cursor-pointer"
                  />
                </th>
                <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('nss_number')}>
                  <div className="flex items-center gap-1">
                    NSS Number
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('first_name')}>
                  <div className="flex items-center gap-1">
                    Applicant Name
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4">Region / District</th>
                <th className="p-4">Assigned Station</th>
                <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">
                    Status
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center gap-1">
                    Submitted Date
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No applications matched your search or status filter.
                  </td>
                </tr>
              ) : (
                paginated.map((app) => {
                  const isSelected = selectedIds.includes(app.id);
                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-emerald-50/60' : ''
                      }`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(app.id)}
                          className="rounded border-slate-300 text-[#0d5c2e] focus:ring-[#0d5c2e] cursor-pointer"
                        />
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-800">{app.nss_number || 'N/A'}</td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">
                            {app.first_name} {app.middle_name || ''} {app.last_name}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">{app.email}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700 font-medium">
                        {app.region || 'National'} {app.district ? `(${app.district})` : ''}
                      </td>
                      <td className="p-4 text-slate-700">
                        {app.posting_station ? (
                          <div className="flex items-center gap-1.5 text-[#0d5c2e] font-bold">
                            <Building2 className="w-3.5 h-3.5 text-[#0d5c2e]" />
                            <span>{app.posting_station}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic font-medium">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4">{getStatusBadge(app.status)}</td>
                      <td className="p-4 text-slate-500 font-medium">{formatDate(app.created_at)}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => onSelectApplication(app.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d5c2e] hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 font-medium gap-4">
          <div>
            Showing <span className="font-bold text-slate-900">{paginated.length}</span> of{' '}
            <span className="font-bold text-slate-900">{sorted.length}</span> results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded-md bg-white border border-slate-200 font-bold text-slate-900 shadow-xs">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
