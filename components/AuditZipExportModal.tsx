'use client';

import { useState, useEffect } from 'react';
import { Download, Archive, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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

  const [month, setMonth] = useState<string>('8');
  const [year, setYear] = useState<string>('2026');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [department, setDepartment] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');

  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/admin/branches')
      .then((res) => res.json())
      .then((data) => {
        if (data.branches) setBranches(data.branches);
      })
      .catch(() => {});
  }, [isOpen]);

  const handleDownload = async () => {
    setDownloading(true);

    try {
      const params = new URLSearchParams();
      if (month !== 'ALL') params.append('month', month);
      if (year !== 'ALL') params.append('year', year);
      if (selectedBranchId !== 'ALL') params.append('branchId', selectedBranchId);
      if (department !== 'ALL') params.append('department', department);
      if (status !== 'ALL') params.append('status', status);

      const res = await fetch(`/api/submissions/export-zip?${params.toString()}`);

      if (!res.ok) {
        throw new Error('Failed to generate zip file.');
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
      filename += `.zip`;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('ZIP package generated & downloaded successfully.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while generating ZIP archive.');
    } finally {
      setDownloading(false);
    }
  };

  const selectedBranchName =
    selectedBranchId === 'ALL'
      ? 'All Stations'
      : branches.find((b) => b.id === selectedBranchId)?.name || 'Selected Station';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Archive className="h-5 w-5 text-emerald-600" />
            <span>Download ZIP Files for Audit</span>
          </DialogTitle>
          <DialogDescription>
            Select target month, station, and department filters to generate a ZIP archive package.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Station */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Select Station</label>
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

          {/* Month & Year */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Select Month</label>
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
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Select Year</label>
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

          {/* Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Staff Category / Department</label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments & Staff Types</SelectItem>
                <SelectItem value="PERMANENT">Permanent Staff</SelectItem>
                <SelectItem value="CONTRACT">Contract Staff</SelectItem>
                <SelectItem value="LICENSING">Driver & Vehicle Licensing Dept</SelectItem>
                <SelectItem value="OPERATIONS">Vehicle Inspection & Operations</SelectItem>
                <SelectItem value="FINANCE">Finance & Accounts Dept</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Approval Status</label>
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

          {/* Summary Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <strong className="text-slate-900">Archive Scope:</strong>
            <div className="mt-1 text-slate-700 space-y-0.5">
              <div>• Station: <span className="font-semibold text-emerald-800">{selectedBranchName}</span></div>
              <div>• Period: <span className="font-semibold text-emerald-800">{month === 'ALL' ? 'All Months' : (['January','February','March','April','May','June','July','August','September','October','November','December'][parseInt(month) - 1] || month)}, {year}</span></div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {downloading ? (
              <>
                <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                <span>Creating Package...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                <span>Download ZIP Package</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
