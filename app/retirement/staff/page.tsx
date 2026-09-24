"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Filter,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  Building2,
  MapPin,
  Briefcase,
  Sparkles,
  ArrowUpDown,
  Edit2,
} from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StaffDirectoryPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-xs text-slate-500 animate-pulse">Loading staff directory...</div>}>
      <StaffDirectoryContent />
    </React.Suspense>
  );
}

function StaffDirectoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active Sub-tab state
  const initialTab = searchParams.get("tab") || "all";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["all", "due", "nearing", "retired", "departments"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabKey);
    router.replace(`/retirement/staff?${params.toString()}`);
  };

  // Staff Data & Department Data
  const [staffList, setStaffList] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination for Staff
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL_STATUS");
  const [deptFilter, setDeptFilter] = useState("ALL_DEPTS");
  const [genderFilter, setGenderFilter] = useState("ALL_GENDERS");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Nearing year filter
  const [nearingYearFilter, setNearingYearFilter] = useState<string>("ALL");

  // Stations & Departments state
  const [units, setUnits] = useState<any[]>([]);
  const [deptSummary, setDeptSummary] = useState<any>({
    totalUnits: 0,
    totalDepartments: 0,
    totalStations: 0,
    totalStaffAllocated: 0,
  });
  const [deptTypeFilter, setDeptTypeFilter] = useState<"ALL" | "DEPARTMENT" | "STATION">("ALL");
  const [deptSearch, setDeptSearch] = useState("");
  const [deptPage, setDeptPage] = useState(1);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any | null>(null);

  // Add Staff Form State
  const [addForm, setAddForm] = useState({
    staffId: "",
    fullName: "",
    dateOfBirth: "",
    gender: "Male",
    departmentId: "",
    jobTitle: "",
    grade: "",
    dateOfFirstAppointment: "",
    email: "",
    phone: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Department Form State
  const [deptForm, setDeptForm] = useState({
    code: "",
    name: "",
    type: "DEPARTMENT",
    location: "Head Office, Accra",
    headOfDept: "",
    description: "",
  });
  const [deptSaving, setDeptSaving] = useState(false);
  const [deptError, setDeptError] = useState<string | null>(null);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Fetch staff data when tab or filters change
  useEffect(() => {
    if (activeTab === "departments") {
      fetchDepartmentsData();
    } else {
      fetchStaff();
    }
  }, [activeTab, search, statusFilter, deptFilter, genderFilter, page, deptTypeFilter, deptSearch]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      // Tab specific status mapping
      if (activeTab === "due") {
        params.set("status", "DUE_THIS_YEAR");
      } else if (activeTab === "nearing") {
        params.set("status", "NEARING_RETIREMENT");
      } else if (activeTab === "retired") {
        params.set("status", "RETIRED");
      } else if (statusFilter && statusFilter !== "ALL_STATUS") {
        params.set("status", statusFilter);
      }

      if (deptFilter !== "ALL_DEPTS") params.set("departmentId", deptFilter);
      if (genderFilter !== "ALL_GENDERS") params.set("gender", genderFilter);
      params.set("page", page.toString());
      params.set("limit", "15");

      const res = await fetch(`/api/retirement/staff?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
        setDepartments(data.departments || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      }
    } catch (e) {
      console.error("Failed to fetch staff:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentsData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (deptTypeFilter !== "ALL") params.set("type", deptTypeFilter);
      if (deptSearch.trim()) params.set("search", deptSearch.trim());

      const res = await fetch(`/api/retirement/departments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUnits(data.units || []);
        if (data.summary) setDeptSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);

    try {
      const res = await fetch("/api/retirement/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Failed to create staff member.");
        setAddLoading(false);
        return;
      }
      setAddModalOpen(false);
      setAddForm({
        staffId: "",
        fullName: "",
        dateOfBirth: "",
        gender: "Male",
        departmentId: "",
        jobTitle: "",
        grade: "",
        dateOfFirstAppointment: "",
        email: "",
        phone: "",
      });
      fetchStaff();
    } catch (err) {
      setAddError("Network error occurred.");
      setAddLoading(false);
    }
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptSaving(true);
    setDeptError(null);

    try {
      const method = editingUnit ? "PUT" : "POST";
      const payload = editingUnit ? { ...deptForm, id: editingUnit.id } : deptForm;

      const res = await fetch("/api/retirement/departments", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setDeptModalOpen(false);
        fetchDepartmentsData();
      } else {
        const data = await res.json();
        setDeptError(data.error || "Failed to save department.");
      }
    } catch (e) {
      setDeptError("Failed to save department.");
    } finally {
      setDeptSaving(false);
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      const res = await fetch(`/api/retirement/departments?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchDepartmentsData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleValidateImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      fd.append("mode", "validate");

      const res = await fetch("/api/retirement/staff/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setImportPreview(data);
      } else {
        setImportMessage(data.error || "Import validation failed.");
      }
    } catch (e) {
      setImportMessage("Failed to validate spreadsheet.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      fd.append("mode", "commit");

      const res = await fetch("/api/retirement/staff/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setImportMessage(data.message);
        setTimeout(() => {
          setImportModalOpen(false);
          setImportFile(null);
          setImportPreview(null);
          fetchStaff();
        }, 1200);
      } else {
        setImportMessage(data.error || "Import commit failed.");
      }
    } catch (e) {
      setImportMessage("Import execution failed.");
    } finally {
      setImportLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL_STATUS");
    setDeptFilter("ALL_DEPTS");
    setGenderFilter("ALL_GENDERS");
    setPage(1);
  };

  // Nearing year filtering logic
  const filteredNearingStaff = activeTab === "nearing"
    ? staffList.filter((s) => {
        if (nearingYearFilter === "ALL") return true;
        const yrs = s.yearsRemaining;
        if (nearingYearFilter === "1") return yrs === 1 || (yrs === 0 && s.monthsRemaining >= 12);
        if (nearingYearFilter === "2") return yrs === 2;
        if (nearingYearFilter === "3") return yrs === 3;
        if (nearingYearFilter === "4") return yrs === 4;
        if (nearingYearFilter === "5") return yrs === 5;
        return true;
      })
    : staffList;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Users size={22} className="text-emerald-700" />
            <span>Staff Retirement Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive DVLA HR portal for active personnel, exit milestones, archives, and regional stations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "departments" ? (
            <button
              onClick={() => {
                setEditingUnit(null);
                setDeptForm({
                  code: "",
                  name: "",
                  type: "DEPARTMENT",
                  location: "Head Office, Accra",
                  headOfDept: "",
                  description: "",
                });
                setDeptModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-2 shadow-md"
            >
              <Plus size={16} />
              <span>Add Station / Dept</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setImportModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition flex items-center gap-2 shadow-xs"
              >
                <FileSpreadsheet size={15} className="text-emerald-600" />
                <span>Import Excel</span>
              </button>

              <a
                href="/api/retirement/reports?type=summary&export=excel"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition flex items-center gap-2 shadow-xs"
              >
                <Download size={15} className="text-amber-600" />
                <span>Export Excel</span>
              </a>

              <button
                onClick={() => setAddModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-2 shadow-md"
              >
                <Plus size={16} />
                <span>Add Staff</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub-Tabs Navigation Bar */}
      <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto shadow-xs border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => handleTabChange("all")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
            activeTab === "all"
              ? "bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users size={16} />
          <span>All Staff Directory</span>
        </button>

        <button
          onClick={() => handleTabChange("due")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
            activeTab === "due"
              ? "bg-amber-500 text-slate-950 shadow-sm font-black"
              : "text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
          }`}
        >
          <AlertTriangle size={16} className={activeTab === "due" ? "text-slate-950" : "text-amber-500"} />
          <span>Due This Year (&lt;1 Yr)</span>
        </button>

        <button
          onClick={() => handleTabChange("nearing")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
            activeTab === "nearing"
              ? "bg-white dark:bg-slate-900 text-yellow-700 dark:text-yellow-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Clock size={16} className="text-yellow-600" />
          <span>Nearing Retirement (1-5 Yrs)</span>
        </button>

        <button
          onClick={() => handleTabChange("retired")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
            activeTab === "retired"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <UserCheck size={16} />
          <span>Retired Archive</span>
        </button>

        <button
          onClick={() => handleTabChange("departments")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
            activeTab === "departments"
              ? "bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Building2 size={16} />
          <span>Stations & Departments</span>
        </button>
      </div>

      {/* Content Area Based on Active Sub-Tab */}
      {activeTab === "departments" ? (
        /* TAB: Stations & Departments CMS */
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Units</span>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{deptSummary.totalUnits}</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Tracked DVLA entities</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Building2 size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Directorates / Depts</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{deptSummary.totalDepartments}</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Head Office divisions</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <Briefcase size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Regional Stations</span>
                <div className="text-2xl font-black text-amber-600 mt-1">{deptSummary.totalStations}</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Regional offices in Ghana</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                <MapPin size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Staff</span>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{deptSummary.totalStaffAllocated}</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Allocated employees</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Users size={20} />
              </div>
            </div>
          </div>

          {/* Controls Bar for Departments */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setDeptTypeFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  deptTypeFilter === "ALL" ? "bg-slate-900 text-amber-400" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Entities ({summaryCount(units, "ALL")})
              </button>
              <button
                onClick={() => setDeptTypeFilter("DEPARTMENT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  deptTypeFilter === "DEPARTMENT" ? "bg-slate-900 text-amber-400" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Directorates ({summaryCount(units, "DEPARTMENT")})
              </button>
              <button
                onClick={() => setDeptTypeFilter("STATION")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  deptTypeFilter === "STATION" ? "bg-slate-900 text-amber-400" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Regional Stations ({summaryCount(units, "STATION")})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                placeholder="Search department, station code..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
              />
            </div>
          </div>

          {/* Departments Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading stations and departments...</div>
            ) : units.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">No departments or stations found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-6">Code</th>
                      <th className="py-3.5 px-6">Name / Title</th>
                      <th className="py-3.5 px-6">Type</th>
                      <th className="py-3.5 px-6">Location</th>
                      <th className="py-3.5 px-6">Head of Dept</th>
                      <th className="py-3.5 px-6">Staff Count</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {units.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-slate-100">{u.code}</td>
                        <td className="py-4 px-6 font-bold">{u.name}</td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              u.type === "STATION"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}
                          >
                            {u.type === "STATION" ? "Regional Station" : "Head Office Dept"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-400">{u.location || "Head Office, Accra"}</td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-400">{u.headOfDept || "Unassigned"}</td>
                        <td className="py-4 px-6 font-mono font-bold">{u._count?.staff || 0}</td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingUnit(u);
                              setDeptForm({
                                code: u.code,
                                name: u.name,
                                type: u.type || "DEPARTMENT",
                                location: u.location || "Head Office, Accra",
                                headOfDept: u.headOfDept || "",
                                description: u.description || "",
                              });
                              setDeptModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Unit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteDepartment(u.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Unit"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TABS: ALL STAFF / DUE / NEARING / RETIRED */
        <div className="space-y-6">
          {/* Shadcn UI Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by ID, name, title..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              {/* Status Filter (Shadcn UI Select) */}
              {activeTab === "all" && (
                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Retirement Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_STATUS">All Retirement Statuses</SelectItem>
                    <SelectItem value="ACTIVE">ACTIVE (&gt;5 Years)</SelectItem>
                    <SelectItem value="NEARING_RETIREMENT">NEARING RETIREMENT (1-5 Years)</SelectItem>
                    <SelectItem value="DUE_THIS_YEAR">DUE THIS YEAR (&lt;1 Year)</SelectItem>
                    <SelectItem value="RETIRED">RETIRED (Exited)</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Department Filter (Shadcn UI Select) */}
              <Select
                value={deptFilter}
                onValueChange={(val) => {
                  setDeptFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_DEPTS">All Departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Gender Filter (Shadcn UI Select) */}
              <Select
                value={genderFilter}
                onValueChange={(val) => {
                  setGenderFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_GENDERS">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>

              {/* Nearing Year filter if nearing tab active */}
              {activeTab === "nearing" && (
                <Select value={nearingYearFilter} onValueChange={(val) => setNearingYearFilter(val)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by Years Left" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Nearing (1-5 Yrs)</SelectItem>
                    <SelectItem value="1">1 Year Remaining</SelectItem>
                    <SelectItem value="2">2 Years Remaining</SelectItem>
                    <SelectItem value="3">3 Years Remaining</SelectItem>
                    <SelectItem value="4">4 Years Remaining</SelectItem>
                    <SelectItem value="5">5 Years Remaining</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {(search || statusFilter !== "ALL_STATUS" || deptFilter !== "ALL_DEPTS" || genderFilter !== "ALL_GENDERS") && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500">
                  Showing results matching active filters ({totalCount} total staff)
                </span>
                <button
                  onClick={clearFilters}
                  className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold text-[11px]"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Main Staff Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
                Loading staff records...
              </div>
            ) : filteredNearingStaff.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No staff records found matching criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-6">Staff ID</th>
                      <th className="py-3.5 px-6">Full Name</th>
                      <th className="py-3.5 px-6">Department</th>
                      <th className="py-3.5 px-6">Job Title</th>
                      <th className="py-3.5 px-6">Date of Birth</th>
                      <th className="py-3.5 px-6">Exit Date (Age 60)</th>
                      <th className="py-3.5 px-6">Time Remaining</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {filteredNearingStaff.map((staff) => (
                      <tr key={staff.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {staff.staffId}
                        </td>
                        <td className="py-4 px-6 font-semibold">
                          <div>
                            <p>{staff.fullName}</p>
                            <span className="text-[10px] text-slate-400 font-normal">{staff.gender} &bull; {staff.grade || "DVLA Staff"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                          {staff.departmentName || "General"}
                        </td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                          {staff.jobTitle}
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-600 dark:text-slate-400">
                          {staff.dateOfBirthFormatted}
                        </td>
                        <td className="py-4 px-6 font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {staff.retirementDateFormatted}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              staff.computedStatus === "DUE_THIS_YEAR"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                                : staff.computedStatus === "NEARING_RETIREMENT"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : staff.computedStatus === "RETIRED"
                                ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}
                          >
                            {staff.timeRemainingFormatted}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/retirement/staff/${staff.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Page {page} of {totalPages} ({totalCount} total staff)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-200 transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-200 transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Add Staff Member */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Add New DVLA Staff Member</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {addError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddStaffSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Staff ID *</label>
                  <input
                    type="text"
                    required
                    value={addForm.staffId}
                    onChange={(e) => setAddForm({ ...addForm, staffId: e.target.value })}
                    placeholder="e.g. DVLA-10088"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.fullName}
                    onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                    placeholder="e.g. Kwame Mensah"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={addForm.dateOfBirth}
                    onChange={(e) => setAddForm({ ...addForm, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Gender *</label>
                  <Select
                    value={addForm.gender}
                    onValueChange={(val) => setAddForm({ ...addForm, gender: val })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Department</label>
                  <Select
                    value={addForm.departmentId}
                    onValueChange={(val) => setAddForm({ ...addForm, departmentId: val })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={addForm.jobTitle}
                    onChange={(e) => setAddForm({ ...addForm, jobTitle: e.target.value })}
                    placeholder="e.g. Senior Licensing Officer"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow transition"
                >
                  {addLoading ? "Saving..." : "Create Staff Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Station / Department Add/Edit */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {editingUnit ? "Edit Station / Department" : "Add New Station / Department"}
              </h3>
              <button onClick={() => setDeptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {deptError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{deptError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDepartment} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    placeholder="e.g. ACC-HQ, KMA-REG"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Entity Type *</label>
                  <Select
                    value={deptForm.type}
                    onValueChange={(val) => setDeptForm({ ...deptForm, type: val })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEPARTMENT">Head Office Department</SelectItem>
                      <SelectItem value="STATION">Regional Operating Station</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Name / Title *</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Directorate of Driver Training"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    value={deptForm.location}
                    onChange={(e) => setDeptForm({ ...deptForm, location: e.target.value })}
                    placeholder="e.g. Kumasi, Ashanti"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Head of Department</label>
                  <input
                    type="text"
                    value={deptForm.headOfDept}
                    onChange={(e) => setDeptForm({ ...deptForm, headOfDept: e.target.value })}
                    placeholder="e.g. Ing. Ernest Obeng"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deptSaving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow transition"
                >
                  {deptSaving ? "Saving..." : "Save Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Import Excel */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Import Staff Excel File</h3>
              <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full p-2 border rounded-xl bg-slate-50"
              />

              {importFile && !importPreview && (
                <button
                  onClick={handleValidateImport}
                  disabled={importLoading}
                  className="w-full py-2 bg-emerald-600 text-white font-bold rounded-xl"
                >
                  {importLoading ? "Validating Excel..." : "Validate Spreadsheet"}
                </button>
              )}

              {importPreview && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl font-semibold">
                    Validation complete: {importPreview.validCount} valid rows ready for import.
                  </div>
                  <button
                    onClick={handleCommitImport}
                    disabled={importLoading}
                    className="w-full py-2 bg-amber-500 text-slate-950 font-bold rounded-xl shadow"
                  >
                    {importLoading ? "Importing..." : "Commit & Import Staff Data"}
                  </button>
                </div>
              )}

              {importMessage && (
                <p className="text-center font-bold text-emerald-700">{importMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function summaryCount(units: any[], type: string) {
  if (type === "ALL") return units.length;
  return units.filter((u) => u.type === type).length;
}
