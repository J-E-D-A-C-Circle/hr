"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Archive,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Stamp,
  ShieldCheck,
  FileEdit,
  PenTool,
  Check,
  X,
  Filter,
  ArrowRight,
  Info,
  Lock,
} from "lucide-react";
import { Badge, statusToBadgeVariant } from "@/components/hrletters/ui/Badge";
import { Button } from "@/components/hrletters/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/hrletters/ui/table";
import { Pagination } from "@/components/hrletters/ui/Pagination";
import { LetterPreviewModal } from "@/components/hrletters/LetterPreviewModal";
import { SignaturePad } from "@/components/hrletters/SignaturePad";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { format } from "date-fns";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "ISSUED", label: "Officially Issued" },
  { value: "ACKNOWLEDGED", label: "Staff Acknowledged" },
  { value: "APPROVED", label: "Approved (Awaiting Seal)" },
  { value: "PENDING_APPROVAL", label: "Pending Director Approval" },
  { value: "REJECTED", label: "Revision Requested" },
  { value: "DRAFT", label: "Draft" },
];

const TYPE_OPTIONS = [
  { value: "ALL", label: "All Classifications" },
  { value: "APPOINTMENT", label: "Appointment" },
  { value: "PROMOTION", label: "Promotion" },
  { value: "CONFIRMATION", label: "Confirmation" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "WARNING", label: "Warning" },
  { value: "LEAVE_APPROVAL", label: "Leave Approval" },
  { value: "CONTRACT_RENEWAL", label: "Contract Renewal" },
];

function ArchivePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode Switcher: "queue" (Approval & Action Queue) vs "archive" (Official Letter Archive)
  const initialMode = searchParams.get("mode") === "queue" ? "queue" : "queue";
  const initialStatus = searchParams.get("status") || "";

  const [activeMode, setActiveMode] = useState<"queue" | "archive">(
    searchParams.get("mode") === "archive" ? "archive" : "queue"
  );

  const [letters, setLetters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("HR_OFFICER");

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Queue Sub-Tabs: "ALL_QUEUE", "PENDING_APPROVAL", "APPROVED", "REJECTED", "DRAFT"
  const [queueTab, setQueueTab] = useState<string>(
    initialStatus && ["PENDING_APPROVAL", "APPROVED", "REJECTED", "DRAFT"].includes(initialStatus)
      ? initialStatus
      : "ALL_QUEUE"
  );

  // Archive Filters
  const [archiveSearch, setArchiveSearch] = useState("");
  const [archiveStatusFilter, setArchiveStatusFilter] = useState(
    initialStatus && ["ISSUED", "ACKNOWLEDGED"].includes(initialStatus) ? initialStatus : ""
  );
  const [archiveTypeFilter, setArchiveTypeFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Interactive Modals
  const [previewLetter, setPreviewLetter] = useState<any | null>(null);
  const [signingLetterId, setSigningLetterId] = useState<string | null>(null);
  const [approvalModalDoc, setApprovalModalDoc] = useState<any | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [rejectionModalDoc, setRejectionModalDoc] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [saving, setSaving] = useState(false);

  const showToast = (type: "success" | "error" | "info", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  useEffect(() => {
    fetch("/api/hrletters/auth/check")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.role) setUserRole(d.user.role);
      })
      .catch(() => {});
    loadLetters();
  }, []);

  const loadLetters = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hrletters/letters");
      const data = await res.json();
      if (data.success) {
        setLetters(data.data);
      } else {
        showToast("error", data.error || "Failed to load letter documents.");
      }
    } catch {
      showToast("error", "Network error while fetching documents.");
    } finally {
      setLoading(false);
    }
  };

  // Approval & Rejection Handlers
  const handleConfirmApproval = async () => {
    if (!approvalModalDoc) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/hrletters/letters/${approvalModalDoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "APPROVED",
          action: "LETTER_APPROVED",
          comments: approvalComment.trim() || "Approved by HR Director.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", `Letter ${approvalModalDoc.verificationCode} endorsed and approved.`);
        setApprovalModalDoc(null);
        setApprovalComment("");
        loadLetters();
      } else {
        showToast("error", data.error || "Approval failed.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmRejection = async () => {
    if (!rejectionModalDoc) return;
    if (!rejectionReason.trim()) {
      showToast("error", "Feedback note is mandatory so the officer knows what needs revision.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/hrletters/letters/${rejectionModalDoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
          action: "LETTER_REJECTED",
          rejectionReason: rejectionReason.trim(),
          comments: rejectionReason.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("info", `Letter ${rejectionModalDoc.verificationCode} sent back for revision.`);
        setRejectionModalDoc(null);
        setRejectionReason("");
        loadLetters();
      } else {
        showToast("error", data.error || "Failed to request revisions.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSignature = async (sig: string) => {
    if (!signingLetterId) return;
    const res = await fetch(`/api/hrletters/letters/${signingLetterId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "ISSUED",
        digitalSignature: sig,
        signedAt: new Date().toISOString(),
        issuedAt: new Date().toISOString(),
        action: "LETTER_ISSUED_WITH_SIGNATURE",
        details: "Officially signed with cryptographic seal and issued.",
      }),
    });
    const data = await res.json();
    if (data.success) {
      showToast("success", "Letter sealed with cryptographic digital signature and issued!");
      setSigningLetterId(null);
      loadLetters();
    } else {
      showToast("error", data.error || "Signing failed.");
    }
  };

  // Status counts for Switcher Badges
  const counts = useMemo(() => {
    const map = {
      queueTotal: 0,
      pendingApproval: 0,
      approvedAwaitingSign: 0,
      rejectedNeedsRevision: 0,
      drafts: 0,
      archiveTotal: 0,
      issued: 0,
      acknowledged: 0,
    };

    letters.forEach((l) => {
      if (["PENDING_APPROVAL", "APPROVED", "REJECTED", "DRAFT"].includes(l.status)) {
        map.queueTotal++;
      }
      if (l.status === "PENDING_APPROVAL") map.pendingApproval++;
      if (l.status === "APPROVED") map.approvedAwaitingSign++;
      if (l.status === "REJECTED") map.rejectedNeedsRevision++;
      if (l.status === "DRAFT") map.drafts++;

      if (["ISSUED", "ACKNOWLEDGED"].includes(l.status)) {
        map.archiveTotal++;
      }
      if (l.status === "ISSUED") map.issued++;
      if (l.status === "ACKNOWLEDGED") map.acknowledged++;
    });

    return map;
  }, [letters]);

  // Filtered letters for the active mode
  const displayedLetters = useMemo(() => {
    if (activeMode === "queue") {
      let qList = letters.filter((l) => ["PENDING_APPROVAL", "APPROVED", "REJECTED", "DRAFT"].includes(l.status));
      if (queueTab !== "ALL_QUEUE") {
        qList = qList.filter((l) => l.status === queueTab);
      }
      return qList;
    } else {
      // Archive Mode
      let aList = letters;
      if (archiveSearch.trim()) {
        const q = archiveSearch.toLowerCase();
        aList = aList.filter(
          (l) =>
            l.staff?.fullName?.toLowerCase().includes(q) ||
            l.verificationCode?.toLowerCase().includes(q) ||
            l.title?.toLowerCase().includes(q) ||
            l.customRefNumber?.toLowerCase().includes(q) ||
            l.staff?.staffId?.toLowerCase().includes(q)
        );
      }
      if (archiveStatusFilter) {
        aList = aList.filter((l) => l.status === archiveStatusFilter);
      }
      if (archiveTypeFilter) {
        aList = aList.filter((l) => l.letterType === archiveTypeFilter);
      }
      return aList;
    }
  }, [letters, activeMode, queueTab, archiveSearch, archiveStatusFilter, archiveTypeFilter]);

  const paginatedLetters = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedLetters.slice(start, start + pageSize);
  }, [displayedLetters, currentPage, pageSize]);

  const totalPages = Math.ceil(displayedLetters.length / pageSize) || 1;

  const handleSwitchMode = (mode: "queue" | "archive") => {
    setActiveMode(mode);
    setCurrentPage(1);
    router.replace(`/hrletters/archive?mode=${mode}`, { scroll: false });
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold transition-all animate-fade-up ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200"
              : toastMessage.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200"
              : "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200"
          }`}
        >
          {toastMessage.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          {toastMessage.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-600" />}
          {toastMessage.type === "info" && <Info className="w-5 h-5 text-blue-600" />}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header with Dual-Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold" style={{ color: "var(--color-text-1)" }}>
              Letter Documents &amp; Archive Gateway
            </h2>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
              {userRole === "HR_DIRECTOR" ? "Director Mode" : "Officer Mode"}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-3)" }}>
            Use the switcher below to toggle between actionable approval items and the permanent letter archive
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/hrletters/generate">
            <Button variant="primary" size="sm" icon={<PenTool className="w-3.5 h-3.5" />}>
              Compose Letter
            </Button>
          </Link>
          <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={loadLetters}>
            Refresh
          </Button>
        </div>
      </div>

      {/* THE MODE SWITCHER (Sidebar-Style Pill Switch & Toggle) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl">
        {/* Sidebar-style segmented pill toggle */}
        <div className="p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 flex items-center text-xs flex-1 max-w-xl">
          <button
            type="button"
            onClick={() => handleSwitchMode("queue")}
            className={`flex-1 py-2 px-3.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeMode === "queue"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Clock className={`h-3.5 w-3.5 ${counts.pendingApproval > 0 ? "text-amber-500 animate-pulse" : "text-slate-400"}`} />
            <span>Action &amp; Approval Queue</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                counts.pendingApproval > 0
                  ? "bg-amber-500 text-white animate-pulse"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              {counts.queueTotal}
            </span>
            {counts.pendingApproval > 0 && userRole === "HR_DIRECTOR" && (
              <span className="hidden md:inline-block text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-300">
                {counts.pendingApproval} Review
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode("archive")}
            className={`flex-1 py-2 px-3.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeMode === "archive"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Archive className="h-3.5 w-3.5 text-emerald-500" />
            <span>Official Letter Archive</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {letters.length}
            </span>
          </button>
        </div>

        {/* Toggle Switch with labels */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 text-xs shrink-0 self-start sm:self-auto shadow-xs">
          <span
            onClick={() => handleSwitchMode("queue")}
            className={`font-semibold cursor-pointer select-none transition ${
              activeMode === "queue"
                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            Queue
          </span>
          <Switch
            checked={activeMode === "archive"}
            onCheckedChange={(checked) => handleSwitchMode(checked ? "archive" : "queue")}
            size="md"
            aria-label="Switch between Queue and Archive"
          />
          <span
            onClick={() => handleSwitchMode("archive")}
            className={`font-semibold cursor-pointer select-none transition ${
              activeMode === "archive"
                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            Archive
          </span>
        </div>
      </div>

      {/* MODE 1: ACTION & APPROVAL QUEUE VIEW */}
      {activeMode === "queue" && (
        <div className="card overflow-hidden animate-fade-up">
          {/* Sub-Tabs for Queue */}
          <div className="p-4 border-b space-y-3" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--color-text-1)" }}>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Executive Workflow &amp; Approval Queue
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Items requiring Director review, endorsement, digital sealing, or officer revision
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
                {[
                  { id: "ALL_QUEUE", label: "All Queue Items", count: counts.queueTotal },
                  {
                    id: "PENDING_APPROVAL",
                    label: "Pending Review",
                    count: counts.pendingApproval,
                    alert: counts.pendingApproval > 0,
                  },
                  { id: "APPROVED", label: "Awaiting Seal", count: counts.approvedAwaitingSign },
                  { id: "REJECTED", label: "Needs Revision", count: counts.rejectedNeedsRevision },
                  { id: "DRAFT", label: "Drafts", count: counts.drafts },
                ].map((subTab) => {
                  const isSelected = queueTab === subTab.id;
                  return (
                    <button
                      key={subTab.id}
                      type="button"
                      onClick={() => {
                        setQueueTab(subTab.id);
                        setCurrentPage(1);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <span>{subTab.label}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : subTab.alert
                            ? "bg-amber-100 text-amber-700 animate-pulse"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {subTab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Shadcn UI Select for Queue Filtering */}
              <div className="sm:w-[220px] shrink-0">
                <Select
                  value={queueTab}
                  onValueChange={(val) => {
                    setQueueTab(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Filter Queue Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_QUEUE">All Queue Items ({counts.queueTotal})</SelectItem>
                    <SelectItem value="PENDING_APPROVAL">Pending Director Review ({counts.pendingApproval})</SelectItem>
                    <SelectItem value="APPROVED">Awaiting Digital Seal ({counts.approvedAwaitingSign})</SelectItem>
                    <SelectItem value="REJECTED">Needs Revision ({counts.rejectedNeedsRevision})</SelectItem>
                    <SelectItem value="DRAFT">Drafts ({counts.drafts})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Queue Table */}
          <Table>
            <TableHeader>
              <TableRow>
                {["Verification Code", "Recipient", "Document Title", "Status", "Digital Seal", "Lifecycle Actions"].map(
                  (h) => (
                    <TableHead key={h}>{h}</TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i}>
                      {Array(6)
                        .fill(0)
                        .map((_, j) => (
                          <TableCell key={j}>
                            <div className="skeleton h-4 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
                          </TableCell>
                        ))}
                    </TableRow>
                  ))
              ) : paginatedLetters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm" style={{ color: "var(--color-text-4)" }}>
                    No queue items in this category. All pending reviews have been processed!
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLetters.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <code className="text-xs font-mono font-semibold" style={{ color: "var(--color-accent)" }}>
                        {doc.verificationCode}
                      </code>
                      {doc.customRefNumber && (
                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">{doc.customRefNumber}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-sm" style={{ color: "var(--color-text-1)" }}>
                        {doc.staff?.fullName || "—"}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">{doc.staff?.staffId || "External"}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium" style={{ color: "var(--color-text-2)" }}>
                        {doc.title}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{doc.letterType}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusToBadgeVariant(doc.status)} dot>
                        {doc.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {doc.digitalSignature ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                          <Stamp className="w-3.5 h-3.5" /> Sealed
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Lock className="w-3 h-3 opacity-60" /> Unsigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 justify-end flex-wrap">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setPreviewLetter(doc)}
                        >
                          View
                        </Button>

                        {/* HR_DIRECTOR ONLY — Approve & Request Changes */}
                        {doc.status === "PENDING_APPROVAL" && userRole === "HR_DIRECTOR" && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<Check className="w-3.5 h-3.5" />}
                              onClick={() => setApprovalModalDoc(doc)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={<X className="w-3.5 h-3.5" />}
                              onClick={() => setRejectionModalDoc(doc)}
                            >
                              Request Changes
                            </Button>
                          </>
                        )}

                        {/* HR_DIRECTOR ONLY — Sign & Issue */}
                        {doc.status === "APPROVED" && userRole === "HR_DIRECTOR" && (
                          <Button
                            variant="success"
                            size="sm"
                            icon={<PenTool className="w-3.5 h-3.5" />}
                            onClick={() => setSigningLetterId(doc.id)}
                          >
                            Sign &amp; Issue
                          </Button>
                        )}

                        {/* HR_OFFICER & ALL — Revise Rejected or Draft */}
                        {(doc.status === "DRAFT" || doc.status === "REJECTED") && (
                          <Link href={`/hrletters/generate?edit=${doc.id}`}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<FileEdit className="w-3.5 h-3.5 text-emerald-600" />}
                            >
                              {doc.status === "REJECTED" ? "Revise & Resubmit" : "Edit Draft"}
                            </Button>
                          </Link>
                        )}

                        {/* Lock Indicators for Officer on Pending / Approved */}
                        {doc.status === "PENDING_APPROVAL" && userRole === "HR_OFFICER" && (
                          <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Awaiting Director
                          </span>
                        )}

                        {doc.status === "APPROVED" && userRole === "HR_OFFICER" && (
                          <span className="text-[11px] font-semibold text-teal-600 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Awaiting Seal
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={displayedLetters.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* MODE 2: OFFICIAL LETTER ARCHIVE VIEW */}
      {activeMode === "archive" && (
        <div className="space-y-4 animate-fade-up">
          {/* Search & Filter Bar */}
          <div className="card p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={archiveSearch}
                onChange={(e) => {
                  setArchiveSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by recipient name, verification code, reference, or title..."
                className="input-base pl-9 w-full"
                style={{ paddingLeft: "2.25rem" }}
              />
            </div>
            <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
              <Select
                value={archiveStatusFilter || "ALL"}
                onValueChange={(val) => {
                  setArchiveStatusFilter(val === "ALL" ? "" : val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[185px] h-10">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={archiveTypeFilter || "ALL"}
                onValueChange={(val) => {
                  setArchiveTypeFilter(val === "ALL" ? "" : val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[185px] h-10">
                  <SelectValue placeholder="All Classifications" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Archive Table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
                  Historical Letter Archive &amp; Audit Trail
                </h3>
              </div>
              <span className="text-xs text-slate-400">{displayedLetters.length} records found</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  {["Verification Code", "Ref Number", "Recipient", "Type", "Title", "Status", "Date Issued / Created", "Actions"].map(
                    (h) => (
                      <TableHead key={h}>{h}</TableHead>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i}>
                        {Array(8)
                          .fill(0)
                          .map((_, j) => (
                            <TableCell key={j}>
                              <div className="skeleton h-4 rounded" style={{ width: "70%" }} />
                            </TableCell>
                          ))}
                      </TableRow>
                    ))
                ) : paginatedLetters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-sm" style={{ color: "var(--color-text-4)" }}>
                      {archiveSearch || archiveStatusFilter || archiveTypeFilter
                        ? "No archive records match your search filters."
                        : "No letters in the archive yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLetters.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <code className="text-xs font-mono font-semibold" style={{ color: "var(--color-accent)" }}>
                          {doc.verificationCode}
                        </code>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-400">
                        {doc.customRefNumber || "—"}
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-sm" style={{ color: "var(--color-text-1)" }}>
                          {doc.staff?.fullName || "—"}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">{doc.staff?.staffId || "External"}</p>
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-md border"
                          style={{
                            background: "var(--color-border-subtle)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text-3)",
                          }}
                        >
                          {doc.letterType?.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate" style={{ color: "var(--color-text-2)" }}>
                        {doc.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusToBadgeVariant(doc.status)} dot>
                          {doc.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {doc.issuedAt ? format(new Date(doc.issuedAt), "dd MMM yyyy") : format(new Date(doc.createdAt), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setPreviewLetter(doc)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={displayedLetters.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* Signature Pad Modal */}
      {signingLetterId && (
        <SignaturePad
          onClose={() => setSigningLetterId(null)}
          onSaveSignature={handleSaveSignature}
        />
      )}

      {/* Letter Full Preview Modal */}
      {previewLetter && (
        <LetterPreviewModal
          letter={previewLetter}
          currentUserRole={userRole}
          onClose={() => setPreviewLetter(null)}
          onApprove={async (id, comments) => {
            const res = await fetch(`/api/hrletters/letters/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "APPROVED", action: "LETTER_APPROVED", comments }),
            });
            if ((await res.json()).success) {
              showToast("success", "Letter approved.");
              setPreviewLetter(null);
              loadLetters();
            }
          }}
          onReject={async (id, reason) => {
            const res = await fetch(`/api/hrletters/letters/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "REJECTED", action: "LETTER_REJECTED", rejectionReason: reason, comments: reason }),
            });
            if ((await res.json()).success) {
              showToast("info", "Revisions requested.");
              setPreviewLetter(null);
              loadLetters();
            }
          }}
          onOpenSign={(id) => {
            setPreviewLetter(null);
            setSigningLetterId(id);
          }}
        />
      )}

      {/* Director Approval Modal */}
      {approvalModalDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 animate-fade-up"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: "var(--color-text-1)" }}>
                  Endorse &amp; Approve Letter
                </h3>
                <p className="text-xs text-slate-500">{approvalModalDoc.verificationCode}</p>
              </div>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-2)" }}>
              You are approving <strong>{approvalModalDoc.title}</strong> for{" "}
              <strong>{approvalModalDoc.staff?.fullName}</strong>. Once approved, the document moves to the &apos;Awaiting Digital Seal&apos; queue.
            </p>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500">Optional Endorsement Note</label>
              <textarea
                rows={3}
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="e.g. Terms verified and approved by HR Director."
                className="w-full p-2.5 rounded-lg border text-xs outline-none"
                style={{ background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text-1)" }}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setApprovalModalDoc(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Check className="w-4 h-4" />}
                onClick={handleConfirmApproval}
                loading={saving}
              >
                Confirm Approval
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Director Rejection Modal */}
      {rejectionModalDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 animate-fade-up"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-600">Request Revisions</h3>
                <p className="text-xs text-slate-500">{rejectionModalDoc.verificationCode}</p>
              </div>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-2)" }}>
              The document will be returned to the HR Officer queue with status <strong>REJECTED / NEEDS REVISION</strong>.
              Provide specific instructions on what must be changed.
            </p>

            <div>
              <label className="block text-xs font-semibold mb-1 text-rose-500">Mandatory Revision Instructions *</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Please verify salary grade step and effective date before re-submitting."
                className="w-full p-2.5 rounded-lg border text-xs outline-none"
                style={{ background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text-1)" }}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setRejectionModalDoc(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<X className="w-4 h-4" />}
                onClick={handleConfirmRejection}
                loading={saving}
              >
                Send Back for Revisions
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HrLettersArchivePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-semibold text-slate-400">Loading Letter Archive &amp; Queue...</div>}>
      <ArchivePageContent />
    </Suspense>
  );
}
