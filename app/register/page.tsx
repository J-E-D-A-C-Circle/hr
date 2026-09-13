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
import { getValidAuthToken, getStoredUser } from '@/lib/auth-client';
import { ArrowLeft, Check, Upload, FileText, Image as ImageIcon, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { uploadFile } from '@/lib/file-upload';
import toast from 'react-hot-toast';
import { Step1Account } from '@/components/registration/Step1Account';
import { Step2Profile } from '@/components/registration/Step2Profile';
import { Step3Verify } from '@/components/registration/Step3Verify';
import { Step4Complete } from '@/components/registration/Step4Complete';

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
  postingRegion?: string;
  postingDistrict?: string;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
  additionalInfo?: string;
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
    postingRegion: '',
    postingDistrict: '',
    servicePeriodStart: '',
    servicePeriodEnd: '',
    additionalInfo: '',
  });

  // Redirect if already authenticated or Load Draft
  useEffect(() => {
    const checkAuthAndDraft = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.role === 'admin') {
            router.replace('/admin/dashboard');
            return;
          }
          
          // Check if they have a draft
          const res = await fetch('/api/applications/draft', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          
          if (data.application && data.application.status === 'draft') {
            // Load draft into form data
            const app = data.application;
            const extra = app.additional_info ? JSON.parse(app.additional_info) : {};
            
            setFormData(prev => ({
              ...prev,
              firstName: app.first_name || '',
              lastName: app.last_name || '',
              middleName: app.middle_name || '',
              email: app.email || prev.email,
              phoneNumber: app.phone_number || '',
              ghanaCard: app.nss_number || prev.ghanaCard, // Stored ghanaCard here temporarily? Or nssPin?
              gender: app.gender || '',
              nationality: app.nationality || 'Ghanaian',
              region: app.region || '',
              district: app.district || '',
              address: app.residential_address || '',
              school: app.institution_name || '',
              course: app.course_program || '',
              yearOfCompletion: app.year_of_completion || '',
              serviceYear: app.service_year || String(new Date().getFullYear()),
              postingRegion: app.posting_region || '',
              postingDistrict: app.posting_district || '',
              servicePeriodStart: app.service_period_start ? app.service_period_start.split('T')[0] : '',
              servicePeriodEnd: app.service_period_end ? app.service_period_end.split('T')[0] : '',
              additionalInfo: app.additional_info || '',
              nssPin: app.nss_number || prev.nssPin,
            }));
            
            if (extra.currentStep) {
              setCurrentStep(extra.currentStep);
            } else {
              setCurrentStep(3); // Default to step 3 if they have an account but no step saved
            }
          } else {
            // Not a draft, or fully completed
            router.replace('/dashboard');
          }
        } catch (e) {
          router.replace('/dashboard');
        }
      }
    };
    
    if (typeof window !== 'undefined') {
      checkAuthAndDraft();
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
          
          // Save draft to database
          try {
            await fetch('/api/applications/draft', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.token}`
              },
              body: JSON.stringify({ ...formData, currentStep: 3 })
            });
          } catch (e) {
            console.error('Failed to save draft:', e);
          }

          // Send OTP via SMS
          try {
            await fetch('/api/auth/send-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phoneNumber: formData.phoneNumber })
            });
          } catch (e) {
            console.error('Failed to send OTP:', e);
          }
        }
        
        console.log('Account created successfully!', data.user);
        toast.success(`Verification code sent to ${formData.phoneNumber || 'your phone'}`);
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
        toast.error('Please enter the 6-digit verification code sent to your phone');
        return;
      }
      
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: formData.phoneNumber,
            token: otp.join('')
          })
        });
        
        const data = await response.json();
        if (!response.ok) {
          toast.error(data.error || 'Invalid verification code');
          setIsSubmitting(false);
          return;
        }
        
        toast.success('Phone number verified successfully!');
        
        // Update draft to Step 4
        const token = localStorage.getItem('token');
        if (token) {
          fetch('/api/applications/draft', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ...formData, currentStep: 4 })
          }).catch(console.error);
        }
        
        setCurrentStep(4);
      } catch (error: any) {
        toast.error('Failed to verify code. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
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
        course_program: formData.course.trim(),
        year_of_completion: formData.yearOfCompletion,
        service_year: formData.serviceYear || new Date().getFullYear().toString(),
        nss_number: formData.nssPin || null,
        posting_region: formData.postingRegion || formData.region || null,
        posting_district: formData.postingDistrict || formData.district.trim() || null,
        service_period_start: formData.servicePeriodStart || null,
        service_period_end: formData.servicePeriodEnd || null,
        additional_info: formData.additionalInfo || null,
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
      <div className="hidden md:flex md:fixed md:left-0 md:top-0 md:w-[460px] md:h-screen flex-col p-8 relative overflow-hidden bg-gradient-to-b from-[#0a4623] via-[#0d5c2e] to-[#073e1e] border-r border-emerald-950/40">
        {/* Soft background glow */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full justify-between overflow-hidden">
          <div className="flex flex-col">
            {/* Logos & Brand */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 p-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl ring-2 ring-white/30 flex items-center justify-center shrink-0">
                  <Image
                    src="/oop.png"
                    alt="DVLA Logo"
                    width={64}
                    height={64}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">DVLA NSS Portal</h2>
                  <p className="text-xs text-emerald-200/90 font-medium">National Service Onboarding</p>
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
      <div className="md:ml-[460px] ml-0 min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4 sm:p-6 md:p-12 flex flex-col">
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
            <Step1Account 
              formData={formData}
              handleInputChange={handleInputChange}
              handleContinue={handleContinue}
              existingAccountNotice={existingAccountNotice}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              passwordStrength={passwordStrength}
            />
          )}

          {/* Step 2: Profile Information */}
          {currentStep === 2 && (
            <Step2Profile 
              formData={formData}
              handleInputChange={handleInputChange}
              handleContinue={handleContinue}
              setCurrentStep={setCurrentStep}
              currentStep={currentStep}
            />
          )}

          {/* Step 3: Verify Email */}
          {currentStep === 3 && (
            <Step3Verify 
              formData={formData}
              handleContinue={handleContinue}
              setCurrentStep={setCurrentStep}
              currentStep={currentStep}
              otp={otp}
              handleOtpChange={handleOtpChange}
              handleOtpKeyDown={handleOtpKeyDown}
            />
          )}

          {/* Step 4: Complete your account */}
          {currentStep === 4 && (
            <Step4Complete 
              formData={formData}
              handleInputChange={handleInputChange}
              handleContinue={handleContinue}
              setCurrentStep={setCurrentStep}
              currentStep={currentStep}
              isSubmitting={isSubmitting}
              submitError={submitError}
              passportFileName={passportFileName}
              idCardFileName={idCardFileName}
              appointmentFileName={appointmentFileName}
              cvFileName={cvFileName}
              passportFileRef={passportFileRef}
              idCardFileRef={idCardFileRef}
              appointmentFileRef={appointmentFileRef}
              cvFileRef={cvFileRef}
              handlePassportSelected={handlePassportSelected}
              handleIdCardSelected={handleIdCardSelected}
              handleAppointmentSelected={handleAppointmentSelected}
              handleCvSelected={handleCvSelected}
            />
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
