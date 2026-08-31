"use client";

import React from "react";
import Image from "next/image";

export interface OfficialAppointmentLetterProps {
  referenceNumber: string;
  verificationCode?: string;
  applicantName: string;
  applicantAddress?: string;
  positionTitle: string;
  departmentName: string;
  postingStationName?: string;
  appointmentType?: string; // APPOINTMENT, PROMOTION, CONFIRMATION, TRANSFER, WARNING, LEAVE_APPROVAL, CONTRACT_RENEWAL
  effectiveDate?: string;
  issueDate?: string;
  salutation?: string;
  customRefNumber?: string;
  yourRef?: string;
  customSubject?: string;
  customBodyText?: string;
  salaryGrade?: string;
  probationPeriod?: string;
  contractDuration?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  signatoryForTitle?: string;
  ccList?: string | string[];
  digitalSignature?: string;
  status?: string;
  isPrintView?: boolean;
}

export const OfficialAppointmentLetter: React.FC<OfficialAppointmentLetterProps> = ({
  referenceNumber,
  verificationCode,
  applicantName,
  applicantAddress = "ACCRA - GHANA",
  positionTitle,
  departmentName,
  postingStationName = "Head Office",
  appointmentType = "APPOINTMENT",
  effectiveDate = "Monday, September 1, 2026",
  issueDate = new Date().toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" }).toUpperCase(),
  salutation = "Dear Sir/Madam,",
  customRefNumber,
  yourRef,
  customSubject,
  customBodyText,
  salaryGrade = "Grade 12 Step 1",
  probationPeriod = "six (6) months",
  contractDuration = "two (2) years",
  signatoryName = "EPHRAIM NII TAN SACKEY",
  signatoryTitle = "AG. DIRECTOR HR",
  signatoryForTitle = "FOR: CHIEF EXECUTIVE",
  ccList,
  digitalSignature,
  status,
  isPrintView = false,
}) => {
  const displayRef = customRefNumber || `DVLA/HR/07/26/PLACMT/${referenceNumber?.slice(-4) || '0127'}`;
  const displaySubject = customSubject || (
    appointmentType === 'CONTRACT_RENEWAL' ? 'OFFER OF CONTRACT RENEWAL' :
    appointmentType === 'PROMOTION' ? 'LETTER OF PROMOTION' :
    appointmentType === 'CONFIRMATION' ? 'CONFIRMATION OF APPOINTMENT' :
    appointmentType === 'TRANSFER' ? 'INTER-DEPARTMENTAL TRANSFER' :
    appointmentType === 'WARNING' ? 'FORMAL DISCIPLINARY WARNING' :
    appointmentType === 'LEAVE_APPROVAL' ? 'APPROVAL OF LEAVE' :
    'OFFER OF APPOINTMENT'
  );

  // Parse CC list array or multiline string
  const formattedCcList: string[] = typeof ccList === 'string'
    ? ccList.split('\n').map(s => s.trim()).filter(Boolean)
    : Array.isArray(ccList) && ccList.length > 0
    ? ccList
    : [
        'Chief Executive',
        'Deputy Chief Executives',
        'Ag. Director, IT',
        'Ag. Director Administration',
        'Manager, HR (C&B)',
      ];

  return (
    <div
      className={`relative w-full max-w-4xl mx-auto text-gray-900 shadow-2xl rounded-xl p-8 md:p-12 border border-amber-300/60 overflow-hidden ${
        isPrintView ? 'p-0 shadow-none border-none' : ''
      }`}
      style={{ backgroundColor: '#FDF3C0', fontFamily: "'Times New Roman', Times, serif" }}
      id="official-letterhead"
    >
      {/* Background oop.png Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.055] pointer-events-none select-none">
        <div className="relative w-[360px] h-[360px]">
          <Image src="/oop.png" alt="DVLA Watermark" fill className="object-contain" />
        </div>
      </div>

      {/* TOP LETTERHEAD HEADER */}
      <div className="relative z-10">
        <h1 className="text-center text-xl md:text-2xl font-serif font-black text-[#008053] tracking-wide uppercase leading-tight">
          DRIVER AND VEHICLE LICENSING AUTHORITY
        </h1>
        <div className="grid grid-cols-3 items-center mt-3 text-[11px] md:text-xs text-gray-800 leading-tight">
          {/* Left Contact Info */}
          <div className="text-left font-sans space-y-0.5">
            <div><strong>Tel:</strong> 0302 764 529</div>
            <div><strong>Website:</strong> http://www.dvla.gov.gh</div>
            <div><strong>Email:</strong> info@dvla.gov.gh</div>
          </div>
          {/* Center Official Seal — oop.png */}
          <div className="flex justify-center">
            <div className="relative w-20 h-20 md:w-24 md:h-24">
              <Image src="/oop.png" alt="DVLA Official Seal" fill className="object-contain drop-shadow-sm" priority />
            </div>
          </div>
          {/* Right Address */}
          <div className="text-right font-sans space-y-0.5">
            <div className="font-bold text-[#008053]">Head Office Address:</div>
            <div>1, Jawaharlal Nehru Road</div>
            <div>P. O. Box 9379, KIA-Accra</div>
          </div>
        </div>
        {/* Green Horizontal Divider Line */}
        <div className="border-t-2 border-[#008053] mt-3 mb-5" />
      </div>

      {/* LETTER REFERENCE & DATE ROWS */}
      <div className="text-xs md:text-sm mb-5 relative z-10 space-y-0.5">
        {/* Row 1: My Ref (Left) & Date (Right Corner) */}
        <div className="flex items-end justify-between gap-4">
          {/* My Ref (Left) */}
          <div className="flex items-end gap-2 flex-1 max-w-[320px]">
            <span className="font-bold shrink-0 text-gray-900 pb-[1px]">My Ref:</span>
            <div className="flex-1 relative pb-[1px] min-w-0 overflow-hidden">
              <span className="absolute bottom-0 left-0 right-0 text-gray-400 font-mono text-[10px] tracking-[2.5px] select-none pointer-events-none leading-none overflow-hidden whitespace-nowrap">
                ............................................................
              </span>
              <span className="relative font-bold text-gray-950 tracking-tight ml-2">
                {displayRef}
              </span>
            </div>
          </div>
          {/* Date (Right Corner) */}
          <div className="flex items-end gap-2 shrink-0 w-[200px]">
            <span className="font-bold shrink-0 text-gray-900 pb-[1px]">Date:</span>
            <div className="flex-1 relative pb-[1px] min-w-0 overflow-hidden">
              <span className="absolute bottom-0 left-0 right-0 text-gray-400 font-mono text-[10px] tracking-[2.5px] select-none pointer-events-none leading-none overflow-hidden whitespace-nowrap">
                ..................................................
              </span>
              <span className="relative font-bold text-gray-950 uppercase tracking-tight ml-2">
                {issueDate}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Your Ref (Compact width on Left) */}
        <div className="flex items-end gap-2 max-w-[320px]">
          <span className="font-bold shrink-0 text-gray-900 pb-[1px]">Your Ref:</span>
          <div className="flex-1 relative pb-[1px] min-w-0 overflow-hidden">
            <span className="absolute bottom-0 left-0 right-0 text-gray-400 font-mono text-[10px] tracking-[2.5px] select-none pointer-events-none leading-none overflow-hidden whitespace-nowrap">
              ............................................................
            </span>
            <span className="relative font-bold text-gray-950 tracking-tight ml-2">
              {yourRef || "\u00A0"}
            </span>
          </div>
        </div>
      </div>

      {/* CANDIDATE ADDRESSEE */}
      <div className="mb-5 space-y-0.5 uppercase font-serif font-bold text-xs md:text-sm text-gray-900 relative z-10">
        <div className="text-sm md:text-base font-black text-gray-950">{applicantName}</div>
        <div className="text-gray-700">{applicantAddress}</div>
      </div>

      {/* SALUTATION */}
      <div className="mb-4 text-xs md:text-sm font-serif text-gray-900 relative z-10">
        {salutation}
      </div>

      {/* SUBJECT TITLE */}
      <div className="mb-5 relative z-10">
        <h2 className="inline-block text-xs md:text-sm font-serif font-black uppercase text-gray-950 border-b border-gray-950 pb-0.5 tracking-wider">
          {displaySubject}
        </h2>
      </div>

      {/* BODY PARAGRAPHS */}
      <div className="space-y-4 text-xs md:text-sm text-gray-900 leading-relaxed font-serif relative z-10 text-justify">
        {customBodyText ? (
          <div className="whitespace-pre-line">{customBodyText}</div>
        ) : (
          <>
            <p>
              I am pleased to inform you that Management has approved your appointment as <strong>{positionTitle}</strong> in the <strong>{departmentName} Department</strong> at <strong>{postingStationName}</strong>, effective <strong>{effectiveDate}</strong>.
            </p>
            <p>
              Your appointment is subject to a probation period of <strong>{probationPeriod}</strong>, during which your performance and conduct will be evaluated for confirmation. Your salary and benefits will be attached to <strong>{salaryGrade}</strong> of the Authority&apos;s Approved Salary Structure.
            </p>
            <p>
              You are required to report to the Ag. Director Human Resource on <strong>{effectiveDate}</strong> for formal onboarding and IPPD payroll documentation.
            </p>
            <p className="pt-2">
              Kindly sign and acknowledge receipt of this document on the staff portal to signify your formal acceptance of this offer.
            </p>
          </>
        )}
      </div>

      {/* SIGNATORY & FOOTER */}
      <div className="mt-8 relative z-10 font-serif text-xs">
        <div className="space-y-4">
          <div>
            <div className="text-gray-900">Yours faithfully,</div>

            {/* Handwritten Signature SVG or Captured Signature */}
            <div className="my-2 h-14 flex items-center">
              {digitalSignature ? (
                <img src={digitalSignature} alt="Signature Stamp" className="h-14 object-contain" />
              ) : (
                <svg className="w-36 h-12 text-[#1a365d]" viewBox="0 0 200 60" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M 10,45 Q 30,10 50,40 T 90,20 T 130,45 T 170,15" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 25,35 Q 60,5 110,40 T 180,25" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </div>

            <div>
              <div className="font-black text-gray-950 uppercase text-xs md:text-sm tracking-wide">{signatoryName}</div>
              <div className="font-bold text-gray-800 text-xs">{signatoryTitle}</div>
              <div className="text-[11px] font-bold text-gray-700 uppercase">{signatoryForTitle}</div>
            </div>
          </div>

          {/* Cc List */}
          <div className="pt-3 text-[11px] text-gray-800 font-serif leading-tight">
            <div className="flex items-start gap-4">
              <span className="font-bold">Cc:</span>
              <ul className="space-y-0.5 text-gray-800">
                {formattedCcList.map((item, idx) => (
                  <li key={idx}>&bull; {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
