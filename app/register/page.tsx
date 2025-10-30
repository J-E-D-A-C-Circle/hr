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
import { ArrowLeft, Check, Upload, FileText, Image as ImageIcon } from 'lucide-react';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  phoneNumber: string;
  school: string;
  branch: string; // Added for branch posted to
}

export default function RegisterPage() {
  const router = useRouter();

  // Hydrated flag - only render after client hydration
  const [hydrated, setHydrated] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    phoneNumber: '',
    school: '',
    branch: '', // Initialize branch
  });

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
    { id: 3, title: 'Verify Phone' },
    { id: 4, title: 'Complete Application' },
  ];

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

  // Update handleContinue to support advancing from OTP step (step 3) to step 4
  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 1) {
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      if (formData.password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
      }
    }
    if (currentStep === 3) {
      if (otp.join('').length !== 6) return;
      setCurrentStep(4);
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final submission - clear saved data and go to success page
      if (typeof window !== 'undefined') {
        localStorage.removeItem('registerCurrentStep');
        localStorage.removeItem('registerFormData');
      }
      router.push('/register/success');
    }
  };

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const newOtp = [...otp]; newOtp[i] = val;
    setOtp(newOtp);
    // Optionally auto-focus next input if val present
    if(val && i < 5) {
      const next = document.querySelector(`#otp-input-${i+1}`) as HTMLElement;
      next?.focus();
    }
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      const prev = document.querySelector(`#otp-input-${i-1}`) as HTMLElement;
      prev?.focus();
    }
  };

  // File inputs state and refs for Step 4
  const [passportFileName, setPassportFileName] = useState<string>('');
  const [appointmentFileName, setAppointmentFileName] = useState<string>('');
  const [cvFileName, setCvFileName] = useState<string>('');
  const passportFileRef = useRef<HTMLInputElement | null>(null);
  const passportCameraRef = useRef<HTMLInputElement | null>(null);
  const appointmentFileRef = useRef<HTMLInputElement | null>(null);
  const appointmentCameraRef = useRef<HTMLInputElement | null>(null);
  const cvFileRef = useRef<HTMLInputElement | null>(null);

  const handlePassportSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPassportFileName(file ? file.name : '');
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

  // In component state, add Autocomplete state
  const [schoolInput, setSchoolInput] = useState("");
  const [schoolDropdown, setSchoolDropdown] = useState(false);
  const [branchInput, setBranchInput] = useState("");
  const [branchDropdown, setBranchDropdown] = useState(false);
  const filteredSchools = ghanianSchools.filter(school => school.toLowerCase().includes(schoolInput.toLowerCase()));
  const filteredBranches = dvlaBranches.filter(branch => branch.toLowerCase().includes(branchInput.toLowerCase()));

  useEffect(() => {
    function closeDropdowns(e: MouseEvent) {
      // Only close if user clicked outside both fields
      if (!(e.target instanceof HTMLElement && e.target.closest('#school'))) {
        setSchoolDropdown(false);
      }
      if (!(e.target instanceof HTMLElement && e.target.closest('#branch'))) {
        setBranchDropdown(false);
      }
    }
    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, []);

  if (!hydrated) return null;

  return (
    <div className="min-h-screen">
      {/* HEADER FOR MOBILE (below md) */}
      <div className="block md:hidden w-full bg-[#16a34a] px-4 py-3 flex items-center justify-between">
        <div className="w-12 h-12">
          <Image src="/oop.png" alt="DVLA Logo" width={48} height={48} className="w-full h-full object-contain" priority />
        </div>
        <h1 className="text-lg font-bold text-white tracking-tight">DVLA NSS Portal</h1>
      </div>

      {/* LOGIN LINK MOBILE */}
      <div className="block md:hidden w-full bg-[#15803d] px-4 py-2">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="text-white w-full flex items-center justify-between font-normal hover:opacity-90"
        >
          <span>Already have an account? Login</span>
          <span>→</span>
        </button>
      </div>

      {/* SIDEBAR FOR DESKTOP only (md+: unchanged) */}
      <div 
        className="hidden md:flex md:fixed md:left-0 md:top-0 md:w-[480px] md:h-screen bg-[#16a34a] flex-col p-8 relative bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1920&q=80)',
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-[#16a34a]/90"></div>
        <div className="relative z-10 flex flex-col h-full justify-between overflow-hidden">
          <div className="flex flex-col">
            {/* Logo */}
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto">
                <Image
                  src="/oop.png"
                  alt="DVLA Logo"
                  width={128}
                  height={128}
                  className="w-full h-full object-contain"
                  priority
                />
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
        {/* Progress Indicator - Top Right Only */}
        <div className="flex justify-end mb-8">
          <div className="text-right w-full">
            <span className="text-gray-600 font-medium block mb-2">Step {currentStep} of 4</span>
            <div className="flex gap-3 w-56 md:w-96 mx-auto">
              {steps.map((step) => (
                <div 
                  key={step.id}
                  className={`flex-1 h-2.5 md:h-3 rounded-full transition-colors ${
                    step.id <= currentStep
                      ? 'bg-[#16a34a]'
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
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="password" className="block text-sm font-medium text-gray-900">
                    Your Password
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#16a34a] text-sm font-medium hover:underline h-auto p-0"
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </Button>
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a password."
                />
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
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password."
                />
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
                  <div className="col-span-2">
                    <Label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-900 mb-2">
                      Your Phone Number
                    </Label>
                    <div className="relative w-full">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 z-10">
                        {/* Replace emoji flag with SVG image */}
                        <Image src="/file.svg" alt="Ghana Flag" width={24} height={16} className="rounded-sm border border-gray-300" />
                        <span className="text-gray-500">|</span>
                      </div>
                      <Input
                        type="tel"
                        id="phoneNumber"
                        required
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className="pl-16 w-full"
                        placeholder="Enter phone number"
                      />
                    </div>
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
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleInputChange('gender', value)}
                      required
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <div className="flex justify-end mt-8">
                <Button type="submit">Continue</Button>
              </div>
            </form>
          )}

          {/* Step 3: Verify Phone */}
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
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Verify Your Phone Number</h2>
                <p className="text-sm md:text-base text-gray-600">A verification code has been set to your account, enter to verify your phone number</p>
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
              <div className="text-green-500 text-base mb-2">You can request another OTP in 00:09:44</div>
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
                  <Input id="nssPin" name="nssPin" placeholder="Eg. NSS 0345 067 856" />
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
                <div>
                  <Label htmlFor="course" className="block text-sm font-medium text-gray-900 mb-2">Your course of study</Label>
                  <Input id="course" name="course" placeholder="Eg. BA Information Studies and Psychology" />
                </div>
                {/* Address */}
                <div>
                  <Label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-2">Your address</Label>
                  <Input id="address" name="address" placeholder="Enter the address of where you will stay during your service" />
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
                    <Label className="block text-sm font-medium text-gray-900 mb-2">Passport Picture</Label>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col md:flex-row items-start md:items-center px-4 py-3 gap-3 md:gap-4 shadow-sm">
                      <button type="button" onClick={() => passportFileRef.current?.click()} className="flex items-center px-3 py-2 bg-emerald-100 text-emerald-700 font-semibold rounded-lg gap-2 shadow hover:bg-emerald-200 transition text-sm md:text-base">
                        <ImageIcon className="w-6 h-6" />
                        Upload Passport
                      </button>
                      <input ref={passportFileRef} id="passport" name="passport" type="file" accept="image/*" className="hidden" onChange={handlePassportSelected} />
                      <div className="md:ml-4 text-xs text-gray-700 truncate mt-1 md:mt-0">
                        {passportFileName ? passportFileName : 'No file selected'}
                      </div>
                    </div>
                  </div>
                  {/* Appointment Letter upload */}
                  <div className="flex flex-col">
                    <Label className="block text-sm font-medium text-gray-900 mb-2">Appointment Letter</Label>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col md:flex-row items-start md:items-center px-4 py-3 gap-3 md:gap-4 shadow-sm">
                      <button type="button" onClick={() => appointmentFileRef.current?.click()} className="flex items-center px-3 py-2 bg-emerald-100 text-emerald-700 font-semibold rounded-lg gap-2 shadow hover:bg-emerald-200 transition text-sm md:text-base">
                        <FileText className="w-6 h-6" />
                        Upload Letter
                      </button>
                      <input ref={appointmentFileRef} id="appointment" name="appointment" type="file" accept="application/pdf,image/*" className="hidden" onChange={handleAppointmentSelected} />
                      <div className="md:ml-4 text-xs text-gray-700 truncate mt-1 md:mt-0">
                        {appointmentFileName ? appointmentFileName : 'No file selected'}
                      </div>
                    </div>
                  </div>
                  {/* CV upload */}
                  <div className="flex flex-col md:col-span-2">
                    <Label className="block text-sm font-medium text-gray-900 mb-2">Curriculum Vitae (CV)</Label>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col md:flex-row items-start md:items-center px-4 py-3 gap-3 md:gap-4 shadow-sm">
                      <button type="button" onClick={() => cvFileRef.current?.click()} className="flex items-center px-3 py-2 bg-emerald-100 text-emerald-700 font-semibold rounded-lg gap-2 shadow hover:bg-emerald-200 transition text-sm md:text-base">
                        <Upload className="w-6 h-6" />
                        Upload CV
                      </button>
                      <input ref={cvFileRef} id="cv" name="cv" type="file" accept="application/pdf" className="hidden" onChange={handleCvSelected} />
                      <div className="md:ml-4 text-xs text-gray-700 truncate mt-1 md:mt-0">
                        {cvFileName ? cvFileName : 'No file selected'}
                </div>
                  </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-8">
                <Button type="submit" className="px-10">Continue</Button>
              </div>
            </form>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
