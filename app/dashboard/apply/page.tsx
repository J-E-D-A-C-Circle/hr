'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { uploadFile } from '@/lib/file-upload';
import { getValidAuthToken, getStoredUser, clearAuthSession } from '@/lib/auth-client';
import { Upload, ImageIcon, FileText, ShieldCheck } from 'lucide-react';

const ghanianSchools = [
  "University of Ghana (UG, Legon)",
  "Kwame Nkrumah University of Science and Technology (KNUST)",
  "University of Cape Coast (UCC)",
  "University of Education, Winneba (UEW)",
  "University for Development Studies (UDS)",
  "Ghana Institute of Management and Public Administration (GIMPA)",
  "University of Professional Studies, Accra (UPSA)",
  "University of Mines and Technology (UMaT)",
  "Ghana Communication Technology University (GCTU)",
  "University of Energy and Natural Resources (UENR)",
  "University of Health and Allied Sciences (UHAS)",
  "Simon Diedong Dombo University (SDD-UBIDS)",
  "C.K. Tedam University (CKT-UTAS)",
  "Accra Technical University (ATU)",
  "Kumasi Technical University (KsTU)",
  "Cape Coast Technical University (CCTU)",
  "Takoradi Technical University (TTU)",
  "Koforidua Technical University (KTU)",
  "Ho Technical University (HTU)",
  "Sunyani Technical University (STU)",
  "Tamale Technical University (TaTU)",
  "Bolgatanga Technical University (BTU)",
  "Wa Technical University (WaTU)",
  "Ashesi University",
  "Central University",
  "Valley View University",
  "Pentecost University",
  "Presbyterian University, Ghana",
  "Methodist University Ghana",
  "Wisconsin International University College",
  "Lancaster University Ghana",
  "Academic City University College",
  "Regent University College of Science & Tech",
  "Catholic University of Ghana",
  "Zenith University College",
  "KAAF University College",
  "Christian Service University College",
  "Radford University College",
  "BlueCrest College Ghana",
  "Accra College of Education",
  "Wesley College of Education",
  "Korle-Bu Nursing Training College",
  "37 Military Hospital Nursing College"
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

export default function ApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [institutionInput, setInstitutionInput] = useState("");
  const [institutionDropdown, setInstitutionDropdown] = useState(false);
  const [courseInput, setCourseInput] = useState("");
  const [courseDropdown, setCourseDropdown] = useState(false);

  const filteredSchools = ghanianSchools.filter(school => school.toLowerCase().includes(institutionInput.toLowerCase()));
  const filteredCourses = ghanianCourses.filter(c => c.toLowerCase().includes(courseInput.toLowerCase()));
  const [formData, setFormData] = useState({
    nss_number: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    date_of_birth: '',
    gender: '',
    nationality: 'Ghanaian',
    phone_number: '',
    email: '',
    residential_address: '',
    region: '',
    district: '',
    institution_name: '',
    course_program: '',
    year_of_completion: '',
    posting_region: '',
    posting_district: '',
    service_year: new Date().getFullYear().toString(),
    service_period_start: '',
    service_period_end: '',
    passport_photo: '',
    id_card_copy: '',
    appointment_letter: '',
    certificates: '',
    additional_info: '',
  });

  const ghanaianRegions = [
    'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 'Northern',
    'Volta', 'Upper East', 'Upper West', 'Brong Ahafo', 'Western North', 'Ahafo',
    'Bono', 'Bono East', 'Oti', 'North East', 'Savannah'
  ];

  useEffect(() => {
    const token = getValidAuthToken();
    const user = getStoredUser();

    if (!token || !user) {
      clearAuthSession();
      router.push('/login');
      return;
    }

    if (user.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }

    // Fetch existing application if user previously submitted or saved draft
    axios.get('/api/applications/my-application', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (res.data?.application) {
        const app = res.data.application;
        setFormData(prev => ({
          ...prev,
          nss_number: app.nss_number || prev.nss_number,
          first_name: app.first_name || prev.first_name,
          last_name: app.last_name || prev.last_name,
          middle_name: app.middle_name || prev.middle_name,
          date_of_birth: app.date_of_birth ? app.date_of_birth.split('T')[0] : prev.date_of_birth,
          gender: app.gender || prev.gender,
          nationality: app.nationality || prev.nationality,
          phone_number: app.phone_number || prev.phone_number,
          email: app.email || prev.email,
          residential_address: app.residential_address || prev.residential_address,
          region: app.region || prev.region,
          district: app.district || prev.district,
          institution_name: app.institution_name || prev.institution_name,
          course_program: app.course_program || prev.course_program,
          year_of_completion: app.year_of_completion ? String(app.year_of_completion) : prev.year_of_completion,
          posting_region: app.posting_region || prev.posting_region,
          posting_district: app.posting_district || prev.posting_district,
          service_year: app.service_year ? String(app.service_year) : prev.service_year,
          service_period_start: app.service_period_start ? app.service_period_start.split('T')[0] : prev.service_period_start,
          service_period_end: app.service_period_end ? app.service_period_end.split('T')[0] : prev.service_period_end,
          passport_photo: app.passport_photo || prev.passport_photo,
          id_card_copy: app.id_card_copy || prev.id_card_copy,
          appointment_letter: app.appointment_letter || prev.appointment_letter,
          certificates: app.certificates || prev.certificates,
          additional_info: app.additional_info || prev.additional_info,
        }));
      }
    }).catch(err => {
      console.error('Failed to fetch existing application:', err);
    });
  }, [router]);

  useEffect(() => {
    function closeDropdowns(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('#institution_name') && !target.closest('.institution-dropdown')) {
        setInstitutionDropdown(false);
      }
      if (!target.closest('#course_program') && !target.closest('.course-dropdown')) {
        setCourseDropdown(false);
      }
    }
    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [appointmentFile, setAppointmentFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token') || '';
      
      let passportPath = formData.passport_photo || null;
      let idCardPath = formData.id_card_copy || null;
      let appointmentPath = formData.appointment_letter || null;
      let cvPath = formData.certificates || null;

      if (passportFile) {
        const res = await uploadFile(passportFile, 'passport', token);
        passportPath = res.file_path;
      }
      if (idCardFile) {
        const res = await uploadFile(idCardFile, 'id_card', token);
        idCardPath = res.file_path;
      }
      if (appointmentFile) {
        const res = await uploadFile(appointmentFile, 'appointment', token);
        appointmentPath = res.file_path;
      }
      if (cvFile) {
        const res = await uploadFile(cvFile, 'cv', token);
        cvPath = res.file_path;
      }

      const payload = {
        ...formData,
        passport_photo: passportPath,
        id_card_copy: idCardPath,
        appointment_letter: appointmentPath,
        certificates: cvPath,
      };

      const response = await axios.post(
        '/api/applications/submit',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-4">Your application has been successfully submitted for review.</p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#0d5c2e] shadow-md border-b border-emerald-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 p-1 bg-white/95 rounded-full shadow-sm flex items-center justify-center">
                <img src="/oop.png" alt="DVLA Logo" className="w-full h-full object-contain" />
              </div>
              <Link href="/dashboard" className="text-xl font-bold text-white tracking-wide">
                DVLA NSS Portal
              </Link>
            </div>
            <div className="flex items-center">
              <Link href="/dashboard" className="px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit Your Application</h2>
            <p className="text-gray-600 mb-6">Please fill in all required details for your National Service application.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NSS Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="nss_number"
                      value={formData.nss_number}
                      onChange={handleChange}
                      placeholder="Enter NSS number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="first_name"
                      required
                      value={formData.first_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                    <Input
                      type="text"
                      name="middle_name"
                      value={formData.middle_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="last_name"
                      required
                      value={formData.last_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth <span className="text-gray-400 font-normal text-xs">(DD/MM/YYYY)</span> <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      name="date_of_birth"
                      required
                      value={formData.date_of_birth}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.gender}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}
                    >
                      <SelectTrigger className="w-full h-12 border-gray-200 rounded-xl">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nationality <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="nationality"
                      required
                      value={formData.nationality}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      name="phone_number"
                      required
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="0500000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Residential Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="residential_address"
                      required
                      value={formData.residential_address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Region <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.region}
                        onValueChange={(val) => setFormData(prev => ({ ...prev, region: val }))}
                      >
                        <SelectTrigger className="w-full h-12 border-gray-200 rounded-xl">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        District <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        name="district"
                        required
                        value={formData.district}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Educational Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Educational Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Institution Name Suggestive Autocomplete */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Institution Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="institution_name"
                      name="institution_name"
                      autoComplete="off"
                      required
                      value={formData.institution_name}
                      onFocus={() => {
                        setInstitutionDropdown(true);
                        setInstitutionInput(formData.institution_name || "");
                      }}
                      onChange={(e) => {
                        setInstitutionInput(e.target.value);
                        setInstitutionDropdown(true);
                        handleChange(e);
                      }}
                      placeholder="Type to filter university..."
                    />
                    {institutionDropdown && (
                      <ul className="institution-dropdown absolute left-0 z-50 max-h-60 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-y-auto">
                        {filteredSchools.length === 0 && (
                          <li className="px-4 py-2 text-gray-400 text-sm">No exact match found — custom entry accepted</li>
                        )}
                        {filteredSchools.map((school) => (
                          <li
                            key={school}
                            className="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer text-sm font-medium text-gray-800 transition-colors"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, institution_name: school }));
                              setInstitutionDropdown(false);
                              setInstitutionInput(school);
                            }}
                          >
                            {school}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Course / Program Suggestive Autocomplete */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course/Program <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="course_program"
                      name="course_program"
                      autoComplete="off"
                      required
                      value={formData.course_program}
                      onFocus={() => {
                        setCourseDropdown(true);
                        setCourseInput(formData.course_program || "");
                      }}
                      onChange={(e) => {
                        setCourseInput(e.target.value);
                        setCourseDropdown(true);
                        handleChange(e);
                      }}
                      placeholder="Type to filter course (e.g. BSc Computer Science)..."
                    />
                    {courseDropdown && (
                      <ul className="course-dropdown absolute left-0 z-50 max-h-60 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-y-auto">
                        {filteredCourses.length === 0 && (
                          <li className="px-4 py-2 text-gray-400 text-sm">No exact match found — custom entry accepted</li>
                        )}
                        {filteredCourses.map((c) => (
                          <li
                            key={c}
                            className="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer text-sm font-medium text-gray-800 transition-colors"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, course_program: c }));
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year of Completion <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      name="year_of_completion"
                      required
                      value={formData.year_of_completion}
                      onChange={handleChange}
                      min="2000"
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>
              </div>

              {/* NSS Assignment Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">NSS Assignment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Year <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      name="service_year"
                      required
                      value={formData.service_year}
                      onChange={handleChange}
                      min="2020"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Posting Region</label>
                    <Select
                      value={formData.posting_region}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, posting_region: val }))}
                    >
                      <SelectTrigger className="w-full h-12 border-gray-200 rounded-xl">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Posting District</label>
                    <Input
                      type="text"
                      name="posting_district"
                      value={formData.posting_district}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Period Start <span className="text-gray-400 font-normal text-xs">(DD/MM/YYYY)</span></label>
                    <Input
                      type="date"
                      name="service_period_start"
                      value={formData.service_period_start}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Period End <span className="text-gray-400 font-normal text-xs">(DD/MM/YYYY)</span></label>
                    <Input
                      type="date"
                      name="service_period_end"
                      value={formData.service_period_end}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Required Document Uploads */}
              <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Required Document Attachments</h3>
                  <p className="text-xs text-gray-600 mt-1">Upload your documents directly as part of your application. Uploaded documents are saved safely and do not need to be uploaded twice.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Passport Picture Upload */}
                  <div className="p-4 bg-white border border-emerald-200 rounded-xl space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-bold text-gray-900">Passport Picture</label>
                      {(passportFile || formData.passport_photo) && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          ✓ Uploaded
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#0d5c2e] hover:bg-[#073e1e] text-white font-medium rounded-lg text-xs transition-colors shadow-sm">
                        <ImageIcon className="w-4 h-4" />
                        {passportFile || formData.passport_photo ? 'Replace Passport Photo' : 'Choose Passport Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      <span className="text-xs text-gray-600 truncate max-w-[160px]">
                        {passportFile ? passportFile.name : (formData.passport_photo ? '✓ Previously Uploaded' : 'No file chosen')}
                      </span>
                    </div>
                  </div>

                  {/* Ghana Card / ID Card Upload */}
                  <div className="p-4 bg-white border border-emerald-200 rounded-xl space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-bold text-gray-900">Ghana Card / ID Card Copy</label>
                      {(idCardFile || formData.id_card_copy) && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          ✓ Uploaded
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#0d5c2e] hover:bg-[#073e1e] text-white font-medium rounded-lg text-xs transition-colors shadow-sm">
                        <ShieldCheck className="w-4 h-4" />
                        {idCardFile || formData.id_card_copy ? 'Replace ID Card' : 'Choose ID Card'}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => setIdCardFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      <span className="text-xs text-gray-600 truncate max-w-[160px]">
                        {idCardFile ? idCardFile.name : (formData.id_card_copy ? '✓ Previously Uploaded' : 'No file chosen')}
                      </span>
                    </div>
                  </div>

                  {/* Appointment Letter Upload */}
                  <div className="p-4 bg-white border border-emerald-200 rounded-xl space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-bold text-gray-900">NSS Appointment Letter</label>
                      {(appointmentFile || formData.appointment_letter) && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          ✓ Uploaded
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#0d5c2e] hover:bg-[#073e1e] text-white font-medium rounded-lg text-xs transition-colors shadow-sm">
                        <FileText className="w-4 h-4" />
                        {appointmentFile || formData.appointment_letter ? 'Replace Letter' : 'Choose Letter'}
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          className="hidden"
                          onChange={(e) => setAppointmentFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      <span className="text-xs text-gray-600 truncate max-w-[160px]">
                        {appointmentFile ? appointmentFile.name : (formData.appointment_letter ? '✓ Previously Uploaded' : 'No file chosen')}
                      </span>
                    </div>
                  </div>

                  {/* Curriculum Vitae / Certificates Upload */}
                  <div className="p-4 bg-white border border-emerald-200 rounded-xl space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-bold text-gray-900">Curriculum Vitae (CV) / Certificates</label>
                      {(cvFile || formData.certificates) && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          ✓ Uploaded
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#0d5c2e] hover:bg-[#073e1e] text-white font-medium rounded-lg text-xs transition-colors shadow-sm">
                        <Upload className="w-4 h-4" />
                        {cvFile || formData.certificates ? 'Replace CV / File' : 'Choose CV / File'}
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      <span className="text-xs text-gray-600 truncate max-w-[160px]">
                        {cvFile ? cvFile.name : (formData.certificates ? '✓ Previously Uploaded' : 'No file chosen')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information</label>
                <textarea
                  name="additional_info"
                  value={formData.additional_info}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
                  placeholder="Any additional information you'd like to provide..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#0d5c2e] text-white py-3 rounded-lg font-semibold hover:bg-[#073e1e] active:bg-[#052b14] transition-all shadow-md hover:shadow-lg disabled:bg-[#0d5c2e]/60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
                <Link
                  href="/dashboard"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

