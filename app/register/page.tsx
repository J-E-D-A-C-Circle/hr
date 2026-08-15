'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Check, Upload, FileText, Image as ImageIcon, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { uploadFile } from '@/lib/file-upload';
import toast from 'react-hot-toast';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  phoneNumber: string;
  ghanaCard: string;
  school: string;
  branch: string;
  dateOfBirth: string;
  nationality: string;
  region: string;
  district: string;
  address: string;
  course: string;
  yearOfCompletion: string;
  serviceYear: string;
  nssPin: string;
}

function formatGhanaCard(input: string): string {
  if (!input) return '';
  const rawDigits = input.replace(/\D/g, '').slice(0, 10);
  
  if (rawDigits.length === 0) {
    return input.trim().toUpperCase().startsWith('G') ? 'GHA-' : '';
  }

  const part1 = rawDigits.slice(0, 9);
  const part2 = rawDigits.slice(9, 10);

  if (rawDigits.length > 9) {
    return `GHA-${part1}-${part2}`;
  }
  
  return `GHA-${part1}`;
}

export default function RegisterPage() {
  const router = useRouter();

  // Hydrated flag - only render after client hydration
  const [hydrated, setHydrated] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [existingAccountNotice, setExistingAccountNotice] = useState<{ email: string; isDraft: boolean } | null>(null);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    phoneNumber: '',
    ghanaCard: '',
    school: '',
    branch: '',
    dateOfBirth: '',
    nationality: 'Ghanaian',
    region: '',
    district: '',
    address: '',
    course: '',
    yearOfCompletion: '',
    serviceYear: String(new Date().getFullYear()),
    nssPin: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.role === 'admin') {
            router.replace('/admin/dashboard');
            return;
          } else {
            router.replace('/dashboard');
            return;
          }
        } catch (e) {
          // Invalid user data, continue to registration
        }
      }
    }
  }, [router]);

  // Only run on client: load from localStorage if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStep = localStorage.getItem('registerCurrentStep');
      setCurrentStep(savedStep ? parseInt(savedStep, 10) : 1);
      const savedFormData = localStorage.getItem('registerFormData');
      setFormData(savedFormData ? JSON.parse(savedFormData) : {
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        middleName: '',
        lastName: '',
        gender: '',
        phoneNumber: '',
        ghanaCard: '',
        school: '',
        branch: '', // Load branch
      });
      setHydrated(true);
    }
  }, []);

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('registerCurrentStep', currentStep.toString());
    }
  }, [currentStep]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('registerFormData', JSON.stringify(formData));
    }
  }, [formData]);

  const steps = [
    { id: 1, title: 'Create Account' },
    { id: 2, title: 'Profile Information' },
    { id: 3, title: 'Verify Email' },
    { id: 4, title: 'Complete Application' },
  ];

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const getPasswordStrength = (password: string): string => {
    if (!password) return '';
    if (password.length < 8) return 'Weak';
    if (!/[!@#$%^&*_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) && !/[0-9]/.test(password)) {
      return 'Weak';
    }
    if (password.length >= 8 && /[!@#$%^&*_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) && /[0-9]/.test(password)) {
      return 'Strong';
    }
    return 'Medium';
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleInputChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData({ ...formData, [field]: value });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Update handleContinue to support advancing from OTP step (step 3) to step 4
  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    if (currentStep === 1) {
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error('Please enter a valid email address');
        return;
      }
      if (!formData.password) {
        toast.error('Password is required');
        return;
      }
      if (formData.password.length < 8) {
        toast.error('Password must be at least 8 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      // Advance to Step 2
      setCurrentStep(2);
      return;
    }
    
    if (currentStep === 2) {
      // Validate required fields
      if (!formData.firstName || !formData.lastName) {
        toast.error('First name and last name are required');
        return;
      }
      
      if (!formData.gender) {
        toast.error('Please select your gender');
        return;
      }

      if (!formData.phoneNumber || formData.phoneNumber.replace(/\D/g, '').length < 9) {
        toast.error('Please enter a valid phone number');
        return;
      }

      if (!formData.ghanaCard) {
        toast.error('Ghana Card number is required');
        return;
      }

      if (!/^GHA-\d{9}-\d$/.test(formData.ghanaCard)) {
        toast.error('Please enter a full Ghana Card number (e.g. GHA-123456789-0)');
        return;
      }
      
      // Check if user is already registered (has token)
      const existingToken = localStorage.getItem('token');
      
      if (existingToken) {
        // Already registered, proceed to next step
        console.log('User already registered, proceeding to next step');
        setCurrentStep(3);
        return;
      }
      
      // Register user account after collecting personal info
      setIsSubmitting(true);
      try {
        const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim();
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            full_name: fullName,
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          if (response.status === 409 && data.exists) {
            setExistingAccountNotice({
              email: formData.email,
              isDraft: data.isDraft ?? true,
            });
            toast.error(data.error || 'An account with this email address already exists.');
          } else {
            setSubmitError(data.error || 'Registration failed. Please try again.');
            toast.error(data.error || 'Registration failed. Please try again.');
          }
          return;
        }
        
        // Save token for later use
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        console.log('Account created successfully!', data.user);
        toast.success(`Verification code sent to ${formData.email || 'your email'}`);
        setCurrentStep(3);
      } catch (error: any) {
        setSubmitError(error.message || 'Registration failed. Please try again.');
        toast.error(error.message || 'Registration failed. Please try again.');
        return;
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    
    if (currentStep === 3) {
      if (otp.join('').length !== 6) {
        toast.error('Please enter the 6-digit verification code sent to your email');
        return;
      }
      toast.success('Email address verified successfully!');
      setCurrentStep(4);
      return;
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      return;
    }
    
    // Step 4: Final submission - submit application
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please start over.');
      }
      
      // Upload files first
      let passportPhotoPath = null;
      let idCardPath = null;
      let appointmentLetterPath = null;
      let cvPath = null;
      
      const passportFile = passportFileRef.current?.files?.[0] || passportCameraRef.current?.files?.[0];
      const idCardFile = idCardFileRef.current?.files?.[0];
      const appointmentFile = appointmentFileRef.current?.files?.[0] || appointmentCameraRef.current?.files?.[0];
      const cvFile = cvFileRef.current?.files?.[0];
      
      if (passportFile) {
        try {
          const uploadResult = await uploadFile(passportFile, 'passport', token);
          passportPhotoPath = uploadResult.file_path;
        } catch (uploadError: any) {
          console.error('Passport upload error:', uploadError);
          throw new Error(`Passport photo upload failed: ${uploadError.message || 'Unknown error'}`);
        }
      }

      if (idCardFile) {
        try {
          const uploadResult = await uploadFile(idCardFile, 'id_card', token);
          idCardPath = uploadResult.file_path;
        } catch (uploadError: any) {
          console.error('ID Card upload error:', uploadError);
          throw new Error(`ID Card upload failed: ${uploadError.message || 'Unknown error'}`);
        }
      }
      
      if (appointmentFile) {
        try {
          const uploadResult = await uploadFile(appointmentFile, 'appointment', token);
          appointmentLetterPath = uploadResult.file_path;
        } catch (uploadError: any) {
          console.error('Appointment letter upload error:', uploadError);
          throw new Error(`Appointment letter upload failed: ${uploadError.message || 'Unknown error'}`);
        }
      }
      
      if (cvFile) {
        try {
          const uploadResult = await uploadFile(cvFile, 'cv', token);
          cvPath = uploadResult.file_path;
        } catch (uploadError: any) {
          console.error('CV upload error:', uploadError);
          throw new Error(`CV upload failed: ${uploadError.message || 'Unknown error'}`);
        }
      }
      
      // Get user ID from stored user data
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user || !user.id) {
        throw new Error('User information not found. Please start over.');
      }
      
      // Validate critical fields
      if (!formData.course || formData.course.trim() === '') {
        toast.error('Course of study is required');
        return;
      }
      
      if (!formData.district || formData.district.trim() === '') {
        toast.error('District is required');
        return;
      }
      
      // Prepare application data
      const applicationData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        middle_name: formData.middleName || null,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        nationality: formData.nationality || 'Ghanaian',
        phone_number: formData.phoneNumber,
        email: formData.email,
        residential_address: formData.address,
        region: formData.region,
        district: formData.district.trim(),
        institution_name: formData.school,
        course_program: formData.course.trim(), // Ensure no leading/trailing spaces
        year_of_completion: formData.yearOfCompletion,
        service_year: formData.serviceYear || new Date().getFullYear().toString(),
        nss_number: formData.nssPin || null,
        posting_region: formData.region || null,
        posting_district: formData.district.trim() || null, // Ensure it's not empty string
        passport_photo: passportPhotoPath,
        id_card_copy: idCardPath,
        appointment_letter: appointmentLetterPath,
        certificates: cvPath,
      };
      
      // Log data before submission for debugging
      console.log('Submitting application data:', applicationData);
      console.log('Course program:', applicationData.course_program);
      console.log('Posting district:', applicationData.posting_district);
      
      // Submit application
      const response = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(applicationData),
      });
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        console.error('Response status:', response.status);
        console.error('Response headers:', [...response.headers.entries()]);
        throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`);
      }
      
      try {
        data = await response.json();
      } catch (jsonError) {
        const text = await response.text();
        console.error('JSON parse error. Response text:', text);
        throw new Error('Server returned invalid JSON. Check console for details.');
      }
      
      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.error || data.message || `Application submission failed (${response.status})`);
      }
      
      console.log('Application submitted successfully:', data);
      
      // Success - clear saved data and redirect to dashboard
      if (typeof window !== 'undefined') {
        localStorage.removeItem('registerCurrentStep');
        localStorage.removeItem('registerFormData');
      }
      // Redirect directly to dashboard (replace to prevent back navigation)
      router.replace('/dashboard');
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to submit application. Please try again.');
      toast.error(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };



  // File inputs state and refs for Step 4
  const [passportFileName, setPassportFileName] = useState<string>('');
  const [idCardFileName, setIdCardFileName] = useState<string>('');
  const [appointmentFileName, setAppointmentFileName] = useState<string>('');
  const [cvFileName, setCvFileName] = useState<string>('');
  const passportFileRef = useRef<HTMLInputElement | null>(null);
  const passportCameraRef = useRef<HTMLInputElement | null>(null);
  const idCardFileRef = useRef<HTMLInputElement | null>(null);
  const appointmentFileRef = useRef<HTMLInputElement | null>(null);
  const appointmentCameraRef = useRef<HTMLInputElement | null>(null);
  const cvFileRef = useRef<HTMLInputElement | null>(null);

  const handlePassportSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPassportFileName(file ? file.name : '');
  };

  const handleIdCardSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setIdCardFileName(file ? file.name : '');
  };

  const handleAppointmentSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAppointmentFileName(file ? file.name : '');
  };

  const handleCvSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCvFileName(file ? file.name : '');
  };

  // Ghana universities and colleges (partial, add as needed)
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
    // ... more ...
  ];

  // The schoolQuery and showSchoolDropdown state and useEffect are no longer needed
  // as the school is now a Select component with a pre-defined list.

  // The useEffect for hide is also no longer needed as the school Select handles its own dropdown.

  // 1. Provide hardcoded arrays for schools and branches (outside component)
  const dvlaBranches = [
    // Greater Accra – multiple stations
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
    // Other regions and major towns
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

  // Ghana Universities & Tertiary Courses
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

  // In component state, add Autocomplete state
  const [schoolInput, setSchoolInput] = useState("");
  const [schoolDropdown, setSchoolDropdown] = useState(false);
  const [courseInput, setCourseInput] = useState("");
  const [courseDropdown, setCourseDropdown] = useState(false);
  const [branchInput, setBranchInput] = useState("");
  const [branchDropdown, setBranchDropdown] = useState(false);
  const [nationalityInput, setNationalityInput] = useState("");
  const [nationalityDropdown, setNationalityDropdown] = useState(false);
  const filteredSchools = ghanianSchools.filter(school => school.toLowerCase().includes(schoolInput.toLowerCase()));
  const filteredCourses = ghanianCourses.filter(c => c.toLowerCase().includes(courseInput.toLowerCase()));
  
  // Nationalities list
  const nationalities = [
    "Ghanaian", "Nigerian", "Kenyan", "South African", "Egyptian", "Ethiopian", "Tanzanian",
    "Ugandan", "Algerian", "Sudanese", "Moroccan", "Angolan", "Mozambican", "Madagascan",
    "Cameroonian", "Ivory Coast", "Malagasy", "Burkina Faso", "Malawi", "Zambian", "Senegalese",
    "Zimbabwean", "Guinean", "Rwandan", "Beninese", "Burundian", "Tunisian", "South Sudanese",
    "Somalian", "Togolese", "Sierra Leonean", "Libyan", "Liberian", "Central African",
    "Mauritanian", "Eritrean", "Gambian", "Botswanan", "Namibian", "Gabonese", "Lesotho",
    "Guinea-Bissau", "Equatorial Guinean", "Mauritian", "Eswatini", "Djiboutian", "Comorian",
    "Cabo Verdean", "Sao Tomean", "Seychellois", "British", "American", "Canadian", "Australian",
    "Indian", "Chinese", "Japanese", "Korean", "Pakistani", "Bangladeshi", "Filipino",
    "Vietnamese", "Thai", "Indonesian", "Malaysian", "Singaporean", "Sri Lankan", "Nepalese",
    "Afghan", "Iranian", "Iraqi", "Saudi Arabian", "Emirati", "Kuwaiti", "Qatari", "Omani",
    "Bahraini", "Yemeni", "Jordanian", "Lebanese", "Syrian", "Israeli", "Palestinian", "Turkish",
    "Greek", "Italian", "Spanish", "French", "German", "Dutch", "Belgian", "Swiss", "Austrian",
    "Portuguese", "Polish", "Russian", "Ukrainian", "Romanian", "Hungarian", "Czech", "Swedish",
    "Norwegian", "Danish", "Finnish", "Irish", "Scottish", "Welsh", "Brazilian", "Argentine",
    "Mexican", "Colombian", "Peruvian", "Venezuelan", "Chilean", "Ecuadorian", "Guatemalan",
    "Cuban", "Haitian", "Dominican", "Jamaican", "Trinidadian", "Barbadian", "Bahamian", "Other"
  ].sort();
  
  const filteredNationalities = nationalities.filter(nat => nat.toLowerCase().includes(nationalityInput.toLowerCase()));
  const filteredBranches = dvlaBranches.filter(branch => branch.toLowerCase().includes(branchInput.toLowerCase()));

  useEffect(() => {
    function closeDropdowns(e: MouseEvent) {
      // Close all dropdowns when clicking outside
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
      if (!target.closest('#nationality') && !target.closest('.nationality-dropdown')) {
        setNationalityDropdown(false);
      }
    }
    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, []);

  if (!hydrated) return null;

  return (
    <div className="min-h-screen">
      {/* HEADER FOR MOBILE (below md) */}
      <div className="block md:hidden w-full bg-gradient-to-r from-[#0d5c2e] to-[#073e1e] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 p-1 bg-white/95 rounded-full shadow">
            <Image src="/oop.png" alt="DVLA Logo" width={36} height={36} className="w-full h-full object-contain" priority />
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">DVLA NSS Portal</h1>
        </div>
      </div>

      {/* LOGIN LINK MOBILE */}
      <div className="block md:hidden w-full bg-[#073e1e] px-4 py-2">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="text-white w-full flex items-center justify-between font-normal hover:opacity-90 text-sm"
        >
          <span>Already have an account? Login</span>
          <span>→</span>
        </button>
      </div>

      {/* SIDEBAR FOR DESKTOP only */}
      <div 
        className="hidden md:flex md:fixed md:left-0 md:top-0 md:w-[480px] md:h-screen bg-[#0d5c2e] flex-col p-8 relative bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1920&q=80)',
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d5c2e]/95 via-[#0d5c2e]/90 to-[#073e1e]/95"></div>
        <div className="relative z-10 flex flex-col h-full justify-between overflow-hidden">
          <div className="flex flex-col">
            {/* Logos */}
            <div className="mb-8">
              <div className="flex items-center justify-center">
                <div className="w-28 h-28 p-2.5 bg-white/95 rounded-2xl shadow-xl ring-2 ring-white/40 flex items-center justify-center">
                  <Image
                    src="/oop.png"
                    alt="DVLA Logo"
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Welcome Message + Progressive Stepper */}
            <div className="text-white mb-8">
              <h1 className="text-4xl font-bold mb-4">Welcome to DVLA - NSS Portal.</h1>
              <p className="text-xl font-normal mb-8">Get your account setup in just a few steps.</p>
              {/* Progressive Stepper with extra margin */}
              <div className="flex flex-col mt-6">
                {steps.map((step, idx) => {
                  const isCompleted = step.id < currentStep;
                  const isCurrent = step.id === currentStep;
                  const isUpcoming = step.id > currentStep;
                  return (
                    <div key={step.id} className={`flex items-start mb-6 ${isCurrent ? 'text-white' : 'text-white/80'}`}>
                      <div className="flex flex-col items-center mr-4">
                        <div
                          className={
                            `flex items-center justify-center w-7 h-7 rounded-full border ${
                              isCompleted ? 'bg-white text-[#16a34a] border-white' : ''
                            } ${
                              isCurrent ? 'border-white text-white' : ''
                            } ${
                              isUpcoming ? 'bg-white/30 text-white/80 border-white/50' : ''
                            }`
                          }
                        >
                          {isCompleted ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-semibold">
                              {step.id}
                            </span>
                          )}
                        </div>
                        {idx < steps.length - 1 && (
                          <div
                            className={`w-px h-6 mt-1 ${
                              step.id < currentStep ? 'bg-white' : 'bg-white/40'
                  }`}
                />
                        )}
                      </div>
                      <div className="pt-0.5">
                        <span className={`text-lg ${isCurrent ? 'font-bold' : 'font-medium'}`}>
                  {step.title}
                </span>
              </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Footer Link (always at bottom) */}
          <div className="mt-auto flex flex-col items-center">
            <Button
              type="button"
              onClick={() => router.push('/login')}
              className="mt-4 w-full py-3 px-6 bg-[#16a34a] text-white text-base font-bold rounded-full hover:bg-[#15803d] hover:translate-y-[-2px] transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Already have an account? Login <span className='text-xl ml-1'>→</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="md:ml-[480px] ml-0 min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-6 md:p-12 flex flex-col">
        {/* Progress Indicator & Auto-Save Badge - Top Right */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-3.5 py-2 rounded-full border border-emerald-300 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0d5c2e] animate-ping" />
            <span>✓ Auto-Saved {lastSavedTime ? `at ${lastSavedTime}` : ''}</span>
          </div>
          <div className="text-right w-full md:w-auto">
            <span className="text-gray-600 font-medium block mb-2">Step {currentStep} of 4</span>
            <div className="flex gap-3 w-56 md:w-80 mx-auto md:mx-0">
              {steps.map((step) => (
                <div 
                  key={step.id}
                  className={`flex-1 h-2.5 md:h-3 rounded-full transition-colors ${
                    step.id <= currentStep
                      ? 'bg-[#0d5c2e]'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex flex-col justify-center max-w-4xl w-full mx-auto">
          <div className="w-full rounded-3xl bg-white/80 backdrop-blur-md shadow-lg ring-1 ring-black/5 p-6 md:p-12">
          {currentStep === 1 && (
            <form onSubmit={handleContinue} className="space-y-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Create an account.</h2>
                <p className="text-base md:text-lg text-gray-600">Provide your account information to continue.</p>
              </div>

              {existingAccountNotice && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0d5c2e]/15 flex items-center justify-center text-[#0d5c2e] shrink-0 font-bold text-lg">
                      💡
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Account Already Exists</h4>
                      <p className="text-xs text-slate-700">
                        An account for <span className="font-semibold text-slate-900">{existingAccountNotice.email}</span> already exists. Log in to resume your application!
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => router.push(`/login?email=${encodeURIComponent(existingAccountNotice.email)}`)}
                    className="bg-[#0d5c2e] hover:bg-[#073e1e] text-white text-xs font-bold px-4 py-2.5 rounded-lg shrink-0 transition-all shadow-md"
                  >
                    Sign In & Resume Draft →
                  </Button>
                </div>
              )}

              {/* Email Input */}
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Your Email
                </Label>
                <Input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              {/* Password Input */}
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                  Your Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    required
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Create a password."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0d5c2e] transition-colors focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="text-sm text-gray-600 space-y-1">
                {formData.password && passwordStrength && (
                  <div className="mb-2">
                    <span className="font-normal">{passwordStrength}</span>
                  </div>
                )}
                <ul className="list-disc list-inside space-y-1 ml-2 font-normal">
                  <li>Use at least 8 characters</li>
                  <li>Besides letters, include at least a number or symbol (!@#$%^&*-_+=).</li>
                  <li>Password is case sensitive.</li>
                </ul>
              </div>

              {/* Confirm Password Input */}
              <div>
                <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-2">
                  Confirm Your Password
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your password."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0d5c2e] transition-colors focus:outline-none"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Continue Button */}
              <div className="flex justify-end mt-8">
                <Button type="submit">Continue</Button>
              </div>
            </form>
          )}

          {/* Step 2: Profile Information */}
          {currentStep === 2 && (
            <form onSubmit={handleContinue} className="space-y-6">
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
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Create an account.</h2>
                <p className="text-base md:text-lg text-gray-600">Provide your personal information to get started.</p>
              </div>

              {/* Two Column Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* First Name */}
                  <div>
                    <Label htmlFor="firstName" className="block text-sm font-medium text-gray-900 mb-2">
                      Your First Name
                    </Label>
                    <Input
                      type="text"
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Enter Your First Name"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <Label htmlFor="lastName" className="block text-sm font-medium text-gray-900 mb-2">
                      Your Last Name
                    </Label>
                    <Input
                      type="text"
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Enter Your Last Name"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <Label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-900 mb-2">
                      Your Phone Number
                    </Label>
                    <div className="relative w-full">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 z-10 pointer-events-none">
                        <span className="text-sm font-semibold text-gray-700">GH</span>
                        <span className="text-gray-400">|</span>
                      </div>
                      <Input
                        type="tel"
                        id="phoneNumber"
                        required
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className="pl-12 w-full"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <Label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-900 mb-2">
                      Date of Birth <span className="text-gray-400 font-normal text-xs">(DD/MM/YYYY)</span>
                    </Label>
                    <Input
                      type="date"
                      id="dateOfBirth"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Middle Name */}
                  <div>
                    <Label htmlFor="middleName" className="block text-sm font-medium text-gray-900 mb-2">
                      Your Middle Name
                    </Label>
                    <Input
                      type="text"
                      id="middleName"
                      value={formData.middleName}
                      onChange={(e) => handleInputChange('middleName', e.target.value)}
                      placeholder="Enter Other Names"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <Label htmlFor="gender" className="block text-sm font-medium text-gray-900 mb-2">
                      Select Your Gender
                    </Label>
                    <div className="relative">
                      <Select
                        value={formData.gender || undefined}
                        onValueChange={(value) => {
                          if (value === "__clear__") {
                            handleInputChange('gender', "");
                            // Force close the select
                            const trigger = document.getElementById('gender');
                            if (trigger) {
                              trigger.click();
                            }
                          } else {
                            handleInputChange('gender', value);
                          }
                        }}
                      >
                        <SelectTrigger id="gender" className="w-full h-14 text-base">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent position="popper" sideOffset={4}>
                          {formData.gender && (
                            <>
                              <SelectItem value="__clear__" className="text-sm cursor-pointer text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-b border-gray-200">
                                Clear selection
                              </SelectItem>
                            </>
                          )}
                          <SelectItem value="Male" className="text-base cursor-pointer">Male</SelectItem>
                          <SelectItem value="Female" className="text-base cursor-pointer">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      {formData.gender && (
                        <button
                          type="button"
                          onClick={() => handleInputChange('gender', "")}
                          className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label="Clear gender selection"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Ghana Card */}
                  <div>
                    <Label htmlFor="ghanaCard" className="block text-sm font-medium text-gray-900 mb-2">
                      Ghana Card Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative flex items-center">
                      <Input
                        type="text"
                        id="ghanaCard"
                        value={formData.ghanaCard}
                        onFocus={(e) => {
                          if (!e.target.value) {
                            handleInputChange('ghanaCard', 'GHA-');
                          }
                        }}
                        onChange={(e) => {
                          const formatted = formatGhanaCard(e.target.value);
                          handleInputChange('ghanaCard', formatted);
                        }}
                        placeholder="GHA-123456789-0"
                        maxLength={15}
                        className="w-full font-mono text-sm tracking-wider font-medium"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                      <span>Format:</span>
                      <span className="font-mono font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">GHA-XXXXXXXXX-X</span>
                      <span className="text-emerald-700 font-medium">(Auto-formats as you type)</span>
                    </p>
                  </div>

                  {/* Nationality */}
                  <div className="relative">
                    <Label htmlFor="nationality" className="block text-sm font-medium text-gray-900 mb-2">
                      Nationality
                    </Label>
                    <Input
                      id="nationality"
                      name="nationality"
                      autoComplete="off"
                      required
                      value={nationalityInput || formData.nationality || ''}
                      onFocus={() => {
                        setNationalityDropdown(true);
                        setNationalityInput(formData.nationality || '');
                      }}
                      onChange={e => {
                        setNationalityInput(e.target.value);
                        setNationalityDropdown(true);
                        handleInputChange('nationality', e.target.value);
                      }}
                      placeholder="Start typing nationality..."
                      className="w-full"
                    />
                    {nationalityDropdown && (
                      <ul className="absolute left-0 z-50 max-h-60 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto">
                        {filteredNationalities.length === 0 && (
                          <li className="px-4 py-2 text-gray-400">No results</li>
                        )}
                        {filteredNationalities.map((nationality) => (
                          <li
                            key={nationality}
                            className="px-4 py-2 hover:bg-emerald-100 cursor-pointer text-sm"
                            onClick={() => {
                              handleInputChange('nationality', nationality);
                              setNationalityDropdown(false);
                              setNationalityInput(nationality);
                            }}
                          >
                            {nationality}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <div className="flex justify-end mt-8">
                <Button type="submit">Continue</Button>
              </div>
            </form>
          )}

          {/* Step 3: Verify Email */}
          {currentStep === 3 && (
            <form onSubmit={handleContinue} className="space-y-8 max-w-xl mx-auto w-full flex flex-col items-center">
              <div className="w-full flex items-center mb-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="text-gray-900 font-medium hover:text-[#16a34a] transition-colors flex items-center gap-2 w-fit px-2 py-1 rounded-lg hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
              </div>
              <div className="mb-4 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Verify Your Email Address</h2>
                <p className="text-sm md:text-base text-gray-600">
                  A 6-digit verification code has been sent to <span className="font-semibold text-gray-900">{formData.email || 'your email address'}</span>. Enter the code below to complete verification.
                </p>
              </div>
              <div className="flex gap-4 md:gap-6 items-center justify-center mb-2">
                {[0,1,2,3,4,5].map(i => (
                  <Input
                    key={i}
                    id={`otp-input-${i}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={otp[i] || ''}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className={`w-12 h-12 md:w-16 md:h-16 text-center text-xl md:text-2xl font-semibold border border-gray-200 focus:border-[#16a34a] focus:ring-[#16a34a] rounded-xl bg-white`}
                  />
                ))}
              </div>
              <div className="flex flex-col items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    toast.success(`Verification code re-sent to ${formData.email || 'your email'}`);
                  }}
                  className="text-emerald-700 hover:text-emerald-800 text-sm font-semibold hover:underline transition-colors cursor-pointer"
                >
                  Didn't receive code? Resend Code to Email
                </button>
              </div>
              <div>
                <Button type="submit" className="px-10">Continue</Button>
              </div>
            </form>
          )}

          {/* Step 4: Complete your account */}
          {currentStep === 4 && (
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
                <div className="relative">
                  <Label htmlFor="school" className="block text-sm font-medium text-gray-900 mb-2">School you attended</Label>
                  <Input
                    id="school"
                    name="school"
                    autoComplete="off"
                    value={formData.school}
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
                <div className="relative">
                  <Label htmlFor="course" className="block text-sm font-medium text-gray-900 mb-2">Your course of study</Label>
                  <Input 
                    id="course" 
                    name="course" 
                    autoComplete="off"
                    required
                    value={formData.course}
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
                    <ul className="course-dropdown absolute left-0 z-50 max-h-60 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto">
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
                <div className="relative">
                  <Label htmlFor="branch" className="block text-sm font-medium text-gray-900 mb-2">DVLA branch posted to</Label>
                  <Input
                    id="branch"
                    name="branch"
                    autoComplete="off"
                    value={formData.branch}
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
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
