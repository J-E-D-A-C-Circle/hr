'use client';
import React from 'react';
import Image from 'next/image';
import { SIGNATURE_BASE64 } from '@/lib/signature';

export interface OfficialAppointmentLetterProps {
  referenceNumber: string;
  verificationCode?: string;
  applicantName: string;
  applicantAddress?: string;
  positionTitle?: string;
  departmentName?: string;
  postingStationName?: string;
  appointmentType?: string; // TEMPORARY, CONTRACT, PERMANENT, REPOSTING
  effectiveDate?: string;
  commencementDate?: string;
  endDate?: string;
  serviceYear?: string;
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
  applicantAddress,
  positionTitle = 'NSS Personnel',
  departmentName = '',
  postingStationName = 'Head Office',
  appointmentType = 'TEMPORARY',
  effectiveDate = 'Monday, 17th November, 2025',
  commencementDate = 'Monday, 17th November, 2025',
  endDate = 'Friday, 30th October, 2026',
  serviceYear = '2025/2026',
  issueDate,
  salutation,
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
  const displayRef = customRefNumber || (referenceNumber ? `DVLA/HR/NSS/${referenceNumber}` : 'DVLA/HR/NSS/11/5/25');
  const displaySubject = customSubject || (
    appointmentType === 'CONTRACT' ? 'OFFER OF CONTRACT APPOINTMENT' :
    appointmentType === 'PERMANENT' ? 'OFFER OF PERMANENT APPOINTMENT' :
    appointmentType === 'REPOSTING' ? 'REPOSTING OF NATIONAL SERVICE PERSONNEL.' :
    'POSTING OF NATIONAL SERVICE PERSONNEL.'
  );

  const displaySalutation = salutation || (applicantName ? `Dear ${applicantName},` : 'Dear Sir/Madam,');

  // Parse CC list array or multiline string
  const formattedCcList: string[] = typeof ccList === 'string'
    ? ccList.split('\n').map(s => s.trim()).filter(Boolean)
    : Array.isArray(ccList) && ccList.length > 0
    ? ccList
    : [
        'District Licensing Manager',
      ];

