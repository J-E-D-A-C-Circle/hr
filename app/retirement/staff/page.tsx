"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Sparkles,
  ArrowUpDown,
} from "lucide-react";

export default function StaffDirectoryPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Add Form State
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

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, [search, statusFilter, deptFilter, genderFilter, page]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (deptFilter !== "ALL") params.set("departmentId", deptFilter);
      if (genderFilter !== "ALL") params.set("gender", genderFilter);
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
    } catch (err: any) {
      setAddError("Network error occurred.");
      setAddLoading(false);
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
    setStatusFilter("");
    setDeptFilter("ALL");
    setGenderFilter("ALL");
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Staff Retirement Directory</h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitor and manage all DVLA personnel statutory retirement schedules.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Filter Bar */}
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-slate-100"
          >
            <option value="">All Retirement Statuses</option>
            <option value="ACTIVE">ACTIVE (&gt;5 Years)</option>
            <option value="NEARING_RETIREMENT">NEARING RETIREMENT (1-5 Years)</option>
            <option value="DUE_THIS_YEAR">DUE THIS YEAR (&lt;1 Year)</option>
            <option value="RETIRED">RETIRED (Exited)</option>
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-slate-100"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id.toString()}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Gender Filter */}
          <select
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-slate-100"
          >
            <option value="ALL">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        {(search || statusFilter || deptFilter !== "ALL" || genderFilter !== "ALL") && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500">Showing filtered results ({totalCount} records)</span>
            <button onClick={clearFilters} className="text-xs font-semibold text-rose-600 hover:underline">
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Staff Master Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading staff records...</div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No staff members found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or add a new staff member.</p>
            <button onClick={clearFilters} className="mt-4 text-xs font-bold text-amber-600 hover:underline">
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-6">Staff ID</th>
                  <th className="py-3.5 px-6">Full Name</th>
                  <th className="py-3.5 px-6">Gender</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Job Title / Grade</th>
                  <th className="py-3.5 px-6">Current Age</th>
                  <th className="py-3.5 px-6">Retirement Date</th>
                  <th className="py-3.5 px-6">Time Remaining</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-slate-100">{staff.staffId}</td>
                    <td className="py-4 px-6 font-semibold">{staff.fullName}</td>
                    <td className="py-4 px-6 text-slate-500">{staff.gender}</td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400">{staff.departmentName || "Unassigned"}</td>
                    <td className="py-4 px-6">
                      <p className="font-medium">{staff.jobTitle}</p>
                      <p className="text-[10px] text-slate-400">{staff.grade || "N/A"}</p>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-700 dark:text-slate-300">{staff.currentAgeFormatted}</td>
                    <td className="py-4 px-6 font-mono text-slate-700 dark:text-slate-300">{staff.retirementDateFormatted}</td>
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold">{staff.timeRemainingFormatted}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                          staff.computedStatus === "DUE_THIS_YEAR"
                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200"
                            : staff.computedStatus === "NEARING_RETIREMENT"
                            ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200"
                            : staff.computedStatus === "RETIRED"
                            ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-200"
                        }`}
                      >
                        {staff.statusLabel}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/retirement/staff/${staff.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        <Eye size={13} />
                        <span>Profile</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {page} of {totalPages} ({totalCount} total staff)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Add New Staff Member</h3>
                <p className="text-xs text-slate-500">Statutory retirement age 60 will be calculated automatically.</p>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {addError && (
              <div className="m-6 mb-0 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddStaffSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Staff ID *</label>
                  <input
                    type="text"
                    value={addForm.staffId}
                    onChange={(e) => setAddForm({ ...addForm, staffId: e.target.value })}
                    placeholder="e.g. DVLA-10040"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={addForm.fullName}
                    onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                    placeholder="e.g. Kwame Mensah"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    value={addForm.dateOfBirth}
                    onChange={(e) => setAddForm({ ...addForm, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Gender *</label>
                  <select
                    value={addForm.gender}
                    onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <select
                    value={addForm.departmentId}
                    onChange={(e) => setAddForm({ ...addForm, departmentId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id.toString()}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Job Title *</label>
                  <input
                    type="text"
                    value={addForm.jobTitle}
                    onChange={(e) => setAddForm({ ...addForm, jobTitle: e.target.value })}
                    placeholder="e.g. Senior Officer"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Grade Level</label>
                  <input
                    type="text"
                    value={addForm.grade}
                    onChange={(e) => setAddForm({ ...addForm, grade: e.target.value })}
                    placeholder="e.g. Grade 10"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date of First Appointment</label>
                  <input
                    type="date"
                    value={addForm.dateOfFirstAppointment}
                    onChange={(e) => setAddForm({ ...addForm, dateOfFirstAppointment: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="k.mensah@dvla.gov.gh"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="+233 24 000 0000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow"
                >
                  {addLoading ? "Saving..." : "Save Staff Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Excel Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Bulk Import Staff Spreadsheet</h3>
                <p className="text-xs text-slate-500">Upload Excel (.xlsx) or CSV file with staff retirement records.</p>
              </div>
              <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-6 w-6 text-amber-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Need a sample template?</p>
                    <p className="text-[11px] text-slate-500">Download formatted template with columns for Staff ID, DOB, etc.</p>
                  </div>
                </div>
                <a
                  href="/api/retirement/staff/import"
                  className="px-3 py-1.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 transition"
                >
                  Download Template
                </a>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Select File</label>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImportFile(e.target.files[0]);
                      setImportPreview(null);
                      setImportMessage(null);
                    }
                  }}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-amber-400 hover:file:bg-slate-800 cursor-pointer"
                />
              </div>

              {importMessage && (
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {importMessage}
                </div>
              )}

              {importFile && !importPreview && (
                <button
                  onClick={handleValidateImport}
                  disabled={importLoading}
                  className="w-full py-2.5 bg-slate-900 text-amber-400 font-bold text-xs rounded-xl hover:bg-slate-800 transition"
                >
                  {importLoading ? "Validating Spreadsheet..." : "Validate Spreadsheet"}
                </button>
              )}

              {importPreview && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-500">TOTAL ROWS</p>
                      <p className="text-lg font-black">{importPreview.totalRecords}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 rounded-xl">
                      <p className="text-[10px] font-bold">VALID RECORDS</p>
                      <p className="text-lg font-black">{importPreview.validCount}</p>
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 rounded-xl">
                      <p className="text-[10px] font-bold">INVALID / DUPLICATES</p>
                      <p className="text-lg font-black">{importPreview.invalidCount}</p>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 divide-y divide-slate-100 text-xs">
                    {importPreview.records.map((r: any, idx: number) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <div>
                          <p className="font-bold">
                            Row {r.rowNum}: {r.fullName} ({r.staffId})
                          </p>
                          {r.errors.length > 0 ? (
                            <p className="text-[10px] text-rose-600 font-semibold">{r.errors.join(", ")}</p>
                          ) : (
                            <p className="text-[10px] text-emerald-600">
                              Valid &bull; Retires {r.calculation?.retirementDateFormatted}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            r.isValid ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {r.isValid ? "Ready" : "Flagged"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleCommitImport}
                    disabled={importLoading || importPreview.validCount === 0}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition disabled:opacity-40"
                  >
                    {importLoading ? "Importing..." : `Confirm & Import ${importPreview.validCount} Valid Records`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
