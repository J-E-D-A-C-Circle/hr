'use client';
import React, { useState, useEffect } from 'react';
import { X, FileText, Sparkles, Check, RefreshCw, Eye, Edit3, Printer, Mail } from 'lucide-react';
import { OfficialAppointmentLetter } from '@/components/OfficialAppointmentLetter';
import { DvlaMailModal } from '@/components/DvlaMailModal';

interface AppointmentLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: any;
  onSuccess?: () => void;
}

export default function AppointmentLetterModal({
  isOpen,
  onClose,
  application,
  onSuccess,
}: AppointmentLetterModalProps) {
  const [appointmentType, setAppointmentType] = useState<string>('TEMPORARY');
  const [letterDate, setLetterDate] = useState<string>('');
  const [salutation, setSalutation] = useState<string>('Dear Sir/Madam,');
  const [customRefNumber, setCustomRefNumber] = useState<string>('');
  const [yourRef, setYourRef] = useState<string>('');
  const [applicantName, setApplicantName] = useState<string>('');
  const [applicantAddress, setApplicantAddress] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>('Monday, September 1, 2026');
  const [salaryGrade, setSalaryGrade] = useState<string>('DVLA Grade 7 Step 1');
  const [probationPeriod, setProbationPeriod] = useState<string>('six (6) months');
  const [contractDuration, setContractDuration] = useState<string>('two (2) years');
  const [signatoryName, setSignatoryName] = useState<string>('EPHRAIM NII TAN SACKEY');
  const [signatoryTitle, setSignatoryTitle] = useState<string>('AG. DIRECTOR HR');
  const [signatoryForTitle, setSignatoryForTitle] = useState<string>('FOR: CHIEF EXECUTIVE');
  const [ccText, setCcText] = useState<string>('Chief Executive\nDeputy Chief Executives\nAg. Director, IT\nAg. Director Administration\nManager, HR (C&B)');
  const [customBodyText, setCustomBodyText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [mailModalOpen, setMailModalOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!application) return;
    const todayStr = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).toUpperCase();

    const fullName = `${application.first_name || ''} ${application.middle_name ? application.middle_name + ' ' : ''}${application.last_name || ''}`.trim();
    setApplicantName(fullName || 'APPLICANT NAME');
    setApplicantAddress(application.residential_address || 'ACCRA - GHANA');

    const existingLetter = application.appointmentLetterObject || application.appointmentLetterData;
    if (existingLetter && typeof existingLetter === 'object') {
      setAppointmentType((existingLetter.appointmentType as any) || (application.status === 'rejected' ? 'REPOSTING' : 'TEMPORARY'));
      setLetterDate(existingLetter.letterDate || todayStr);
      setSalutation(existingLetter.salutation || 'Dear Sir/Madam,');
      setCustomRefNumber(existingLetter.customRefNumber || '');
      setYourRef(existingLetter.yourRef || '');
      setApplicantName(existingLetter.applicantName || fullName);
      setApplicantAddress(existingLetter.applicantAddress || application.residential_address || 'ACCRA - GHANA');
      setCustomSubject(existingLetter.customSubject || '');
      setEffectiveDate(existingLetter.effectiveDate || 'Monday, September 1, 2026');
      setSalaryGrade(existingLetter.salaryGrade || 'DVLA Grade 7 Step 1');
      setProbationPeriod(existingLetter.probationPeriod || 'six (6) months');
      setContractDuration(existingLetter.contractDuration || 'two (2) years');
      setSignatoryName(existingLetter.signatoryName || 'EPHRAIM NII TAN SACKEY');
      setSignatoryTitle(existingLetter.signatoryTitle || 'AG. DIRECTOR HR');
      setSignatoryForTitle(existingLetter.signatoryForTitle || 'FOR: CHIEF EXECUTIVE');
      setCcText(existingLetter.ccText || 'Chief Executive\nDeputy Chief Executives\nAg. Director, IT\nAg. Director Administration\nManager, HR (C&B)');
      setCustomBodyText(existingLetter.customBodyText || '');
    } else {
      setLetterDate(todayStr);
      const initialType = application.status === 'rejected' ? 'REPOSTING' : 'TEMPORARY';
      setAppointmentType(initialType);
      applyDefaultTemplate(initialType, todayStr);
    }
  }, [application, isOpen]);

  const generateDefaultRef = (type: string) => {
    if (!application) return '';
    const monthStr = String(new Date().getMonth() + 1).padStart(2, '0');
    const yearSuffix = String(new Date().getFullYear()).slice(-2);
    const refSuffix = (application.referenceNumber || application.nss_number || String(application.id || '0000')).slice(-4);
    let code = 'PLACMT';
    if (type === 'CONTRACT') code = 'CONTR';
    if (type === 'PERMANENT') code = 'PERM';
    if (type === 'REPOSTING') code = 'REPOST';
    return `DVLA/HR/${monthStr}/${yearSuffix}/${code}/${refSuffix}`;
  };

  const applyDefaultTemplate = (type: string, dateStr?: string) => {
    if (!application) return;
    setAppointmentType(type);
    const posTitle = application.position?.title || application.position_title || application.course_program || 'NSS Personnel';
    const deptName = application.department?.name || application.posting_department || 'Operations';
    const stationName = application.station?.name || application.posting_station || application.posting_district || 'Head Office (Accra 37)';
    const effDate = effectiveDate || 'Monday, September 1, 2026';
    const ref = generateDefaultRef(type);
    setCustomRefNumber(ref);

    if (type === 'REPOSTING') {
      setCustomSubject('OFFICIAL REPOSTING & RE-ASSIGNMENT RELEASE');
      setCustomBodyText(
        `This is to formally inform you that, your application for National Service placement at the Driver and Vehicle Licensing Authority (DVLA) has NOT BEEN ACCEPTED.\n\nConsequently, this official notification serves as your formal release letter for re-posting back to the National Service Scheme (NSS) Secretariat for re-assignment to an alternative user agency.\n\nYou are kindly advised to submit a copy of this official release letter to the regional or national NSS Secretariat to facilitate your re-posting.\n\nThank you.`
      );
    } else if (type === 'CONTRACT') {
      setCustomSubject('OFFER OF CONTRACT APPOINTMENT');
      setCustomBodyText(
        `I am pleased to inform you that the Management of Driver and Vehicle Licensing Authority (DVLA) has offered you a Contract Appointment as ${posTitle} assigned to the ${deptName} Department at ${stationName}, effective ${effDate}.\n\nThis appointment is for a fixed term of ${contractDuration || 'two (2) years'}, subject to satisfactory performance and adherence to Authority regulations.\n\nYou will be placed on ${salaryGrade || 'DVLA Grade 7 Step 1'}. You are to report to the Director, Human Resource for assumption of duties.\n\nThank you.`
      );
    } else if (type === 'PERMANENT') {
      setCustomSubject('OFFER OF PERMANENT APPOINTMENT');
      setCustomBodyText(
        `I am pleased to convey Management's approval for your Permanent Appointment as ${posTitle} in the ${deptName} Department at ${stationName}, effective ${effDate}.\n\nYour appointment will be subject to a probation period of ${probationPeriod || 'six (6) months'}, during which your conduct and performance will be evaluated for confirmation.\n\nYou will be placed on ${salaryGrade || 'DVLA Grade 7 Step 1'}. Kindly signify your acceptance of this offer in writing.\n\nThank you.`
      );
    } else {
      setCustomSubject('NSS POSTING APPOINTMENT');
      setCustomBodyText(
        `This is to inform you that you have been posted to the ${stationName} as an NSS Personnel assigned to the ${deptName} Department under the National Service Scheme (NSS), effective ${effDate}.\n\nYou are to report to the Ag. Director Human Resource and Ag. Director Administration for necessary instructions and directives concerning your official duties.\n\nThank you.`
      );
    }
  };

  const handlePrintLetter = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    const logoPath = '/oop.png';
    const displayRef = customRefNumber || `DVLA/HR/08/26/PLACMT/${(application.nss_number || String(application.id || '0127')).slice(-4)}`;
    const displayYourRef = yourRef || '....................................';
    const displayIssueDate = letterDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
    const displayApplicantName = applicantName || 'APPLICANT NAME';
    const displayApplicantAddress = applicantAddress || 'ACCRA - GHANA';
    const displaySubjectText = customSubject || 'NSS POSTING APPOINTMENT';
    const displayBodyText = customBodyText;
    const displaySignatoryName = signatoryName || 'EPHRAIM NII TAN SACKEY';
    const displaySignatoryTitle = signatoryTitle || 'AG. DIRECTOR HR';
    const displaySignatoryForTitle = signatoryForTitle || 'FOR: CHIEF EXECUTIVE';

    const ccListItems: string[] = typeof ccText === 'string'
      ? ccText.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : ['Chief Executive', 'Deputy Chief Executives', 'Ag. Director, IT', 'Ag. Director Administration', 'Manager, HR (C&B)'];

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>DVLA Official Appointment Letter - ${displayApplicantName}</title>
        <style>
          @page { margin: 0; size: A4 portrait; }
          @media print {
            html, body {
              width: 210mm !important;
              min-height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #FDF3C0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .letter-container {
              box-shadow: none !important;
              border: none !important;
              width: 210mm !important;
              min-height: 297mm !important;
              padding: 16mm 18mm !important;
              margin: 0 !important;
              border-radius: 0 !important;
              background-color: #FDF3C0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            width: 100%;
            margin: 0;
            padding: 0;
            background: #FDF3C0;
            font-family: 'Georgia', 'Times New Roman', serif;
            line-height: 1.5;
            color: #111827;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body { display: flex; justify-content: center; }
          .letter-container {
            position: relative;
            width: 210mm;
            min-height: 297mm;
            background-color: #FDF3C0;
            padding: 18mm 18mm 18mm 18mm;
            overflow: hidden;
            box-sizing: border-box;
            font-family: 'Times New Roman', Times, serif;
          }
          .watermark { position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%); width: 380px; height: 380px; opacity: 0.07; pointer-events: none; z-index: 1; }
          .content-z { position: relative; z-index: 10; }
          .header-title { text-align: center; font-size: 20px; font-weight: 900; color: #008053; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px; }
          .header-grid { display: flex; justify-content: space-between; align-items: center; font-family: Arial, sans-serif; font-size: 11px; color: #1f2937; margin-top: 10px; }
          .header-left { text-align: left; }
          .header-center { text-align: center; }
          .header-right { text-align: right; }
          .header-logo { width: 70px; height: 70px; object-fit: contain; }
          .divider { border-top: 2px solid #008053; margin: 12px 0 24px 0; }
          .ref-section { font-size: 13px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 2px; }
          .ref-top-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
          .ref-box-my { display: flex; align-items: flex-end; gap: 6px; max-width: 320px; flex: 1; }
          .ref-box-date { display: flex; align-items: flex-end; gap: 6px; width: 200px; margin-left: auto; }
          .ref-box-your { display: flex; align-items: flex-end; gap: 6px; max-width: 320px; }
          .ref-label { font-weight: bold; white-space: nowrap; color: #111827; padding-bottom: 1px; }
          .dots-wrapper { position: relative; flex: 1; padding-bottom: 1px; overflow: hidden; }
          .dots-bg { position: absolute; bottom: 0; left: 0; right: 0; color: #9ca3af; font-family: monospace; font-size: 10px; letter-spacing: 2.5px; line-height: 1; user-select: none; pointer-events: none; overflow: hidden; white-space: nowrap; }
          .dots-val { position: relative; font-weight: bold; color: #030712; margin-left: 8px; }
          .dots-val-upper { position: relative; font-weight: bold; color: #030712; margin-left: 8px; text-transform: uppercase; }
          .addressee { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
          .salutation { font-size: 13px; margin-bottom: 16px; }
          .subject-title { font-size: 14px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #111827; padding-bottom: 2px; display: inline-block; margin-bottom: 20px; }
          .body-text { font-size: 13px; line-height: 1.6; text-align: justify; margin-bottom: 28px; white-space: pre-line; }
          .footer-block { margin-top: 30px; }
          .signatory-block { font-size: 12px; }
          .signature-svg { width: 140px; height: 48px; margin: 8px 0; }
          .signatory-name { font-weight: 900; text-transform: uppercase; font-size: 13px; }
          .signatory-title { font-weight: bold; color: #1f2937; }
          .cc-box { margin-top: 16px; font-size: 11px; }
          .cc-box ul { list-style: none; padding-left: 0; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="letter-container">
          <img src="${logoPath}" alt="Watermark" class="watermark" />
          <div class="content-z">
            <div class="header-title">DRIVER AND VEHICLE LICENSING AUTHORITY</div>
            <div class="header-grid">
              <div class="header-left">
                <div><strong>Tel:</strong> 0302 764 529</div>
                <div><strong>Website:</strong> http://www.dvla.gov.gh</div>
                <div><strong>Email:</strong> info@dvla.gov.gh</div>
              </div>
              <div class="header-center">
                <img src="${logoPath}" alt="DVLA Logo" class="header-logo" />
              </div>
              <div class="header-right">
                <div style="font-weight: bold; color: #008053;">Head Office Address:</div>
                <div>1, Jawaharlal Nehru Road</div>
                <div>P. O. Box 9379, KIA-Accra</div>
              </div>
            </div>
            <div class="divider"></div>

            <div class="ref-section">
              <div class="ref-top-row">
                <div class="ref-box-my">
                  <span class="ref-label">My Ref:</span>
                  <div class="dots-wrapper">
                    <span class="dots-bg">..................................................</span>
                    <span class="dots-val">${displayRef}</span>
                  </div>
                </div>
                <div class="ref-box-date">
                  <span class="ref-label">Date:</span>
                  <div class="dots-wrapper">
                    <span class="dots-bg">..................................................</span>
                    <span class="dots-val-upper">${displayIssueDate}</span>
                  </div>
                </div>
              </div>
              <div class="ref-box-your">
                <span class="ref-label">Your Ref:</span>
                <div class="dots-wrapper">
                  <span class="dots-bg">..................................................</span>
                  <span class="dots-val">${displayYourRef}</span>
                </div>
              </div>
            </div>

            <div class="addressee">
              <div>${displayApplicantName}</div>
              <div style="color: #374151; font-weight: normal;">${displayApplicantAddress}</div>
            </div>

            <div class="salutation">${salutation}</div>

            <div>
              <h2 class="subject-title">${displaySubjectText}</h2>
            </div>

            <div class="body-text">
              ${displayBodyText}
            </div>

            <div class="footer-block">
              <div class="signatory-block">
                <div>Yours faithfully,</div>
                <div style="margin: 8px 0;">
                  <svg class="signature-svg" viewBox="0 0 200 60" fill="none" stroke="#1a365d" stroke-width="2">
                    <path d="M 10,45 Q 30,10 50,40 T 90,20 T 130,45 T 170,15" stroke-width="2.5" stroke-linecap="round" />
                    <path d="M 25,35 Q 60,5 110,40 T 180,25" stroke-width="1.5" stroke-linecap="round" />
                  </svg>
                </div>
                <div>
                  <div class="signatory-name">${displaySignatoryName}</div>
                  <div class="signatory-title">${displaySignatoryTitle}</div>
                  <div style="font-size: 11px; font-weight: bold; color: #4b5563; text-transform: uppercase;">${displaySignatoryForTitle}</div>
                </div>
                <div class="cc-box">
                  <strong>Cc:</strong>
                  <ul>
                    ${ccListItems.map(item => `<li>&bull; ${item}</li>`).join('')}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleTypeChange = (newType: 'TEMPORARY' | 'REPOSTING') => {
    setAppointmentType(newType as any);
    applyDefaultTemplate(newType);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const letterPayload = {
        appointmentType,
        letterDate,
        salutation,
        customRefNumber,
        yourRef,
        applicantName,
        applicantAddress,
        customSubject,
        customBodyText,
        salaryGrade,
        probationPeriod,
        contractDuration,
        signatoryName,
        signatoryTitle,
        signatoryForTitle,
        ccText,
      };

      const token = localStorage.getItem('token');
      const res = await fetch('/api/applications/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: application.id,
          appointmentLetterData: letterPayload,
        }),
      });
      const resData = await res.json();
      if (!res.ok || (resData.success === false)) {
        throw new Error(resData?.error || 'Failed to save appointment letter.');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save appointment letter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !application) return null;

  const posTitle = application.position?.title 
    || application.position_title 
    || application.course_program 
    || 'NSS Personnel';
  const deptName = application.department?.name 
    || application.posting_department 
    || 'Operations';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        className="w-full max-w-6xl rounded-2xl shadow-2xl border overflow-hidden my-6 flex flex-col max-h-[92vh]"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {/* Header */}
        <div className="bg-[#0F5132] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-gray-950 flex items-center justify-center font-bold shadow">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-white">
                Appointment Letter Generator
              </h2>
              <p className="text-xs text-emerald-200">
                Candidate: <strong className="text-amber-300">{applicantName}</strong> &bull; {posTitle} ({deptName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Appointment Category Selection Bar */}
        <div className="bg-emerald-950 text-white px-6 py-3 border-b border-emerald-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Category:</span>
              <div className="inline-flex p-1 bg-emerald-900 rounded-xl border border-emerald-700">
                <button
                  type="button"
                  onClick={() => handleTypeChange('TEMPORARY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    appointmentType === 'TEMPORARY'
                      ? 'bg-amber-400 text-gray-950 shadow'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  NSS Posting
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('REPOSTING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    appointmentType === 'REPOSTING'
                      ? 'bg-red-500 text-white shadow'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  Reposting Release
                </button>
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 bg-emerald-900 rounded-xl border border-emerald-700">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'form'
                    ? 'bg-white text-emerald-950 shadow'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Letter
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'preview'
                    ? 'bg-white text-emerald-950 shadow'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Live Preview
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          {errorMsg && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-600 p-3 rounded text-red-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Form Controls */}
            <form
              id="appointment-letter-form"
              onSubmit={handleSave}
              className={`lg:col-span-6 space-y-4 ${activeTab === 'preview' ? 'hidden lg:block' : 'block'}`}
            >
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                  <h3 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Letter Details & Reference
                  </h3>
                  <button
                    type="button"
                    onClick={() => applyDefaultTemplate(appointmentType)}
                    className="text-[11px] text-[#0F5132] font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset Default
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Select Letter Template
                  </label>
                  <select
                    value={appointmentType}
                    onChange={(e) => applyDefaultTemplate(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#0F5132] bg-amber-50/40"
                  >
                    <option value="TEMPORARY">NSS Placement Appointment</option>
                    <option value="REPOSTING">Official Reposting & Release</option>
                    <option value="CONTRACT">Offer of Contract Appointment</option>
                    <option value="PERMANENT">Offer of Permanent Appointment</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      Applicant Full Name
                    </label>
                    <input
                      type="text"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="e.g. EMMANUEL KWAME OWUSU"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      Applicant Address
                    </label>
                    <input
                      type="text"
                      value={applicantAddress}
                      onChange={(e) => setApplicantAddress(e.target.value)}
                      placeholder="e.g. ACCRA - GHANA"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      Official Letter Date
                    </label>
                    <input
                      type="text"
                      value={letterDate}
                      onChange={(e) => setLetterDate(e.target.value)}
                      placeholder="e.g. AUGUST 11, 2026"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      Reference Number (My Ref)
                    </label>
                    <input
                      type="text"
                      value={customRefNumber}
                      onChange={(e) => setCustomRefNumber(e.target.value)}
                      placeholder="e.g. DVLA/HR/08/26/PLACMT/0127"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      Your Reference (Your Ref)
                    </label>
                    <input
                      type="text"
                      value={yourRef}
                      onChange={(e) => setYourRef(e.target.value)}
                      placeholder="e.g. NSS/ADM/2026/042"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      Salutation
                    </label>
                    <input
                      type="text"
                      value={salutation}
                      onChange={(e) => setSalutation(e.target.value)}
                      placeholder="e.g. Dear Sir/Madam,"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Effective / Assumption Date
                  </label>
                  <input
                    type="text"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    placeholder="e.g. Monday, September 1, 2026"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Subject Heading Title
                  </label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="e.g. OFFER OF CONTRACT APPOINTMENT"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Custom Body Paragraphs (Editable Content)
                  </label>
                  <textarea
                    rows={6}
                    value={customBodyText}
                    onChange={(e) => setCustomBodyText(e.target.value)}
                    placeholder="Enter customized body text here..."
                    className="w-full border border-gray-300 rounded-xl p-3 text-xs leading-relaxed text-gray-900 focus:ring-2 focus:ring-[#0F5132] font-serif"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      Signatory Name
                    </label>
                    <input
                      type="text"
                      value={signatoryName}
                      onChange={(e) => setSignatoryName(e.target.value)}
                      placeholder="e.g. EPHRAIM NII TAN SACKEY"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      Signatory Title
                    </label>
                    <input
                      type="text"
                      value={signatoryTitle}
                      onChange={(e) => setSignatoryTitle(e.target.value)}
                      placeholder="e.g. AG. DIRECTOR HR"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      On Behalf Of Line
                    </label>
                    <input
                      type="text"
                      value={signatoryForTitle}
                      onChange={(e) => setSignatoryForTitle(e.target.value)}
                      placeholder="e.g. FOR: CHIEF EXECUTIVE"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Cc Distribution List (One entry per line)
                  </label>
                  <textarea
                    rows={4}
                    value={ccText}
                    onChange={(e) => setCcText(e.target.value)}
                    placeholder="Chief Executive&#10;Deputy Chief Executives&#10;Ag. Director, IT"
                    className="w-full border border-gray-300 rounded-xl p-3 text-xs leading-relaxed text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
                  />
                </div>
              </div>
            </form>

            {/* Live Letterhead Preview */}
            <div className={`lg:col-span-6 ${activeTab === 'form' ? 'hidden lg:block' : 'block'}`}>
              <div className="sticky top-0 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 px-1">
                  <span className="uppercase tracking-wider">Live Document Preview</span>
                  <span className="text-[11px] font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    Category: {appointmentType}
                  </span>
                </div>
                <div className="bg-amber-100/50 p-2 rounded-2xl border border-amber-300/80 max-h-[70vh] overflow-y-auto shadow-inner">
                  <OfficialAppointmentLetter
                    referenceNumber={application.referenceNumber || application.nss_number || String(application.id || '0000')}
                    applicantName={applicantName}
                    applicantAddress={applicantAddress}
                    positionTitle={posTitle}
                    departmentName={deptName}
                    postingStationName={application.station?.name || application.posting_station || application.posting_district || 'Head Office'}
                    appointmentType={appointmentType}
                    effectiveDate={effectiveDate}
                    issueDate={letterDate}
                    salutation={salutation}
                    customRefNumber={customRefNumber}
                    yourRef={yourRef}
                    customSubject={customSubject}
                    customBodyText={customBodyText}
                    salaryGrade={salaryGrade}
                    probationPeriod={probationPeriod}
                    contractDuration={contractDuration}
                    signatoryName={signatoryName}
                    signatoryTitle={signatoryTitle}
                    signatoryForTitle={signatoryForTitle}
                    ccList={ccText}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setMailModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black text-gray-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4 text-emerald-800" />
              <span>Send via DVLA Mail</span>
            </button>
            <button
              type="button"
              onClick={handlePrintLetter}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black text-emerald-950 bg-amber-400 hover:bg-amber-300 transition shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-950" />
              <span>Print / Download Letter</span>
            </button>
            <button
              type="submit"
              form="appointment-letter-form"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0F5132] hover:bg-[#0B3D26] transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Saving & Issuing Letter...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Save & Issue Official Appointment Letter</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {mailModalOpen && (
        <DvlaMailModal
          isOpen={mailModalOpen}
          defaultEmail={application?.email}
          defaultSubject={`[DVLA HR Official] Appointment Letter - ${applicantName}`}
          onClose={() => setMailModalOpen(false)}
        />
      )}
    </div>
  );
}
