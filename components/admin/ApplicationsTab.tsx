'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  AlertCircle,
  Trash2,
  Loader2,
  MapPin,
  Calendar,
  GraduationCap,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Application } from '@/lib/types/admin';
import ModalPortal from '@/components/ui/ModalPortal';
import ShadcnSelect from '@/components/ui/ShadcnSelect';

interface ApplicationsTabProps {
  applications: Application[];
  onSelectApplication: (id: number) => void;
  onBulkAction: (action: 'approve' | 'reject' | 'delete', ids: number[]) => void;
  onExportCSV: (items: Application[]) => void;
  loading: boolean;
  onDeleteApplication?: (id: number) => Promise<void> | void;
}

const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Northern',
  'Volta',
  'Bono',
  'Bono East',
  'Ahafo',
  'Upper East',
  'Upper West',
  'Oti',
  'Western North',
  'Savannah',
  'North East'
];

const POPULAR_COURSES = [
  'BSc. Computer Science',
  'BSc. Information Technology',
  'BSc. Administration',
  'BSc. Business Administration',
  'BSc. Accounting',
  'BSc. Finance',
  'BSc. Human Resource Management',
  'BSc. Marketing',
  'BSc. Mechanical Engineering',
  'BSc. Electrical / Electronic Engineering',
  'BSc. Civil Engineering',
  'BSc. Economics',
  'BSc. Mathematics / Statistics',
  'BSc. Procurement & Supply Chain Management',
  'BA. Communication Studies / Public Relations',
  'Diploma in IT',
  'HND Mechanical Engineering',
  'HND Accountancy'
];

