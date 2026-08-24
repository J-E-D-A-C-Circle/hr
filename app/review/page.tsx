'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Archive,
  ClipboardCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Building2,
  Calendar,
  Filter,
} from 'lucide-react';
import AuditZipExportModal from '@/components/AuditZipExportModal';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface Submission {
  id: string;
  month: number;
  year: number;
  status: string;
  staffType?: string;
  fileName: string;
  fileSize: number;
  note?: string;
  uploadedAt: string;
  reviewerNotes?: string;
  reviewedAt?: string;
  ocrPassed?: boolean;
  branch: {
    id: string;
    name: string;
    code: string;
    region: { id: string; name: string };
  };
  uploadedBy: { name: string; email: string };
  reviewer?: { name: string; email: string };
}

export default function ReviewPage() {
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [staffTypeFilter, setStaffTypeFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('8');
  const [yearFilter, setYearFilter] = useState('2026');

  // Zip Archive Modal
  const [showZipModal, setShowZipModal] = useState(false);

  // Selected Submission for Split View
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  // Review action modal state
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== 'HR_ADMIN') {
          router.push('/upload');
        } else {
          loadSubmissions();
          loadRegions();
        }
      });
  }, [statusFilter, staffTypeFilter, regionFilter, monthFilter, yearFilter]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (staffTypeFilter !== 'ALL') params.append('staffType', staffTypeFilter);
      if (regionFilter !== 'ALL') params.append('regionId', regionFilter);
      if (monthFilter !== 'ALL') params.append('month', monthFilter);
      if (yearFilter !== 'ALL') params.append('year', yearFilter);
      if (searchQuery) params.append('q', searchQuery);

      const res = await fetch(`/api/submissions?${params.toString()}`);
      const data = await res.json();
      if (data.submissions) {
        setSubmissions(data.submissions);
        if (data.submissions.length > 0 && !selectedSub) {
          setSelectedSub(data.submissions[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load submissions:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadRegions = async () => {
    try {
      const res = await fetch('/api/admin/branches');
      const data = await res.json();
      if (data.regions) setRegions(data.regions);
    } catch (e) {
      console.error('Failed to load regions:', e);
    }
  };

  const handleReviewAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedSub) return;
    if (action === 'REJECT' && !reviewNotes.trim()) {
      setActionError('Please enter a note explaining why this document needs correction.');
      setRejecting(true);
      return;
    }

    setActionLoading(true);
    setActionError('');

    try {
      const res = await fetch(`/api/submissions/${selectedSub.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reviewerNotes: reviewNotes }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to submit review');
      } else {
        setReviewNotes('');
        setRejecting(false);
        loadSubmissions();
        if (data.submission) {
          setSelectedSub(data.submission);
        }
      }
    } catch {
      setActionError('Network error executing review action');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Zip Archive Modal */}
      <AuditZipExportModal isOpen={showZipModal} onClose={() => setShowZipModal(false)} />

      {/* Top Header Card */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 border border-emerald-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 flex items-center gap-1.5 shadow-2xs">
              <ClipboardCheck className="h-3.5 w-3.5 text-emerald-300" />
              HR Review Desk
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-normal">Review Queue</h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 font-normal max-w-2xl mt-1">
            Check and approve payroll validation forms submitted by station managers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowZipModal(true)}
            className="px-4 py-2.5 text-xs font-normal rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Archive className="h-4 w-4 text-emerald-200" />
            <span>Download Zip Files for Audit</span>
          </button>

          <button
            onClick={loadSubmissions}
            className="px-4 py-2.5 text-xs font-normal rounded-xl bg-emerald-950/80 hover:bg-emerald-950 text-white border border-emerald-800 transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 text-emerald-300" />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Filter Bar with Shadcn UI Select Components */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadSubmissions()}
            placeholder="Search station name or code..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-normal text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none transition"
          />
        </div>

        {/* Staff Type Segregation Filter */}
        <div className="space-y-1 min-w-[150px]">
          <label className="block text-[11px] font-normal text-slate-500">Staff Category</label>
          <Select value={staffTypeFilter} onValueChange={setStaffTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Staff type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Staff</SelectItem>
              <SelectItem value="PERMANENT">Permanent Staff</SelectItem>
              <SelectItem value="CONTRACT">Contract Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-1 min-w-[140px]">
          <label className="block text-[11px] font-normal text-slate-500">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Needs Resubmission</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Region Filter */}
        <div className="space-y-1 min-w-[130px]">
          <label className="block text-[11px] font-normal text-slate-500">Region</label>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Regions</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Month Filter */}
        <div className="space-y-1 min-w-[120px]">
          <label className="block text-[11px] font-normal text-slate-500">Month</label>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Months</SelectItem>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  Month {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Split View Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Submissions Queue Table (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-emerald-900 text-white flex items-center justify-between border-b border-emerald-800">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Submissions Queue ({submissions.length})
              </span>
              <span className="text-xs text-emerald-200/80 font-normal">Click to preview document</span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs font-bold text-slate-600">Loading submission queue...</div>
            ) : submissions.length === 0 ? (
              <div className="py-16 text-center text-xs font-semibold text-slate-500">No submissions matching filters.</div>
            ) : (
              <div className="divide-y divide-slate-200 max-h-[680px] overflow-y-auto">
                {submissions.map((sub) => {
                  const isSelected = selectedSub?.id === sub.id;
                  let parsedNote: any = {};
                  try {
                    if (sub.note && sub.note.startsWith('{')) {
                      parsedNote = JSON.parse(sub.note);
                    }
                  } catch (e) {}

                  const staffCategory = sub.staffType || parsedNote.staffType || 'PERMANENT';

                  return (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSub(sub)}
                      className={`p-4 cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-50/90 border-l-4 border-emerald-600 shadow-2xs'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">{sub.branch.name}</span>
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {sub.branch.code}
                          </span>
                          {/* Staff Category Badge */}
                          <span
                            className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${
                              staffCategory === 'CONTRACT'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : staffCategory === 'BOTH'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : 'bg-teal-50 text-teal-800 border-teal-200'
                            }`}
                          >
                            {staffCategory === 'CONTRACT'
                              ? 'Contract Staff'
                              : staffCategory === 'BOTH'
                              ? 'Permanent & Contract'
                              : 'Permanent Staff'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal flex items-center gap-2">
                          <span>{sub.branch.region.name}</span>
                          <span>•</span>
                          <span>
                            {sub.month}/{sub.year} Cycle
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-normal rounded-lg border ${
                            sub.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : sub.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-rose-100 text-rose-900 border-rose-300'
                          }`}
                        >
                          {sub.status === 'APPROVED' && 'Approved'}
                          {sub.status === 'PENDING' && 'Pending'}
                          {sub.status === 'REJECTED' && 'Needs Correction'}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: PDF Preview & Decision Panel (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6 sticky top-20">
          {selectedSub ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-6">
              {/* Header & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-900">{selectedSub.branch.name}</h2>
                    <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {selectedSub.branch.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-normal">
                    {selectedSub.month}/{selectedSub.year} Cycle • Uploaded by {selectedSub.uploadedBy.name}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/api/submissions/${selectedSub.id}/file`}
                    download={selectedSub.fileName}
                    className="px-3.5 py-2 text-xs font-normal rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5"
                  >
                    <Download className="h-4 w-4 text-emerald-400" />
                    <span>Download PDF</span>
                  </a>
                </div>
              </div>

              {/* Inline PDF Viewer */}
              <div className="relative w-full h-[420px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col shadow-inner">
                <iframe
                  src={`/api/submissions/${selectedSub.id}/file#toolbar=0`}
                  className="w-full h-full border-none"
                  title="PDF Document Preview"
                />
              </div>

              {/* Form Details & Breakdown */}
              {(() => {
                let parsedForm: any = null;
                try {
                  if (selectedSub.note && selectedSub.note.startsWith('{')) {
                    parsedForm = JSON.parse(selectedSub.note);
                  }
                } catch (e) {}

                const staffCategory = selectedSub.staffType || parsedForm?.staffType || 'PERMANENT';

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-normal">
                    {/* Form Information Card */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="text-slate-500 font-normal uppercase tracking-wider text-[10px] pb-1 border-b border-slate-200">
                        Form Information:
                      </div>
                      {parsedForm ? (
                        <div className="space-y-1.5 text-slate-800">
                          <div>
                            <span className="text-slate-500">Staff Category:</span>{' '}
                            <span className="font-semibold text-slate-900">
                              {staffCategory === 'CONTRACT'
                                ? 'Contract Staff'
                                : staffCategory === 'BOTH'
                                ? 'Both Permanent & Contract'
                                : 'Permanent Staff'}
                            </span>
                          </div>
                          <div><span className="text-slate-500">Station Manager:</span> <span className="font-normal text-slate-900">{parsedForm.signerName || 'N/A'}</span></div>
                          {parsedForm.contextNote && <div><span className="text-slate-500">Notes:</span> <span className="italic text-slate-900">{parsedForm.contextNote}</span></div>}
                        </div>
                      ) : (
                        <div className="text-slate-900 italic">
                          {selectedSub.note || 'No notes provided.'}
                        </div>
                      )}
                    </div>

                    {/* Document Check Card */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="text-slate-500 font-normal uppercase tracking-wider text-[10px] pb-1 border-b border-slate-200">
                        Document Check:
                      </div>
                      <div className="space-y-2 pt-0.5">
                        <div className="flex items-center gap-2">
                          {selectedSub.ocrPassed ? (
                            <span className="text-emerald-800 font-normal flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Readable PDF scan
                            </span>
                          ) : (
                            <span className="text-amber-800 font-normal flex items-center gap-1.5">
                              <AlertCircle className="h-4 w-4 text-amber-600" /> Photo scan with low text
                            </span>
                          )}
                        </div>
                        {parsedForm?.uploadMode && (
                          <div className="text-slate-600 text-xs">
                            Document Type: <span className="text-slate-900 font-normal">{parsedForm.uploadMode === 'IMAGES' ? 'Photos merged into PDF' : 'PDF Document'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Reviewer Decision Panel */}
              <div className="p-5 rounded-2xl bg-emerald-900 text-white space-y-4 shadow-md border border-emerald-800">
                <div className="font-bold text-sm text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-300" />
                    <span>Review Decision Action</span>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                      selectedSub.status === 'APPROVED'
                        ? 'bg-emerald-600 text-white'
                        : selectedSub.status === 'PENDING'
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    STATUS: {selectedSub.status}
                  </span>
                </div>

                {actionError && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-bold">
                    {actionError}
                  </div>
                )}

                {rejecting ? (
                  <div className="space-y-3">
                    <label className="block text-xs font-black text-rose-300">
                      Rejection Reason (Mandatory note sent to Station Manager):
                    </label>
                    <textarea
                      rows={3}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Explain what needs correction (e.g. physical signature missing on page 2)..."
                      className="w-full p-3 rounded-xl bg-slate-950 border border-rose-400 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />

                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setRejecting(false);
                          setReviewNotes('');
                        }}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReviewAction('REJECT')}
                        disabled={actionLoading || !reviewNotes.trim()}
                        className="px-4 py-2 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md disabled:opacity-50 transition cursor-pointer"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setRejecting(true)}
                      disabled={actionLoading}
                      className="px-4 py-2.5 text-xs font-black rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition flex items-center gap-2 cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject & Require Resubmission</span>
                    </button>

                    <button
                      onClick={() => handleReviewAction('APPROVE')}
                      disabled={actionLoading}
                      className="px-5 py-2.5 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Approve Submission</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-slate-500 text-xs font-bold shadow-sm">
              Select a submission from the left queue to preview PDF document and review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
