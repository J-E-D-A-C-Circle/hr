'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Sparkles, Check, RefreshCw, Eye, Edit3 } from 'lucide-react';
import OfficialAppointmentLetter from '@/components/OfficialAppointmentLetter';
import { generateOrUpdateAppointmentLetter } from '@/app/actions/admin';

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
  const [appointmentType, setAppointmentType] = useState<'TEMPORARY' | 'CONTRACT' | 'PERMANENT'>('TEMPORARY');
  const [letterDate, setLetterDate] = useState<string>('');
  const [salutation, setSalutation] = useState<string>('Dear Sir/Madam,');
  const [customRefNumber, setCustomRefNumber] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>('Monday, September 1, 2026');
  const [salaryGrade, setSalaryGrade] = useState<string>('DVLA Grade 7 Step 1');
  const [probationPeriod, setProbationPeriod] = useState<string>('six (6) months');
  const [contractDuration, setContractDuration] = useState<string>('two (2) years');
  const [signatoryName, setSignatoryName] = useState<string>('EPHRAIM NII TAN SACKEY');
  const [signatoryTitle, setSignatoryTitle] = useState<string>('AG. DIRECTOR HR');
  const [customBodyText, setCustomBodyText] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or reset form state when application or modal changes
  useEffect(() => {
    if (!application) return;

    const todayStr = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).toUpperCase();

    const existingLetter = application.appointmentLetterObject || application.appointmentLetterData;

    if (existingLetter && typeof existingLetter === 'object') {
      setAppointmentType((existingLetter.appointmentType as any) || 'TEMPORARY');
      setLetterDate(existingLetter.letterDate || todayStr);
      setSalutation(existingLetter.salutation || 'Dear Sir/Madam,');
      setCustomRefNumber(existingLetter.customRefNumber || '');
      setCustomSubject(existingLetter.customSubject || '');
      setEffectiveDate(existingLetter.effectiveDate || 'Monday, September 1, 2026');
      setSalaryGrade(existingLetter.salaryGrade || 'DVLA Grade 7 Step 1');
      setProbationPeriod(existingLetter.probationPeriod || 'six (6) months');
      setContractDuration(existingLetter.contractDuration || 'two (2) years');
      setSignatoryName(existingLetter.signatoryName || 'EPHRAIM NII TAN SACKEY');
      setSignatoryTitle(existingLetter.signatoryTitle || 'AG. DIRECTOR HR');
      setCustomBodyText(existingLetter.customBodyText || '');
    } else {
      setLetterDate(todayStr);
      applyDefaultTemplate('TEMPORARY', todayStr);
    }
  }, [application, isOpen]);

  const generateDefaultRef = (type: string) => {
    if (!application) return '';
    const monthStr = String(new Date().getMonth() + 1).padStart(2, '0');
    const yearSuffix = String(new Date().getFullYear()).slice(-2);
    const refSuffix = (application.referenceNumber || '0000').slice(-4);
    let code = 'PLACMT';
    if (type === 'CONTRACT') code = 'CONTR';
    if (type === 'PERMANENT') code = 'PERM';
    return `DVLA/HR/${monthStr}/${yearSuffix}/${code}/${refSuffix}`;
  };

  const applyDefaultTemplate = (type: 'TEMPORARY' | 'CONTRACT' | 'PERMANENT', dateStr?: string) => {
    if (!application) return;
    const posTitle = application.position?.title || 'Officer';
    const deptName = application.department?.name || 'Operations';
    const stationName = application.station?.name || 'Head Office (Accra 37)';
    const effDate = effectiveDate || 'Monday, September 1, 2026';

    const ref = generateDefaultRef(type);
    setCustomRefNumber(ref);

    if (type === 'TEMPORARY') {
      setCustomSubject('TEMPORARY PLACEMENT');
      setCustomBodyText(
        `This is to inform you that you have been temporarily posted to the ${stationName} as a ${posTitle}, assigned to the ${deptName} Department, effective ${effDate}.\n\nYou are to report to the Ag. Director Human Resource and Ag. Director Administration for necessary instructions and directives concerning your official duties.\n\nThank you.`
      );
    } else if (type === 'CONTRACT') {
      setCustomSubject('OFFER OF CONTRACT APPOINTMENT');
      setCustomBodyText(
        `I am pleased to inform you that Management has approved your appointment as ${posTitle} in the ${deptName} Department at ${stationName} on a Contract basis, effective ${effDate}.\n\nThis appointment is for an initial period of ${contractDuration}, subject to satisfactory performance and renewal. Your remuneration and terms of engagement will be in accordance with ${salaryGrade}.\n\nYou are requested to report to the Ag. Director Human Resource for formal documentation and assumption of duty.\n\nPlease confirm your acceptance of this offer in writing within fourteen (14) days from the date of this letter.`
      );
    } else if (type === 'PERMANENT') {
      setCustomSubject('OFFER OF PERMANENT APPOINTMENT');
      setCustomBodyText(
        `I am pleased to inform you that Management has approved your appointment as ${posTitle} in the ${deptName} Department at ${stationName} as a Permanent Staff member of the Driver and Vehicle Licensing Authority (DVLA), effective ${effDate}.\n\nYour appointment is subject to a probation period of ${probationPeriod}, during which your performance and conduct will be evaluated for confirmation. Your salary and benefits will be attached to ${salaryGrade} of the Authority's Approved Salary Structure.\n\nYou are required to report to the Ag. Director Human Resource on ${effDate} for formal onboarding and IPPD payroll documentation.\n\nKindly sign and return the duplicate copy of this letter to signify your formal acceptance of this offer.`
      );
    }
  };

  const handleTypeChange = (newType: 'TEMPORARY' | 'CONTRACT' | 'PERMANENT') => {
    setAppointmentType(newType);
    applyDefaultTemplate(newType);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await generateOrUpdateAppointmentLetter({
      applicationId: application.id,
      appointmentType,
      letterDate,
      salutation,
      customRefNumber,
      customSubject,
      customBodyText,
      effectiveDate,
      salaryGrade,
      probationPeriod,
      contractDuration,
      signatoryName,
      signatoryTitle,
    });

    setIsSubmitting(false);

    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to save appointment letter.');
    }
  };

  if (!isOpen || !application) return null;

  const applicantName = application.applicant?.fullName || 'Applicant';
  const posTitle = application.position?.title || 'Position';
  const deptName = application.department?.name || 'Department';
  const stationName = application.station?.name || 'Head Office (Accra 37)';

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
                DVLA HR Appointment Letter Generator
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Letter Category:</span>
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
                Temporary Placement
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('CONTRACT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  appointmentType === 'CONTRACT'
                    ? 'bg-amber-400 text-gray-950 shadow'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                Contract Staff
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('PERMANENT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  appointmentType === 'PERMANENT'
                    ? 'bg-amber-400 text-gray-950 shadow'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                Permanent Staff
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 bg-emerald-900 rounded-xl border border-emerald-700">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'form' ? 'bg-white text-gray-950 shadow' : 'text-emerald-200 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Fields</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'preview' ? 'bg-white text-gray-950 shadow' : 'text-emerald-200 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {errorMsg && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-600 p-3 rounded text-red-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Split-View Grid on Large Screens or Tab View on Small Screens */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Form Controls Column */}
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
                    Reset Category Default
                  </button>
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
                </div>

                {appointmentType === 'CONTRACT' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-amber-900 mb-1">
                        Contract Duration
                      </label>
                      <input
                        type="text"
                        value={contractDuration}
                        onChange={(e) => setContractDuration(e.target.value)}
                        placeholder="e.g. two (2) years"
                        className="w-full border border-amber-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-amber-900 mb-1">
                        Salary / Remuneration Scale
                      </label>
                      <input
                        type="text"
                        value={salaryGrade}
                        onChange={(e) => setSalaryGrade(e.target.value)}
                        placeholder="e.g. DVLA Contract Grade 7"
                        className="w-full border border-amber-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
                      />
                    </div>
                  </div>
                )}

                {appointmentType === 'PERMANENT' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-emerald-900 mb-1">
                        Probation Period
                      </label>
                      <input
                        type="text"
                        value={probationPeriod}
                        onChange={(e) => setProbationPeriod(e.target.value)}
                        placeholder="e.g. six (6) months"
                        className="w-full border border-emerald-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-emerald-900 mb-1">
                        Approved Salary Grade
                      </label>
                      <input
                        type="text"
                        value={salaryGrade}
                        onChange={(e) => setSalaryGrade(e.target.value)}
                        placeholder="e.g. DVLA Grade 8 Step 1"
                        className="w-full border border-emerald-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
                      />
                    </div>
                  </div>
                )}

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      Signatory Officer Name
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
                </div>
              </div>
            </form>

            {/* Live Letterhead Preview Column */}
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
                    referenceNumber={application.referenceNumber || '0000'}
                    verificationCode={application.appointmentLetterObject?.verificationCode || 'DVLA-VER-2026-PREVIEW'}
                    applicantName={applicantName}
                    positionTitle={posTitle}
                    departmentName={deptName}
                    postingStationName={stationName}
                    appointmentType={appointmentType}
                    effectiveDate={effectiveDate}
                    issueDate={letterDate}
                    salutation={salutation}
                    customRefNumber={customRefNumber}
                    customSubject={customSubject}
                    customBodyText={customBodyText}
                    salaryGrade={salaryGrade}
                    probationPeriod={probationPeriod}
                    contractDuration={contractDuration}
                    signatoryName={signatoryName}
                    signatoryTitle={signatoryTitle}
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
  );
}
