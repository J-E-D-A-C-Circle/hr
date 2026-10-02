"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Building,
  CreditCard,
  FileText,
  Clock,
  History,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  Award,
  DollarSign,
  UserCheck,
  Pencil,
  Download,
  ArrowRightLeft,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { formatDateReadable } from "@/lib/status";

interface ViewStaffDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any | null;
  currentUserRole?: string;
  currentUserName?: string;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
  onEdit?: (staff: any) => void;
}

export default function ViewStaffDetailModal({
  isOpen,
  onClose,
  staff,
  currentUserRole = "HR Manager",
  currentUserName = "Admin",
  onApprove,
  onReject,
  onEdit,
}: ViewStaffDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "audit">("details");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [rejecting, setRejecting] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [processingEditAction, setProcessingEditAction] = useState<boolean>(false);

  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [newStation, setNewStation] = useState<string>("");
  const [transferReason, setTransferReason] = useState<string>("");
  const [transferLoading, setTransferLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && staff?.id) {
      setActiveTab("details");
      setRejecting(false);
      setRejectReason("");
      fetchStaffAuditLogs(staff.id);
    }
  }, [isOpen, staff]);

  const fetchStaffAuditLogs = async (staffId: number) => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/audit-logs?staff_id=${staffId}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setAuditLogs(json.data || []);
      }
    } catch (err) {
      console.error("Error fetching staff audit logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleApproveEditRequest = async () => {
    if (!staff?.id) return;
    setProcessingEditAction(true);
    try {
      const res = await fetch(`/api/staff/${staff.id}/approve-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name: currentUserName, user_role: currentUserRole }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to approve edit request");
      if (onApprove) onApprove();
      else if (onClose) onClose();
    } catch (err: any) {
      alert(err.message || "Failed to approve edit request.");
    } finally {
      setProcessingEditAction(false);
    }
  };

  const handleRejectEditRequest = async () => {
    if (!staff?.id) return;
    setProcessingEditAction(true);
    try {
      const res = await fetch(`/api/staff/${staff.id}/reject-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: currentUserName,
          user_role: currentUserRole,
          rejection_reason: rejectReason || "Edit request rejected by Approval Officer",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to reject edit request");
      if (onReject) onReject("Edit request rejected");
      else if (onClose) onClose();
    } catch (err: any) {
      alert(err.message || "Failed to reject edit request.");
    } finally {
      setProcessingEditAction(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStation.trim()) {
      alert("New Station / Department is required.");
      return;
    }
    setTransferLoading(true);
    try {
      const res = await fetch(`/api/staff/${staff.id}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_department: newStation.trim(),
          transfer_reason: transferReason.trim(),
          user_name: currentUserName,
          user_role: currentUserRole,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to transfer staff member station");
      alert(json.message || "Station transfer request processed successfully.");
      setShowTransferModal(false);
      if (onApprove) onApprove();
      else fetchStaffAuditLogs(staff.id);
    } catch (err: any) {
      alert(err.message || "Failed to transfer station.");
    } finally {
      setTransferLoading(false);
    }
  };

  const handleExportStaffLogs = () => {
    if (!auditLogs || auditLogs.length === 0) return;
    const headers = ["Timestamp", "User Name", "User Role", "Action", "Details"];
    const rows = auditLogs.map((log) => [
      `"${new Date(log.created_at).toLocaleString("en-GB")}"`,
      `"${log.user_name || ""}"`,
      `"${log.user_role || ""}"`,
      `"${log.action || ""}"`,
      `"${(log.details || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${(staff?.full_name || "Staff").replace(/\s+/g, "_")}_Activity_Log.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !staff) return null;

  const currentContract = staff.contracts?.find((c: any) => c.is_current) || staff.contracts?.[0] || staff.currentContract;
  const approvalStatus = staff.approval_status || "APPROVED";
  const isPending = approvalStatus === "PENDING_APPROVAL";
  const isRejected = approvalStatus === "REJECTED";

  const roleUpper = (currentUserRole || "").toUpperCase();
  const canApproveReject =
    roleUpper.includes("MANAGER") ||
    roleUpper.includes("DIRECTOR") ||
    roleUpper.includes("ADMIN") ||
    roleUpper.includes("SUPER") ||
    roleUpper.includes("LEAD") ||
    roleUpper.includes("APPROVAL");

  const canSeeAuditTab =
    roleUpper.includes("MANAGER") ||
    roleUpper.includes("DIRECTOR") ||
    roleUpper.includes("ADMIN") ||
    roleUpper.includes("SUPER");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-lg border border-emerald-200 dark:border-emerald-800">
              {(staff.full_name || "S").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {staff.full_name}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold">
                  {staff.staff_code || `EMP-${staff.id}`}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span>{staff.department || "General Station"}</span>
                <span>•</span>
                <span>{staff.role || "Temporary Staff"}</span>
                {isPending && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-600" />
                    Pending Approval
                  </span>
                )}
                {isRejected && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-rose-600" />
                    Rejected
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(staff);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition"
                title="Edit Employee Data"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit Data</span>
              </button>
            )}

            {/* Station Transfer Button (Only allowed if contract is Active) */}
            <button
              onClick={() => {
                setNewStation(staff.department || "");
                setTransferReason("");
                setShowTransferModal(true);
              }}
              disabled={staff.computedStatus !== "Active" && currentContract?.is_terminated}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
              title={
                staff.computedStatus === "Active" || !currentContract?.is_terminated
                  ? "Transfer Staff Member to New Station / Location"
                  : "Transfer Disabled (Contract is not active)"
              }
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>Transfer Station</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/30 dark:bg-slate-950/20 shrink-0">
          <button
            onClick={() => setActiveTab("details")}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === "details"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Staff Bio & Details</span>
          </button>

          {canSeeAuditTab && (
            <button
              onClick={() => setActiveTab("audit")}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                activeTab === "audit"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <History className="h-4 w-4" />
              <span>Activity & Audit Log ({auditLogs.length})</span>
            </button>
          )}
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {activeTab === "details" ? (
            <div className="space-y-6">
              {/* Status & Salary Header Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                    Contract Status
                  </span>
                  <div className="mt-1">
                    <StatusBadge status={staff.computedStatus || "Active"} size="sm" />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                    Monthly Basic Salary
                  </span>
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-1 block">
                    GH₵{staff.salary ? Number(staff.salary).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "1,400.00"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                    Approval Workflow
                  </span>
                  <span className={`font-bold text-xs mt-1 block ${isPending || approvalStatus === "PENDING_EDIT_APPROVAL" ? "text-amber-600" : isRejected ? "text-rose-600" : "text-emerald-600"}`}>
                    {approvalStatus === "PENDING_APPROVAL"
                      ? "Pending New Staff Approval"
                      : approvalStatus === "PENDING_EDIT_APPROVAL" || staff.pending_edits
                      ? "Pending Edit Approval"
                      : approvalStatus}
                  </span>
                </div>
              </div>

              {/* Pending Employee Edit Request Comparison Card */}
              {staff.pending_edits && (() => {
                let editObj: any = null;
                try { editObj = JSON.parse(staff.pending_edits); } catch {}
                if (!editObj || !editObj.changes) return null;
                const changes = editObj.changes;
                const changedEntries = Object.entries(changes).filter(([k, v]) => {
                  if (v === undefined || v === null || v === "") return false;
                  let curr: any = (staff as any)[k];
                  if (k === "salary") curr = staff.salary ? String(staff.salary) : "";
                  return String(v) !== String(curr || "");
                });

                return (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Pencil className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <h4 className="font-bold text-amber-900 dark:text-amber-100 text-xs">
                          Pending Employee Edit Request Submitted by {editObj.requested_by || "HR Officer"}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 font-semibold">
                        {formatDateReadable(editObj.requested_at)}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/80 overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-amber-100/60 dark:bg-amber-950/80 text-amber-950 dark:text-amber-100 font-bold text-[11px]">
                          <tr>
                            <th className="p-2 border-b border-amber-200 dark:border-amber-800">Field Name</th>
                            <th className="p-2 border-b border-amber-200 dark:border-amber-800">Current Profile Value</th>
                            <th className="p-2 border-b border-amber-200 dark:border-amber-800">Requested Edit Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100 dark:divide-amber-900/40 font-medium">
                          {changedEntries.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="p-3 text-center text-slate-500 italic">No field differences detected.</td>
                            </tr>
                          ) : (
                            changedEntries.map(([key, val]) => (
                              <tr key={key}>
                                <td className="p-2 capitalize font-bold text-slate-700 dark:text-slate-300">{key.replace("_", " ")}</td>
                                <td className="p-2 text-slate-400 line-through">{String((staff as any)[key] || "—")}</td>
                                <td className="p-2 text-amber-700 dark:text-amber-300 font-bold">{String(val)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {canApproveReject && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                        <button
                          type="button"
                          onClick={handleRejectEditRequest}
                          disabled={processingEditAction}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Reject Edit Request</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleApproveEditRequest}
                          disabled={processingEditAction}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Approve & Apply Edits</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Bio & Contact Information Grid */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-500" />
                  Personal Information & Bio
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div>
                    <span className="text-slate-400 font-semibold block">Full Name:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{staff.full_name}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block">Gender & DOB:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {staff.gender || "Unspecified"} • {staff.date_of_birth ? formatDateReadable(staff.date_of_birth) : "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block">Email Address:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1">
                      <Mail className="h-3 w-3 text-slate-400" />
                      {staff.email || "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block">Phone Number:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      {staff.phone || "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block">SSNIT Number:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {staff.ssnit_no || "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block">NIA / Ghana Card No:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {staff.nia_number || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Station, Banking & Statutory Details */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-500" />
                  Station, Banking & Statutory Info
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div>
                    <span className="text-slate-400 font-semibold block">Station / Department:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{staff.department || "General Office"}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block">Designation / Role:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{staff.role || "Temporary Staff"}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block">Bank Details:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                      {staff.bank_name || "N/A"} {staff.bank_branch ? `(${staff.bank_branch})` : ""}
                    </span>
                    <div className="font-mono text-[11px] text-slate-500 font-bold">
                      Acc: {staff.bank_account || "N/A"}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block">Pension Insurance Provider:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                      {staff.insurance_provider || "Petra"} (Policy: {staff.insurance_policy_no || "N/A"})
                    </span>
                  </div>
                </div>
              </div>

              {/* Contract Information */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  Contract Tenure Details
                </h4>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-slate-400 font-semibold block">Start Date:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {currentContract?.start_date ? formatDateReadable(currentContract.start_date) : "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block">End Date:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {currentContract?.end_date ? formatDateReadable(currentContract.end_date) : "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block">Renewal Count:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      Renewal #{currentContract?.renewal_number || 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* Approval Info Block */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Created By: <strong>{staff.created_by || "HR Officer"}</strong></span>
                  <span>Created On: <strong>{formatDateReadable(staff.created_at)}</strong></span>
                </div>
                {staff.approved_by && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>Approved By: <strong>{staff.approved_by}</strong></span>
                    <span>Approved On: <strong>{staff.approved_at ? formatDateReadable(staff.approved_at) : "N/A"}</strong></span>
                  </div>
                )}
                {staff.rejection_reason && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold mt-2">
                    <strong>Rejection Note:</strong> {staff.rejection_reason}
                  </div>
                )}
              </div>

              {/* Approval Officer Action Area */}
              {isPending && canApproveReject && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 space-y-3">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-xs">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Approval Officer Review Action Required</span>
                  </div>

                  {rejecting ? (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-rose-800 dark:text-rose-300">
                        Specify Rejection Reason:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Invalid SSNIT number format or missing station details"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setRejecting(false)}
                          className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => onReject && onReject(rejectReason)}
                          className="px-4 py-1.5 rounded-lg text-white bg-rose-600 hover:bg-rose-700 text-xs font-bold"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-3 pt-1">
                      <button
                        onClick={() => setRejecting(true)}
                        className="px-4 py-2 rounded-xl text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 font-bold text-xs transition"
                      >
                        Reject Submission
                      </button>
                      <button
                        onClick={() => onApprove && onApprove()}
                        className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Approve Staff Entry</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: Audit Logs & Activity Trail */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                  <History className="h-4 w-4 text-emerald-500" />
                  Chronological Audit Trail & Activity Logs for {staff.full_name}
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportStaffLogs}
                    disabled={auditLogs.length === 0}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1 hover:bg-emerald-100 transition disabled:opacity-40"
                    title="Export Employee Activity Log to CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export CSV</span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {auditLogs.length} events
                  </span>
                </div>
              </div>

              {loadingLogs ? (
                <div className="p-8 text-center text-slate-400 font-medium">
                  Loading activity logs...
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  No activity history recorded for this staff member yet.
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6 py-2">
                  {auditLogs.map((log) => {
                    const isApprove = log.action === "APPROVE" || log.action === "APPROVE_EDIT" || log.action === "APPROVE_RENEWAL";
                    const isReject = log.action === "REJECT" || log.action === "REJECT_EDIT";
                    const isCreate = log.action === "CREATE" || log.action === "SUBMIT_FOR_APPROVAL";
                    const isRenew = log.action === "RENEW" || log.action === "BULK_RENEW";
                    const isValidate = log.action === "VALIDATE";
                    const isTransfer = log.action === "STATION_TRANSFER" || log.action === "SUBMIT_TRANSFER_FOR_APPROVAL";

                    const badgeBg = isApprove
                      ? "bg-emerald-500"
                      : isReject
                      ? "bg-rose-500"
                      : isCreate
                      ? "bg-blue-500"
                      : isRenew
                      ? "bg-purple-500"
                      : isValidate
                      ? "bg-teal-500"
                      : isTransfer
                      ? "bg-indigo-500"
                      : "bg-slate-500";

                    return (
                      <div key={log.id} className="relative pl-6">
                        {/* Bullet Marker */}
                        <div
                          className={`absolute -left-[9px] top-0.5 h-4 w-4 rounded-full ${badgeBg} ring-4 ring-white dark:ring-slate-900 flex items-center justify-center text-white`}
                        />

                        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{log.user_name || "System User"}</span>
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {log.user_role || "HR Officer"}
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatDateReadable(log.created_at)}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                            {log.details}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Station Transfer Sub-Modal Dialog */}
      {showTransferModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Station Transfer — {staff.full_name}
                </h3>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Station / Department:
                </label>
                <input
                  type="text"
                  disabled
                  value={staff.department || "Unassigned Station"}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Station / Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TEMA HARBOUR, WEIJA OFFICE, TAKORADI PORT"
                  value={newStation}
                  onChange={(e) => setNewStation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transfer Reason / Notes:
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Operational re-assignment per HR directive"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="px-5 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-bold shadow-md shadow-blue-600/20 transition disabled:opacity-50"
                >
                  {transferLoading ? "Processing Transfer..." : "Submit Station Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
