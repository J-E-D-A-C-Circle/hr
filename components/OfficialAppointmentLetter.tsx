'use client';
import React from 'react';
import Image from 'next/image';

export interface OfficialAppointmentLetterProps {
  referenceNumber: string;
  verificationCode?: string;
  applicantName: string;
  applicantAddress?: string;
  positionTitle: string;
  departmentName: string;
  postingStationName?: string;
  appointmentType?: string; // TEMPORARY, CONTRACT, PERMANENT, REPOSTING
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
  status?: string;
  isPrintView?: boolean;
}

export default function OfficialAppointmentLetter({
  referenceNumber,
  applicantName,
  applicantAddress = 'ACCRA - GHANA',
  positionTitle,
  departmentName,
  postingStationName = 'Head Office',
  appointmentType = 'TEMPORARY',
  effectiveDate = 'Monday, August 3, 2026',
  issueDate = 'JULY 30, 2026',
  salutation = 'Dear Sir/Madam,',
  customRefNumber,
  yourRef,
  customSubject,
  customBodyText,
  salaryGrade = 'DVLA Salary Scale',
  probationPeriod = 'six (6) months',
  contractDuration = 'two (2) years',
  signatoryName = 'EPHRAIM NII TAN SACKEY',
  signatoryTitle = 'AG. DIRECTOR HR',
  signatoryForTitle = 'FOR: CHIEF EXECUTIVE',
  ccList,
  isPrintView = false,
}: OfficialAppointmentLetterProps) {
  const displayRef = customRefNumber || `DVLA/HR/07/26/PLACMT/${referenceNumber?.slice(-4) || '0127'}`;
  const displaySubject = customSubject || (
    appointmentType === 'CONTRACT' ? 'OFFER OF CONTRACT APPOINTMENT' :
    appointmentType === 'PERMANENT' ? 'OFFER OF PERMANENT APPOINTMENT' :
    appointmentType === 'REPOSTING' ? 'OFFICIAL REPOSTING & RE-ASSIGNMENT RELEASE' :
    'NSS POSTING APPOINTMENT'
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
      className={`relative w-full max-w-4xl mx-auto text-gray-900 shadow-xl rounded-lg p-8 md:p-14 border border-amber-300/60 overflow-hidden font-serif ${
        isPrintView ? 'p-0 shadow-none border-none' : ''
      }`}
      style={{ backgroundColor: '#FDF3C0' }}
      id="official-letterhead"
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] pointer-events-none select-none">
        <div className="w-[420px] h-[420px] relative">
          <Image
            src="/oop.png"
            alt="Watermark Logo"
            fill
            className="object-contain"
            priority
          />
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
          {/* Center Official Seal Logo */}
          <div className="flex justify-center">
            <div className="w-16 h-16 md:w-20 md:h-20 relative">
              <Image
                src="/oop.png"
                alt="Emblem Logo"
                width={80}
                height={80}
                className="object-contain w-full h-full"
                priority
              />
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
        <div className="border-t-2 border-[#008053] mt-3 mb-6" />
      </div>

      {/* LETTER REFERENCE & DATE ROW */}
      <div className="flex justify-between items-start text-xs md:text-sm font-sans mb-6 relative z-10">
        <div className="space-y-1">
          <div>
            <span className="font-bold">My Ref:</span>......<span className="font-mono font-bold text-gray-900">{displayRef}</span>
          </div>
          <div>
            <span className="font-bold">Your Ref:</span>......<span className="font-mono font-bold text-gray-900">{yourRef || '....................................'}</span>
          </div>
        </div>
        <div className="text-right font-sans">
          <div className="font-bold text-gray-900 uppercase">
            {issueDate}
          </div>
          <div className="text-xs text-gray-500 font-mono">............/............/20..........</div>
        </div>
      </div>

      {/* CANDIDATE ADDRESSEE */}
      <div className="mb-6 space-y-0.5 uppercase font-serif font-bold text-xs md:text-sm text-gray-900 relative z-10">
        <div className="text-sm md:text-base font-black text-gray-950">{applicantName}</div>
        <div className="text-gray-700">{applicantAddress}</div>
      </div>

      {/* SALUTATION */}
      <div className="mb-4 text-xs md:text-sm font-serif text-gray-900 relative z-10">
        {salutation}
      </div>

      {/* SUBJECT TITLE */}
      <div className="mb-6 relative z-10">
        <h2 className="inline-block text-xs md:text-sm font-serif font-black uppercase text-gray-950 border-b border-gray-950 pb-0.5 tracking-wider">
          {displaySubject}
        </h2>
      </div>

      {/* BODY PARAGRAPHS */}
      <div className="space-y-4 text-xs md:text-sm text-gray-900 leading-relaxed font-serif relative z-10 text-justify">
        {customBodyText ? (
          <div className="whitespace-pre-line">{customBodyText}</div>
        ) : appointmentType === 'CONTRACT' ? (
          <>
            <p>
              I am pleased to inform you that Management has approved your appointment as <strong>{positionTitle}</strong> in the <strong>{departmentName} Department</strong> at <strong>{postingStationName}</strong> on a Contract basis, effective <strong>{effectiveDate}</strong>.
            </p>
            <p>
              This appointment is for an initial period of <strong>{contractDuration}</strong>, subject to satisfactory performance and renewal. Your remuneration and terms of engagement will be in accordance with <strong>{salaryGrade}</strong>.
            </p>
            <p>
              You are requested to report to the Ag. Director Human Resource for formal documentation and assumption of duty.
            </p>
            <p className="pt-2">
              Please confirm your acceptance of this offer in writing within fourteen (14) days from the date of this letter.
            </p>
          </>
        ) : appointmentType === 'PERMANENT' ? (
          <>
            <p>
              I am pleased to inform you that Management has approved your appointment as <strong>{positionTitle}</strong> in the <strong>{departmentName} Department</strong> at <strong>{postingStationName}</strong> as a Permanent Staff member of the Driver and Vehicle Licensing Authority (DVLA), effective <strong>{effectiveDate}</strong>.
            </p>
            <p>
              Your appointment is subject to a probation period of <strong>{probationPeriod}</strong>, during which your performance and conduct will be evaluated for confirmation. Your salary and benefits will be attached to <strong>{salaryGrade}</strong> of the Authority&apos;s Approved Salary Structure.
            </p>
            <p>
              You are required to report to the Ag. Director Human Resource on <strong>{effectiveDate}</strong> for formal onboarding and IPPD payroll documentation.
            </p>
            <p className="pt-2">
              Kindly sign and return the duplicate copy of this letter to signify your formal acceptance of this offer.
            </p>
          </>
        ) : (
          <>
            <p>
              This is to inform you that, you have been temporarily posted to the{' '}
              <strong>{postingStationName}</strong> as an <strong>{positionTitle}</strong>, assigned to
              the <strong>{departmentName} Department</strong>, effective <strong>{effectiveDate}</strong>.
            </p>
            <p>
              You are to report to the Ag. Director Human Resource and Ag. Director Administration, for necessary instructions and directives concerning your official duties.
            </p>
            <p className="pt-2">Thank you.</p>
          </>
        )}
      </div>

      {/* SIGNATORY & FOOTER */}
      <div className="mt-8 pt-4 relative z-10 font-serif text-xs border-t border-amber-900/20">
        <div className="space-y-4">
          <div>
            <div className="text-gray-900">Yours faithfully,</div>
            {/* Handwritten Signature SVG */}
            <div className="my-2 h-12 flex items-center">
              <svg className="w-36 h-12 text-[#1a365d]" viewBox="0 0 200 60" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M 10,45 Q 30,10 50,40 T 90,20 T 130,45 T 170,15" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 25,35 Q 60,5 110,40 T 180,25" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
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
}
