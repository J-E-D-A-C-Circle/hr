"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import SidebarLayout from "@/components/SidebarLayout";
import AddStaffModal from "@/components/AddStaffModal";
import StatusBadge from "@/components/StatusBadge";
import RenewModal from "@/components/RenewModal";
import TerminateModal from "@/components/TerminateModal";
import ReinstateModal from "@/components/ReinstateModal";
import ValidateStaffModal from "@/components/ValidateStaffModal";
import MergeDuplicateModal from "@/components/MergeDuplicateModal";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  UserPlus,
  RefreshCw,
  UserX,
  UserCheck,
  Archive,
  Eye,
  Building,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  AlertCircle,
  GitMerge,
  Trash2,
} from "lucide-react";
import { formatDateReadable } from "@/lib/status";

export default function StaffListPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "endDate" | "days">("days");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal states
  const [renewTarget, setRenewTarget] = useState<any | null>(null);
  const [terminateTarget, setTerminateTarget] = useState<any | null>(null);
  const [reinstateTarget, setReinstateTarget] = useState<any | null>(null);
  const [validateTarget, setValidateTarget] = useState<any | null>(null);
  const [mergeTarget, setMergeTarget] = useState<any | null>(null);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);

  // Bulk Renew selection state
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
  const [bulkRenewing, setBulkRenewing] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/staff");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load staff list");
      }
      setStaffList(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("add") === "true" || params.get("openAdd") === "true") {
        setShowAddStaffModal(true);
      }
    }
  }, []);

  // Unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set<string>();
    staffList.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set).sort();
  }, [staffList]);

  // Duplicate employee detection logic
  const duplicateStaffIds = useMemo(() => {
    const set = new Set<number>();
    const seenCodes = new Map<string, number>();
    const seenNames = new Map<string, number>();
    const seenSsnit = new Map<string, number>();

    staffList.forEach((s) => {
      if (s.staff_code) {
        const code = s.staff_code.trim().toLowerCase();
        if (seenCodes.has(code)) {
          set.add(s.id);
          set.add(seenCodes.get(code)!);
        } else {
          seenCodes.set(code, s.id);
        }
      }

      if (s.full_name) {
        const name = s.full_name.trim().toLowerCase();
        if (seenNames.has(name)) {
          set.add(s.id);
          set.add(seenNames.get(name)!);
        } else {
          seenNames.set(name, s.id);
        }
      }

      if (s.ssnit_no) {
        const ssnit = s.ssnit_no.trim().toLowerCase();
        if (seenSsnit.has(ssnit)) {
          set.add(s.id);
          set.add(seenSsnit.get(ssnit)!);
        } else {
          seenSsnit.set(ssnit, s.id);
        }
      }
    });

    return set;
  }, [staffList]);

  const isValidatedForMonth = (staffItem: any, month: string) => {
    if (!staffItem.validations) return false;
    return staffItem.validations.some((v: any) => v.month.toLowerCase() === month.toLowerCase());
  };

  // Filtered & Sorted staff
  const processedStaff = useMemo(() => {
    return staffList
      .filter((item) => {
        // Status filter
        if (statusFilter === "all") {
          // Exclude Terminated staff from Active Staff Directory
          if (item.computedStatus?.toLowerCase() === "terminated") {
            return false;
          }
        } else if (statusFilter === "terminated") {
          if (item.computedStatus?.toLowerCase() !== "terminated") {
            return false;
          }
        } else if (statusFilter === "duplicates") {
          if (!duplicateStaffIds.has(item.id)) {
            return false;
          }
        } else {
          if (item.computedStatus?.toLowerCase() !== statusFilter.toLowerCase()) {
            return false;
          }
        }
        // Department filter
        if (departmentFilter !== "all") {
          if (item.department !== departmentFilter) {
            return false;
          }
        }
        // Search filter
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = item.full_name?.toLowerCase().includes(q);
          const matchCode = item.staff_code?.toLowerCase().includes(q);
          const matchRole = item.role?.toLowerCase().includes(q);
          const matchDept = item.department?.toLowerCase().includes(q);
          const matchSsnit = item.ssnit_no?.toLowerCase().includes(q);
          const matchNia = item.nia_number?.toLowerCase().includes(q);
          const matchGender = item.gender?.toLowerCase().includes(q);
          const matchEmail = item.email?.toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchRole && !matchDept && !matchSsnit && !matchNia && !matchGender && !matchEmail) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = "";
        let valB: any = "";

        if (sortBy === "name") {
          valA = a.full_name || "";
          valB = b.full_name || "";
        } else if (sortBy === "endDate") {
          const fallback = sortOrder === "desc" ? 0 : 9999999999999;
          valA = a.currentContract?.end_date ? new Date(a.currentContract.end_date).getTime() : fallback;
          valB = b.currentContract?.end_date ? new Date(b.currentContract.end_date).getTime() : fallback;
        } else if (sortBy === "days") {
          const fallback = sortOrder === "desc" ? -9999 : 9999;
          valA = a.daysRemaining !== null && a.daysRemaining !== undefined ? a.daysRemaining : fallback;
          valB = b.daysRemaining !== null && b.daysRemaining !== undefined ? b.daysRemaining : fallback;
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [staffList, search, statusFilter, departmentFilter, sortBy, sortOrder]);

  // Pagination State (25 items per page)
  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination to page 1 whenever search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, departmentFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(processedStaff.length / PAGE_SIZE));

  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return processedStaff.slice(start, start + PAGE_SIZE);
  }, [processedStaff, currentPage]);

  const toggleSelectStaff = (id: number) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllPage = (pageStaff: any[]) => {
    const pageIds = pageStaff.map((s) => s.id);
    const allSelected = pageIds.every((id) => selectedStaffIds.includes(id));
    if (allSelected) {
      setSelectedStaffIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedStaffIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleBulkRenew = async () => {
    if (selectedStaffIds.length === 0) return;
    setBulkRenewing(true);
    setBulkMessage(null);
    try {
      const res = await fetch("/api/staff/bulk-renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffIds: selectedStaffIds }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Bulk renewal failed");
      }
      setBulkMessage(json.message);
      setSelectedStaffIds([]);
      await fetchStaff();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBulkRenewing(false);
    }
  };

  const toggleSort = (field: "name" | "endDate" | "days") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(field === "name" ? "asc" : "desc");
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header & Main Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Temporary Staff Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage rolling 6-month contracts, renewals, and terminations
            </p>
          </div>

          <button
            onClick={() => setShowAddStaffModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition self-start sm:self-auto"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New Staff</span>
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          {/* Tab Switcher: Active Staff vs Duplicate Staff vs Archived Staff */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                statusFilter === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Active Staff Directory</span>
            </button>

            <button
              onClick={() => setStatusFilter("duplicates")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                statusFilter === "duplicates"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800"
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span>Duplicate Records ({duplicateStaffIds.size})</span>
            </button>

            <button
              onClick={() => setStatusFilter("terminated")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                statusFilter === "terminated"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Archived Staff List (Terminated)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search name, code, role, dept..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Status Filter (Shadcn UI Select) */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Contract Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Active Staff Directory (Excludes Terminated)</SelectItem>
                <SelectItem value="duplicates">
                  Duplicate Records List ({duplicateStaffIds.size})
                </SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="expiring soon">Expiring Soon (≤30d)</SelectItem>
                <SelectItem value="expired">Expired Only</SelectItem>
                <SelectItem value="terminated">Archived Staff List (Terminated)</SelectItem>
              </SelectContent>
            </Select>

            {/* Station Filter (Shadcn UI Select) */}
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Stations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stations</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleSort("days")}
                className={`flex-1 px-3 py-2 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                  sortBy === "days"
                    ? sortOrder === "desc"
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300"
                      : "bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300"
                    : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span>Sort Expiration ({sortOrder.toUpperCase()})</span>
              </button>
            </div>
          </div>

          {/* Bulk Action Bar & Feedback */}
          {bulkMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <UserCheck className="h-4 w-4 shrink-0" />
              <span>{bulkMessage}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 pt-1 gap-2">
            <span>
              Showing <strong>{processedStaff.length}</strong> of {staffList.length} staff records
              {selectedStaffIds.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold">
                  ({selectedStaffIds.length} Selected)
                </span>
              )}
            </span>

            <div className="flex items-center gap-2">
              {selectedStaffIds.length > 0 && (
                <button
                  onClick={handleBulkRenew}
                  disabled={bulkRenewing}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${bulkRenewing ? "animate-spin" : ""}`} />
                  <span>{bulkRenewing ? "Renewing..." : `Bulk Renew Selected (${selectedStaffIds.length})`}</span>
                </button>
              )}

              {(search || statusFilter !== "all" || departmentFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setDepartmentFilter("all");
                    setSelectedStaffIds([]);
                  }}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Master Staff Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        paginatedStaff.length > 0 &&
                        paginatedStaff.every((s) => selectedStaffIds.includes(s.id))
                      }
                      onChange={() => toggleSelectAllPage(paginatedStaff)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                  </th>
                  <th className="px-4 py-3.5 cursor-pointer" onClick={() => toggleSort("name")}>
                    <div className="flex items-center gap-1">
                      <span>Staff Member</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3.5">Station / Role</th>
                  <th className="px-4 py-3.5">Contract Period</th>
                  <th className="px-4 py-3.5 cursor-pointer" onClick={() => toggleSort("days")}>
                    <div className="flex items-center gap-1">
                      <span>Days Remaining</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-center">Renewal #</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      Loading staff database records...
                    </td>
                  </tr>
                ) : processedStaff.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                      No matching staff records found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedStaff.map((staff) => {
                    const currentContract = staff.currentContract;
                    const status = staff.computedStatus;
                    const days = staff.daysRemaining;

                    return (
                      <tr
                        key={staff.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                          selectedStaffIds.includes(staff.id) ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                        }`}
                      >
                        {/* Checkbox Selection */}
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedStaffIds.includes(staff.id)}
                            onChange={() => toggleSelectStaff(staff.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                        </td>

                        {/* Name & Code */}
                        <td className="px-4 py-3.5">
                          <div>
                            <Link
                              href={`/staff/${staff.id}`}
                              className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                            >
                              {staff.full_name}
                            </Link>
                            <div className="font-mono text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-500">{staff.staff_code || `EMP-${staff.id}`}</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                  staff.ssnit_no
                                    ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                SSNIT: {staff.ssnit_no || "N/A"}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                  staff.nia_number
                                    ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                NIA: {staff.nia_number || "N/A"}
                              </span>
                              {staff.validations && staff.validations.length > 0 && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                    staff.validations[0].month.includes("(Supplementary)")
                                      ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                      : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                  }`}
                                >
                                  ✓ {staff.validations[0].month}
                                </span>
                              )}
                              {duplicateStaffIds.has(staff.id) && (
                                <button
                                  onClick={() => setMergeTarget(staff)}
                                  title="Click to Compare, Merge or Delete Duplicate Record"
                                  className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800 text-[10px] flex items-center gap-1 hover:bg-amber-100 transition animate-pulse"
                                >
                                  <AlertCircle className="h-3 w-3 text-amber-500" />
                                  <span>Duplicate Record (Click to Merge/Delete)</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Dept & Role */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {staff.department || "Unassigned"}
                          </div>
                          <div className="text-slate-500 text-[11px]">{staff.role || "Staff"}</div>
                        </td>

                        {/* Contract Dates */}
                        <td className="px-4 py-3.5">
                          {currentContract ? (
                            <div>
                              <div className="font-medium text-slate-800 dark:text-slate-200">
                                {formatDateReadable(currentContract.start_date)}
                              </div>
                              <div className="text-slate-500 text-[11px]">
                                to {formatDateReadable(currentContract.end_date)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No contract</span>
                          )}
                        </td>

                        {/* Days Remaining */}
                        <td className="px-4 py-3.5 font-medium">
                          {currentContract && !currentContract.is_terminated ? (
                            days !== null && days <= 30 ? (
                              <span className="font-bold text-amber-600 dark:text-amber-400">
                                {days <= 0 ? `0 days (${Math.abs(days)}d past)` : `${days} days`}
                              </span>
                            ) : (
                              <span className="text-slate-700 dark:text-slate-300">{days} days</span>
                            )
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3.5">
                          <StatusBadge status={status} daysRemaining={days} size="sm" />
                        </td>

                        {/* Renewal # */}
                        <td className="px-4 py-3.5 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {currentContract ? `#${currentContract.renewal_number}` : "-"}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Merge Duplicate Button */}
                            {duplicateStaffIds.has(staff.id) && (
                              <button
                                onClick={() => setMergeTarget(staff)}
                                title="Compare, Merge or Delete Duplicate Record"
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-100 transition"
                              >
                                <GitMerge className="h-4 w-4" />
                              </button>
                            )}

                            {/* Validate Button (Tick Icon) */}
                            <button
                              onClick={() => setValidateTarget(staff)}
                              disabled={status === "Expired" || status === "Terminated"}
                              title={
                                status === "Expired" || status === "Terminated"
                                  ? `Validation Disabled (${status} Staff)`
                                  : "Click to Validate Staff for Monthly Payment"
                              }
                              className={`p-1.5 rounded-lg transition ${
                                status === "Expired" || status === "Terminated"
                                  ? "text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-40"
                                  : "text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>

                            <Link
                              href={`/staff/${staff.id}`}
                              title="View Details & History"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>

                            {/* Renew Button (Active or Expiring) */}
                            {currentContract && !currentContract.is_terminated && (
                              <button
                                onClick={() => setRenewTarget(staff)}
                                title="Renew Contract (+6 Months)"
                                className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 dark:text-indigo-400 transition"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                            )}

                            {/* Terminate Button */}
                            {currentContract && !currentContract.is_terminated && (
                              <button
                                onClick={() => setTerminateTarget(staff)}
                                title="Terminate Early"
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            )}

                            {/* Reinstate Button (Terminated / Archived Staff) */}
                            {(status === "Terminated" || (currentContract && currentContract.is_terminated)) && (
                              <button
                                onClick={() => setReinstateTarget(staff)}
                                title="Reinstate Staff Member"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs transition ml-1"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Reinstate</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 25-Item Pagination Controls Footer Bar */}
          {processedStaff.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-950/40">
              <div className="text-slate-500 dark:text-slate-400 font-medium">
                Showing <strong>{Math.min((currentPage - 1) * PAGE_SIZE + 1, processedStaff.length)}</strong> to{" "}
                <strong>{Math.min(currentPage * PAGE_SIZE, processedStaff.length)}</strong> of{" "}
                <strong>{processedStaff.length}</strong> staff members
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  title="First Page"
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Previous Page"
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="px-3 py-1 font-bold text-slate-800 dark:text-slate-200">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Next Page"
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  title="Last Page"
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Renew Modal */}
      <RenewModal
        isOpen={!!renewTarget}
        onClose={() => setRenewTarget(null)}
        staff={renewTarget}
        onSuccess={fetchStaff}
      />

      {/* Terminate Modal */}
      <TerminateModal
        isOpen={!!terminateTarget}
        onClose={() => setTerminateTarget(null)}
        staff={terminateTarget}
        onSuccess={fetchStaff}
      />

      {/* Reinstate Modal */}
      <ReinstateModal
        isOpen={!!reinstateTarget}
        onClose={() => setReinstateTarget(null)}
        staff={reinstateTarget}
        onSuccess={fetchStaff}
      />

      {/* Modals */}
      <AddStaffModal
        isOpen={showAddStaffModal}
        onClose={() => setShowAddStaffModal(false)}
        onSuccess={() => fetchStaff()}
      />

      <ValidateStaffModal
        isOpen={!!validateTarget}
        staff={validateTarget}
        onClose={() => setValidateTarget(null)}
        onSuccess={() => fetchStaff()}
      />

      <MergeDuplicateModal
        isOpen={!!mergeTarget}
        staff={mergeTarget}
        allStaff={staffList}
        onClose={() => setMergeTarget(null)}
        onSuccess={() => fetchStaff()}
      />
    </SidebarLayout>
  );
}