export default function ApplicationsTab({
  applications,
  onSelectApplication,
  onBulkAction,
  onExportCSV,
  loading,
  onDeleteApplication
}: ApplicationsTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('');
  const [courseInput, setCourseInput] = useState<string>('');
  const [isCourseSuggestOpen, setIsCourseSuggestOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const courseSuggestRef = useRef<HTMLDivElement>(null);

  // Close course dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (courseSuggestRef.current && !courseSuggestRef.current.contains(e.target as Node)) {
        setIsCourseSuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      if (onDeleteApplication) {
        await onDeleteApplication(deleteTarget.id);
      }
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete applicant error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirmBulkDelete = async () => {
    try {
      await onBulkAction('delete', selectedIds);
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
    } catch (err) {
      console.error('Bulk delete error:', err);
    }
  };

  // Helper to test date filter
  const matchesDateFilter = (createdAtStr: string, filter: string) => {
    if (filter === 'all') return true;
    if (!createdAtStr) return false;
    const created = new Date(createdAtStr);
    if (isNaN(created.getTime())) return false;
    const now = new Date();

    if (filter === 'today') {
      return created.toDateString() === now.toDateString();
    }
    if (filter === 'this_week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return created >= sevenDaysAgo;
    }
    if (filter === 'this_month') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return created >= thirtyDaysAgo;
    }
    return true;
  };

  // Region options with counts
  const regionCounts: Record<string, number> = {};
  applications.forEach((app) => {
    const reg = (app.region || app.posting_region || '').trim();
    if (reg) {
      regionCounts[reg] = (regionCounts[reg] || 0) + 1;
    }
  });

  const dynamicRegions = Array.from(
    new Set([...GHANA_REGIONS, ...Object.keys(regionCounts)])
  ).sort((a, b) => {
    const countA = regionCounts[a] || 0;
    const countB = regionCounts[b] || 0;
    if (countB !== countA) return countB - countA;
    return a.localeCompare(b);
  });

  const regionOptions = [
    { value: 'all', label: 'All Regions', badge: applications.length },
    ...dynamicRegions.map((reg) => ({
      value: reg,
      label: reg,
      badge: regionCounts[reg] || 0
    }))
  ];

  // Station options with counts
  const unassignedCount = applications.filter(
    (a) => !a.posting_station || a.posting_station.trim() === ''
  ).length;
  const assignedCount = applications.length - unassignedCount;

  const stationCounts: Record<string, number> = {};
  applications.forEach((a) => {
    if (a.posting_station && a.posting_station.trim()) {
      const st = a.posting_station.trim();
      stationCounts[st] = (stationCounts[st] || 0) + 1;
    }
  });

  const stationOptions = [
    { value: 'all', label: 'All Stations', badge: applications.length },
    { value: 'unassigned', label: 'Unassigned', badge: unassignedCount },
    { value: 'assigned', label: 'Assigned (Any)', badge: assignedCount },
    ...Object.entries(stationCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([st, count]) => ({
        value: st,
        label: st,
        badge: count
      }))
  ];

  // Date options
  const dateOptions = [
    { value: 'all', label: 'All Dates' },
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'Past 7 Days' },
    { value: 'this_month', label: 'Past 30 Days' }
  ];

  // Course suggestion list with counts
  const courseCounts: Record<string, number> = {};
  applications.forEach((a) => {
    if (a.course_program && a.course_program.trim()) {
      const c = a.course_program.trim();
      courseCounts[c] = (courseCounts[c] || 0) + 1;
    }
  });

  POPULAR_COURSES.forEach((c) => {
    if (courseCounts[c] === undefined) {
      courseCounts[c] = 0;
    }
  });

  const cQuery = courseInput.trim().toLowerCase();
  const suggestedCourses = Object.entries(courseCounts)
    .filter(([courseName]) => {
      if (!cQuery) return true;
      return courseName.toLowerCase().includes(cQuery);
    })
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      const aStarts = a[0].toLowerCase().startsWith(cQuery);
      const bStarts = b[0].toLowerCase().startsWith(cQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a[0].localeCompare(b[0]);
    })
    .slice(0, 10);

  // Filter logic
  const filtered = applications.filter((app) => {
    // 1. Status filter
    if (statusFilter !== 'all' && app.status !== statusFilter) {
      return false;
    }

    // 2. Region filter
    if (regionFilter !== 'all') {
      const regTarget = regionFilter.toLowerCase().trim();
      const appReg = (app.region || '').toLowerCase().trim();
      const postReg = (app.posting_region || '').toLowerCase().trim();
      if (!appReg.includes(regTarget) && !postReg.includes(regTarget)) {
        return false;
      }
    }

    // 3. Station filter
    if (stationFilter === 'unassigned') {
      if (app.posting_station && app.posting_station.trim() !== '') return false;
    } else if (stationFilter === 'assigned') {
      if (!app.posting_station || app.posting_station.trim() === '') return false;
    } else if (stationFilter !== 'all') {
      if ((app.posting_station || '').toLowerCase() !== stationFilter.toLowerCase()) return false;
    }

    // 4. Date filter
    if (!matchesDateFilter(app.created_at, dateFilter)) {
      return false;
    }

    // 5. Course filter
    if (courseFilter.trim() !== '') {
      const cTarget = courseFilter.toLowerCase().trim();
      const appCourse = (app.course_program || '').toLowerCase().trim();
      if (!appCourse.includes(cTarget)) {
        return false;
      }
    }

    // 6. Universal Search query (Enhanced for comprehensive matching)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const fullName = `${app.first_name || ''} ${app.middle_name || ''} ${app.last_name || ''}`.toLowerCase();
      const nss = (app.nss_number || '').toLowerCase();
      const email = (app.email || '').toLowerCase();
      const station = (app.posting_station || '').toLowerCase();
      const region = (app.region || '').toLowerCase();
      const postingRegion = (app.posting_region || '').toLowerCase();
      const district = (app.district || '').toLowerCase();
      const postingDistrict = (app.posting_district || '').toLowerCase();
      const course = (app.course_program || '').toLowerCase();
      const institution = (app.institution_name || '').toLowerCase();
      const phone = (app.phone_number || '').toLowerCase();

      const matches =
        fullName.includes(q) ||
        nss.includes(q) ||
        email.includes(q) ||
        station.includes(q) ||
        region.includes(q) ||
        postingRegion.includes(q) ||
        district.includes(q) ||
        postingDistrict.includes(q) ||
        course.includes(q) ||
        institution.includes(q) ||
        phone.includes(q);

      if (!matches) {
        return false;
      }
    }

    return true;
  });

  // Active filter count & reset handler
  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (regionFilter !== 'all' ? 1 : 0) +
    (stationFilter !== 'all' ? 1 : 0) +
    (dateFilter !== 'all' ? 1 : 0) +
    (courseFilter.trim() !== '' ? 1 : 0) +
    (searchQuery.trim() !== '' ? 1 : 0);

  const handleClearAllFilters = () => {
    setStatusFilter('all');
    setRegionFilter('all');
    setStationFilter('all');
    setDateFilter('all');
    setCourseFilter('');
    setCourseInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

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
      {/* Control Bar: Tabs, Actions & Advanced Filter Controls */}
      <div className="space-y-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        {/* Row 1: Status Tabs, Search & Export */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
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
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search name, NSS, region, course..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0d5c2e]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => onExportCSV(filtered)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#0d5c2e]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Filters (Region, Station, Date, Suggestive Course Search) */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          {/* Region Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-[#0d5c2e]" />
              Region
            </label>
            <ShadcnSelect
              options={regionOptions}
              value={regionFilter}
              onChange={(val) => {
                setRegionFilter(val);
                setCurrentPage(1);
              }}
              enableSearch
              searchPlaceholder="Filter regions..."
              placeholder="All Regions"
            />
          </div>

          {/* Station / Assignment Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-[#0d5c2e]" />
              Posting Station
            </label>
            <ShadcnSelect
              options={stationOptions}
              value={stationFilter}
              onChange={(val) => {
                setStationFilter(val);
                setCurrentPage(1);
              }}
              enableSearch
              searchPlaceholder="Filter stations..."
              placeholder="All Stations"
            />
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-[#0d5c2e]" />
              Submission Date
            </label>
            <ShadcnSelect
              options={dateOptions}
              value={dateFilter}
              onChange={(val) => {
                setDateFilter(val);
                setCurrentPage(1);
              }}
              placeholder="All Dates"
            />
          </div>

          {/* Course with Suggestive Typing */}
          <div ref={courseSuggestRef} className="relative">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#0d5c2e]" />
                Course / Program
              </span>
              {courseFilter && (
                <span className="text-[10px] text-emerald-700 font-extrabold lowercase">
                  active
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                value={courseInput}
                onFocus={() => setIsCourseSuggestOpen(true)}
                onChange={(e) => {
                  setCourseInput(e.target.value);
                  setCourseFilter(e.target.value);
                  setIsCourseSuggestOpen(true);
                  setCurrentPage(1);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsCourseSuggestOpen(false);
                  }
                }}
                placeholder="Type course (e.g. Computer)..."
                className={`w-full pl-3 pr-8 py-2 text-xs font-semibold rounded-xl bg-white border transition-all text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none ${
                  courseFilter
                    ? 'border-[#0d5c2e] ring-2 ring-[#0d5c2e]/20'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              />
              {courseInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setCourseInput('');
                    setCourseFilter('');
                    setIsCourseSuggestOpen(false);
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
            </div>

            {/* Suggestive Dropdown Panel */}
            {isCourseSuggestOpen && (
              <div className="absolute z-40 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl py-1 custom-scrollbar animate-in fade-in duration-100">
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span>Suggested Programs</span>
                  <span>Applicants</span>
                </div>
                {suggestedCourses.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No matching courses found. Press Enter to search "{courseInput}".
                  </div>
                ) : (
                  suggestedCourses.map(([courseName, count]) => (
                    <button
                      key={courseName}
                      type="button"
                      onClick={() => {
                        setCourseInput(courseName);
                        setCourseFilter(courseName);
                        setIsCourseSuggestOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-emerald-50 hover:text-[#0d5c2e] transition-colors cursor-pointer ${
                        courseFilter.toLowerCase() === courseName.toLowerCase()
                          ? 'bg-emerald-50 text-[#0d5c2e] font-bold'
                          : 'text-slate-700'
                      }`}
                    >
                      <span className="truncate pr-2">{courseName}</span>
                      {count > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-[#0d5c2e] shrink-0">
                          {count}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 shrink-0">0</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active Filters Bar */}
        {activeFilterCount > 0 && (
          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Active Filters:</span>

              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0d5c2e] font-bold text-[11px]">
                  Status: {statusFilter.replace('_', ' ')}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="hover:text-emerald-900 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {regionFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0d5c2e] font-bold text-[11px]">
                  Region: {regionFilter}
                  <button
                    onClick={() => setRegionFilter('all')}
                    className="hover:text-emerald-900 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {stationFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0d5c2e] font-bold text-[11px]">
                  Station: {stationFilter}
                  <button
                    onClick={() => setStationFilter('all')}
                    className="hover:text-emerald-900 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {dateFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0d5c2e] font-bold text-[11px]">
                  Date: {dateOptions.find((d) => d.value === dateFilter)?.label}
                  <button
                    onClick={() => setDateFilter('all')}
                    className="hover:text-emerald-900 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {courseFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0d5c2e] font-bold text-[11px]">
                  Course: {courseFilter}
                  <button
                    onClick={() => {
                      setCourseFilter('');
                      setCourseInput('');
                    }}
                    className="hover:text-emerald-900 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold text-[11px]">
                  Query: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:text-slate-900 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold text-slate-500">
                Found <strong className="text-slate-900">{filtered.length}</strong> of{' '}
                <strong className="text-slate-900">{applications.length}</strong> applicants
              </span>
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset All
              </button>
            </div>
          </div>
        )}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs"
            >
              <X className="w-3.5 h-3.5" />
              Bulk Reject
            </button>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Bulk Delete
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
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="p-4 text-right">Actions</th>
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
                          {app.course_program && (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-semibold mt-0.5"
                              title={app.course_program}
                            >
                              <GraduationCap className="w-3 h-3 text-[#0d5c2e] shrink-0" />
                              <span className="truncate max-w-[190px]">{app.course_program}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-700 font-medium">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">
                            {app.region || app.posting_region || 'National'}
                          </span>
                          {(app.district || app.posting_district) && (
                            <span className="text-[11px] text-slate-500">
                              {app.district || app.posting_district}
                            </span>
                          )}
                        </div>
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectApplication(app.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d5c2e] hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                            title="Review Application"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(app);
                            }}
                            disabled={deletingId === app.id}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                            title={`Delete ${app.first_name} ${app.last_name}`}
                            aria-label="Delete applicant"
                          >
                            {deletingId === app.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
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

      {/* Confirmation Modal: Delete Single Applicant */}
      {deleteTarget && (
        <ModalPortal onClose={() => (deletingId === null ? setDeleteTarget(null) : null)}>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget && deletingId === null) setDeleteTarget(null);
            }}
          >
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[90vh] flex flex-col overflow-y-auto">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Applicant</h3>
                  <p className="text-xs text-slate-500">Permanent data and file cleanup</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <p>
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-slate-900">
                    {deleteTarget.first_name} {deleteTarget.middle_name ? `${deleteTarget.middle_name} ` : ''}{deleteTarget.last_name}
                  </strong>{' '}
                  ({deleteTarget.nss_number || deleteTarget.email})?
                </p>
                <div className="p-2.5 bg-rose-50/70 rounded-lg border border-rose-200 text-rose-800 font-medium space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    What will be deleted:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5 ml-1">
                    <li>Applicant database record and account</li>
                    <li>All uploaded files (Passport photo, ID card, Appointment letter, Certificates/CV)</li>
                    <li>Associated placement & review data</li>
                  </ul>
                </div>
                <p className="text-slate-500 italic text-[11px]">This action cannot be undone.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deletingId !== null}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deletingId !== null}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {deletingId === deleteTarget.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Confirmation Modal: Bulk Delete */}
      {showBulkDeleteConfirm && (
        <ModalPortal onClose={() => setShowBulkDeleteConfirm(false)}>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowBulkDeleteConfirm(false);
            }}
          >
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[90vh] flex flex-col overflow-y-auto">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Bulk Delete Applicants</h3>
                  <p className="text-xs text-slate-500">Permanent data and file cleanup</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <p>
                  Are you sure you want to permanently delete all{' '}
                  <strong className="text-slate-900">{selectedIds.length}</strong> selected applicants?
                </p>
                <div className="p-2.5 bg-rose-50/70 rounded-lg border border-rose-200 text-rose-800 font-medium space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    What will be deleted:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5 ml-1">
                    <li>All {selectedIds.length} applicant records and user accounts</li>
                    <li>All uploaded files for these applicants</li>
                  </ul>
                </div>
                <p className="text-slate-500 italic text-[11px]">This action cannot be undone.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkDelete}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete All Selected
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
