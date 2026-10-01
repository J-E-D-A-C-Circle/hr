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
      className={`relative w-full max-w-4xl mx-auto text-gray-900 shadow-xl rounded-lg p-8 md:p-14 border border-amber-300/60 overflow-hidden ${
        isPrintView ? 'p-0 shadow-none border-none' : ''
      }`}
      style={{ backgroundColor: '#FDF3C0', fontFamily: "'Times New Roman', Times, serif", fontSize: '12pt' }}
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
      <div className="relative z-10" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
        <h1 className="text-center font-black text-[#008053] tracking-wide uppercase leading-tight" style={{ fontSize: '15pt', fontFamily: "'Times New Roman', Times, serif" }}>
          DRIVER AND VEHICLE LICENSING AUTHORITY
        </h1>
        <div className="grid grid-cols-3 items-center mt-3 text-gray-800 leading-tight" style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
          {/* Left Contact Info */}
          <div className="text-left space-y-0.5" style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
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
          <div className="text-right space-y-0.5" style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
            <div className="font-bold text-[#008053]">Head Office Address:</div>
            <div>1, Jawaharlal Nehru Road</div>
            <div>P. O. Box 9379, KIA-Accra</div>
          </div>
        </div>
        {/* Green Horizontal Divider Line */}
        <div className="border-t-2 border-[#008053] mt-3 mb-6" />
      </div>

      {/* LETTER REFERENCE & DATE ROW */}
      <div className="flex justify-between items-start mb-6 relative z-10" style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
        <div className="space-y-1">
          <div>
            <span className="font-bold">My Ref:</span>......<span className="font-mono font-bold text-gray-900" style={{ fontSize: '12pt' }}>{displayRef}</span>
          </div>
          <div>
            <span className="font-bold">Your Ref:</span>......<span className="font-mono font-bold text-gray-900" style={{ fontSize: '12pt' }}>{yourRef || '....................................'}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-gray-900 uppercase" style={{ fontSize: '12pt' }}>
            {issueDate}
          </div>
          <div className="text-gray-500 font-mono" style={{ fontSize: '12pt' }}>............/............/20..........</div>
        </div>
      </div>

      {/* CANDIDATE ADDRESSEE */}
      <div className="mb-6 space-y-0.5 uppercase font-bold text-gray-900 relative z-10" style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
        <div className="font-black text-gray-950" style={{ fontSize: '12pt' }}>{applicantName}</div>
        <div className="text-gray-700" style={{ fontSize: '12pt' }}>{applicantAddress}</div>
      </div>

      {/* SALUTATION */}
      <div className="mb-4 text-gray-900 relative z-10" style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
        {salutation}
      </div>

      {/* SUBJECT TITLE */}
      <div className="mb-6 relative z-10">
        <h2 className="inline-block font-black uppercase text-gray-950 border-b border-gray-950 pb-0.5 tracking-wider" style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
          {displaySubject}
        </h2>
      </div>

      {/* BODY PARAGRAPHS */}
      <div className="space-y-4 text-gray-900 leading-relaxed relative z-10 text-justify" style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
        {customBodyText ? (
          <div className="whitespace-pre-line" style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>{customBodyText}</div>
        ) : appointmentType === 'CONTRACT' ? (
          <>
            <p style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
              I am pleased to inform you that Management has approved your appointment as <strong>{positionTitle}</strong> in the <strong>{departmentName} Department</strong> at <strong>{postingStationName}</strong> on a Contract basis, effective <strong>{effectiveDate}</strong>.
            </p>
            <p style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
              This appointment is for an initial period of <strong>{contractDuration}</strong>, subject to satisfactory performance and renewal. Your remuneration and terms of engagement will be in accordance with <strong>{salaryGrade}</strong>.
            </p>
            <p style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
              You are requested to report to the Ag. Director Human Resource for formal documentation and assumption of duty.
            </p>
            <p className="pt-2" style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
              Please confirm your acceptance of this offer in writing within fourteen (14) days from the date of this letter.
            </p>
          </>
        ) : appointmentType === 'PERMANENT' ? (
          <>
            <p style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
              I am pleased to inform you that Management has approved your appointment as <strong>{positionTitle}</strong> in the <strong>{departmentName} Department</strong> at <strong>{postingStationName}</strong> as a Permanent Staff member of the Driver and Vehicle Licensing Authority (DVLA), effective <strong>{effectiveDate}</strong>.
            </p>
            <p style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
              Your appointment is subject to a probation period of <strong>{probationPeriod}</strong>, during which your performance and conduct will be evaluated for confirmation. Your salary and benefits will be attached to <strong>{salaryGrade}</strong> of the Authority&apos;s Approved Salary Structure.
            </p>
            <p style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
              You are required to report to the Ag. Director Human Resource on <strong>{effectiveDate}</strong> for formal onboarding and IPPD payroll documentation.
            </p>
            <p className="pt-2" style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
              Kindly sign and return the duplicate copy of this letter to signify your formal acceptance of this offer.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
              This is to inform you that, you have been temporarily posted to the{' '}
              <strong>{postingStationName}</strong> as an <strong>{positionTitle}</strong>, assigned to
              the <strong>{departmentName} Department</strong>, effective <strong>{effectiveDate}</strong>.
            </p>
            <p style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
              You are to report to the Ag. Director Human Resource and Ag. Director Administration, for necessary instructions and directives concerning your official duties.
            </p>
            <p className="pt-2" style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>Thank you.</p>
          </>
        )}
      </div>

      {/* SIGNATORY & FOOTER */}
      <div className="mt-8 pt-4 relative z-10 border-t border-amber-900/20" style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
        <div className="space-y-4">
          <div>
            <div className="text-gray-900" style={{ fontSize: '12pt' }}>Yours faithfully,</div>
            {/* Handwritten Signature SVG */}
            <div className="my-2 h-12 flex items-center">
              <svg className="w-36 h-12 text-[#1a365d]" viewBox="0 0 200 60" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M 10,45 Q 30,10 50,40 T 90,20 T 130,45 T 170,15" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 25,35 Q 60,5 110,40 T 180,25" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="font-black text-gray-950 uppercase tracking-wide" style={{ fontSize: '12pt' }}>{signatoryName}</div>
              <div className="font-bold text-gray-800" style={{ fontSize: '12pt' }}>{signatoryTitle}</div>
              <div className="font-bold text-gray-700 uppercase" style={{ fontSize: '12pt' }}>{signatoryForTitle}</div>
            </div>
          </div>
          {/* Cc List */}
          <div className="pt-3 text-gray-800 leading-tight" style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}>
            <div className="flex items-start gap-4">
              <span className="font-bold" style={{ fontSize: '12pt' }}>Cc:</span>
              <ul className="space-y-0.5 text-gray-800">
                {formattedCcList.map((item, idx) => (
                  <li key={idx} style={{ fontSize: '12pt' }}>&bull; {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
