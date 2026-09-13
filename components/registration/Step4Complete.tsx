import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ImageIcon, ShieldCheck, FileText, Upload } from 'lucide-react';

interface Step4CompleteProps {
  formData: any;
  handleInputChange: (field: any, value: any) => void;
  handleContinue: (e: React.FormEvent) => void;
  setCurrentStep: (step: number) => void;
  currentStep: number;
  isSubmitting: boolean;
  submitError: string | null;
  passportFileName: string;
  idCardFileName: string;
  appointmentFileName: string;
  cvFileName: string;
  passportFileRef: React.RefObject<HTMLInputElement | null>;
  idCardFileRef: React.RefObject<HTMLInputElement | null>;
  appointmentFileRef: React.RefObject<HTMLInputElement | null>;
  cvFileRef: React.RefObject<HTMLInputElement | null>;
  handlePassportSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleIdCardSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAppointmentSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCvSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ghanianSchools = [
  "University of Ghana",
  "Kwame Nkrumah University of Science and Technology",
  "University of Cape Coast",
  "University for Development Studies",
  "University of Education, Winneba",
  "University of Energy and Natural Resources",
  "University of Health and Allied Sciences",
  "Ghana Institute of Management and Public Administration",
  "University of Mines and Technology",
  "Ghana Communication Technology University",
  "University of Professional Studies, Accra",
  "Presbyterian University College",
  "Central University",
  "Valley View University",
  "Pentecost University College",
  "KAAF University College",
  "Zenith University College",
  "Christian Service University College",
  "Cape Coast Technical University",
  "Accra Technical University",
  "Kumasi Technical University",
  "Ho Technical University",
  "Koforidua Technical University",
  "Sunyani Technical University",
  "Takoradi Technical University",
  "Tamale Technical University",
  "Bolgatanga Polytechnic",
  "Wa Polytechnic",
];

const ghanianCourses = [
  "BSc. Computer Science",
  "BSc. Information Technology",
  "BSc. Software Engineering",
  "BSc. Computer Engineering",
  "BSc. Data Science and Analytics",
  "BSc. Cybersecurity",
  "BSc. Electrical and Electronic Engineering",
  "BSc. Mechanical Engineering",
  "BSc. Civil Engineering",
  "BSc. Geomatic Engineering",
  "BSc. Biomedical Engineering",
  "BSc. Chemical Engineering",
  "BSc. Agricultural Engineering",
  "BSc. Telecommunication Engineering",
  "Bachelor of Medicine and Bachelor of Surgery (MBChB)",
  "Doctor of Pharmacy (PharmD)",
  "BSc. Nursing",
  "BSc. Midwifery",
  "BSc. Public Health",
  "BSc. Medical Laboratory Science",
  "BSc. Physician Assistantship",
  "BSc. Physiotherapy",
  "BSc. Radiography",
  "BSc. Business Administration (Accounting)",
  "BSc. Business Administration (Banking & Finance)",
  "BSc. Business Administration (Human Resource Management)",
  "BSc. Business Administration (Marketing)",
  "BSc. Business Administration (Management)",
  "BSc. Business Administration (Insurance & Risk)",
  "BSc. Business Administration (Logistics & Supply Chain)",
  "BA. Communication Studies & Journalism",
  "BA. Public Relations",
  "BA. Economics",
  "BA. Sociology",
  "BA. Psychology",
  "BA. Political Science",
  "BA. Information Studies",
  "BA. Geography and Resource Development",
  "BA. English Language & Literature",
  "BA. History",
  "BA. Linguistics",
  "BA. French / Modern Languages",
  "Bachelor of Laws (LL.B)",
  "BSc. Actuarial Science",
  "BSc. Statistics",
  "BSc. Mathematics",
  "BSc. Physics",
  "BSc. Chemistry",
  "BSc. Biochemistry / Biological Sciences",
  "BSc. Environmental Science",
  "BSc. Architecture",
  "BSc. Quantity Surveying & Construction Economics",
  "BSc. Real Estate / Estate Management",
  "BSc. Land Economy",
  "BSc. Agriculture / Agribusiness",
  "BEd. Computer Science Education",
  "BEd. Mathematics Education",
  "BEd. Social Studies Education",
  "BEd. Early Childhood Education",
  "HND Computer Science",
  "HND Electrical/Electronic Engineering",
  "HND Mechanical Engineering",
  "HND Building Technology",
  "HND Accountancy",
  "HND Marketing",
  "HND Purchasing and Supply"
];

const ghanaianRegions = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 'Northern',
  'Volta', 'Upper East', 'Upper West', 'Brong Ahafo', 'Western North', 'Ahafo',
  'Bono', 'Bono East', 'Oti', 'North East', 'Savannah'
];

