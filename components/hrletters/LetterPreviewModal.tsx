"use client";

import React, { useState, useEffect } from "react";
import {
  Printer,
  CheckCircle,
  X,
  FileText,
  ShieldCheck,
  History,
  Stamp,
  AlertTriangle,
  Send,
  Check,
  Clock,
  ArrowRight,
  ExternalLink,
  Lock,
  User,
  PenTool,
} from "lucide-react";
import { OfficialAppointmentLetter } from "./OfficialAppointmentLetter";
import { Badge, statusToBadgeVariant } from "./ui/Badge";
import { Button } from "./ui/Button";
import { printOfficialLetter } from "@/lib/printLetterHelper";
import Link from "next/link";

interface LetterPreviewModalProps {
  letter: any;
  onClose: () => void;
  onAcknowledge?: (letterId: string) => void;
  onApprove?: (letterId: string, comments?: string) => void;
  onReject?: (letterId: string, reason: string) => void;
  onOpenSign?: (letterId: string) => void;
  isEmployeeView?: boolean;
  currentUserRole?: string;
}

export const LetterPreviewModal: React.FC<LetterPreviewModalProps> = ({
  letter,
  onClose,
  onAcknowledge,
  onApprove,
  onReject,
  onOpenSign,
  isEmployeeView = false,
  currentUserRole = "HR_OFFICER",
}) => {
  const [activeTab, setActiveTab] = useState<"document" | "trail" | "security">("document");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!letter) return null;

  const handlePrint = () => {
    printOfficialLetter({
      verificationCode: letter.verificationCode,
      customRefNumber: letter.customRefNumber || letter.verificationCode,
      yourRef: letter.yourRef,
      issueDate: letter.issuedAt
        ? new Date(letter.issuedAt)
            .toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })
            .toUpperCase()
        : new Date()
            .toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })
            .toUpperCase(),
      applicantName: letter.staff?.fullName || "Staff Member",
      applicantAddress: letter.applicantAddress || "ACCRA - GHANA",
      salutation: letter.salutation || "Dear Sir/Madam,",
      customSubject: letter.title,
      customBodyText: letter.content,
      salaryGrade: letter.salaryGrade,
      signatoryName: letter.signatoryName || "EPHRAIM NII TAN SACKEY",
      signatoryTitle: letter.signatoryTitle || "AG. DIRECTOR HR",
      signatoryForTitle: letter.signatoryForTitle || "FOR: CHIEF EXECUTIVE",
      ccList: letter.ccText,
      digitalSignature: letter.digitalSignature,
      letterType: letter.letterType,
    });
  };

  const handleApproveClick = async () => {
    if (!onApprove) return;
    setActionLoading(true);
    try {
      await onApprove(letter.id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onReject || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await onReject(letter.id, rejectReason.trim());
      setShowRejectForm(false);
    } finally {
      setActionLoading(false);
    }
  };

  // Determine active step index
  // 1: DRAFT, 2: PENDING_APPROVAL, 3: APPROVED, 4: ISSUED, 5: ACKNOWLEDGED
  const statusStepMap: Record<string, number> = {
    DRAFT: 1,
    REJECTED: 1,
    PENDING_APPROVAL: 2,
    APPROVED: 3,
    ISSUED: 4,
    ACKNOWLEDGED: 5,
  };
  const currentStep = statusStepMap[letter.status] || 1;

  const steps = [
    { num: 1, label: "Draft & Compose", role: "HR Officer", status: "DRAFT" },
    { num: 2, label: "Director Review", role: "HR Director", status: "PENDING_APPROVAL" },
    { num: 3, label: "Approval Endorsement", role: "HR Director", status: "APPROVED" },
    { num: 4, label: "Digital Seal & Issue", role: "HR Director", status: "ISSUED" },
    { num: 5, label: "Staff Acknowledged", role: "Staff Member", status: "ACKNOWLEDGED" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-5xl max-h-[92vh] my-auto flex flex-col rounded-2xl border shadow-2xl overflow-hidden animate-fade-up shrink-0"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {/* Top Header */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b shrink-0 gap-3"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl shrink-0" style={{ background: "var(--color-accent-subtle)" }}>
              <FileText className="w-5 h-5" style={{ color: "var(--color-accent)" }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold truncate" style={{ color: "var(--color-text-1)" }}>
                  {letter.title}
                </p>
                <Badge variant={statusToBadgeVariant(letter.status)} dot>
                  {letter.status?.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-3)" }}>
                Recipient: <strong style={{ color: "var(--color-text-1)" }}>{letter.staff?.fullName || "Personnel"}</strong> &bull;
                Ref: <span className="font-mono">{letter.customRefNumber || letter.verificationCode}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Director Actions for PENDING_APPROVAL */}
            {currentUserRole === "HR_DIRECTOR" && letter.status === "PENDING_APPROVAL" && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle className="w-3.5 h-3.5" />}
                  onClick={handleApproveClick}
                  loading={actionLoading}
                >
                  Approve Letter
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<AlertTriangle className="w-3.5 h-3.5" />}
                  onClick={() => setShowRejectForm(true)}
                  disabled={actionLoading}
                >
                  Request Changes
                </Button>
              </>
            )}

            {/* Director Action for APPROVED -> Sign & Issue */}
            {currentUserRole === "HR_DIRECTOR" && letter.status === "APPROVED" && onOpenSign && (
              <Button
                variant="success"
                size="sm"
                icon={<PenTool className="w-3.5 h-3.5" />}
                onClick={() => onOpenSign(letter.id)}
              >
                Sign &amp; Issue Document
              </Button>
            )}

            {/* Employee Action for ISSUED -> Acknowledge */}
            {isEmployeeView && letter.status === "ISSUED" && onAcknowledge && (
              <Button
                variant="success"
                size="sm"
                icon={<CheckCircle className="w-3.5 h-3.5" />}
                onClick={() => onAcknowledge(letter.id)}
              >
                Acknowledge Receipt
              </Button>
            )}

            <Button variant="secondary" size="sm" icon={<Printer className="w-3.5 h-3.5" />} onClick={handlePrint}>
              Print / PDF
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-70 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visual Lifecycle Stepper */}
        <div className="px-5 py-3 border-b bg-slate-50/70 dark:bg-slate-900/60" style={{ borderColor: "var(--color-border)" }}>
          <div className="grid grid-cols-5 gap-2 text-center">
            {steps.map((st) => {
              const isDone = currentStep > st.num || letter.status === st.status;
              const isCurrent = currentStep === st.num;
              const isRejected = letter.status === "REJECTED" && st.num === 2;

              return (
                <div key={st.num} className="relative flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isRejected
                        ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                        : isDone
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                        : isCurrent
                        ? "bg-blue-600 text-white ring-2 ring-blue-400/30"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {isRejected ? "✕" : isDone ? "✓" : st.num}
                  </div>
                  <span className="text-[11px] font-bold mt-1 text-slate-800 dark:text-slate-200 truncate w-full">
                    {st.label}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-medium">{st.role}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rejection Prompt Form (When Director clicks Request Changes) */}
        {showRejectForm && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60">
            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Specify Required Revision / Rejection Feedback
                </span>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="State the reasons or corrections required (e.g. Please verify salary grade step and update the department name to Driver Licensing)..."
                rows={2}
                className="w-full p-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                required
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  type="submit"
                  loading={actionLoading}
                  disabled={!rejectReason.trim()}
                >
                  Submit Revision Request
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center gap-4 px-5 border-b shrink-0 text-xs font-semibold" style={{ borderColor: "var(--color-border)" }}>
          <button
            onClick={() => setActiveTab("document")}
            className={`py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "document"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Official Letterhead
          </button>
          <button
            onClick={() => setActiveTab("trail")}
            className={`py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "trail"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <History className="w-3.5 h-3.5" /> Approval Trail &amp; Signatures
            {letter.approvalWorkflows?.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800">
                {letter.approvalWorkflows.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "security"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> QR Code &amp; Anti-Tamper CUID
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{ background: "var(--color-bg)" }}>
          {activeTab === "document" && (
            <div className="flex justify-center">
              <OfficialAppointmentLetter
                referenceNumber={letter.verificationCode}
                verificationCode={letter.verificationCode}
                applicantName={letter.staff?.fullName || "Staff Member"}
                applicantAddress={letter.applicantAddress || "ACCRA - GHANA"}
                positionTitle={letter.staff?.jobTitle || "Officer"}
                departmentName={letter.staff?.department || "Operations"}
                appointmentType={letter.letterType || "APPOINTMENT"}
                effectiveDate={letter.effectiveDate || letter.staff?.appointmentDate || "Monday, September 1, 2026"}
                issueDate={
                  letter.issuedAt
                    ? new Date(letter.issuedAt)
                        .toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })
                        .toUpperCase()
                    : new Date()
                        .toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })
                        .toUpperCase()
                }
                salutation={letter.salutation || "Dear Sir/Madam,"}
                customRefNumber={letter.customRefNumber}
                yourRef={letter.yourRef}
                customSubject={letter.title}
                customBodyText={letter.content}
                salaryGrade={letter.salaryGrade || "Grade 12 Step 1"}
                signatoryName={letter.signatoryName || "EPHRAIM NII TAN SACKEY"}
                signatoryTitle={letter.signatoryTitle || "AG. DIRECTOR HR"}
                signatoryForTitle={letter.signatoryForTitle || "FOR: CHIEF EXECUTIVE"}
                ccList={letter.ccText}
                digitalSignature={letter.digitalSignature}
              />
            </div>
          )}

          {activeTab === "trail" && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="p-4 rounded-xl border bg-white dark:bg-slate-900" style={{ borderColor: "var(--color-border)" }}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-500" /> Chain of Custody &amp; Document History
                </h4>

                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {/* Step 1: Initiated */}
                  <div className="relative flex items-start gap-3 pl-8">
                    <span className="absolute left-2 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Document Created / Drafted</p>
                      <p className="text-[11px] text-slate-500">
                        Initial draft compiled on {new Date(letter.createdAt).toLocaleString("en-GB")}
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Workflow Steps */}
                  {letter.approvalWorkflows?.map((wf: any) => (
                    <div key={wf.id} className="relative flex items-start gap-3 pl-8">
                      <span
                        className={`absolute left-2 top-1 w-3.5 h-3.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                          wf.status === "APPROVED"
                            ? "bg-emerald-500"
                            : wf.status === "REJECTED"
                            ? "bg-rose-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {wf.status === "APPROVED"
                              ? "Director Approval Granted"
                              : wf.status === "REJECTED"
                              ? "Revision Requested"
                              : "Director Review Pending"}
                          </p>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              wf.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                                : wf.status === "REJECTED"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300"
                            }`}
                          >
                            {wf.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Assigned to: <strong>{wf.approverName}</strong> ({wf.approverRole})
                          {wf.decidedAt && ` • Decided: ${new Date(wf.decidedAt).toLocaleString("en-GB")}`}
                        </p>
                        {wf.comments && (
                          <div className="mt-1.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs italic text-slate-700 dark:text-slate-300">
                            &ldquo;{wf.comments}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Step: Signed & Issued */}
                  {letter.issuedAt && (
                    <div className="relative flex items-start gap-3 pl-8">
                      <span className="absolute left-2 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Digitally Signed &amp; Published</p>
                        <p className="text-[11px] text-slate-500">
                          Officially sealed by {letter.signatoryName || "Director HR"} on{" "}
                          {new Date(letter.issuedAt).toLocaleString("en-GB")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step: Acknowledged */}
                  {letter.acknowledgedAt && (
                    <div className="relative flex items-start gap-3 pl-8">
                      <span className="absolute left-2 top-1 w-3.5 h-3.5 rounded-full bg-emerald-600 ring-4 ring-white dark:ring-slate-900" />
                      <div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Employee Receipt Confirmed
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Acknowledged by {letter.staff?.fullName} on {new Date(letter.acknowledgedAt).toLocaleString("en-GB")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 space-y-4" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Cryptographic Anti-Tamper Verification
                    </h4>
                    <p className="text-xs text-slate-500">Official DVLA HR Registry Integrity System</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[11px]">Verification Code (CUID)</span>
                    <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      {letter.verificationCode}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[11px]">Document Status</span>
                    <span className="font-bold text-slate-900 dark:text-white uppercase">{letter.status}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[11px]">Digital Signature</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {letter.digitalSignature ? "✓ Applied & Stamped" : "Pending Signature"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[11px]">Staff Acknowledgment</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {letter.acknowledgedAt ? "✓ Confirmed by Staff" : "Pending Acknowledgment"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Public Document Verifier</span>
                  <Link
                    href={`/verify?code=${letter.verificationCode}`}
                    target="_blank"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    Open Public Verifier <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
