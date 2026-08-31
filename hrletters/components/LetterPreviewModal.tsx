"use client";

import React, { useEffect } from "react";
import { Printer, CheckCircle, X, FileText } from "lucide-react";
import { OfficialAppointmentLetter } from "./OfficialAppointmentLetter";
import { Badge, statusToBadgeVariant } from "./ui/Badge";
import { Button } from "./ui/Button";
import { printOfficialLetter } from "../lib/printLetterHelper";

interface LetterPreviewModalProps {
  letter: any;
  onClose: () => void;
  onAcknowledge?: (letterId: string) => void;
  isEmployeeView?: boolean;
}

export const LetterPreviewModal: React.FC<LetterPreviewModalProps> = ({
  letter,
  onClose,
  onAcknowledge,
  isEmployeeView = false,
}) => {
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
        ? new Date(letter.issuedAt).toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" }).toUpperCase()
        : new Date().toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" }).toUpperCase(),
      applicantName: letter.staff?.fullName || "Staff Member",
      applicantAddress: letter.applicantAddress || "ACCRA - GHANA",
      salutation: letter.salutation || "Dear Sir/Madam,",
      customSubject: letter.title,
      customBodyText: letter.content,
      salaryGrade: letter.salaryGrade,
      signatoryName: letter.signatoryName || "EPHRAIM NII TAN SACKEY",
      signatoryTitle: letter.signatoryTitle || "AG. DIRECTOR HR",
      signatoryForTitle: letter.signatoryForTitle || "FOR: CHIEF EXECUTIVE",
      ccList: letter.ccList,
      digitalSignature: letter.digitalSignature,
      letterType: letter.letterType,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] my-auto flex flex-col rounded-xl border shadow-2xl overflow-hidden animate-fade-up shrink-0"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg shrink-0" style={{ background: "var(--color-accent-subtle)" }}>
              <FileText className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-1)" }}>
                  {letter.title}
                </p>
                <Badge variant={statusToBadgeVariant(letter.status)} dot>
                  {letter.status?.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-3)" }}>
                Verification:{" "}
                <code className="font-mono font-semibold" style={{ color: "var(--color-accent)" }}>
                  {letter.verificationCode}
                </code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-4">
            <Button
              variant="primary"
              size="sm"
              icon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
            >
              Print / Download PDF
            </Button>

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

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-70"
              style={{ color: "var(--color-text-3)" }}
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Letterhead body ── */}
        <div
          className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center"
          style={{ background: "var(--color-bg)" }}
        >
          <OfficialAppointmentLetter
            referenceNumber={letter.verificationCode}
            verificationCode={letter.verificationCode}
            applicantName={letter.staff?.fullName || "Staff Member"}
            positionTitle={letter.staff?.jobTitle || "Officer"}
            departmentName={letter.staff?.department || "Operations"}
            appointmentType={letter.letterType || "APPOINTMENT"}
            effectiveDate={
              letter.effectiveDate ||
              letter.staff?.appointmentDate ||
              "Monday, September 1, 2026"
            }
            issueDate={
              letter.issuedAt
                ? new Date(letter.issuedAt).toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" }).toUpperCase()
                : new Date().toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" }).toUpperCase()
            }
            salutation={letter.salutation || "Dear Sir/Madam,"}
            customRefNumber={letter.customRefNumber}
            yourRef={letter.yourRef}
            customSubject={letter.title}
            customBodyText={letter.content}
            salaryGrade={letter.salaryGrade || letter.staff?.salaryGrade || "Grade 12 Step 1"}
            signatoryName={letter.signatoryName || "EPHRAIM NII TAN SACKEY"}
            signatoryTitle={letter.signatoryTitle || "AG. DIRECTOR HR"}
            signatoryForTitle={letter.signatoryForTitle || "FOR: CHIEF EXECUTIVE"}
            digitalSignature={letter.digitalSignature}
            status={letter.status}
          />
        </div>
      </div>
    </div>
  );
};