const dvlaBranches = [
  "Accra Central",
  "Achimota",
  "Adentan",
  "Dansoman",
  "East Legon",
  "Head Office - Cantonments",
  "Kaneshie",
  "Narhman",
  "Nungua",
  "Tema",
  "Weija",
  "Bolgatanga",
  "Cape Coast",
  "Goaso",
  "Ho",
  "Koforidua",
  "Kumasi",
  "Obuasi",
  "Sefwi Wiawso",
  "Sunyani",
  "Takoradi",
  "Tamale",
  "Techiman",
  "Wa"
].sort();

export function Step4Complete({
  formData,
  handleInputChange,
  handleContinue,
  setCurrentStep,
  currentStep,
  isSubmitting,
  submitError,
  passportFileName,
  idCardFileName,
  appointmentFileName,
  cvFileName,
  passportFileRef,
  idCardFileRef,
  appointmentFileRef,
  cvFileRef,
  handlePassportSelected,
  handleIdCardSelected,
  handleAppointmentSelected,
  handleCvSelected
}: Step4CompleteProps) {
  const [schoolInput, setSchoolInput] = useState(formData.school || "");
  const [schoolDropdown, setSchoolDropdown] = useState(false);
  const [courseInput, setCourseInput] = useState(formData.course || "");
  const [courseDropdown, setCourseDropdown] = useState(false);
  const [branchInput, setBranchInput] = useState(formData.branch || "");
  const [branchDropdown, setBranchDropdown] = useState(false);

  const filteredSchools = ghanianSchools.filter(school => school.toLowerCase().includes(schoolInput.toLowerCase()));
  const filteredCourses = ghanianCourses.filter(c => c.toLowerCase().includes(courseInput.toLowerCase()));
  const filteredBranches = dvlaBranches.filter(branch => branch.toLowerCase().includes(branchInput.toLowerCase()));

  useEffect(() => {
    function closeDropdowns(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('#school') && !target.closest('.school-dropdown')) {
        setSchoolDropdown(false);
      }
      if (!target.closest('#course') && !target.closest('.course-dropdown')) {
        setCourseDropdown(false);
      }
      if (!target.closest('#branch') && !target.closest('.branch-dropdown')) {
        setBranchDropdown(false);
      }
    }
    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, []);

  return (
    <form onSubmit={handleContinue} className="space-y-7 max-w-2xl mx-auto w-full">
      <div className="flex items-center mb-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setCurrentStep(currentStep - 1)}
          className="text-gray-900 font-medium hover:text-[#16a34a] transition-colors flex items-center gap-2 w-fit px-2 py-1 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete your account</h2>
        <p className="text-lg text-gray-600">Provide your personal information to get started.</p>
      </div>
      <div className="space-y-5">
        {/* NSS PIN */}
        <div>
          <Label htmlFor="nssPin" className="block text-sm font-medium text-gray-900 mb-2">Your National Service PIN</Label>
          <Input 
            id="nssPin" 
            name="nssPin" 
            value={formData.nssPin}
            onChange={(e) => handleInputChange('nssPin', e.target.value)}
            placeholder="Eg. NSS 0345 067 856" 
          />
        </div>
        {/* School Select */}
        <div className="relative school-dropdown">
          <Label htmlFor="school" className="block text-sm font-medium text-gray-900 mb-2">School you attended</Label>
          <Input
            id="school"
            name="school"
            autoComplete="off"
            value={schoolInput || formData.school || ''}
            onFocus={() => {
              setSchoolDropdown(true);
              setSchoolInput("");
            }}
            onChange={e => {
              setSchoolInput(e.target.value);
              setSchoolDropdown(true);
              handleInputChange('school', e.target.value);
            }}
            placeholder="Start typing your school..."
            className=""
          />
          {schoolDropdown && (
            <ul className="absolute left-0 z-50 max-h-60 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto">
              {filteredSchools.length === 0 && (
                <li className="px-4 py-2 text-gray-400">No results</li>
              )}
              {filteredSchools.map((school) => (
                <li
                  key={school}
                  className="px-4 py-2 hover:bg-emerald-100 cursor-pointer text-sm"
                  onClick={() => {
                    handleInputChange('school', school);
                    setSchoolDropdown(false);
                    setSchoolInput(school);
                  }}
                >
                  {school}
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Course */}
        <div className="relative course-dropdown">
          <Label htmlFor="course" className="block text-sm font-medium text-gray-900 mb-2">Your course of study</Label>
          <Input 
            id="course" 
            name="course" 
            autoComplete="off"
            required
            value={courseInput || formData.course || ''}
            onFocus={() => {
              setCourseDropdown(true);
              setCourseInput(formData.course || "");
            }}
            onChange={(e) => {
              setCourseInput(e.target.value);
              setCourseDropdown(true);
              handleInputChange('course', e.target.value);
            }}
            placeholder="Start typing your course (e.g. BSc Computer Science)..." 
          />
          {courseDropdown && (
            <ul className="absolute left-0 z-50 max-h-60 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto">
              {filteredCourses.length === 0 && (
                <li className="px-4 py-2 text-gray-400 text-sm">No exact match found — custom course text accepted</li>
              )}
              {filteredCourses.map((c) => (
                <li
                  key={c}
                  className="px-4 py-2 hover:bg-emerald-100 cursor-pointer text-sm font-medium text-gray-800"
                  onClick={() => {
                    handleInputChange('course', c);
                    setCourseDropdown(false);
                    setCourseInput(c);
                  }}
                >
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Year of Completion */}
        <div>
          <Label htmlFor="yearOfCompletion" className="block text-sm font-medium text-gray-900 mb-2">Year of Completion (University)</Label>
          <Input 
            id="yearOfCompletion" 
            name="yearOfCompletion" 
            type="number"
            required
            min="2000"
            max={new Date().getFullYear() + 1}
            value={formData.yearOfCompletion}
            onChange={(e) => handleInputChange('yearOfCompletion', e.target.value)}
            placeholder="e.g. 2024" 
          />
        </div>

        {/* Service Year */}
        <div>
          <Label htmlFor="serviceYear" className="block text-sm font-medium text-gray-900 mb-2">Service Year</Label>
          <Input 
            id="serviceYear" 
            name="serviceYear" 
            type="number"
            required
            min="2020"
            max={new Date().getFullYear() + 2}
            value={formData.serviceYear || new Date().getFullYear().toString()}
            onChange={(e) => handleInputChange('serviceYear', e.target.value)}
            placeholder={`e.g. ${new Date().getFullYear()}`}
          />
        </div>
        {/* Address */}
        <div>
          <Label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-2">Your Residential Address</Label>
          <Input 
            id="address" 
            name="address" 
            required
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Enter the address of where you will stay during your service" 
          />
        </div>

        {/* Region */}
        <div>
          <Label htmlFor="region" className="block text-sm font-medium text-gray-900 mb-2">Region</Label>
          <Input 
            id="region" 
            name="region" 
            required
            value={formData.region}
            onChange={(e) => handleInputChange('region', e.target.value)}
            placeholder="e.g. Greater Accra, Ashanti, Western" 
          />
        </div>

        {/* District */}
        <div>
          <Label htmlFor="district" className="block text-sm font-medium text-gray-900 mb-2">District</Label>
          <Input 
            id="district" 
            name="district" 
            required
            value={formData.district}
            onChange={(e) => handleInputChange('district', e.target.value)}
            placeholder="e.g. Accra Metro, Kumasi Metro" 
          />
        </div>
        {/* Branch posted to (DVLA branches select) */}
        <div className="relative branch-dropdown">
          <Label htmlFor="branch" className="block text-sm font-medium text-gray-900 mb-2">DVLA branch posted to</Label>
          <Input
            id="branch"
            name="branch"
            autoComplete="off"
            value={branchInput || formData.branch || ''}
            onFocus={() => {
              setBranchDropdown(true);
              setBranchInput("");
            }}
            onChange={e => {
              setBranchInput(e.target.value);
              setBranchDropdown(true);
              handleInputChange('branch', e.target.value);
            }}
            placeholder="Start typing DVLA branch..."
          />
          {branchDropdown && (
            <ul className="absolute left-0 z-50 max-h-60 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto">
              {filteredBranches.length === 0 && (
                <li className="px-4 py-2 text-gray-400">No results</li>
              )}
              {filteredBranches.map((branch) => (
                <li
                  key={branch}
                  className="px-4 py-2 hover:bg-emerald-100 cursor-pointer text-sm"
                  onClick={() => {
                    handleInputChange('branch', branch);
                    setBranchDropdown(false);
                    setBranchInput(branch);
                  }}
                >
                  {branch}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* NSS Assignment Details (New Fields) */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">NSS Assignment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-2">Posting Region</Label>
              <Select
                value={formData.postingRegion}
                onValueChange={(val) => handleInputChange('postingRegion', val)}
              >
                <SelectTrigger className="w-full h-10 border-gray-200 rounded-md">
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {ghanaianRegions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-2">Posting District</Label>
              <Input
                type="text"
                name="postingDistrict"
                value={formData.postingDistrict || ''}
                onChange={e => handleInputChange('postingDistrict', e.target.value)}
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-2">Service Period Start <span className="text-gray-400 font-normal text-xs">(DD/MM/YYYY)</span></Label>
              <Input
                type="date"
                name="servicePeriodStart"
                value={formData.servicePeriodStart || ''}
                onChange={e => handleInputChange('servicePeriodStart', e.target.value)}
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-2">Service Period End <span className="text-gray-400 font-normal text-xs">(DD/MM/YYYY)</span></Label>
              <Input
                type="date"
                name="servicePeriodEnd"
                value={formData.servicePeriodEnd || ''}
                onChange={e => handleInputChange('servicePeriodEnd', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <Label className="block text-sm font-medium text-gray-900 mb-2 mt-2">Additional Information</Label>
          <textarea
            name="additionalInfo"
            value={formData.additionalInfo || ''}
            onChange={e => handleInputChange('additionalInfo', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
            placeholder="Any additional information you'd like to provide..."
          />
        </div>
        {/* Uploads Grid Modernized */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Passport upload */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Label className="block text-sm font-semibold text-gray-900">Passport Picture</Label>
              {passportFileName && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  ✓ Attached
                </span>
              )}
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col md:flex-row items-start md:items-center px-4 py-3 gap-3 md:gap-4 shadow-sm">
              <button type="button" onClick={() => passportFileRef.current?.click()} className="flex items-center px-3 py-2 bg-[#0d5c2e] text-white font-semibold rounded-lg gap-2 shadow hover:bg-[#073e1e] transition text-xs md:text-sm">
                <ImageIcon className="w-4 h-4" />
                {passportFileName ? 'Change Photo' : 'Upload Passport'}
              </button>
              <input ref={passportFileRef} id="passport" name="passport" type="file" accept="image/*" className="hidden" onChange={handlePassportSelected} />
              <div className="md:ml-2 text-xs text-gray-700 truncate mt-1 md:mt-0 max-w-[160px]">
                {passportFileName ? passportFileName : 'No file selected'}
              </div>
            </div>
          </div>

          {/* Ghana Card / ID Card upload */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Label className="block text-sm font-semibold text-gray-900">Ghana Card / ID Card Copy</Label>
              {idCardFileName && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  ✓ Attached
                </span>
              )}
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col md:flex-row items-start md:items-center px-4 py-3 gap-3 md:gap-4 shadow-sm">
              <button type="button" onClick={() => idCardFileRef.current?.click()} className="flex items-center px-3 py-2 bg-[#0d5c2e] text-white font-semibold rounded-lg gap-2 shadow hover:bg-[#073e1e] transition text-xs md:text-sm">
                <ShieldCheck className="w-4 h-4" />
                {idCardFileName ? 'Change ID Card' : 'Upload ID Card'}
              </button>
              <input ref={idCardFileRef} id="id_card" name="id_card" type="file" accept="image/*,application/pdf" className="hidden" onChange={handleIdCardSelected} />
              <div className="md:ml-2 text-xs text-gray-700 truncate mt-1 md:mt-0 max-w-[160px]">
                {idCardFileName ? idCardFileName : 'No file selected'}
              </div>
            </div>
          </div>

          {/* Appointment Letter upload */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Label className="block text-sm font-semibold text-gray-900">NSS Appointment Letter</Label>
              {appointmentFileName && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  ✓ Attached
                </span>
              )}
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col md:flex-row items-start md:items-center px-4 py-3 gap-3 md:gap-4 shadow-sm">
              <button type="button" onClick={() => appointmentFileRef.current?.click()} className="flex items-center px-3 py-2 bg-[#0d5c2e] text-white font-semibold rounded-lg gap-2 shadow hover:bg-[#073e1e] transition text-xs md:text-sm">
                <FileText className="w-4 h-4" />
                {appointmentFileName ? 'Change Letter' : 'Upload Letter'}
              </button>
              <input ref={appointmentFileRef} id="appointment" name="appointment" type="file" accept="application/pdf,image/*" className="hidden" onChange={handleAppointmentSelected} />
              <div className="md:ml-2 text-xs text-gray-700 truncate mt-1 md:mt-0 max-w-[160px]">
                {appointmentFileName ? appointmentFileName : 'No file selected'}
              </div>
            </div>
          </div>

          {/* CV upload */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Label className="block text-sm font-semibold text-gray-900">Curriculum Vitae (CV) / Certificates</Label>
              {cvFileName && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  ✓ Attached
                </span>
              )}
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col md:flex-row items-start md:items-center px-4 py-3 gap-3 md:gap-4 shadow-sm">
              <button type="button" onClick={() => cvFileRef.current?.click()} className="flex items-center px-3 py-2 bg-[#0d5c2e] text-white font-semibold rounded-lg gap-2 shadow hover:bg-[#073e1e] transition text-xs md:text-sm">
                <Upload className="w-4 h-4" />
                {cvFileName ? 'Change CV / File' : 'Upload CV / File'}
              </button>
              <input ref={cvFileRef} id="cv" name="cv" type="file" accept="application/pdf" className="hidden" onChange={handleCvSelected} />
              <div className="md:ml-2 text-xs text-gray-700 truncate mt-1 md:mt-0 max-w-[160px]">
                {cvFileName ? cvFileName : 'No file selected'}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-8">
        <Button type="submit" className="px-10" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
        </Button>
      </div>
      {submitError && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {submitError}
        </div>
      )}
    </form>
  );
}
