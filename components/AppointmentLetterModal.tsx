'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, FileText, Sparkles, Check, RefreshCw, Eye, Edit3, Printer } from 'lucide-react';
import OfficialAppointmentLetter from '@/components/OfficialAppointmentLetter';
import { SIGNATURE_BASE64 } from '@/lib/signature';
import { getAutoServiceYear, getAutoEndDate } from '@/lib/utils';

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
  const [appointmentType, setAppointmentType] = useState<'TEMPORARY' | 'REPOSTING'>('TEMPORARY');
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
  const [ccText, setCcText] = useState<string>('');
  const [customBodyText, setCustomBodyText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
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

    const appStart = application.service_period_start || application.servicePeriodStart;
    const initialEffectiveDate = appStart 
      ? new Date(appStart).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : 'Monday, September 1, 2026';

    const existingLetter = application.appointmentLetterObject || application.appointmentLetterData;
    if (existingLetter && typeof existingLetter === 'object') {
      const type = (existingLetter.appointmentType as any) || (application.status === 'rejected' ? 'REPOSTING' : 'TEMPORARY');
      setAppointmentType(type);
      setLetterDate(existingLetter.letterDate || todayStr);
      setSalutation(existingLetter.salutation || (type === 'REPOSTING' ? 'Dear Madam,' : 'Dear Sir/Madam,'));
      const defaultRef = application.nss_number ? `DVLA/HR/NSS/${application.nss_number}` : `DVLA/HR/NSS/${application.id || '0127'}`;
      setCustomRefNumber(existingLetter.customRefNumber || defaultRef);
      setYourRef(existingLetter.yourRef || '');
      setApplicantName(existingLetter.applicantName || fullName);
      setApplicantAddress(existingLetter.applicantAddress || application.residential_address || '');
      const isStaleSubject = type === 'REPOSTING' && (
        !existingLetter.customSubject ||
        existingLetter.customSubject === 'POSTING OF NATIONAL SERVICE PERSONNEL.' ||
        existingLetter.customSubject === 'REPOSTING OF NATIONAL SERVICE PERSONNEL.' ||
        existingLetter.customSubject === 'REQUEST FOR REPOSTING' ||
        existingLetter.customSubject?.includes('2025/2026')
      );
      const autoServiceYear = getAutoServiceYear(application.service_year);
      setCustomSubject(isStaleSubject ? `RELEASE OF NATIONAL SERVICE PERSONNEL FOR THE ${autoServiceYear} SERVICE YEAR` : (existingLetter.customSubject || ''));
      setEffectiveDate(existingLetter.effectiveDate || initialEffectiveDate);
      setSalaryGrade(existingLetter.salaryGrade || 'DVLA Salary Scale');
      setProbationPeriod(existingLetter.probationPeriod || 'six (6) months');
      setContractDuration(existingLetter.contractDuration || 'two (2) years');
      setSignatoryName(existingLetter.signatoryName || 'EPHRAIM NII TAN SACKEY');
      setSignatoryTitle(existingLetter.signatoryTitle || 'AG. DIRECTOR HR');
      setSignatoryForTitle(existingLetter.signatoryForTitle || 'FOR: CHIEF EXECUTIVE');
      const rawCc = existingLetter.ccText || '';
      const sanitizedCc = rawCc
        .split('\n')
        .map((s: string) => s.trim())
        .filter((s: string) => Boolean(s) && s !== 'District Licensing Manager')
        .join('\n');
      setCcText(type === 'REPOSTING' ? '' : sanitizedCc);
      
      if (type === 'REPOSTING') {
        const isStaleBody = (
          !existingLetter.customBodyText ||
          existingLetter.customBodyText.includes('assigned to') ||
          existingLetter.customBodyText.includes('reposted to the') ||
          existingLetter.customBodyText.includes('has requested to be released')
        );
        if (isStaleBody) {
          setCustomBodyText(
            `We write to inform your esteemed office that the bearer of this letter has been released to the National Service Secretariat for reposting.\n\nBy this letter we write to confirm the release of the National Service Person.\n\nCounting on your usual cooperation.`
          );
        } else {
          setCustomBodyText(existingLetter.customBodyText || '');
        }
      } else {
        const startDateStr = existingLetter.effectiveDate || initialEffectiveDate;
        const autoYear = getAutoServiceYear(application.service_year || startDateStr);
        const autoEnd = getAutoEndDate(startDateStr);
        let body = existingLetter.customBodyText || '';
        if (body) {
          body = body
            .replace(/2025\/2026/g, autoYear)
            .replace(/(ends on\s+(?:<strong>)?)[^<.]*?30th October,\s*2026(?:<\/strong>)?/gi, `$1${autoEnd}</strong>`)
            .replace(/District Licensing Manager/g, 'Head of Department');
        } else {
          const stationName = application.station?.name || application.posting_station || application.posting_district || 'Head Office';
          body = `This is to inform you that you have been assigned to the <strong>${stationName}</strong> for the <strong>${autoYear}</strong> service year.\n\nYour National Service commences on <strong>${startDateStr}</strong> and ends on <strong>${autoEnd}</strong>.\n\nYou are required to report to the Head of Department for orientation and assignment. You are expected to exhibit good conduct and abide by all rules and regulations of the Authority throughout your service period.`;
        }
        setCustomBodyText(body);
      }
    } else {
      setLetterDate(todayStr);
      setEffectiveDate(initialEffectiveDate);
      const initialType = application.status === 'rejected' ? 'REPOSTING' : 'TEMPORARY';
      setAppointmentType(initialType);
      applyDefaultTemplate(initialType, todayStr, initialEffectiveDate);
    }
  }, [application, isOpen]);

  const generateDefaultRef = (type: string) => {
    if (!application) return type === 'REPOSTING' ? 'DVLA/ADMIN/NSS/10/25' : 'DVLA/HR/NSS/0127';
    const refCode = application.nss_number || String(application.id || '10/25');
    return type === 'REPOSTING' ? `DVLA/ADMIN/NSS/${refCode}` : `DVLA/HR/NSS/${refCode}`;
  };

  const applyDefaultTemplate = (type: 'TEMPORARY' | 'REPOSTING', dateStr?: string, effDateOverride?: string) => {
    if (!application) return;
    const stationName = application.station?.name || application.posting_station || application.posting_district || 'Head Office';
    const ref = generateDefaultRef(type);
    setCustomRefNumber(ref);
    const appStart = application.service_period_start || application.servicePeriodStart;
    const fallbackDate = appStart 
      ? new Date(appStart).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : `Monday, September 1, ${new Date().getFullYear()}`;
    const effDate = effDateOverride || effectiveDate || fallbackDate;
    const autoServiceYear = getAutoServiceYear(application?.service_year || effDate);
    const autoEndDate = getAutoEndDate(effDate);

    if (type === 'REPOSTING') {
      setCustomSubject(`RELEASE OF NATIONAL SERVICE PERSONNEL FOR THE ${autoServiceYear} SERVICE YEAR`);
      setApplicantName('THE EXECUTIVE DIRECTOR');
      setApplicantAddress('NATIONAL SERVICE SECRETARIAT\nACCRA');
      setSalutation('Dear Madam,');
      setSignatoryTitle('AG. DIRECTOR HUMAN RESOURCE');
      setSignatoryForTitle('FOR: CHIEF EXECUTIVE');
      setCcText('');
      setCustomBodyText(
        `We write to inform your esteemed office that the bearer of this letter has been released to the National Service Secretariat for reposting.\n\nBy this letter we write to confirm the release of the National Service Person.\n\nCounting on your usual cooperation.`
      );
    } else {
      setCustomSubject('POSTING OF NATIONAL SERVICE PERSONNEL.');
      setApplicantName(application?.full_name || `${application?.first_name || ''} ${application?.last_name || ''}`.trim());
      setApplicantAddress(application?.residential_address || 'ACCRA - GHANA');
      setSalutation(application?.full_name ? `Dear ${application.full_name},` : 'Dear Sir/Madam,');
      setSignatoryTitle('AG. DIRECTOR HR');
      setSignatoryForTitle('FOR: CHIEF EXECUTIVE');
      setCcText('');
      setCustomBodyText(
        `This is to inform you that you have been assigned to the <strong>${stationName}</strong> for the <strong>${autoServiceYear}</strong> service year.\n\nYour National Service commences on <strong>${effDate}</strong> and ends on <strong>${autoEndDate}</strong>.\n\nYou are required to report to the Head of Department for orientation and assignment. You are expected to exhibit good conduct and abide by all rules and regulations of the Authority throughout your service period.`
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
    const autoServiceYear = getAutoServiceYear(application?.service_year || effectiveDate);
    const autoEndDate = getAutoEndDate(effectiveDate);
    const displaySubjectText = customSubject || (appointmentType === 'REPOSTING' ? `RELEASE OF NATIONAL SERVICE PERSONNEL FOR THE ${autoServiceYear} SERVICE YEAR` : 'POSTING OF NATIONAL SERVICE PERSONNEL.');
    const displaySalutation = salutation || (appointmentType === 'REPOSTING' ? 'Dear Madam,' : 'Dear Sir/Madam,');
    let displayBodyText = customBodyText || (appointmentType === 'REPOSTING' ? `We write to inform your esteemed office that the bearer of this letter has been released to the National Service Secretariat for reposting.\n\nBy this letter we write to confirm the release of the National Service Person.\n\nCounting on your usual cooperation.` : '');
    if (appointmentType !== 'REPOSTING' && displayBodyText) {
      displayBodyText = displayBodyText
        .replace(/2025\/2026/g, autoServiceYear)
        .replace(/(ends on\s+(?:<strong>)?)[^<.]*?30th October,\s*2026(?:<\/strong>)?/gi, `$1${autoEndDate}</strong>`)
        .replace(/District Licensing Manager/g, 'Head of Department');
    }
    const displaySignatoryName = signatoryName || 'EPHRAIM NII TAN SACKEY';
    const displaySignatoryTitle = signatoryTitle || 'AG. DIRECTOR HR';
    const displaySignatoryForTitle = signatoryForTitle || 'FOR: CHIEF EXECUTIVE';

    const ccListItems: string[] = (
      typeof ccText === 'string'
        ? ccText.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : []
    ).filter(item => item !== 'District Licensing Manager');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>DVLA Official Appointment Letter - ${displayApplicantName}</title>
        <style>
          @media print {
            @page { margin: 8mm 12mm; size: A4 portrait; }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: 100% !important;
              background-color: #FFFFFF !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .letter-container {
              position: relative !important;
              width: 100% !important;
              max-width: 190mm !important;
              max-height: 275mm !important;
              box-sizing: border-box !important;
              padding: 4mm 8mm !important;
              margin: 0 auto !important;
              border: none !important;
              box-shadow: none !important;
              background-color: #FFFFFF !important;
              overflow: hidden !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
            }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', Times, serif !important; }
          body { font-family: 'Times New Roman', Times, serif !important; font-size: 12pt !important; line-height: 1.45; color: #111827; background: #FFFFFF; padding: 8mm; }
          .letter-container { position: relative; max-width: 780px; margin: 0 auto; background-color: #FFFFFF; padding: 20px 30px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
          .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 340px; height: 340px; opacity: 0.06; pointer-events: none; z-index: 1; }
          .content-z { position: relative; z-index: 10; }
          .header-title { text-align: center; font-size: 15pt !important; font-weight: 900; color: #008053; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px; font-family: 'Times New Roman', Times, serif !important; }
          .header-grid { display: flex; justify-content: space-between; align-items: center; font-size: 12pt !important; color: #1f2937; margin-top: 8px; font-family: 'Times New Roman', Times, serif !important; }
          .header-left { text-align: left; font-size: 12pt !important; line-height: 1.35; }
          .header-center { text-align: center; }
          .header-right { text-align: right; font-size: 12pt !important; line-height: 1.35; }
          .header-logo { width: 76px; height: 76px; object-fit: contain; }
          .divider { border-top: 2px solid #008053; margin: 10px 0 16px 0; }
          .ref-row { display: flex; justify-content: space-between; font-size: 12pt !important; margin-bottom: 16px; font-family: 'Times New Roman', Times, serif !important; }
          .ref-dotted { display: inline-block; border-bottom: 1px dotted #111827; font-family: monospace; font-weight: bold; padding: 0 4px; min-width: 200px; }
          .addressee { font-size: 12pt !important; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; font-family: 'Times New Roman', Times, serif !important; }
          .salutation { font-size: 12pt !important; margin-bottom: 10px; font-family: 'Times New Roman', Times, serif !important; }
          .subject-title { font-size: 12pt !important; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #111827; padding-bottom: 1px; display: inline-block; margin-bottom: 12px; font-family: 'Times New Roman', Times, serif !important; }
          .body-text { font-size: 12pt !important; line-height: 1.5; text-align: justify; margin-bottom: 16px; white-space: pre-line; font-family: 'Times New Roman', Times, serif !important; }
          .footer-block { margin-top: 14px; padding-top: 8px; }
          .signatory-block { font-size: 12pt !important; font-family: 'Times New Roman', Times, serif !important; }
          .signature-img { height: 48px; max-height: 48px; width: auto; object-fit: contain; margin: 4px 0; }
          .signatory-name { font-weight: 900; text-transform: uppercase; font-size: 12pt !important; font-family: 'Times New Roman', Times, serif !important; }
          .signatory-title { font-weight: bold; color: #1f2937; font-size: 12pt !important; font-family: 'Times New Roman', Times, serif !important; }
          .signatory-for { font-size: 11pt; font-weight: bold; color: #4b5563; text-transform: uppercase; }
          .cc-box { margin-top: 10px; font-size: 11pt !important; font-family: 'Times New Roman', Times, serif !important; }
          .cc-box ul { list-style: none; padding-left: 0; margin-top: 2px; font-size: 11pt !important; }
          .cc-box li { font-size: 11pt !important; }
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

            <div class="ref-row">
              <div>
                <div style="margin-bottom: 4px;"><strong>My Ref:</strong> <span class="ref-dotted">${displayRef}</span></div>
                <div><strong>Your Ref:</strong> <span class="ref-dotted">${displayYourRef}</span></div>
              </div>
              <div style="text-align: right;">
                <div><strong>Date:</strong> <span class="ref-dotted" style="text-transform: uppercase; min-width: 150px; text-align: center;">${displayIssueDate}</span></div>
              </div>
            </div>

            <div class="addressee">
              ${appointmentType === 'REPOSTING' ? `
                <div>THE EXECUTIVE DIRECTOR</div>
                <div>NATIONAL SERVICE SECRETARIAT</div>
                <div>ACCRA</div>
              ` : `
                <div>${displayApplicantName}</div>
                <div style="color: #374151; font-weight: normal; white-space: pre-line;">${displayApplicantAddress}</div>
              `}
            </div>

            <div class="salutation">${displaySalutation}</div>

            <div>
              <h2 class="subject-title">${displaySubjectText}</h2>
            </div>

            <div class="body-text">
              ${displayBodyText}
            </div>

            <div class="footer-block">
              <div class="signatory-block">
                <div>Thank you.</div>
                <div style="margin-top: 4px;">Yours faithfully,</div>
                <div style="margin: 4px 0;">
                  <img src="${SIGNATURE_BASE64}" alt="Signature" class="signature-img" />
                </div>
                <div>
                  <div class="signatory-name">${displaySignatoryName}</div>
                  <div class="signatory-title">${displaySignatoryTitle || (appointmentType === 'REPOSTING' ? 'AG. DIRECTOR HUMAN RESOURCE' : 'AG. DIRECTOR HR')}</div>
                  <div class="signatory-for">${displaySignatoryForTitle}</div>
                </div>
                ${appointmentType !== 'REPOSTING' && ccListItems.length > 0 ? `
                <div class="cc-box">
                  <strong>Cc:</strong>
                  <ul>
                    ${ccListItems.map(item => `<li>&bull; ${item}</li>`).join('')}
                  </ul>
                </div>
                ` : ''}
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
        ccText: appointmentType === 'REPOSTING' ? '' : ccText,
      };

      const token = localStorage.getItem('token');
      const targetStatus = appointmentType === 'REPOSTING' ? 'rejected' : 'approved';
      const targetStation = application.posting_station || application.station?.name || application.posting_district || 'DVLA Head Office - Cantonments';
      const targetDept = application.posting_department || application.department?.name || 'Operations';
      const targetStart = application.service_period_start || application.servicePeriodStart || '2026-09-01';

      await axios.post(
        '/api/applications/review',
        {
          id: application.id,
          status: targetStatus,
          posting_station: targetStation,
          posting_department: targetDept,
          service_period_start: targetStart,
          appointmentLetterData: letterPayload,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || err?.message || 'Failed to save appointment letter.');
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
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
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
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setEffectiveDate(newStart);
                      const newEndDate = getAutoEndDate(newStart);
                      const newYear = getAutoServiceYear(newStart);
                      setCustomBodyText((prev) => {
                        if (!prev || appointmentType === 'REPOSTING') return prev;
                        let updated = prev;
                        if (updated.includes('commences on')) {
                          updated = updated.replace(
                            /(commences on\s+<strong>)[^<]*?(<\/strong>\s+and ends on\s+<strong>)[^<]*?(<\/strong>)/i,
                            `$1${newStart}$2${newEndDate}$3`
                          );
                        }
                        if (updated.includes('service year')) {
                          updated = updated.replace(
                            /(for the\s+<strong>)[^<]*?(<\/strong>\s+service year)/i,
                            `$1${newYear}$2`
                          );
                        }
                        return updated;
                      });
                    }}
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

                {appointmentType !== 'REPOSTING' ? (
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
                ) : (
                  <div className="bg-gray-100 p-3 rounded-xl border border-gray-200 text-xs text-gray-500 font-medium">
                    Cc Distribution does not apply to Reposting / Release letters.
                  </div>
                )}
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
                <div className="bg-slate-100 p-2 rounded-2xl border border-slate-200 max-h-[70vh] overflow-y-auto shadow-inner">
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
    </div>
  );
}
