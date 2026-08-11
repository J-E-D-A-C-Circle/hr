'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateApplicationStage, uploadAppointmentLetter, generateOrUpdateAppointmentLetter } from '@/app/actions/admin';
import AppointmentLetterModal from '@/components/AppointmentLetterModal';
import { ApplicationStage } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Filter,
  CheckCircle2,
  AlertCircle,
  Upload,
  Eye,
  Award,
  Send,
  User,
  FileText,
  Building2,
  X,
  Search,
  Download,
  ArrowUpDown,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

const STAGES: ApplicationStage[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'PANEL_SCORING',
  'APPROVED',
  'REJECTED',
];

export default function AdminDashboardClient({
  currentUser,
  initialApplications,
  departments,
  stations = [],
  currentDeptId,
  currentStage,
}: {
  currentUser: any;
  initialApplications: any[];
  departments: any[];
  stations?: any[];
  currentDeptId?: string;
  currentStage?: string;
}) {
  const router = useRouter();
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [stageNotes, setStageNotes] = useState('');
  const [postingStationId, setPostingStationId] = useState('');
  const [reportingDate, setReportingDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isUploadingLetter, setIsUploadingLetter] = useState(false);
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string; fileName?: string; rawUrl?: string } | null>(null);
  const [docHtmlContent, setDocHtmlContent] = useState<string | null>(null);
  const [isLoadingDocHtml, setIsLoadingDocHtml] = useState<boolean>(false);

  // Fetch DOCX HTML Content when a Word Document is selected
  useEffect(() => {
    if (!previewDoc) {
      setDocHtmlContent(null);
      setIsLoadingDocHtml(false);
      return;
    }

    const docName = previewDoc.fileName || previewDoc.rawUrl || previewDoc.url || '';
    const isWordDoc = docName.match(/\.(docx?|doc)$/i);
    
    if (isWordDoc) {
      setIsLoadingDocHtml(true);
      const targetFile = previewDoc.rawUrl || previewDoc.url;
      fetch(`/api/view-document?file=${encodeURIComponent(targetFile)}`)
        .then((res) => res.text())
        .then((html) => {
          setDocHtmlContent(html);
          setIsLoadingDocHtml(false);
        })
        .catch(() => {
          setDocHtmlContent('<div class="p-8 text-center text-red-600 font-bold">Failed to load document content.</div>');
          setIsLoadingDocHtml(false);
        });
    } else {
      setDocHtmlContent(null);
    }
  }, [previewDoc]);

  // Search, Sorting, Stage Filter & Type Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'ATTACHMENT' | 'TEMPORARY' | 'PERMANENT'>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date-desc' | 'score-high' | 'name-asc'>('date-desc');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const ITEMS_PER_PAGE = 8;

  // Filter & Sort Applications
  const processedApplications = useMemo(() => {
    let result = [...initialApplications];

    // Stage Filter
    if (stageFilter !== 'ALL') {
      result = result.filter((app) => app.currentStage === stageFilter);
    }

    // Type Filter (Attachment covers both ATTACHMENT and INTERNSHIP)
    if (typeFilter !== 'ALL') {
      result = result.filter((app) =>
        typeFilter === 'ATTACHMENT'
          ? app.position.type === 'ATTACHMENT' || app.position.type === 'INTERNSHIP'
          : app.position.type === typeFilter
      );
    }

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (app) =>
          app.applicant.fullName.toLowerCase().includes(q) ||
          app.referenceNumber.toLowerCase().includes(q) ||
          app.position.title.toLowerCase().includes(q) ||
          app.applicant.email.toLowerCase().includes(q)
      );
    }

    // Sort (Default: Latest Submission First)
    result.sort((a, b) => {
      if (sortBy === 'score-high') {
        const scoreA =
          a.panelScores.length > 0
            ? a.panelScores.reduce((sum: number, s: any) => sum + s.totalScore, 0) / a.panelScores.length
            : -1;
        const scoreB =
          b.panelScores.length > 0
            ? b.panelScores.reduce((sum: number, s: any) => sum + s.totalScore, 0) / b.panelScores.length
            : -1;
        return scoreB - scoreA;
      }
      if (sortBy === 'name-asc') {
        return a.applicant.fullName.localeCompare(b.applicant.fullName);
      }
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeB - timeA;
    });

    return result;
  }, [initialApplications, searchQuery, sortBy, typeFilter, stageFilter]);

  const totalPages = Math.ceil(processedApplications.length / ITEMS_PER_PAGE) || 1;

  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedApplications.slice(start, start + ITEMS_PER_PAGE);
  }, [processedApplications, currentPage]);

  const handleStageChange = async (appId: string, newStage: ApplicationStage) => {
    setIsUpdating(true);
    setActionSuccess(null);
    setActionError(null);

    const res = await updateApplicationStage(
      appId,
      newStage,
      stageNotes,
      postingStationId || undefined,
      reportingDate || undefined
    );
    setIsUpdating(false);

    if (res.success && res.application) {
      setActionSuccess(`Stage successfully updated to ${newStage}. Notification email dispatched.`);
      setSelectedApp((prev: any) => ({ ...prev, currentStage: newStage }));
      router.refresh();
    } else {
      setActionError(res.error || 'Failed to update stage.');
    }
  };

  const handleUploadAppointmentLetter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedApp) return;

    setIsUploadingLetter(true);
    setActionSuccess(null);
    setActionError(null);

    const formData = new FormData(e.currentTarget);
    const res = await uploadAppointmentLetter(selectedApp.id, formData);
    setIsUploadingLetter(false);

    if (res.success && res.appointmentLetter) {
      setActionSuccess('Official HR Appointment Letter uploaded successfully!');
      setSelectedApp((prev: any) => ({ ...prev, appointmentLetter: res.appointmentLetter.fileUrl }));
      router.refresh();
    } else {
      setActionError(res.error || 'Failed to upload appointment letter.');
    }
  };

  const exportToCsv = () => {
    const headers = [
      'Reference Number',
      'Applicant Name',
      'Email',
      'Phone',
      'Position',
      'Position Type',
      'Department',
      'Current Stage',
      'Average Panel Score',
      'Application Date',
    ];

    const rows = processedApplications.map((app) => {
      const avgScore =
        app.panelScores.length > 0
          ? Math.round(
              app.panelScores.reduce((sum: number, s: any) => sum + s.totalScore, 0) /
                app.panelScores.length
            )
          : 'N/A';

      return [
        `"${app.referenceNumber}"`,
        `"${app.applicant.fullName}"`,
        `"${app.applicant.email}"`,
        `"${app.applicant.phone}"`,
        `"${app.position.title}"`,
        `"${app.position.type}"`,
        `"${app.department.name}"`,
        `"${app.currentStage}"`,
        `"${avgScore}"`,
        `"${new Date(app.createdAt).toLocaleDateString()}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DVLA_Applications_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Toolbar */}
      <div className="bg-[#FAF0D7] rounded-3xl p-5 shadow-sm border border-[#E6D7A8] space-y-4">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Real-time Candidate Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, reference #, position, or email..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-[#E6D7A8] bg-[#FDF8EB] rounded-2xl text-gray-900 focus:ring-2 focus:ring-[#15803D] focus:outline-none"
            />
          </div>

          {/* Export Report Action Button */}
          <button
            type="button"
            onClick={exportToCsv}
            className="bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold px-4 py-2 rounded-2xl shadow transition inline-flex items-center space-x-1.5 shrink-0 cursor-pointer"
            style={{ height: '38px', maxHeight: '38px' }}
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Export Applications CSV Report</span>
          </button>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-4 border-t border-[#E6D7A8] pt-3">
          
          {/* Department Filter */}
          <div className="w-56">
            <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#15803D]" />
              <span>Department</span>
            </label>
            <Select
              value={currentDeptId || 'ALL'}
              onValueChange={(val) => {
                const dept = val === 'ALL' ? '' : val;
                router.push(`/admin/dashboard?${dept ? `departmentId=${dept}&` : ''}${currentStage ? `stage=${currentStage}` : ''}`);
              }}
            >
              <SelectTrigger className="rounded-xl h-9 bg-[#FDF8EB] border-[#E6D7A8]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl bg-[#FDF8EB] border-[#E6D7A8]">
                <SelectItem value="ALL">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stage Filter */}
          <div className="w-48">
            <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber-700" />
              <span>Application Stage</span>
            </label>
            <Select
              value={stageFilter}
              onValueChange={(val) => {
                setStageFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="rounded-xl h-9 bg-[#FDF8EB] border-[#E6D7A8]">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl bg-[#FDF8EB] border-[#E6D7A8]">
                <SelectItem value="ALL">All Stages</SelectItem>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort By Dropdown */}
          <div className="w-52">
            <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-gray-700" />
              <span>Sort Candidates By</span>
            </label>
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
              <SelectTrigger className="rounded-xl h-9 bg-[#FDF8EB] border-[#E6D7A8]">
                <SelectValue placeholder="Sort Order" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl bg-[#FDF8EB] border-[#E6D7A8]">
                <SelectItem value="date-desc">Newest Submission First</SelectItem>
                <SelectItem value="score-high">Highest Panel Score First</SelectItem>
                <SelectItem value="name-asc">Applicant Name (A - Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>

      {/* Position Track & Application Stage Switcher Tabs */}
      <div className="space-y-2">
        {/* Track Category Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mr-1">Track:</span>
          {(['ALL', 'ATTACHMENT', 'TEMPORARY', 'PERMANENT'] as const).map((t) => {
            const labels: Record<string, string> = { ALL: 'All Tracks', ATTACHMENT: 'Attachment', TEMPORARY: 'Temporary', PERMANENT: 'Permanent' };
            const count = t === 'ALL'
              ? initialApplications.length
              : initialApplications.filter((a: any) =>
                  t === 'ATTACHMENT'
                    ? a.position.type === 'ATTACHMENT' || a.position.type === 'INTERNSHIP'
                    : a.position.type === t
                ).length;
            return (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setCurrentPage(1); }}
                className={`px-3.5 py-1 rounded-full text-xs transition border ${
                  typeFilter === t
                    ? 'bg-[#0F5132] text-white border-[#0F5132] font-bold shadow-sm'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-[#0F5132] hover:text-[#0F5132]'
                }`}
              >
                {labels[t]} <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Stage Status Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mr-1">Status:</span>
          {(['ALL', ...STAGES] as const).map((st) => {
            const label = st === 'ALL' ? 'All Statuses' : st.replace('_', ' ');
            const count = st === 'ALL'
              ? initialApplications.length
              : initialApplications.filter((a: any) => a.currentStage === st).length;
            return (
              <button
                key={st}
                onClick={() => { setStageFilter(st); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-xl text-[11px] transition border uppercase tracking-wider ${
                  stageFilter === st
                    ? 'bg-amber-700 text-white border-amber-700 font-black shadow-sm'
                    : 'bg-white/80 text-gray-700 border-gray-300 hover:border-amber-700 hover:text-amber-900 font-semibold'
                }`}
              >
                {label} <span className="ml-0.5 opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-[#FAF0D7] rounded-3xl shadow-md border border-[#E6D7A8] overflow-hidden">
        <div className="p-5 border-b border-[#E6D7A8] bg-[#F5E8C3] flex items-center justify-between">
          <h2 className="font-black text-gray-900 text-base">
            Applications Record ({processedApplications.length} found)
          </h2>
          <span className="text-xs text-gray-600 font-bold">Segregated by Department & Target Position</span>
        </div>

        {processedApplications.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm font-semibold">
            No candidate applications matching the selected query or filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F4327] text-white uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Ref # / Applicant</th>
                  <th className="px-5 py-3.5">Target Position</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Staff Status</th>
                  <th className="px-5 py-3.5">Current Stage</th>
                  <th className="px-5 py-3.5">Panel Score</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6D7A8] font-medium bg-[#FAF0D7]">
                {paginatedApplications.map((app) => {
                  const scoreCount = app.panelScores.length;
                  const avgScore =
                    scoreCount > 0
                      ? Math.round(
                          app.panelScores.reduce((acc: number, s: any) => acc + s.totalScore, 0) / scoreCount
                        )
                      : null;

                  return (
                    <tr key={app.id} className="hover:bg-[#F3E5C0] transition">
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        <div className="text-amber-800 font-black font-mono">{app.referenceNumber}</div>
                        <div className="text-sm">{app.applicant.fullName}</div>
                        <div className="text-[10px] text-gray-500 font-normal">
                          {new Date(app.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-800">
                        {app.position.title} ({app.position.type})
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">
                        {app.department.name} ({app.department.code})
                      </td>
                      <td className="px-5 py-3.5">
                        {app.isCurrentDvlaStaff ? (
                          <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-xl border border-amber-300">
                            Staff ({app.applicant.station?.name || 'GH'})
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-xl border border-gray-300">
                            External
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`font-black px-2.5 py-1 rounded-xl uppercase text-[10px] ${
                            app.currentStage === 'APPROVED'
                              ? 'bg-green-100 text-green-900 border border-green-300'
                              : app.currentStage === 'REJECTED'
                              ? 'bg-red-100 text-red-900 border border-red-300'
                              : app.currentStage === 'SHORTLISTED'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {app.currentStage.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold">
                        {avgScore !== null ? (
                          <span className="text-[#15803D] font-black text-sm flex items-center gap-1">
                            <Award className="w-4 h-4 text-[#15803D]" />
                            <span>{avgScore} / 100 ({scoreCount} judge{scoreCount > 1 ? 's' : ''})</span>
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">Unscored</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setActionSuccess(null);
                            setActionError(null);
                            setPostingStationId(app.applicant.stationId || '');
                          }}
                          className="bg-[#15803D] hover:bg-[#166534] text-white px-3 py-1.5 rounded-xl font-bold transition shadow-sm inline-flex items-center space-x-1 cursor-pointer"
                          style={{ height: '32px', maxHeight: '32px' }}
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span>Manage & Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar (8 items per page) */}
        {processedApplications.length > 0 && (
          <div className="p-4 border-t border-[#E6D7A8] bg-[#F5E8C3] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-gray-700 font-medium">
              Showing <strong className="text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to{' '}
              <strong className="text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, processedApplications.length)}</strong> of{' '}
              <strong className="text-gray-900">{processedApplications.length}</strong> applications
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 rounded-xl border border-[#E6D7A8] bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold inline-flex items-center gap-1 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`w-8 h-8 rounded-xl font-bold transition text-xs ${
                      currentPage === pg
                        ? 'bg-[#15803D] text-white shadow-sm'
                        : 'bg-white border border-[#E6D7A8] text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 rounded-xl border border-[#E6D7A8] bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold inline-flex items-center gap-1 transition"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal Drawer */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF0D7] rounded-3xl shadow-2xl max-w-3xl w-full p-6 md:p-8 space-y-6 border border-[#E6D7A8] max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E6D7A8] pb-4">
              <div>
                <span className="text-xs uppercase font-extrabold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-300">
                  Ref #: {selectedApp.referenceNumber}
                </span>
                <h2 className="text-xl font-black text-gray-900 mt-1">
                  {selectedApp.applicant.fullName} — {selectedApp.position.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-500 hover:text-gray-700 font-bold p-1 cursor-pointer"
                style={{ height: '32px', maxHeight: '32px' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Alerts */}
            {actionSuccess && (
              <div className="bg-green-50 border-l-4 border-green-600 p-3.5 rounded-2xl text-green-900 text-xs font-semibold shadow-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}
            {actionError && (
              <div className="bg-red-50 border-l-4 border-red-600 p-3.5 rounded-2xl text-red-900 text-xs font-semibold shadow-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="bg-[#FDF8EB] p-4 rounded-2xl border border-[#E6D7A8] text-xs space-y-2">
                <h3 className="font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#15803D]" />
                  <span>Applicant Profile</span>
                </h3>
                <div><strong>Email:</strong> {selectedApp.applicant.email}</div>
                <div><strong>Phone:</strong> {selectedApp.applicant.phone}</div>
                <div><strong>Current DVLA Staff:</strong> {selectedApp.isCurrentDvlaStaff ? 'Yes' : 'No'}</div>
                {selectedApp.isCurrentDvlaStaff && (
                  <div><strong>Station:</strong> {selectedApp.applicant.station?.name || 'N/A'}</div>
                )}
                <div><strong>Department:</strong> {selectedApp.department.name}</div>
              </div>

              {/* Uploaded Documents List */}
              <div className="bg-[#FDF8EB] p-4 rounded-2xl border border-[#E6D7A8] text-xs space-y-2">
                <h3 className="font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span>Uploaded Application Documents</span>
                </h3>
                {selectedApp.documents && selectedApp.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedApp.documents.map((doc: any) => {
                      const docTypeName = (doc.documentType || doc.type || 'Document').replace(/_/g, ' ');
                      return (
                        <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-sm gap-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#15803D] shrink-0" />
                            <div>
                              <div className="font-bold text-gray-900 text-xs">{docTypeName}</div>
                              <div className="text-[10px] text-gray-500 font-mono">{doc.fileName || 'document.pdf'}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => {
                                const targetUrl = doc.fileUrl.startsWith('/api/')
                                  ? doc.fileUrl
                                  : `/api/view-document?file=${encodeURIComponent(doc.fileUrl)}`;
                                setPreviewDoc({
                                  title: `${selectedApp.applicant.fullName} — ${docTypeName}`,
                                  url: targetUrl,
                                  fileName: doc.fileName || `${docTypeName}.pdf`,
                                  rawUrl: doc.fileUrl,
                                });
                              }}
                              className="bg-[#15803D] hover:bg-[#166534] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-gray-300 transition inline-flex items-center gap-1"
                              title="Download File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-500 italic">No documents attached.</div>
                )}
              </div>
            </div>

            {/* Posting Assignment & Reporting Date Controls */}
            <div className="bg-[#FDF8EB] p-5 rounded-2xl border border-[#E6D7A8] space-y-3">
              <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#15803D]" />
                <span>Assigned Station Posting & Reporting Date</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Target Posting DVLA Station</label>
                  <Select value={postingStationId} onValueChange={setPostingStationId}>
                    <SelectTrigger className="rounded-xl bg-white border-gray-300 h-9 text-xs">
                      <SelectValue placeholder="Select station" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {stations.map((st) => (
                        <SelectItem key={st.id} value={st.id}>
                          {st.name} ({st.location || 'Ghana'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-700" />
                    <span>Official Reporting Date</span>
                  </label>
                  <input
                    type="date"
                    value={reportingDate}
                    onChange={(e) => setReportingDate(e.target.value)}
                    className="w-full border border-gray-300 bg-white rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:ring-2 focus:ring-[#15803D]"
                  />
                </div>
              </div>
            </div>

            {/* Stage Transition Control */}
            <div className="bg-[#FDF8EB] p-5 rounded-2xl border border-[#E6D7A8] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Update Application Stage</h3>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">
                  Current: {selectedApp.currentStage.replace('_', ' ')}
                </span>
              </div>

              {/* Guided HR Decision Action Buttons */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="text-xs font-bold text-gray-700">Recommended HR Actions:</div>

                {selectedApp.currentStage === 'SUBMITTED' && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={isUpdating}
                      onClick={() => handleStageChange(selectedApp.id, 'UNDER_REVIEW')}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Mark as Under Review</span>
                    </button>
                  </div>
                )}

                {selectedApp.currentStage === 'UNDER_REVIEW' && (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      disabled={isUpdating}
                      onClick={() => handleStageChange(selectedApp.id, 'SHORTLISTED')}
                      className="bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Shortlist for Panel</span>
                    </button>
                    <button
                      disabled={isUpdating}
                      onClick={() => handleStageChange(selectedApp.id, 'REJECTED')}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject Application</span>
                    </button>
                  </div>
                )}

                {selectedApp.currentStage === 'SHORTLISTED' && (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      disabled={isUpdating}
                      onClick={() => handleStageChange(selectedApp.id, 'PANEL_SCORING')}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Award className="w-4 h-4" />
                      <span>Send to Panel Scoring</span>
                    </button>
                    <button
                      disabled={isUpdating}
                      onClick={() => handleStageChange(selectedApp.id, 'REJECTED')}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject Application</span>
                    </button>
                  </div>
                )}

                {selectedApp.currentStage === 'PANEL_SCORING' && (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      disabled={isUpdating}
                      onClick={() => handleStageChange(selectedApp.id, 'APPROVED')}
                      className="bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Final Approve & Grant Placement</span>
                    </button>
                    <button
                      disabled={isUpdating}
                      onClick={() => handleStageChange(selectedApp.id, 'REJECTED')}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject Application</span>
                    </button>
                  </div>
                )}

                {selectedApp.currentStage === 'APPROVED' && (
                  <div className="text-xs font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Application has been Fully Approved. Proceed to generate official appointment letter below.</span>
                  </div>
                )}

                {selectedApp.currentStage === 'REJECTED' && (
                  <div className="text-xs font-bold text-red-800 bg-red-50 p-2.5 rounded-lg border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Application has been Rejected.</span>
                  </div>
                )}
              </div>

              {/* Manual Stage Selector Override */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-gray-500 mb-1.5">Manual Stage Override:</div>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map((st) => (
                    <button
                      key={st}
                      disabled={isUpdating || selectedApp.currentStage === st}
                      onClick={() => handleStageChange(selectedApp.id, st)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition disabled:opacity-50 cursor-pointer ${
                        selectedApp.currentStage === st
                          ? 'bg-[#15803D] text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Audit Trail Notes (Optional)</label>
                <input
                  type="text"
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                  placeholder="Reasoning or comments for stage change..."
                  className="w-full border border-[#E6D7A8] bg-white rounded-xl px-3 py-2 text-xs text-gray-900"
                />
              </div>
            </div>

            {/* Appointment Letter Upload / Custom Generator */}
            <div className="bg-[#FDF8EB] p-5 rounded-2xl border border-[#E6D7A8] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#15803D]" />
                  <span>Official HR Appointment Letter & QR Verification</span>
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLetterModalOpen(true)}
                    className="w-full sm:w-auto bg-[#0F5132] hover:bg-[#0B3D26] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>⚡ Create & Edit Custom Appointment Letter</span>
                  </button>

                  {selectedApp.appointmentLetter && (
                    <a
                      href={selectedApp.appointmentLetter}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-gray-950 px-4 py-2.5 rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
                    >
                      <span>View / Print Letter ↗</span>
                    </a>
                  )}
                </div>

                <div className="text-[11px] text-gray-500 flex items-center gap-1">
                  <span>Supports:</span>
                  <span className="font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded">Temporary Placement</span>
                  <span className="font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">Contract Staff</span>
                  <span className="font-bold text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded">Permanent Staff</span>
                </div>

                <form onSubmit={handleUploadAppointmentLetter} className="flex flex-col sm:flex-row items-center gap-3 border-t border-[#E6D7A8] pt-3">
                  <input
                    type="file"
                    name="appointmentLetter"
                    accept=".pdf,.doc,.docx"
                    required
                    className="text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#15803D] file:text-white hover:file:bg-[#166534] transition cursor-pointer flex-1"
                  />
                  <button
                    type="submit"
                    disabled={isUploadingLetter}
                    className="bg-[#15803D] hover:bg-[#166534] text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition shrink-0 cursor-pointer inline-flex items-center space-x-1"
                    style={{ height: '36px', maxHeight: '36px' }}
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span>{isUploadingLetter ? 'Uploading...' : 'Upload Manual PDF'}</span>
                  </button>
                </form>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedApp(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-5 py-2 rounded-xl text-xs transition"
                style={{ height: '36px', maxHeight: '36px' }}
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* In-App Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full flex flex-col h-[88vh] border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Viewer Header */}
            <div className="bg-[#0F5132] text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-900 flex items-center justify-center border border-emerald-700">
                  <FileText className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-white leading-tight">{previewDoc.title}</h2>
                  <p className="text-[11px] text-emerald-200 font-mono mt-0.5">{previewDoc.fileName || previewDoc.url}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="bg-emerald-900 hover:bg-emerald-800 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-700 transition inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Original</span>
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 rounded-full bg-emerald-900 hover:bg-emerald-800 flex items-center justify-center text-white transition border border-emerald-700 cursor-pointer"
                  aria-label="Close viewer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Viewer Main Display Area */}
            <div className="flex-1 bg-gray-100 p-4 relative flex flex-col items-center justify-center overflow-hidden">
              {isLoadingDocHtml ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-white rounded-2xl border border-gray-300 shadow-inner w-full h-full">
                  <Loader2 className="w-8 h-8 text-[#15803D] animate-spin" />
                  <div className="text-xs font-bold text-gray-700">Extracting Word Document Text Content...</div>
                </div>
              ) : docHtmlContent ? (
                <div className="w-full h-full flex flex-col bg-white rounded-2xl border border-gray-300 shadow-inner overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-700 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#15803D]" />
                      <span>{previewDoc.title}</span>
                    </span>
                    <span className="text-[11px] font-mono text-gray-500">{previewDoc.fileName}</span>
                  </div>
                  <div className="flex-1 relative bg-white">
                    <iframe
                      srcDoc={docHtmlContent}
                      title={previewDoc.title}
                      className="w-full h-full rounded-b-2xl border-none bg-white"
                    />
                  </div>
                </div>
              ) : previewDoc.fileName?.match(/\.(png|jpe?g|webp|gif|svg)$/i) || previewDoc.url.match(/\.(png|jpe?g|webp|gif|svg)$/i) ? (
                <div className="max-w-full max-h-full overflow-auto rounded-xl shadow-lg border border-gray-300 bg-white p-2 flex items-center justify-center">
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.title}
                    className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col bg-white rounded-2xl border border-gray-300 shadow-inner overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-700 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#15803D]" />
                      <span>{previewDoc.title}</span>
                    </span>
                    <span className="text-[11px] font-mono text-gray-500">{previewDoc.fileName}</span>
                  </div>
                  
                  <div className="flex-1 relative bg-gray-50">
                    <iframe
                      src={previewDoc.url}
                      title={previewDoc.title}
                      className="w-full h-full rounded-b-2xl border-none bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Viewer Footer Bar */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between text-xs text-gray-600 shrink-0">
              <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#0F5132]" />
                <span>DVLA In-App Document Inspection Viewer</span>
              </span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="bg-gray-800 hover:bg-gray-900 text-white font-bold px-4 py-1.5 rounded-xl transition cursor-pointer"
              >
                Close Viewer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Appointment Letter Generator Modal */}
      <AppointmentLetterModal
        isOpen={isLetterModalOpen}
        onClose={() => setIsLetterModalOpen(false)}
        application={selectedApp}
        onSuccess={() => {
          setActionSuccess('Official Appointment Letter generated and dispatched successfully!');
          router.refresh();
        }}
      />
    </div>
  );
}
