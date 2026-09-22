"use client";

import React, { useEffect, useState } from "react";
import {
  FileText, Send, PenTool, Eye, Tag, Stamp, User, Building2, Hash, Printer, RefreshCw, Sparkles,
  Mail, CheckCircle2,
} from "lucide-react";
import { SignaturePad } from "@/components/hrletters/SignaturePad";
import { LetterPreviewModal } from "@/components/hrletters/LetterPreviewModal";
import { OfficialAppointmentLetter } from "@/components/hrletters/OfficialAppointmentLetter";
import { Badge, statusToBadgeVariant } from "@/components/hrletters/ui/Badge";
import { Button } from "@/components/hrletters/ui/Button";
import { Select } from "@/components/hrletters/ui/Select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/hrletters/ui/table";
import { Pagination } from "@/components/hrletters/ui/Pagination";
import { printOfficialLetter } from "@/lib/printLetterHelper";

const InputLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-2)" }}>
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const inputCls = "w-full px-3 py-2 rounded-lg border text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";
const inputStyle = { background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text-1)" };

export default function HrLettersGeneratePage() {
  const [letters, setLetters] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState("HR_OFFICER");

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
  const [ccText, setCcText] = useState("Chief Executive\nDeputy Chief Executives\nAg. Director, IT\nAg. Director Administration\nManager, HR (C&B)");

  // UI State
  const [signingLetterId, setSigningLetterId] = useState<string | null>(null);
  const [previewLetter, setPreviewLetter] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    fetch("/api/hrletters/auth/check").then(r => r.json()).then(d => {
      if (d.user?.role) setUserRole(d.user.role);
    }).catch(() => {});
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lRes, tRes] = await Promise.all([
        fetch("/api/hrletters/letters").then(r => r.json()),
        fetch("/api/hrletters/templates").then(r => r.json()),
      ]);
      if (lRes.success) setLetters(lRes.data);
      if (tRes.success) setTemplates(tRes.data);
    } finally {
      setLoading(false);
    }
  };

  const resetDefaults = () => {
    setRecipientName("Kofi Mensah");
    setRecipientStaffId("DVLA-712986");
    setRecipientDepartment("Driver Licensing & Administration");
    setRecipientJobTitle("Senior Licensing Officer");
    setRecipientAddress("ACCRA - GHANA");
    setSelectedTemplateId("");
    setCustomTitle("OFFER OF APPOINTMENT");
    setLetterType("APPOINTMENT");
    setSalutation("Dear Sir/Madam,");
    setContent("I am pleased to convey to you that the Driver and Vehicle Licensing Authority (DVLA) has offered you appointment as Senior Licensing Officer in the Driver Licensing & Administration department at Head Office, Accra.");
    setSalaryGrade("Grade 12 Step 1");
    setRefNumber("DVLA/HR/07/26/PLACMT/0127");
    setYourRef("NSS/ADM/2026/042");
    setIssueDate(new Date().toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" }).toUpperCase());
    setEffectiveDate("Monday, September 1, 2026");
    setSignatoryName("EPHRAIM NII TAN SACKEY");
    setSignatoryTitle("AG. DIRECTOR HR");
    setSignatoryForTitle("FOR: CHIEF EXECUTIVE");
    setCcText("Chief Executive\nDeputy Chief Executives\nAg. Director, IT\nAg. Director Administration\nManager, HR (C&B)");
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates.find(t => t.id === templateId);
    if (!tmpl) return;
    setLetterType(tmpl.type);
    setCustomTitle(`${tmpl.title} — ${recipientName || "Employee"}`);
    let fill = tmpl.content
      .replace(/\{\{staff_name\}\}/g, recipientName || "[Employee Name]")
      .replace(/\{\{staff_id\}\}/g, recipientStaffId || "[Staff ID]")
      .replace(/\{\{department\}\}/g, recipientDepartment || "[Department]")
      .replace(/\{\{job_title\}\}/g, recipientJobTitle || "[Job Title]")
      .replace(/\{\{start_date\}\}/g, effectiveDate)
      .replace(/\{\{salary_grade\}\}/g, salaryGrade)
      .replace(/\{\{reporting_officer\}\}/g, "Director HR");
    setContent(fill);
  };

  const resolveBody = () => content
    .replace(/\{\{staff_name\}\}/g, recipientName || "[Employee Name]")
    .replace(/\{\{staff_id\}\}/g, recipientStaffId || "[Staff ID]")
    .replace(/\{\{department\}\}/g, recipientDepartment || "[Department]")
    .replace(/\{\{job_title\}\}/g, recipientJobTitle || "[Job Title]")
    .replace(/\{\{start_date\}\}/g, effectiveDate)
    .replace(/\{\{salary_grade\}\}/g, salaryGrade)
    .replace(/\{\{reporting_officer\}\}/g, "Director HR");

  const handlePrint = () => {
    printOfficialLetter({
      customRefNumber: refNumber, yourRef, issueDate,
      applicantName: recipientName || "APPLICANT NAME",
      applicantAddress: recipientAddress || "ACCRA - GHANA",
      salutation, customSubject: customTitle || "OFFER OF APPOINTMENT",
      customBodyText: resolveBody(), salaryGrade,
      signatoryName, signatoryTitle, signatoryForTitle,
      ccList: ccText, letterType,
      positionTitle: recipientJobTitle, departmentName: recipientDepartment, effectiveDate,
    });
  };

  const handleGenerateLetter = async (submitForApproval: boolean) => {
    if (!recipientName || !content) return;
    setSaving(true);
    try {
      const res = await fetch("/api/hrletters/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName, recipientStaffId, recipientDepartment, recipientJobTitle, recipientAddress,
          templateId: selectedTemplateId || null,
          title: customTitle || "Official HR Letter",
          letterType, salutation, content: resolveBody(), salaryGrade,
          customRefNumber: refNumber, yourRef, effectiveDate,
          signatoryName, signatoryTitle, signatoryForTitle, ccText,
          status: submitForApproval ? "PENDING_APPROVAL" : "DRAFT",
        }),
      });
      const data = await res.json();
      if (data.success) loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleApproveLetter = async (id: string) => {
    const res = await fetch(`/api/hrletters/letters/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED", action: "LETTER_APPROVED", details: "Reviewed and approved." }),
    });
    if ((await res.json()).success) loadData();
  };

  const handleSaveSignature = async (sig: string) => {
    if (!signingLetterId) return;
    const res = await fetch(`/api/hrletters/letters/${signingLetterId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "ISSUED", digitalSignature: sig, signatoryName, signatoryTitle,
        signedAt: new Date().toISOString(), issuedAt: new Date().toISOString(),
        action: "LETTER_ISSUED_WITH_SIGNATURE", details: "Digital signature attached and letter issued.",
      }),
    });
    if ((await res.json()).success) { setSigningLetterId(null); loadData(); }
  };

  const TAG_LIST = ["staff_name", "staff_id", "job_title", "department", "start_date", "salary_grade", "reporting_officer"];
  const templateOptions = templates.map(t => ({ value: t.id, label: `${t.title} (${t.type})` }));
  const paginatedLetters = letters.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(letters.length / pageSize);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-1)" }}>Letter Generator</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-3)" }}>Compose & customize official HR letters with real-time preview & full-bleed print/export</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={resetDefaults}>Reset</Button>
          <Button variant="primary" size="sm" icon={<Printer className="w-3.5 h-3.5" />} onClick={handlePrint}>Print / PDF</Button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="card flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--color-text-1)" }}>
              <PenTool className="w-4 h-4 text-emerald-500" /> Document Editor
            </h3>
            <span className="text-xs font-medium" style={{ color: "var(--color-text-4)" }}>Full Field Control</span>
          </div>

          <div className="flex-1 p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Recipient Details */}
            <div className="p-3.5 rounded-xl space-y-3" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--color-text-3)" }}>
                <User className="w-3.5 h-3.5 text-emerald-500" /> Recipient Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div><InputLabel required>Full Name</InputLabel>
                  <input type="text" className={inputCls} style={inputStyle} placeholder="e.g. Kofi Mensah" value={recipientName} onChange={e => setRecipientName(e.target.value)} />
                </div>
                <div><InputLabel>Staff ID</InputLabel>
                  <input type="text" className={`${inputCls} font-mono`} style={inputStyle} placeholder="e.g. DVLA-712986" value={recipientStaffId} onChange={e => setRecipientStaffId(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><InputLabel>Department</InputLabel>
                  <input type="text" className={inputCls} style={inputStyle} placeholder="e.g. Driver Licensing" value={recipientDepartment} onChange={e => setRecipientDepartment(e.target.value)} />
                </div>
                <div><InputLabel>Position / Job Title</InputLabel>
                  <input type="text" className={inputCls} style={inputStyle} placeholder="e.g. Licensing Officer" value={recipientJobTitle} onChange={e => setRecipientJobTitle(e.target.value)} />
                </div>
              </div>
              <div><InputLabel>Recipient Address</InputLabel>
                <input type="text" className={inputCls} style={inputStyle} placeholder="e.g. ACCRA - GHANA" value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} />
              </div>
            </div>

            {/* References & Dates */}
            <div className="p-3.5 rounded-xl space-y-3" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--color-text-3)" }}>
                <Hash className="w-3.5 h-3.5 text-emerald-500" /> References & Dates
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div><InputLabel>My Ref Number</InputLabel>
                  <input type="text" className={`${inputCls} font-mono`} style={inputStyle} value={refNumber} onChange={e => setRefNumber(e.target.value)} />
                </div>
                <div><InputLabel>Your Ref Number</InputLabel>
                  <input type="text" className={`${inputCls} font-mono`} style={inputStyle} placeholder="e.g. NSS/ADM/2026/042" value={yourRef} onChange={e => setYourRef(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><InputLabel>Official Letter Date</InputLabel>
                  <input type="text" className={inputCls} style={inputStyle} value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                </div>
                <div><InputLabel>Effective / Assumption Date</InputLabel>
                  <input type="text" className={inputCls} style={inputStyle} value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Template & Headings */}
            <div className="grid grid-cols-2 gap-3">
              <div><InputLabel>Load Template (Optional)</InputLabel>
                <Select value={selectedTemplateId} onChange={handleTemplateSelect} options={templateOptions} placeholder="Pick a template" icon={<FileText className="w-4 h-4" />} />
              </div>
              <div><InputLabel>Salutation</InputLabel>
                <input type="text" className={inputCls} style={inputStyle} value={salutation} onChange={e => setSalutation(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><InputLabel>Subject Heading Title</InputLabel>
                <input className={inputCls} style={inputStyle} placeholder="OFFER OF APPOINTMENT" value={customTitle} onChange={e => setCustomTitle(e.target.value)} />
              </div>
              <div><InputLabel>Salary Scale / Grade</InputLabel>
                <input className={inputCls} style={inputStyle} value={salaryGrade} onChange={e => setSalaryGrade(e.target.value)} />
              </div>
            </div>

            {/* Tags + Body Textarea */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <InputLabel required>Letter Body Paragraphs</InputLabel>
                <span className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--color-text-4)" }}>
                  <Tag className="w-3 h-3" /> Insert placeholder:
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {TAG_LIST.map(tag => (
                  <button key={tag} type="button" onClick={() => setContent(p => p + ` {{${tag}}}`)}
                    className="px-2 py-1 rounded-md text-[11px] font-mono font-semibold border cursor-pointer transition-colors"
                    style={{ background: "var(--color-accent-subtle)", borderColor: "var(--color-border)", color: "var(--color-accent)" }}
                  >
                    {`{${tag}}`}
                  </button>
                ))}
              </div>
              <textarea
                rows={8} value={content} onChange={e => setContent(e.target.value)}
                placeholder="Type the letter body, or select a template above."
                className={`${inputCls} resize-none font-serif leading-relaxed`}
                style={inputStyle}
              />
            </div>

            {/* Signatory & CC */}
            <div className="p-3.5 rounded-xl space-y-3" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--color-text-3)" }}>
                <Stamp className="w-3.5 h-3.5 text-emerald-500" /> Signatory & Distribution (Cc)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div><InputLabel>Signatory Name</InputLabel>
                  <input type="text" className={inputCls} style={inputStyle} value={signatoryName} onChange={e => setSignatoryName(e.target.value)} />
                </div>
                <div><InputLabel>Signatory Title</InputLabel>
                  <input type="text" className={inputCls} style={inputStyle} value={signatoryTitle} onChange={e => setSignatoryTitle(e.target.value)} />
                </div>
                <div><InputLabel>On Behalf Of Line</InputLabel>
                  <input type="text" className={inputCls} style={inputStyle} value={signatoryForTitle} onChange={e => setSignatoryForTitle(e.target.value)} />
                </div>
              </div>
              <div><InputLabel>Cc Distribution List (One entry per line)</InputLabel>
                <textarea rows={3} value={ccText} onChange={e => setCcText(e.target.value)} className={`${inputCls} resize-none`} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t" style={{ borderColor: "var(--color-border)" }}>
            <Button variant="secondary" size="sm" onClick={() => handleGenerateLetter(false)} loading={saving}>Save Draft</Button>
            {userRole === "HR_OFFICER" && (
              <Button variant="primary" size="sm" icon={<Send className="w-4 h-4" />} onClick={() => handleGenerateLetter(true)} loading={saving}>Submit for Approval</Button>
            )}
            {userRole === "HR_DIRECTOR" && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" icon={<Send className="w-4 h-4" />} onClick={() => handleGenerateLetter(true)} loading={saving}>Submit for Approval</Button>
                <Button variant="primary" size="sm" icon={<CheckCircle2 className="w-4 h-4" />} onClick={async () => { setSaving(true); try { const res = await fetch("/api/hrletters/letters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientName, recipientStaffId, recipientDepartment, recipientJobTitle, recipientAddress, templateId: selectedTemplateId || null, title: customTitle || "Official HR Letter", letterType, salutation, content: resolveBody(), salaryGrade, customRefNumber: refNumber, yourRef, effectiveDate, signatoryName, signatoryTitle, signatoryForTitle, ccText, status: "APPROVED" }) }); const data = await res.json(); if (data.success) loadData(); } finally { setSaving(false); } }} loading={saving}>Approve &amp; Save</Button>
              </div>
            )}
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs font-medium"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-3)" }}>
            <span className="flex items-center gap-2"><Eye className="w-4 h-4 text-emerald-500" /> Real-Time DVLA HR Letterhead Preview</span>
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

      {/* Letter Documents Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>Letter Documents & Approval Queue</h3>
          <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{ background: "var(--color-border-subtle)", color: "var(--color-text-3)" }}>{letters.length} records</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {["Verification Code", "Recipient", "Document Title", "Status", "Signature", "Actions"].map(h => <TableHead key={h}>{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                  {Array(6).fill(0).map((_, j) => (
                    <TableCell key={j}><div className="skeleton h-4 rounded" style={{ width: `${60 + Math.random() * 40}%` }} /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedLetters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm" style={{ color: "var(--color-text-4)" }}>
                  No letters generated yet. Use the editor above to create one.
                </TableCell>
              </TableRow>
            ) : paginatedLetters.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell><code className="text-xs font-mono font-semibold" style={{ color: "var(--color-accent)" }}>{doc.verificationCode}</code></TableCell>
                <TableCell className="font-semibold text-sm" style={{ color: "var(--color-text-1)" }}>{doc.staff?.fullName || "—"}</TableCell>
                <TableCell className="text-sm" style={{ color: "var(--color-text-2)" }}>{doc.title}</TableCell>
                <TableCell><Badge variant={statusToBadgeVariant(doc.status)} dot>{doc.status.replace("_", " ")}</Badge></TableCell>
                <TableCell>
                  {doc.digitalSignature ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><Stamp className="w-3.5 h-3.5" /> Signed</span>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--color-text-4)" }}>Unsigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 justify-end flex-wrap">
                    <Button variant="secondary" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => setPreviewLetter(doc)}>View</Button>
                    {/* HR_DIRECTOR ONLY — Approve */}
                    {doc.status === "PENDING_APPROVAL" && userRole === "HR_DIRECTOR" && (
                      <Button variant="primary" size="sm" onClick={() => handleApproveLetter(doc.id)}>Approve</Button>
                    )}
                    {/* HR_DIRECTOR ONLY — Sign & Issue */}
                    {doc.status === "APPROVED" && userRole === "HR_DIRECTOR" && (
                      <Button variant="success" size="sm" icon={<PenTool className="w-3.5 h-3.5" />} onClick={() => setSigningLetterId(doc.id)}>Sign & Issue</Button>
                    )}
                    {/* HR_OFFICER — indicator for pending letters they submitted */}
                    {doc.status === "PENDING_APPROVAL" && userRole === "HR_OFFICER" && (
                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">Awaiting Director</span>
                    )}
                    {doc.status === "ISSUED" && (
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1"><Stamp className="w-3 h-3" /> Issued</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={letters.length} pageSize={pageSize} onPageChange={setCurrentPage} />
      </div>

      {signingLetterId && <SignaturePad onClose={() => setSigningLetterId(null)} onSaveSignature={handleSaveSignature} signatoryName={signatoryName} signatoryTitle={signatoryTitle} />}
      {previewLetter && <LetterPreviewModal letter={previewLetter} onClose={() => setPreviewLetter(null)} />}
    </div>
  );
}
