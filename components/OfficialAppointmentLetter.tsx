'use client';

import React from 'react';
import Image from 'next/image';

export interface OfficialAppointmentLetterProps {
  referenceNumber: string;
  verificationCode: string;
  applicantName: string;
  applicantAddress?: string;
  positionTitle: string;
  departmentName: string;
  postingStationName?: string;
  effectiveDate?: string;
  issueDate?: string;
  salutation?: string;
  customRefNumber?: string;
  customSubject?: string;
  customBodyText?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  status?: string;
  isPrintView?: boolean;
}

export default function OfficialAppointmentLetter({
  referenceNumber,
  verificationCode,
  applicantName,
  applicantAddress = 'ACCRA - GHANA',
  positionTitle,
  departmentName,
  postingStationName = 'Head Office',
  effectiveDate = 'Monday, August 3, 2026',
  issueDate = 'JULY 30, 2026',
  salutation = 'Dear Madam,',
  customRefNumber,
  customSubject = 'TEMPORARY PLACEMENT',
  customBodyText,
  signatoryName = 'EPHRAIM NII TAN SACKEY',
  signatoryTitle = 'AG. DIRECTOR HR',
  status = 'VERIFIED',
  isPrintView = false,
}: OfficialAppointmentLetterProps) {
  const displayRef = customRefNumber || `DVLA/HR./07/26/ PLACMT/0127`;
  const verificationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/verify/${verificationCode}` 
    : `/verify/${verificationCode}`;
  
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verificationUrl)}&color=0f5132`;

  return (
    <div
      className={`relative w-full max-w-4xl mx-auto text-gray-900 shadow-xl rounded-lg p-8 md:p-14 border border-amber-300/60 overflow-hidden font-serif ${
        isPrintView ? 'p-0 shadow-none border-none' : ''
      }`}
      style={{ backgroundColor: '#FDF3C0' }}
      id="official-letterhead"
    >
      {/* Background Watermark using /oop.png */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] pointer-events-none select-none">
        <div className="w-[420px] h-[420px] relative">
          <Image
            src="/oop.png"
            alt="DVLA Watermark"
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
            <div><strong>Website:</strong> http: //www.dvla.gov.gh</div>
            <div><strong>Email:</strong> info@dvla.gov.gh</div>
          </div>

          {/* Center Official DVLA Seal Logo */}
          <div className="flex justify-center">
            <div className="w-16 h-16 md:w-20 md:h-20 relative">
              <Image
                src="/oop.png"
                alt="DVLA Emblem"
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
            <span className="font-bold">Your Ref:</span>....................................
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
          {customSubject}
        </h2>
      </div>

      {/* BODY PARAGRAPHS */}
      <div className="space-y-4 text-xs md:text-sm text-gray-900 leading-relaxed font-serif relative z-10 text-justify">
        {customBodyText ? (
          <div className="whitespace-pre-line">{customBodyText}</div>
        ) : (
          <>
            <p>
              This is to inform you that, you have been temporarily posted to the{' '}
              <strong>{postingStationName}</strong> as an <strong>{positionTitle}</strong>, assigned to
              the <strong>{departmentName} Department</strong>, effective <strong>{effectiveDate}</strong>.
            </p>
            <p>
              You are to report to the Ag, Director Human Resource and Ag. Director Administration, for necessary instructions and directives concerning your official duties.
            </p>
            <p className="pt-2">Thank you.</p>
          </>
        )}
      </div>

      {/* SIGNATORY & FOOTER */}
      <div className="mt-8 pt-2 flex flex-col md:flex-row items-end justify-between gap-6 relative z-10">
        
        {/* Left Signatory & Cc */}
        <div className="space-y-4 font-serif text-xs flex-1">
          <div>
            <div className="text-gray-900">Yours faithfully,</div>

            {/* Handwritten Signature graphic */}
            <div className="my-2 h-12 flex items-center">
              <svg className="w-36 h-12 text-[#1a365d]" viewBox="0 0 200 60" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M 10,45 Q 30,10 50,40 T 90,20 T 130,45 T 170,15" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 25,35 Q 60,5 110,40 T 180,25" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            <div>
              <div className="font-black text-gray-950 uppercase text-xs md:text-sm tracking-wide">{signatoryName}</div>
              <div className="font-bold text-gray-800 text-xs">{signatoryTitle}</div>
              <div className="text-[11px] font-bold text-gray-700 uppercase">FOR: CHIEF EXECUTIVE</div>
            </div>
          </div>

          {/* Cc List */}
          <div className="pt-3 text-[11px] text-gray-800 font-serif leading-tight">
            <div className="flex items-start gap-4">
              <span className="font-bold">Cc:</span>
              <ul className="space-y-0.5 text-gray-800">
                <li>Chief Executive</li>
                <li>Deputy Chief Executives</li>
                <li>Ag. Director, IT</li>
                <li>Ag. Director Administration</li>
                <li>Manager, HR (C&B)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Embedded Security QR Verification Box */}
        <div className="bg-emerald-50/50 border border-emerald-800/40 rounded-xl p-3 text-center font-sans space-y-1.5 shrink-0 self-end">
          <div className="text-[9px] font-black uppercase text-[#008053] tracking-wider">
            SECURITY VERIFICATION
          </div>

          {/* QR Code Graphic */}
          <div className="w-24 h-24 mx-auto bg-white p-1 rounded border border-gray-300 flex items-center justify-center">
            {/* eslint-disable-next-html-element-target */}
            <img
              src={qrApiUrl}
              alt="Scan to Verify DVLA Appointment Letter"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="text-[9px] font-mono font-bold text-gray-800">
            {verificationCode}
          </div>
          <div className="text-[8px] text-gray-500 max-w-[130px] mx-auto leading-tight">
            Scan to confirm document authenticity
          </div>
        </div>

      </div>

    </div>
  );
}
