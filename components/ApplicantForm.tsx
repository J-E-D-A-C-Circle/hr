'use me';
'use client';

import { useState, useMemo } from 'react';
import { submitApplication } from '@/app/actions/applicant';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';

interface ApplicantFormProps {
  positions: Array<{
    id: string;
    title: string;
    type: string;
    departmentId: string;
    department: { name: string };
  }>;
  departments: Array<{ id: string; name: string; code: string }>;
  stations: Array<{ id: string; name: string; location: string | null }>;
  preselectedPosId?: string;
  selectedPositionId?: string;
}

export default function ApplicantForm({
  positions,
  departments,
  stations,
  preselectedPosId,
  selectedPositionId,
}: ApplicantFormProps) {
  const targetId = preselectedPosId || selectedPositionId;
  const defaultPos = positions.find((p) => p.id === targetId) || positions[0];

  // Category filter state: ATTACHMENT, TEMPORARY, PERMANENT
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultPos?.type || 'ATTACHMENT');

  // Filter positions matching the selected category — also include INTERNSHIP under ATTACHMENT
  const filteredPositions = useMemo(() => {
    if (selectedCategory === 'ATTACHMENT') {
      return positions.filter((p) => p.type === 'ATTACHMENT' || p.type === 'INTERNSHIP');
    }
    return positions.filter((p) => p.type === selectedCategory);
  }, [positions, selectedCategory]);

  const [selectedPosId, setSelectedPosId] = useState(defaultPos?.id || filteredPositions[0]?.id || '');
  const [selectedDeptId, setSelectedDeptId] = useState(defaultPos?.departmentId || departments[0]?.id || '');
  const [isStaff, setIsStaff] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState(stations[0]?.id || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);
  const [ghanaCardValue, setGhanaCardValue] = useState('GHA-');

  // Auto-formats input to GHA-XXXXXXXXX-X as user types digits
  const handleGhanaCardInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Strip the GHA- prefix and extract only digits
    const stripped = raw.replace(/^GHA-?/i, '').replace(/\D/g, '').slice(0, 10);
    let formatted = 'GHA-';
    if (stripped.length > 0) formatted += stripped.slice(0, 9);
    if (stripped.length >= 10) formatted += '-' + stripped.slice(9, 10);
    setGhanaCardValue(formatted);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const matchingPos = positions.find((p) => p.type === category);
    if (matchingPos) {
      setSelectedPosId(matchingPos.id);
      setSelectedDeptId(matchingPos.departmentId);
    }
  };

  const handlePositionChange = (posId: string) => {
    setSelectedPosId(posId);
    const targetPos = positions.find((p) => p.id === posId);
    if (targetPos) {
      setSelectedDeptId(targetPos.departmentId);
      if (targetPos.type !== selectedCategory) {
        setSelectedCategory(targetPos.type);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.set('isCurrentDvlaStaff', isStaff ? 'true' : 'false');
    formData.set('departmentId', selectedDeptId);
    formData.set('positionId', selectedPosId);
    if (isStaff) {
      formData.set('stationId', selectedStationId);
    } else {
      formData.delete('stationId');
    }

    const res = await submitApplication(formData);
    setIsSubmitting(false);

    if (res.success && res.referenceNumber) {
      setSuccessRef(res.referenceNumber);
    } else {
      setErrorMsg(res.error || 'Failed to submit application.');
    }
  };

  if (successRef) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-600 p-8 md:p-10 max-w-2xl mx-auto text-center my-8">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-3xl font-extrabold mx-auto mb-4 shadow-sm">
          ✓
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Application Submitted Successfully!</h2>
        <p className="text-gray-600 text-sm mb-6">
          Your official recruitment & attachment application has been recorded by the Driver & Vehicle Licensing Authority.
        </p>

        <div className="bg-[#FDF6E3] border border-amber-300 rounded-2xl p-6 mb-6 shadow-inner">
          <div className="text-xs uppercase font-bold text-amber-800 tracking-wider mb-1">Your Application Reference Number</div>
          <div className="text-3xl font-black text-[#15803D] tracking-widest my-2 select-all">{successRef}</div>
          <p className="text-xs text-gray-600 mt-2">
            Please keep this reference number safe. A confirmation email has been sent with tracking details.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <a
            href={`/status?ref=${successRef}`}
            className="bg-[#15803D] hover:bg-[#166534] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition transform hover:-translate-y-0.5"
          >
            Track Application Status
          </a>
          <a
            href="/positions"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-semibold text-sm transition"
          >
            View More Positions
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#FAF0D7] rounded-3xl shadow-xl border border-[#E6D7A8] p-6 md:p-10 space-y-6">
      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-2xl text-red-800 text-sm flex items-start space-x-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Submission Error</div>
            <div>{errorMsg}</div>
          </div>
        </div>
      )}

      {/* Step 1: Select Application Placement Track / Category */}
      <div className="bg-[#FDF6E3] border border-amber-300 rounded-2xl p-5 shadow-sm space-y-3">
        <label className="block text-xs font-black uppercase tracking-wider text-amber-950">
          1. Select Recruitment / Placement Track *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleCategoryChange('ATTACHMENT')}
            className={`p-3.5 rounded-xl border-2 text-left font-bold transition flex flex-col justify-between cursor-pointer ${
              selectedCategory === 'ATTACHMENT'
                ? 'bg-[#15803D] text-white border-[#15803D] shadow-md'
                : 'bg-white text-gray-800 border-gray-300 hover:border-emerald-400'
            }`}
          >
            <div className="text-xs uppercase font-extrabold opacity-80">Student Placement</div>
            <div className="text-sm font-black mt-1">Attachment Placement</div>
          </button>

          <button
            type="button"
            onClick={() => handleCategoryChange('TEMPORARY')}
            className={`p-3.5 rounded-xl border-2 text-left font-bold transition flex flex-col justify-between cursor-pointer ${
              selectedCategory === 'TEMPORARY'
                ? 'bg-[#15803D] text-white border-[#15803D] shadow-md'
                : 'bg-white text-gray-800 border-gray-300 hover:border-emerald-400'
            }`}
          >
            <div className="text-xs uppercase font-extrabold opacity-80">Staff Recruitment</div>
            <div className="text-sm font-black mt-1">Temporary Staff Role</div>
          </button>

          <button
            type="button"
            onClick={() => handleCategoryChange('PERMANENT')}
            className={`p-3.5 rounded-xl border-2 text-left font-bold transition flex flex-col justify-between cursor-pointer ${
              selectedCategory === 'PERMANENT'
                ? 'bg-[#15803D] text-white border-[#15803D] shadow-md'
                : 'bg-white text-gray-800 border-gray-300 hover:border-emerald-400'
            }`}
          >
            <div className="text-xs uppercase font-extrabold opacity-80">Staff Recruitment</div>
            <div className="text-sm font-black mt-1">Permanent Staff Role</div>
          </button>
        </div>
      </div>

      {/* Step 2: Target Position Selection */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
          2. Target Position Role ({selectedCategory}) *
        </label>
        <Select value={selectedPosId} onValueChange={handlePositionChange}>
          <SelectTrigger className="rounded-xl bg-white border-emerald-300">
            <SelectValue placeholder="Select target placement position" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            {filteredPositions.map((pos) => (
              <SelectItem key={pos.id} value={pos.id}>
                {pos.title} — Dept: {pos.department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Step 3: Personal Info Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Full Name *</label>
          <input
            type="text"
            name="fullName"
            required
            placeholder="e.g. Kwame Mensah"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#15803D] focus:outline-none shadow-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Email Address *</label>
          <input
            type="email"
            name="email"
            required
            placeholder="e.g. kwame.mensah@example.com"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#15803D] focus:outline-none shadow-sm"
          />
          <span className="text-[11px] text-gray-500">Must be unique. One application permitted per person.</span>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Contact Phone Number *</label>
          <input
            type="tel"
            name="phone"
            required
            placeholder="e.g. +233 24 123 4567"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#15803D] focus:outline-none shadow-sm"
          />
        </div>

        <div>
          <label className="block text-xs uppercase text-gray-700 mb-1">National ID / Ghana Card Number *</label>
          <input
            type="text"
            name="nationalIdNumber"
            required
            value={ghanaCardValue}
            onChange={handleGhanaCardInput}
            placeholder="GHA-XXXXXXXXX-X"
            maxLength={17}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-mono uppercase text-gray-900 focus:ring-2 focus:ring-[#15803D] focus:outline-none shadow-sm tracking-widest"
          />
          <span className="text-[11px] text-gray-500">Dashes are added automatically. Verified for duplicate identity prevention.</span>
        </div>
      </div>

      {/* Step 4: DVLA Staff Toggle */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between bg-[#FDF6E3] border border-amber-300 rounded-2xl p-5 shadow-sm">
          <div>
            <div className="font-bold text-gray-900 text-sm">Are you currently employed with DVLA Ghana?</div>
            <div className="text-xs text-gray-600">
              {isStaff
                ? 'Yes — Station and Department fields unlocked.'
                : 'No — Station and Department fields remain locked.'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsStaff(!isStaff)}
            className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isStaff ? 'bg-[#15803D]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isStaff ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
              Current DVLA Station {isStaff ? '*' : '(Locked)'}
            </label>
            <Select
              disabled={!isStaff}
              value={selectedStationId}
              onValueChange={setSelectedStationId}
            >
              <SelectTrigger className="rounded-xl bg-white">
                <SelectValue placeholder="Select DVLA Station" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {stations.map((st) => (
                  <SelectItem key={st.id} value={st.id}>
                    {st.name} ({st.location || 'Ghana'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
              Assigned Department {isStaff ? '*' : '(Locked)'}
            </label>
            <Select
              disabled={!isStaff}
              value={selectedDeptId}
              onValueChange={setSelectedDeptId}
            >
              <SelectTrigger className="rounded-xl bg-white">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Step 5: Required Document Uploads (CV, Application Letter, Certificate) */}
      <div className="border-t border-gray-200 pt-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Required Application Documents</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl shadow-sm">
            <label className="block text-xs font-bold text-gray-900 mb-1">1. Curriculum Vitae (CV) *</label>
            <span className="text-[11px] text-gray-500 block mb-2">PDF, DOC, DOCX up to 5MB.</span>
            <input
              type="file"
              name="cv"
              accept=".pdf,.doc,.docx"
              required
              className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#15803D] file:text-white hover:file:bg-[#166534] transition cursor-pointer"
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl shadow-sm">
            <label className="block text-xs font-bold text-gray-900 mb-1">2. Application Letter *</label>
            <span className="text-[11px] text-gray-500 block mb-2">PDF, DOC, DOCX up to 5MB.</span>
            <input
              type="file"
              name="applicationLetter"
              accept=".pdf,.doc,.docx"
              required
              className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#15803D] file:text-white hover:file:bg-[#166534] transition cursor-pointer"
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl shadow-sm">
            <label className="block text-xs font-bold text-gray-900 mb-1">3. Certificate / Transcripts *</label>
            <span className="text-[11px] text-gray-500 block mb-2">Academic Certificate or Transcripts PDF up to 5MB.</span>
            <input
              type="file"
              name="certificate"
              accept=".pdf,.doc,.docx"
              required
              className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#15803D] file:text-white hover:file:bg-[#166534] transition cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#15803D] hover:bg-[#166534] text-white font-bold py-3.5 px-6 rounded-2xl text-base shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
        >
          {isSubmitting ? (
            <span>Submitting Application...</span>
          ) : (
            <span>Submit Official DVLA Application →</span>
          )}
        </button>
      </div>
    </form>
  );
}
