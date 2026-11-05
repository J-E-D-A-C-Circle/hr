"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FileText,
  Send,
  PenTool,
  Eye,
  Tag,
  Stamp,
  User,
  Building2,
  Hash,
  Printer,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Search,
  Users,
  Check,
  X,
  ChevronRight,
  ShieldCheck,
  FileEdit,
  Lock,
  ArrowRight,
  Info,
  Archive,
} from "lucide-react";
import Link from "next/link";
import { LetterPreviewModal } from "@/components/hrletters/LetterPreviewModal";
import { OfficialAppointmentLetter } from "@/components/hrletters/OfficialAppointmentLetter";
import { Badge, statusToBadgeVariant } from "@/components/hrletters/ui/Badge";
import { Button } from "@/components/hrletters/ui/Button";
import { Select } from "@/components/hrletters/ui/Select";
import { printOfficialLetter } from "@/lib/printLetterHelper";

const InputLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-2)" }}>
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const inputCls =
  "w-full px-3 py-2 rounded-lg border text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";
const inputStyle = { background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text-1)" };

const LIFECYCLE_STEPS = [
  { step: 1, label: "Draft & Compose", role: "HR Officer", desc: "Compose or select template" },
  { step: 2, label: "Director Review", role: "HR Director", desc: "Examine compliance & terms" },
  { step: 3, label: "Approval Endorsement", role: "HR Director", desc: "Official executive greenlight" },
  { step: 4, label: "Digital Seal & Issue", role: "HR Director", desc: "Cryptographic signature attached" },
  { step: 5, label: "Staff Acknowledged", role: "Staff Member", desc: "Receipt logged via portal" },
];

function GeneratePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editParam = searchParams.get("edit");

  const [letters, setLetters] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState("HR_OFFICER");

  // Notification message
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Recipient Source Toggle
  const [recipientSource, setRecipientSource] = useState<"registry" | "manual">("registry");
  const [selectedStaffRegistryId, setSelectedStaffRegistryId] = useState("");

  // Editing state for revising drafts or rejected letters
  const [editingLetterId, setEditingLetterId] = useState<string | null>(null);
  const [editingLetterDoc, setEditingLetterDoc] = useState<any | null>(null);

  // Recipient Fields
  const [recipientName, setRecipientName] = useState("Kofi Mensah");
  const [recipientStaffId, setRecipientStaffId] = useState("DVLA-712986");
  const [recipientDepartment, setRecipientDepartment] = useState("Driver Licensing & Administration");
  const [recipientJobTitle, setRecipientJobTitle] = useState("Senior Licensing Officer");
  const [recipientAddress, setRecipientAddress] = useState("ACCRA - GHANA");

  // Document Fields
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [customTitle, setCustomTitle] = useState("OFFER OF APPOINTMENT");
  const [letterType, setLetterType] = useState("APPOINTMENT");
  const [salutation, setSalutation] = useState("Dear Sir/Madam,");
  const [content, setContent] = useState(
    "I am pleased to convey to you that the Driver and Vehicle Licensing Authority (DVLA) has offered you appointment as Senior Licensing Officer in the Driver Licensing & Administration department at Head Office, Accra."
  );
  const [salaryGrade, setSalaryGrade] = useState("Grade 12 Step 1");
  const [refNumber, setRefNumber] = useState("DVLA/HR/07/26/PLACMT/0127");
  const [yourRef, setYourRef] = useState("NSS/ADM/2026/042");
  const [issueDate, setIssueDate] = useState(
    new Date().toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" }).toUpperCase()
  );
  const [effectiveDate, setEffectiveDate] = useState("Monday, September 1, 2026");

  // Signatory & CC
  const [signatoryName, setSignatoryName] = useState("EPHRAIM NII TAN SACKEY");
  const [signatoryTitle, setSignatoryTitle] = useState("AG. DIRECTOR HR");
  const [signatoryForTitle, setSignatoryForTitle] = useState("FOR: CHIEF EXECUTIVE");
  const [ccText, setCcText] = useState(
    "Chief Executive\nDeputy Chief Executives\nAg. Director, IT\nAg. Director Administration\nManager, HR (C&B)"
  );

  const [previewLetter, setPreviewLetter] = useState<any | null>(null);

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
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lRes, tRes, sRes] = await Promise.all([
        fetch("/api/hrletters/letters").then((r) => r.json()),
        fetch("/api/hrletters/templates").then((r) => r.json()),
        fetch("/api/hrletters/staff").then((r) => r.json()),
      ]);
      if (lRes.success) {
        setLetters(lRes.data);
        if (editParam) {
          const match = lRes.data.find((l: any) => l.id === editParam);
          if (match) handleEditLetter(match);
        }
      }
      if (tRes.success) setTemplates(tRes.data);
      if (sRes.success) setStaffList(sRes.data);
    } catch {
      showToast("error", "Failed to load HR data from server.");
    } finally {
      setLoading(false);
    }
  };

  const handleStaffRegistrySelect = (staffIdStr: string) => {
    setSelectedStaffRegistryId(staffIdStr);
    const selected = staffList.find((s) => s.id === staffIdStr || s.staffId === staffIdStr);
    if (!selected) return;

    setRecipientName(selected.fullName);
    setRecipientStaffId(selected.staffId);
    setRecipientDepartment(selected.department || "Operations");
    setRecipientJobTitle(selected.jobTitle || "Officer");
    if (selected.salaryGrade) setSalaryGrade(selected.salaryGrade);
    setRecipientAddress("ACCRA - GHANA");

    if (selectedTemplateId) {
      const tmpl = templates.find((t) => t.id === selectedTemplateId);
      if (tmpl) {
        fillTemplateWithValues(tmpl, selected.fullName, selected.staffId, selected.department, selected.jobTitle, selected.salaryGrade || salaryGrade);
      }
    }
  };

  const fillTemplateWithValues = (
    tmpl: any,
    name: string,
    sId: string,
    dept: string,
    title: string,
    grade: string
  ) => {
    let fill = tmpl.content
      .replace(/\{\{staff_name\}\}/g, name || "[Employee Name]")
      .replace(/\{\{staff_id\}\}/g, sId || "[Staff ID]")
      .replace(/\{\{department\}\}/g, dept || "[Department]")
      .replace(/\{\{job_title\}\}/g, title || "[Job Title]")
      .replace(/\{\{start_date\}\}/g, effectiveDate)
      .replace(/\{\{salary_grade\}\}/g, grade)
      .replace(/\{\{reporting_officer\}\}/g, "Director HR");
    setContent(fill);
  };

  const resetDefaults = () => {
    setEditingLetterId(null);
    setEditingLetterDoc(null);
    setSelectedStaffRegistryId("");
    setRecipientSource("registry");
    setRecipientName("Kofi Mensah");
    setRecipientStaffId("DVLA-712986");
    setRecipientDepartment("Driver Licensing & Administration");
    setRecipientJobTitle("Senior Licensing Officer");
    setRecipientAddress("ACCRA - GHANA");
    setSelectedTemplateId("");
    setCustomTitle("OFFER OF APPOINTMENT");
    setLetterType("APPOINTMENT");
    setSalutation("Dear Sir/Madam,");
    setContent(
      "I am pleased to convey to you that the Driver and Vehicle Licensing Authority (DVLA) has offered you appointment as Senior Licensing Officer in the Driver Licensing & Administration department at Head Office, Accra."
    );
    setSalaryGrade("Grade 12 Step 1");
    setRefNumber(`DVLA/HR/07/${new Date().getFullYear().toString().slice(-2)}/PLACMT/${Math.floor(100 + Math.random() * 900)}`);
    setYourRef("NSS/ADM/2026/042");
    setIssueDate(new Date().toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" }).toUpperCase());
    setEffectiveDate("Monday, September 1, 2026");
    setSignatoryName("EPHRAIM NII TAN SACKEY");
    setSignatoryTitle("AG. DIRECTOR HR");
    setSignatoryForTitle("FOR: CHIEF EXECUTIVE");
    setCcText("Chief Executive\nDeputy Chief Executives\nAg. Director, IT\nAg. Director Administration\nManager, HR (C&B)");
    showToast("info", "Form reset to new appointment draft.");
  };

  const handleEditLetter = (doc: any) => {
    setEditingLetterId(doc.id);
    setEditingLetterDoc(doc);
    setRecipientSource("manual");
    setRecipientName(doc.staff?.fullName || "");
    setRecipientStaffId(doc.staff?.staffId || "");
    setRecipientDepartment(doc.staff?.department || "");
    setRecipientJobTitle(doc.staff?.jobTitle || "");
    setRecipientAddress(doc.applicantAddress || "ACCRA - GHANA");
    setCustomTitle(doc.title || "");
    setLetterType(doc.letterType || "APPOINTMENT");
    setSalutation(doc.salutation || "Dear Sir/Madam,");
    setContent(doc.content || "");
    setSalaryGrade(doc.salaryGrade || "");
    setRefNumber(doc.customRefNumber || "");
    setYourRef(doc.yourRef || "");
    setEffectiveDate(doc.effectiveDate || "");
    setSignatoryName(doc.signatoryName || "EPHRAIM NII TAN SACKEY");
    setSignatoryTitle(doc.signatoryTitle || "AG. DIRECTOR HR");
    setSignatoryForTitle(doc.signatoryForTitle || "FOR: CHIEF EXECUTIVE");
    setCcText(doc.ccText || "");

    window.scrollTo({ top: 80, behavior: "smooth" });
    showToast("info", `Loaded document ${doc.verificationCode} into editor.`);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return;
    setLetterType(tmpl.type);
    setCustomTitle(`${tmpl.title} — ${recipientName || "Employee"}`);
    fillTemplateWithValues(tmpl, recipientName, recipientStaffId, recipientDepartment, recipientJobTitle, salaryGrade);
  };

  const resolveBody = () =>
    content
      .replace(/\{\{staff_name\}\}/g, recipientName || "[Employee Name]")
      .replace(/\{\{staff_id\}\}/g, recipientStaffId || "[Staff ID]")
      .replace(/\{\{department\}\}/g, recipientDepartment || "[Department]")
      .replace(/\{\{job_title\}\}/g, recipientJobTitle || "[Job Title]")
      .replace(/\{\{start_date\}\}/g, effectiveDate)
      .replace(/\{\{salary_grade\}\}/g, salaryGrade)
      .replace(/\{\{reporting_officer\}\}/g, "Director HR");

  const handleSaveOrSubmit = async (submitForApproval: boolean) => {
    if (!recipientName.trim() || !content.trim()) {
      showToast("error", "Recipient Name and Letter Body content are mandatory.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        recipientName,
        recipientStaffId,
        recipientDepartment,
        recipientJobTitle,
        applicantAddress: recipientAddress,
        staffId: selectedStaffRegistryId || undefined,
        templateId: selectedTemplateId || null,
        title: customTitle || "Official HR Letter",
        letterType,
        salutation,
        content: resolveBody(),
        salaryGrade,
        customRefNumber: refNumber,
        yourRef,
        effectiveDate,
        signatoryName,
        signatoryTitle,
        signatoryForTitle,
        ccText,
        status: submitForApproval ? "PENDING_APPROVAL" : "DRAFT",
      };

      if (editingLetterId) {
        const res = await fetch(`/api/hrletters/letters/${editingLetterId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          showToast(
            "success",
            submitForApproval
              ? "Letter submitted for Director review successfully."
              : "Draft updated successfully."
          );
          setEditingLetterId(null);
          setEditingLetterDoc(null);
          loadData();
        } else {
          showToast("error", data.error || "Failed to update document.");
        }
      } else {
        const res = await fetch("/api/hrletters/letters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          showToast(
            "success",
            submitForApproval
              ? "Letter submitted for Director review successfully."
              : "Draft created successfully."
          );
          loadData();
        } else {
          showToast("error", data.error || "Failed to create document.");
        }
      }
    } catch {
      showToast("error", "A network error occurred while saving the letter.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    printOfficialLetter({
      customRefNumber: refNumber,
      yourRef,
      issueDate,
      applicantName: recipientName || "APPLICANT NAME",
      applicantAddress: recipientAddress || "ACCRA - GHANA",
      salutation,
      customSubject: customTitle || "OFFER OF APPOINTMENT",
      customBodyText: resolveBody(),
      salaryGrade,
      signatoryName,
      signatoryTitle,
      signatoryForTitle,
      ccList: ccText,
      letterType,
      positionTitle: recipientJobTitle,
      departmentName: recipientDepartment,
      effectiveDate,
    });
  };

  const TAG_LIST = ["staff_name", "staff_id", "job_title", "department", "start_date", "salary_grade", "reporting_officer"];
  const templateOptions = templates.map((t) => ({ value: t.id, label: `${t.title} (${t.type})` }));
  const staffRegistryOptions = staffList.map((s) => ({
    value: s.id,
    label: `${s.fullName} (${s.staffId}) — ${s.department}`,
  }));

  // Queue summary counts
  const pendingCount = letters.filter((l) => l.status === "PENDING_APPROVAL").length;
  const approvedCount = letters.filter((l) => l.status === "APPROVED").length;
  const rejectedCount = letters.filter((l) => l.status === "REJECTED").length;

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold" style={{ color: "var(--color-text-1)" }}>
              Letter Generator &amp; Document Composer
            </h2>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
              {userRole === "HR_DIRECTOR" ? "Director Authority" : "HR Officer Mode"}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-3)" }}>
            Compose official DVLA letters with personnel registry auto-fill and real-time DVLA letterhead preview
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editingLetterId && (
            <Button variant="danger" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={resetDefaults}>
              Cancel Editing
            </Button>
          )}
          <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={resetDefaults}>
            Reset Form
          </Button>
          <Button variant="primary" size="sm" icon={<Printer className="w-3.5 h-3.5" />} onClick={handlePrint}>
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Active Lifecycle Stepper Card */}
      <div className="card p-4 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] gap-2">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isActive =
              editingLetterDoc
                ? (editingLetterDoc.status === "DRAFT" || editingLetterDoc.status === "REJECTED") && step.step === 1
                  ? true
                  : editingLetterDoc.status === "PENDING_APPROVAL" && step.step === 2
                  ? true
                  : editingLetterDoc.status === "APPROVED" && step.step === 3
                  ? true
                  : editingLetterDoc.status === "ISSUED" && step.step === 4
                  ? true
                  : editingLetterDoc.status === "ACKNOWLEDGED" && step.step === 5
                  ? true
                  : false
                : step.step === 1;

            return (
              <React.Fragment key={step.step}>
                <div
                  className={`flex-1 flex items-center gap-2.5 p-2 rounded-xl transition-all border ${
                    isActive
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-xs"
                      : "border-transparent text-slate-400 opacity-60"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isActive ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {step.step}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate leading-tight">{step.label}</p>
                    <p className="text-[10px] text-slate-500 truncate">{step.role}</p>
                  </div>
                </div>
                {idx < LIFECYCLE_STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Revision / Edit Mode Banner */}
      {editingLetterDoc && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-4 animate-fade-up ${
            editingLetterDoc.status === "REJECTED"
              ? "bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200"
              : "bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {editingLetterDoc.status === "REJECTED" ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            ) : (
              <FileEdit className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="text-sm font-bold">
                {editingLetterDoc.status === "REJECTED"
                  ? `Revising Letter: Changes Requested by Director (${editingLetterDoc.verificationCode})`
                  : `Currently Editing Draft Document (${editingLetterDoc.verificationCode})`}
              </p>
              {editingLetterDoc.status === "REJECTED" && (
                <p className="text-xs mt-1 bg-white/70 dark:bg-black/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900 font-mono">
                  <strong>Director Feedback Note:</strong>{" "}
                  {editingLetterDoc.rejectionReason ||
                    editingLetterDoc.approvalWorkflows?.find((w: any) => w.status === "REJECTED")?.comments ||
                    "Please revise parameters and re-submit for approval."}
                </p>
              )}
              <p className="text-xs mt-1 opacity-80">
                Update the document parameters below. Once revised, click &apos;Re-submit for Approval&apos; to send it back to the Director queue.
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={resetDefaults}>
            Discard &amp; Exit Edit Mode
          </Button>
        </div>
      )}

      {/* Split Layout: Editor & Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Document Editor */}
        <div className="card flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--color-text-1)" }}>
              <PenTool className="w-4 h-4 text-emerald-500" />
              {editingLetterId ? "Document Revisions Editor" : "New Document Composition"}
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
              {editingLetterDoc ? editingLetterDoc.verificationCode : "Unsaved Document"}
            </span>
          </div>

          <div className="flex-1 p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Recipient Source & Staff Registry Selector */}
            <div className="p-3.5 rounded-xl space-y-3" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--color-text-3)" }}>
                  <User className="w-3.5 h-3.5 text-emerald-500" /> Recipient Identification
                </p>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border text-xs">
                  <button
                    type="button"
                    onClick={() => setRecipientSource("registry")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      recipientSource === "registry"
                        ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Staff Registry
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientSource("manual")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      recipientSource === "manual"
                        ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    External / Manual
                  </button>
                </div>
              </div>

              {recipientSource === "registry" && (
                <div>
                  <InputLabel>Select from DVLA Personnel Registry</InputLabel>
                  <Select
                    value={selectedStaffRegistryId}
                    onChange={handleStaffRegistrySelect}
                    options={staffRegistryOptions}
                    placeholder="Search and pick an active employee..."
                    icon={<Users className="w-4 h-4" />}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Auto-populates full name, staff ID, department, salary grade, and position.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <InputLabel required>Full Name</InputLabel>
                  <input
                    type="text"
                    className={inputCls}
                    style={inputStyle}
                    placeholder="e.g. Kofi Mensah"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </div>
                <div>
                  <InputLabel>Staff Code / ID</InputLabel>
                  <input
                    type="text"
                    className={`${inputCls} font-mono`}
                    style={inputStyle}
                    placeholder="e.g. DVLA-712986"
                    value={recipientStaffId}
                    onChange={(e) => setRecipientStaffId(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <InputLabel>Department</InputLabel>
                  <input
                    type="text"
                    className={inputCls}
                    style={inputStyle}
                    placeholder="e.g. Driver Licensing & Administration"
                    value={recipientDepartment}
                    onChange={(e) => setRecipientDepartment(e.target.value)}
                  />
                </div>
                <div>
                  <InputLabel>Position / Job Title</InputLabel>
                  <input
                    type="text"
                    className={inputCls}
                    style={inputStyle}
                    placeholder="e.g. Senior Licensing Officer"
                    value={recipientJobTitle}
                    onChange={(e) => setRecipientJobTitle(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <InputLabel>Recipient Address</InputLabel>
                <input
                  type="text"
                  className={inputCls}
                  style={inputStyle}
                  placeholder="e.g. ACCRA - GHANA"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
              </div>
            </div>

            {/* References & Dates */}
            <div className="p-3.5 rounded-xl space-y-3" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--color-text-3)" }}>
                <Hash className="w-3.5 h-3.5 text-emerald-500" /> References &amp; Official Dates
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <InputLabel>DVLA Ref Number</InputLabel>
                  <input
                    type="text"
                    className={`${inputCls} font-mono`}
                    style={inputStyle}
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                  />
                </div>
                <div>
                  <InputLabel>Recipient / Your Ref</InputLabel>
                  <input
                    type="text"
                    className={`${inputCls} font-mono`}
                    style={inputStyle}
                    placeholder="e.g. NSS/ADM/2026/042"
                    value={yourRef}
                    onChange={(e) => setYourRef(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <InputLabel>Official Letter Date</InputLabel>
                  <input
                    type="text"
                    className={inputCls}
                    style={inputStyle}
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
                <div>
                  <InputLabel>Effective / Assumption Date</InputLabel>
                  <input
                    type="text"
                    className={inputCls}
                    style={inputStyle}
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Template & Subject Headings */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <InputLabel>Load Template (Optional)</InputLabel>
                <Select
                  value={selectedTemplateId}
                  onChange={handleTemplateSelect}
                  options={templateOptions}
                  placeholder="Pick an approved template"
                  icon={<FileText className="w-4 h-4" />}
                />
              </div>
              <div>
                <InputLabel>Salutation</InputLabel>
                <input
                  type="text"
                  className={inputCls}
                  style={inputStyle}
                  value={salutation}
                  onChange={(e) => setSalutation(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <InputLabel>Subject Heading Title</InputLabel>
                <input
                  className={inputCls}
                  style={inputStyle}
                  placeholder="OFFER OF APPOINTMENT"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>
              <div>
                <InputLabel>Salary Scale / Grade</InputLabel>
                <input
                  className={inputCls}
                  style={inputStyle}
                  placeholder="Grade 12 Step 1"
                  value={salaryGrade}
                  onChange={(e) => setSalaryGrade(e.target.value)}
                />
              </div>
            </div>

            {/* Tags + Body Textarea */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <InputLabel required>Letter Body Paragraphs</InputLabel>
                <span className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--color-text-4)" }}>
                  <Tag className="w-3 h-3" /> Click placeholder tag to insert:
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {TAG_LIST.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setContent((p) => p + ` {{${tag}}}`)}
                    className="px-2 py-1 rounded-md text-[11px] font-mono font-semibold border cursor-pointer transition-colors"
                    style={{
                      background: "var(--color-accent-subtle)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-accent)",
                    }}
                  >
                    {`{${tag}}`}
                  </button>
                ))}
              </div>
              <textarea
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type the letter body, or select a template above."
                className={`${inputCls} resize-none font-serif leading-relaxed`}
                style={inputStyle}
              />
            </div>

            {/* Signatory & Distribution (CC) */}
            <div className="p-3.5 rounded-xl space-y-3" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--color-text-3)" }}>
                <Stamp className="w-3.5 h-3.5 text-emerald-500" /> Signatory &amp; Distribution (Cc)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <InputLabel>Signatory Name</InputLabel>
                  <input
                    type="text"
                    className={inputCls}
                    style={inputStyle}
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                  />
                </div>
                <div>
                  <InputLabel>Signatory Title</InputLabel>
                  <input
                    type="text"
                    className={inputCls}
                    style={inputStyle}
                    value={signatoryTitle}
                    onChange={(e) => setSignatoryTitle(e.target.value)}
                  />
                </div>
                <div>
                  <InputLabel>On Behalf Of Line</InputLabel>
                  <input
                    type="text"
                    className={inputCls}
                    style={inputStyle}
                    value={signatoryForTitle}
                    onChange={(e) => setSignatoryForTitle(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <InputLabel>Cc Distribution List (One entry per line)</InputLabel>
                <textarea
                  rows={3}
                  value={ccText}
                  onChange={(e) => setCcText(e.target.value)}
                  className={`${inputCls} resize-none`}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t gap-2" style={{ borderColor: "var(--color-border)" }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSaveOrSubmit(false)}
              loading={saving}
            >
              {editingLetterId ? "Update Draft" : "Save as Draft"}
            </Button>

            <div className="flex items-center gap-2">
              {editingLetterId && (
                <Button variant="ghost" size="sm" onClick={resetDefaults}>
                  Cancel Revision
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                icon={<Send className="w-4 h-4" />}
                onClick={() => handleSaveOrSubmit(true)}
                loading={saving}
              >
                {editingLetterId ? "Re-submit for Approval" : "Submit for Director Approval"}
              </Button>
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="space-y-3">
          <div
            className="flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs font-medium"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-3)" }}
          >
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-500" /> Real-Time DVLA HR Letterhead Preview
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>

          <div className="overflow-auto rounded-xl border" style={{ borderColor: "var(--color-border)", maxHeight: "78vh" }}>
            <OfficialAppointmentLetter
              referenceNumber={refNumber}
              applicantName={recipientName || "[ Recipient Full Name ]"}
              applicantAddress={recipientAddress || "ACCRA - GHANA"}
              positionTitle={recipientJobTitle || "Officer"}
              departmentName={recipientDepartment || "Human Resource"}
              appointmentType={letterType}
              effectiveDate={effectiveDate}
              issueDate={issueDate}
              salutation={salutation}
              customRefNumber={refNumber}
              yourRef={yourRef}
              customSubject={customTitle || "OFFER OF APPOINTMENT"}
              customBodyText={resolveBody() || "Type the letter body above to see it rendered here in real time."}
              salaryGrade={salaryGrade}
              signatoryName={signatoryName}
              signatoryTitle={signatoryTitle}
              signatoryForTitle={signatoryForTitle}
              ccList={ccText}
            />
          </div>
        </div>
      </div>

      {/* Centralized Approval Queue Gateway Card */}
      <div className="card p-6 border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold" style={{ color: "var(--color-text-1)" }}>
              Centralized Approval Queue &amp; Letter Archive
            </h3>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            All document approvals, revision requests, digital seals, and historical records are managed in the{" "}
            <strong>Letter Archive &amp; Queue Gateway</strong> with an instant switcher.
          </p>
          <div className="flex items-center gap-3 pt-2 text-xs">
            {pendingCount > 0 && (
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {pendingCount} Pending Review
              </span>
            )}
            {approvedCount > 0 && (
              <span className="text-teal-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {approvedCount} Awaiting Seal
              </span>
            )}
            {rejectedCount > 0 && (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {rejectedCount} Needs Revision
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/hrletters/archive?mode=queue">
            <Button variant="primary" size="sm" icon={<Clock className="w-3.5 h-3.5" />}>
              Open Approval Queue
            </Button>
          </Link>
          <Link href="/hrletters/archive?mode=archive">
            <Button variant="secondary" size="sm" icon={<Archive className="w-3.5 h-3.5" />}>
              View Letter Archive
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HrLettersGeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-semibold text-slate-400">
          Loading DVLA HR Letters Engine...
        </div>
      }
    >
      <GeneratePageContent />
    </Suspense>
  );
}