  return (
    <div
      className={`relative w-full max-w-4xl mx-auto text-gray-900 shadow-xl rounded-lg p-6 md:p-10 border border-gray-200 overflow-hidden ${
        isPrintView ? 'p-0 shadow-none border-none' : ''
      }`}
      style={{
        backgroundColor: '#FFFFFF',
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: '11pt',
        lineHeight: 1.45,
      }}
      id="official-letterhead"
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none select-none">
        <div className="w-[360px] h-[360px] relative">
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
        <h1
          className="text-center font-black text-[#008053] tracking-wide uppercase leading-tight"
          style={{ fontSize: '15pt', fontFamily: "'Times New Roman', Times, serif" }}
        >
          DRIVER AND VEHICLE LICENSING AUTHORITY
        </h1>
        <div
          className="grid grid-cols-3 items-center mt-3 text-gray-800 leading-tight"
          style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}
        >
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
      <div
        className="flex justify-between items-start mb-6 relative z-10 gap-6"
        style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}
      >
        <div className="space-y-2 min-w-[300px]">
          <div className="flex items-baseline gap-1">
            <span className="font-bold whitespace-nowrap">My Ref:</span>
            <span className="inline-block border-b border-dotted border-gray-900 font-mono font-bold text-gray-900 px-1 min-w-[220px]">
              {displayRef}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-bold whitespace-nowrap">Your Ref:</span>
            <span className="inline-block border-b border-dotted border-gray-900 font-mono font-bold text-gray-900 px-1 min-w-[220px]">
              {yourRef || '\u00A0'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-1">
            <span className="font-bold whitespace-nowrap">Date:</span>
            <span className="inline-block border-b border-dotted border-gray-900 font-bold text-gray-900 uppercase px-1 min-w-[160px] text-center">
              {issueDate || '\u00A0'}
            </span>
          </div>
        </div>
      </div>

      {/* CANDIDATE ADDRESSEE */}
      <div
        className="mb-4 space-y-0.5 uppercase font-bold text-gray-900 relative z-10"
        style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}
      >
        <div className="font-black text-gray-950">{applicantName}</div>
        {applicantAddress && <div className="text-gray-700 font-normal">{applicantAddress}</div>}
      </div>

      {/* SALUTATION */}
      <div
        className="mb-4 text-gray-900 relative z-10"
        style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}
      >
        {displaySalutation}
      </div>

      {/* SUBJECT TITLE */}
      <div className="mb-4 relative z-10">
        <h2
          className="inline-block font-black uppercase text-gray-950 border-b border-gray-950 pb-0.5 tracking-wider"
          style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}
        >
          {displaySubject}
        </h2>
      </div>

      {/* BODY PARAGRAPHS */}
      <div
        className="space-y-3 text-gray-900 leading-relaxed relative z-10 text-justify"
        style={{ fontSize: '12pt', fontFamily: "'Times New Roman', Times, serif" }}
      >
        {customBodyText ? (
          <div
            className="whitespace-pre-line space-y-3"
            dangerouslySetInnerHTML={{ __html: customBodyText }}
          />
        ) : appointmentType === 'CONTRACT' ? (
          <>
            <p>
              I am pleased to inform you that Management has approved your appointment as <strong>{positionTitle}</strong> in the <strong>{departmentName || 'Operations'} Department</strong> at <strong>{postingStationName}</strong> on a Contract basis ({contractDuration}), effective <strong>{effectiveDate}</strong>, in accordance with <strong>{salaryGrade}</strong>.
            </p>
            <p>
              You are requested to report to the District Licensing Manager for orientation and assignment. Please confirm your acceptance of this offer in writing within fourteen (14) days from the date of this letter.
            </p>
          </>
        ) : appointmentType === 'PERMANENT' ? (
          <>
            <p>
              I am pleased to inform you that Management has approved your appointment as <strong>{positionTitle}</strong> in the <strong>{departmentName || 'Operations'} Department</strong> at <strong>{postingStationName}</strong> as a Permanent Staff member of the Driver and Vehicle Licensing Authority (DVLA), effective <strong>{effectiveDate}</strong>, subject to a probation period of <strong>{probationPeriod}</strong>.
            </p>
            <p>
              You are required to report to the District Licensing Manager for orientation and assignment. Kindly sign and return the duplicate copy of this letter signifying your formal acceptance.
            </p>
          </>
        ) : (
          <>
            <p>
              This is to inform you that you have been {appointmentType === 'REPOSTING' ? 'reposted' : 'assigned'} to the <strong>{postingStationName}</strong>{departmentName ? <> (<strong>{departmentName}</strong>)</> : ''} for the <strong>{serviceYear}</strong> service year.
            </p>
            <p>
              Your National Service commences on <strong>{commencementDate}</strong> and ends on <strong>{endDate}</strong>.
            </p>
            <p>
              You are required to report to the District Licensing Manager for orientation and assignment. You are expected to exhibit good conduct and abide by all rules and regulations of the Authority throughout your service period.
            </p>
          </>
        )}
      </div>

      {/* SIGNATORY & FOOTER */}
      <div
        className="mt-6 pt-3 relative z-10"
        style={{ fontSize: '11pt', fontFamily: "'Times New Roman', Times, serif" }}
      >
        <div className="space-y-3">
          <div>
            <div className="text-gray-900 mb-1">Thank you.</div>
            <div className="text-gray-900">Yours faithfully,</div>

            {/* Official Scanned Signature Image */}
            <div className="my-1.5 h-12 flex items-center">
              <img
                src={SIGNATURE_BASE64}
                alt="Authorized Signature"
                className="h-12 w-auto max-h-12 object-contain"
              />
            </div>

            <div>
              <div className="font-black text-gray-950 uppercase tracking-wide">{signatoryName}</div>
              <div className="font-bold text-gray-800">{signatoryTitle}</div>
              <div className="font-bold text-gray-700 uppercase">{signatoryForTitle}</div>
            </div>
          </div>

          {/* Cc List */}
          <div
            className="pt-2 text-gray-800 leading-tight"
            style={{ fontSize: '10.5pt', fontFamily: "'Times New Roman', Times, serif" }}
          >
            <div className="flex items-start gap-3">
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
