"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Filter,
  Briefcase,
  ShieldAlert,
} from "lucide-react";

export default function DepartmentsCMSPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalUnits: 0,
    totalDepartments: 0,
    totalStations: 0,
    totalStaffAllocated: 0,
  });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "DEPARTMENT" | "STATION">("ALL");
  const [search, setSearch] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 8;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "DEPARTMENT",
    location: "Head Office, Accra",
    headOfDept: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUnits();
  }, [typeFilter, search]);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/retirement/departments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUnits(data.units || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingUnit(null);
    setFormData({
      code: "",
      name: "",
      type: typeFilter === "STATION" ? "STATION" : "DEPARTMENT",
      location: typeFilter === "STATION" ? "Regional Office" : "Head Office, Accra",
      headOfDept: "",
      description: "",
    });
    setErrorMessage(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (unit: any) => {
    setEditingUnit(unit);
    setFormData({
      code: unit.code,
      name: unit.name,
      type: unit.type || "DEPARTMENT",
      location: unit.location || "Head Office, Accra",
      headOfDept: unit.headOfDept || "",
      description: unit.description || "",
    });
    setErrorMessage(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);

    try {
      const url = editingUnit
        ? `/api/retirement/departments/${editingUnit.id}`
        : "/api/retirement/departments";
      const method = editingUnit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to save station/department.");
        setSaving(false);
        return;
      }

      setSuccessMessage(
        editingUnit
          ? `Unit '${formData.name}' updated successfully.`
          : `New unit '${formData.name}' added successfully.`
      );
      setTimeout(() => setSuccessMessage(null), 3500);

      setModalOpen(false);
      fetchUnits();
    } catch (e: any) {
      setErrorMessage(e.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDelete = (unit: any) => {
    setUnitToDelete(unit);
    setErrorMessage(null);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!unitToDelete) return;
    setDeleting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/retirement/departments/${unitToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to delete unit.");
        setDeleting(false);
        return;
      }

      setSuccessMessage(`Unit '${unitToDelete.name}' deleted successfully.`);
      setTimeout(() => setSuccessMessage(null), 3500);

      setDeleteModalOpen(false);
      setUnitToDelete(null);
      fetchUnits();
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to delete unit.");
    } finally {
      setDeleting(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(units.length / limit) || 1;
  const paginatedUnits = units.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <Building2 size={22} />
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              DVLA Stations & Departments CMS
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage DVLA Directorates, Divisions, and Regional Operating Stations across Ghana.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add Station / Department</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Units</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{summary.totalUnits}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Tracked DVLA entities</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Building2 size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Directorates / Depts</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{summary.totalDepartments}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Head Office divisions</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
            <Briefcase size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Regional Stations</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{summary.totalStations}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Regional offices in Ghana</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
            <MapPin size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Staff</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{summary.totalStaffAllocated}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Employees allocated</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Users size={20} />
          </div>
        </div>
      </div>

      {/* 3. Controls Bar: Filter Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => {
              setTypeFilter("ALL");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              typeFilter === "ALL"
                ? "bg-slate-900 text-amber-400 dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            All Units ({summary.totalUnits})
          </button>

          <button
            onClick={() => {
              setTypeFilter("DEPARTMENT");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              typeFilter === "DEPARTMENT"
                ? "bg-emerald-800 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Departments ({summary.totalDepartments})
          </button>

          <button
            onClick={() => {
              setTypeFilter("STATION");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              typeFilter === "STATION"
                ? "bg-amber-500 text-slate-950 font-black"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Regional Stations ({summary.totalStations})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search code, name, location..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* 4. Units Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 animate-pulse">Loading stations and departments...</div>
        ) : units.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No departments or stations found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Unit Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Location / Region</th>
                  <th className="py-3 px-4">Head of Unit / Manager</th>
                  <th className="py-3 px-4 text-center">Staff Count</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {unit.code}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{unit.name}</p>
                      {unit.description && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{unit.description}</p>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          unit.type === "STATION"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                        }`}
                      >
                        {unit.type === "STATION" ? "Regional Station" : "Department"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-amber-500 shrink-0" />
                        <span>{unit.location || "N/A"}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {unit.headOfDept || "Unassigned"}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="px-2.5 py-1 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                        {unit.totalStaff} staff
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(unit)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
                          title="Edit Unit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(unit)}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition"
                          title="Delete Unit"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && units.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page <strong className="text-slate-900 dark:text-slate-100">{page}</strong> of <strong className="text-slate-900 dark:text-slate-100">{totalPages}</strong> ({units.length} total units)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Building2 size={16} className="text-amber-500" />
                <span>{editingUnit ? "Edit Unit" : "Add Station / Department"}</span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-semibold">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Unit Type Radio */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Unit Category</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer font-bold transition ${
                      formData.type === "DEPARTMENT"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="unitType"
                      value="DEPARTMENT"
                      checked={formData.type === "DEPARTMENT"}
                      onChange={() => setFormData({ ...formData, type: "DEPARTMENT" })}
                    />
                    <span>Department / Directorate</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer font-bold transition ${
                      formData.type === "STATION"
                        ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-800 dark:text-amber-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="unitType"
                      value="STATION"
                      checked={formData.type === "STATION"}
                      onChange={() => setFormData({ ...formData, type: "STATION" })}
                    />
                    <span>Regional Station</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STN-KMS"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase font-bold outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kumasi Regional Station"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Location / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Ashanti Region, Kumasi"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Head of Unit / Manager</label>
                  <input
                    type="text"
                    placeholder="e.g. Ing. Richard Mensah"
                    value={formData.headOfDept}
                    onChange={(e) => setFormData({ ...formData, headOfDept: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description / Scope</label>
                <textarea
                  rows={2}
                  placeholder="Optional brief description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow transition flex items-center gap-1.5"
                >
                  <span>{saving ? "Saving..." : editingUnit ? "Update Unit" : "Create Unit"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deleteModalOpen && unitToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert size={24} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Delete Unit Confirmation
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-slate-100">{unitToDelete.name}</strong> ({unitToDelete.code})?
            </p>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow transition flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>{deleting ? "Deleting..." : "Delete Unit"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
