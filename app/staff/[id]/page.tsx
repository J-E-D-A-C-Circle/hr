"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SidebarLayout from "@/components/SidebarLayout";
import StatusBadge from "@/components/StatusBadge";
import RenewModal from "@/components/RenewModal";
import TerminateModal from "@/components/TerminateModal";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  ArrowLeft,
  User,
  CreditCard,
  ShieldCheck,
  History,
  Calendar,
  Building,
  Phone,
  DollarSign,
  RefreshCw,
  UserX,
  Edit,
  Check,
  AlertCircle,
  Clock,
  Hash,
} from "lucide-react";
import { formatDateReadable, formatDateToISO } from "@/lib/status";

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");

  const [staff, setStaff] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Modals state
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);

  useEffect(() => {
    Promise.resolve(params).then((unwrapped: any) => {
      if (unwrapped?.id) {
        setId(String(unwrapped.id));
      }
    });
  }, [params]);

  const fetchStaffDetails = async (targetId: string) => {
    if (!targetId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/${targetId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load staff member profile");
      }
      const currentContract = json.data.contracts?.find((c: any) => c.is_current) || json.data.contracts?.[0];
      setStaff(json.data);
      setEditForm({
        ...json.data,
        date_of_birth: json.data.date_of_birth ? formatDateToISO(new Date(json.data.date_of_birth)) : "",
        start_date: currentContract ? formatDateToISO(new Date(currentContract.start_date)) : "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStaffDetails(id);
    }
  }, [id]);

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_code: editForm.staff_code,
          full_name: editForm.full_name,
          date_of_birth: editForm.date_of_birth,
          gender: editForm.gender,
          email: editForm.email,
          ssnit_no: editForm.ssnit_no,
          nia_number: editForm.nia_number,
          role: editForm.role,
          department: editForm.department,
          phone: editForm.phone,
          bank_name: editForm.bank_name,
          bank_branch: editForm.bank_branch,
          bank_account: editForm.bank_account,
          salary: editForm.salary,
          start_date: editForm.start_date,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update profile");
      }

      setIsEditing(false);
      setSaveError(null);
      fetchStaffDetails(id);
    } catch (err: any) {
      setSaveError(err.message || "Failed to update profile");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center p-12 text-xs text-slate-400">
          Loading staff profile...
        </div>
      </SidebarLayout>
    );
  }

  if (error || !staff) {
    return (
      <SidebarLayout>
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <p className="text-rose-600 text-sm font-semibold">{error || "Staff profile not found"}</p>
          <Link href="/staff" className="text-xs text-indigo-600 underline font-semibold">
            Return to Staff Directory
          </Link>
        </div>
      </SidebarLayout>
    );
  }

  const currentContract = staff.currentContract;
  const isTerminated = currentContract?.is_terminated;

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Back Link & Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/staff"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Staff Directory</span>
          </Link>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saveLoading}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{saveLoading ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            )}

            {currentContract && !isTerminated && (
              <>
                <button
                  onClick={() => setShowRenewModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Renew Contract</span>
                </button>
                <button
                  onClick={() => setShowTerminateModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold hover:bg-rose-100 transition flex items-center gap-1.5"
                >
                  <UserX className="h-3.5 w-3.5" />
                  <span>Terminate</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Top Profile Overview Banner */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/20 shrink-0">
              {staff.full_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {staff.full_name}
                </h1>
                <StatusBadge
                  status={staff.computedStatus}
                  daysRemaining={staff.daysRemaining}
                  size="md"
                />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">
                  {staff.staff_code || `EMP-${staff.id}`}
                </span>
                {staff.ssnit_no && (
                  <span className="font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                    SSNIT: {staff.ssnit_no}
                  </span>
                )}
                {staff.nia_number && (
                  <span className="font-mono bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    NIA: {staff.nia_number}
                  </span>
                )}
                <span>•</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {staff.department || "Unassigned Station"}
                </span>
                <span>•</span>
                <span>{staff.role || "Temporary Staff"}</span>
              </div>
            </div>
          </div>

          {currentContract && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center gap-6">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Current Contract
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {formatDateReadable(currentContract.start_date)} → {formatDateReadable(currentContract.end_date)}
                </span>
              </div>
              <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-6">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Cycle Number
                </span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  Renewal #{currentContract.renewal_number}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Staff Details */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-500" />
              <span>Personal & Employment</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-0.5">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.full_name || ""}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                ) : (
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{staff.full_name}</span>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-indigo-500" />
                  <span>Date of Birth (DD/MM/YYYY)</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY (e.g. 25/08/1995)"
                    value={editForm.date_of_birth || ""}
                    onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                ) : (
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {staff.date_of_birth ? formatDateReadable(staff.date_of_birth) : "N/A"}
                  </span>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-0.5">Gender</label>
                {isEditing ? (
                  <Select
                    value={editForm.gender || ""}
                    onValueChange={(val) => setEditForm({ ...editForm, gender: val })}
                  >
                    <SelectTrigger className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Select Gender..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{staff.gender || "N/A"}</span>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-0.5">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email || ""}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                ) : (
                  <span className="font-medium text-slate-900 dark:text-slate-100">{staff.email || "N/A"}</span>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-0.5">Staff Code / Employee ID</label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editForm.staff_code || ""}
                      onChange={(e) => {
                        setSaveError(null);
                        setEditForm({ ...editForm, staff_code: e.target.value });
                      }}
                      className={`w-full p-2 border rounded-lg font-mono ${
                        saveError
                          ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                      }`}
                    />
                    {saveError && (
                      <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">
                        ⚠️ {saveError}
                      </p>
                    )}
                  </>
                ) : (
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{staff.staff_code || "N/A"}</span>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-0.5 flex items-center gap-1">
                  <Hash className="h-3 w-3 text-indigo-500" />
                  <span>SSNIT Number</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.ssnit_no || ""}
                    onChange={(e) => setEditForm({ ...editForm, ssnit_no: e.target.value })}
                    placeholder="e.g. C123456789012"
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 font-mono font-bold text-slate-900 dark:text-white"
                  />
                ) : (
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{staff.ssnit_no || "N/A (Not Provided)"}</span>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-0.5 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  <span>NIA Number (Ghana Card No)</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.nia_number || ""}
                    onChange={(e) => setEditForm({ ...editForm, nia_number: e.target.value })}
                    placeholder="e.g. GHA-712345678-9"
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 font-mono font-bold text-slate-900 dark:text-white"
                  />
                ) : (
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{staff.nia_number || "N/A (Not Provided)"}</span>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-0.5">Station / Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.department || ""}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                ) : (
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{staff.department || "N/A"}</span>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-0.5">Role / Position</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.role || ""}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                ) : (
                  <span className="font-medium text-slate-800 dark:text-slate-200">{staff.role || "N/A"}</span>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-0.5">Phone Contact</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.phone || ""}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                ) : (
                  <span className="font-medium text-slate-800 dark:text-slate-200">{staff.phone || "N/A"}</span>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-indigo-500" />
                  <span>Contract Start Date</span>
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editForm.start_date || ""}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
                  />
                ) : (
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {currentContract ? formatDateReadable(currentContract.start_date) : "N/A"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Financial & Payroll Info */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              <span>Payroll & Bank Details</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-0.5">Monthly Base Salary (GH₵)</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.salary || ""}
                    onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                ) : (
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {staff.salary ? `GH₵${Number(staff.salary).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "N/A"}
                  </span>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-0.5">Bank Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.bank_name || ""}
                    onChange={(e) => setEditForm({ ...editForm, bank_name: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                ) : (
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{staff.bank_name || "N/A"}</span>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-0.5">Bank Branch</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.bank_branch || ""}
                    onChange={(e) => setEditForm({ ...editForm, bank_branch: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                ) : (
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{staff.bank_branch || "N/A"}</span>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-0.5">Bank Account No.</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.bank_account || ""}
                    onChange={(e) => setEditForm({ ...editForm, bank_account: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-white"
                  />
                ) : (
                  <span className="font-mono text-slate-800 dark:text-slate-200">{staff.bank_account || "N/A"}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contract History Timeline Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" />
              <span>Full Contract History & Audit Log</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Total Cycles: {staff.contracts?.length || 0}
            </span>
          </div>

          <div className="space-y-4">
            {staff.contracts?.map((contract: any) => {
              const isCurrent = contract.is_current;
              const isTerminated = contract.is_terminated;

              return (
                <div
                  key={contract.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition ${
                    isCurrent
                      ? "border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/30 dark:bg-indigo-950/20"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-mono font-bold">
                        Renewal #{contract.renewal_number}
                      </span>

                      {isCurrent && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-md uppercase">
                          Current Active Contract
                        </span>
                      )}

                      {isTerminated && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-md uppercase">
                          Terminated
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 font-mono">
                      Recorded: {formatDateReadable(contract.created_at)}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">Contract Window:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatDateReadable(contract.start_date)} → {formatDateReadable(contract.end_date)}
                      </span>
                    </div>

                    {isTerminated && (
                      <div className="col-span-full mt-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 text-rose-600" />
                          <span>Terminated Early on {formatDateReadable(contract.termination_date)}</span>
                        </div>
                        <p className="text-[11px] pl-5">
                          <strong>Reason:</strong> {contract.termination_reason || "No details specified"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      <RenewModal
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        staff={staff}
        onSuccess={() => fetchStaffDetails(id as string)}
      />

      <TerminateModal
        isOpen={showTerminateModal}
        onClose={() => setShowTerminateModal(false)}
        staff={staff}
        onSuccess={() => fetchStaffDetails(id as string)}
      />
    </SidebarLayout>
  );
}
