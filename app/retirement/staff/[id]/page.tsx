"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  Award,
  Bell,
  CheckCircle2,
  Edit,
  Trash2,
  ShieldAlert,
  User,
  Mail,
  Phone,
  AlertCircle,
  X,
} from "lucide-react";
import { format } from "date-fns";

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [staff, setStaff] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    fetchStaffDetails();
  }, [id]);

  const fetchStaffDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/retirement/staff/${id}`);
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff);
        setAlerts(data.alerts || []);
        setAuditLogs(data.auditLogs || []);
        setEditForm({
          fullName: data.staff.fullName,
          dateOfBirth: new Date(data.staff.dateOfBirth).toISOString().split("T")[0],
          gender: data.staff.gender,
          departmentId: data.staff.departmentId || "",
          jobTitle: data.staff.jobTitle,
          grade: data.staff.grade || "",
          dateOfFirstAppointment: data.staff.dateOfFirstAppointment
            ? new Date(data.staff.dateOfFirstAppointment).toISOString().split("T")[0]
            : "",
          email: data.staff.email || "",
          phone: data.staff.phone || "",
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/retirement/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Failed to update staff member.");
        setEditLoading(false);
        return;
      }
      setEditModalOpen(false);
      fetchStaffDetails();
    } catch (e) {
      setEditError("Failed to update staff record.");
      setEditLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm(`Are you sure you want to deactivate staff record ${staff.staffId}?`)) return;
    try {
      const res = await fetch(`/api/retirement/staff/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/retirement/staff");
      }
    } catch (e) {
      alert("Failed to deactivate staff member.");
    }
  };

  if (loading || !staff) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  const dofaFormatted = staff.dateOfFirstAppointment
    ? format(new Date(staff.dateOfFirstAppointment), "dd MMM yyyy")
    : "N/A";
  const dobFormatted = format(new Date(staff.dateOfBirth), "dd MMM yyyy");

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/retirement/staff"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Staff Directory</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition flex items-center gap-1.5"
          >
            <Edit size={14} className="text-amber-600" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={handleDeactivate}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 transition flex items-center gap-1.5 border border-rose-200 dark:border-rose-900/40"
          >
            <Trash2 size={14} />
            <span>Deactivate</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-amber-400 font-bold text-xl flex items-center justify-center border border-slate-700 shadow-md">
            {staff.fullName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{staff.fullName}</h1>
              <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                {staff.staffId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {staff.jobTitle} &bull; {staff.grade || "Officer"} &bull; {staff.departmentName || "Unassigned"}
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              {staff.email && (
                <span className="flex items-center gap-1">
                  <Mail size={13} className="text-slate-400" />
                  <span>{staff.email}</span>
                </span>
              )}
              {staff.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={13} className="text-slate-400" />
                  <span>{staff.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase inline-block ${
              staff.computedStatus === "DUE_THIS_YEAR"
                ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200"
                : staff.computedStatus === "NEARING_RETIREMENT"
                ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border border-amber-200"
                : staff.computedStatus === "RETIRED"
                ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                : "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-200"
            }`}
          >
            {staff.statusLabel}
          </span>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2">
            Time Remaining: <strong className="font-mono">{staff.timeRemainingFormatted}</strong>
          </p>
        </div>
      </div>

      {/* Retirement Progress Bar Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-lg border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-amber-400 uppercase tracking-wider">Statutory Career Progression</span>
          <span className="font-mono text-slate-300">{staff.percentageCompleted}% Career Served</span>
        </div>

        <div className="h-3.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
          <div
            style={{ width: `${staff.percentageCompleted}%` }}
            className={`h-full rounded-full transition-all duration-500 ${
              staff.computedStatus === "DUE_THIS_YEAR"
                ? "bg-rose-500"
                : staff.computedStatus === "NEARING_RETIREMENT"
                ? "bg-amber-500"
                : staff.computedStatus === "RETIRED"
                ? "bg-slate-400"
                : "bg-emerald-500"
            }`}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>First Appointed: {dofaFormatted}</span>
          <span>
            Expected Retirement Date: <strong className="text-white font-mono">{staff.retirementDateFormatted}</strong>
          </span>
        </div>
      </div>

      {/* 2-Column Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Appointment & Personal Info */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
            Appointment Information
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Date of Birth</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{dobFormatted}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Current Age</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{staff.currentAgeFormatted}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Gender</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{staff.gender}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Date of First Appointment</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{dofaFormatted}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Department</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{staff.departmentName || "N/A"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Job Title / Grade</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{staff.jobTitle} ({staff.grade || "Officer"})</span>
            </div>
          </div>
        </div>

        {/* Right: Retirement & Alert Milestones */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
            Retirement & Milestone Alerts
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
              <span className="text-slate-500">Statutory Retirement Age:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">60 Years</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
              <span className="text-slate-500">Statutory Exit Date:</span>
              <span className="font-mono font-bold text-amber-600">{staff.retirementDateFormatted}</span>
            </div>

            <div className="pt-2">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Triggered Milestone History</h4>
              {alerts.length > 0 ? (
                <div className="space-y-2">
                  {alerts.map((a) => (
                    <div key={a.id} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Bell size={14} className="text-amber-500" />
                        <span className="font-bold">{a.milestone.replace("_", " ")} Alert</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Triggered {format(new Date(a.triggeredAt), "dd MMM yyyy")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic text-[11px]">No milestone alerts triggered yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal Dialog */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Edit Staff Record</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div className="m-6 mb-0 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.fullName || ""}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth || ""}
                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Job Title</label>
                  <input
                    type="text"
                    value={editForm.jobTitle || ""}
                    onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Grade</label>
                  <input
                    type="text"
                    value={editForm.grade || ""}
                    onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow"
                >
                  {editLoading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
