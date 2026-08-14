'use client';

import { useState, useEffect } from 'react';
import {
  Download,
  X,
  Archive,
  Calendar,
  Filter,
  Users,
  Building,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface AuditZipExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuditZipExportModal({ isOpen, onClose }: AuditZipExportModalProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Specific Filters requested by user: Month, Station, Department
  const [month, setMonth] = useState<string>('8'); // August default
  const [year, setYear] = useState<string>('2026');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [department, setDepartment] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Fetch branches on open
  useEffect(() => {
    if (!isOpen) return;
    setLoadingBranches(true);
    fetch('/api/admin/branches')
      .then((res) => res.json())
      .then((data) => {
        if (data.branches) setBranches(data.branches);
        setLoadingBranches(false);
      })
      .catch(() => setLoadingBranches(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);

    try {
      const params = new URLSearchParams();
      if (month !== 'ALL') params.append('month', month);
      if (year !== 'ALL') params.append('year', year);
      if (selectedBranchId !== 'ALL') params.append('branchId', selectedBranchId);
      if (department !== 'ALL') params.append('department', department);
      if (status !== 'ALL') params.append('status', status);

      const res = await fetch(`/api/submissions/export-zip?${params.toString()}`);

      if (!res.ok) {
        throw new Error('Failed to generate zip file. Please try again.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      let filename = 'Audit_Records';
      if (selectedBranchId !== 'ALL') {
        const bCode = branches.find((b) => b.id === selectedBranchId)?.code || 'Station';
        filename += `_${bCode}`;
      }
      if (month !== 'ALL') filename += `_Month${month}`;
      if (year !== 'ALL') filename += `_${year}`;
      if (department !== 'ALL') filename += `_${department}`;
      filename += `.zip`;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (err: any) {
      setDownloadError(err.message || 'An error occurred while preparing your zip download.');
    } finally {
      setDownloading(false);
    }
  };

  const selectedBranchName =
    selectedBranchId === 'ALL'
      ? 'All Stations'
      : branches.find((b) => b.id === selectedBranchId)?.name || 'Selected Station';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-6 flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-800 text-emerald-200 border border-emerald-700">
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-normal text-white">Download Zip Files for Audit</h3>
              <p className="text-xs text-emerald-200/80">
                Select month, station, and department to download files for audit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-200 hover:bg-emerald-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {downloadError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-normal flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{downloadError}</span>
            </div>
          )}

          {/* 1. Station Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-normal text-slate-700">Select Station *</label>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="Select station branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Stations</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}{b.code ? ` (${b.code})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Month & Year Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-normal text-slate-700">Select Month *</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Months</SelectItem>
                  {[
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ].map((m, idx) => (
                    <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                      {m} ({idx + 1})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-normal text-slate-700">Select Year *</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Years</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3. Department / Staff Category Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-normal text-slate-700">Select Department / Staff Type *</label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments & Staff Types</SelectItem>
                <SelectItem value="PERMANENT">Permanent Staff</SelectItem>
                <SelectItem value="CONTRACT">Contract Staff</SelectItem>
                <SelectItem value="BOTH">Both Permanent & Contract Staff</SelectItem>
                <SelectItem value="LICENSING">Driver & Vehicle Licensing Dept</SelectItem>
                <SelectItem value="OPERATIONS">Vehicle Inspection & Operations</SelectItem>
                <SelectItem value="FINANCE">Finance & Accounts Dept</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4. Approval Status Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-normal text-slate-700">Approval Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="APPROVED">Approved Records Only</SelectItem>
                <SelectItem value="PENDING">Pending Review Only</SelectItem>
                <SelectItem value="REJECTED">Needs Correction Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Info Summary Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            📁 <strong className="text-slate-800">Selected Filter Package:</strong>
            <div className="mt-1 text-slate-700 font-normal space-y-0.5">
              <div>• Station: <span className="font-semibold text-emerald-900">{selectedBranchName}</span></div>
              <div>• Period: <span className="font-semibold text-emerald-900">{month === 'ALL' ? 'All Months' : `Month ${month}`}, {year}</span></div>
              <div>• Department / Staff: <span className="font-semibold text-emerald-900">{department === 'ALL' ? 'All Departments' : department}</span></div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-normal transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={downloading}
            onClick={handleDownload}
            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-normal transition shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {downloading ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" />
                <span>Creating Zip File...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download Zip File</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
