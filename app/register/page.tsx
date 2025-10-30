'use client';

import { useState, useEffect } from 'react';
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
import { ArrowLeft } from 'lucide-react';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  phoneNumber: string;
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

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation logic here
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
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final submission - clear saved data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('registerCurrentStep');
        localStorage.removeItem('registerFormData');
      }
      router.push('/dashboard');
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

  if (!hydrated) return null;

  return (
    <div className="min-h-screen flex">
      {/* Left Sidebar */}
      <div 
        className="w-[420px] bg-[#16a34a] flex flex-col p-8 relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1920&q=80)',
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-[#16a34a]/90"></div>
        <div className="relative z-10 flex flex-col h-full justify-between">
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

            {/* Welcome Message */}
            <div className="text-white mb-8">
              <h1 className="text-4xl font-bold mb-4">Welcome to DVLA - NSS Portal.</h1>
              <p className="text-xl font-normal">Get your account setup in just a few steps.</p>
            </div>
          </div>

          {/* Step Navigation */}
          <div className="flex flex-col">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center mb-6 ${
                  step.id === currentStep
                    ? 'text-white'
                    : 'text-white/70'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full mr-4 ${
                    step.id === currentStep
                      ? 'bg-white'
                      : 'bg-white/50'
                  }`}
                />
                <span
                  className={`text-lg ${
                    step.id === currentStep ? 'font-bold' : 'font-normal'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>

          {/* Footer Link */}
          <div className="bg-[#15803d] p-4 rounded-lg">
            <Button
              variant="ghost"
              onClick={() => router.push('/login')}
              className="text-white flex items-center justify-between w-full hover:opacity-90 font-normal"
            >
              <span>Already have an account? Login</span>
              <span>→</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 bg-white p-12 flex flex-col">
        {/* Progress Indicator - Top Right Only */}
        <div className="flex justify-end mb-8">
          <div className="text-right">
            <span className="text-gray-600 font-medium block mb-2">Step {currentStep} of 4</span>
            <div className="flex gap-2">
              {steps.map((step) => (
                <div 
                  key={step.id}
                  className={`flex-1 h-1 rounded ${
                    step.id <= currentStep
                      ? 'bg-[#16a34a]'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex flex-col justify-center max-w-4xl w-full mx-auto">
          {currentStep === 1 && (
            <form onSubmit={handleContinue} className="space-y-6">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">Create an account.</h2>
                <p className="text-lg text-gray-600">Provide your account information to continue.</p>
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
                <Button
                  type="submit"
                >
                  Continue
                </Button>
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
                <h2 className="text-4xl font-bold text-gray-900 mb-2">Create an account.</h2>
                <p className="text-lg text-gray-600">Provide your personal information to get started.</p>
              </div>

              {/* Two Column Grid Layout */}
              <div className="grid grid-cols-2 gap-6">
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
                <Button
                  type="submit"
                >
                  Continue
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Verify Phone */}
          {currentStep === 3 && (
            <form onSubmit={handleContinue} className="space-y-8 max-w-xl mx-auto w-full flex flex-col items-center">
              <div className="mb-6 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Phone Number</h2>
                <p className="text-base text-gray-600">A verification code has been set to your account, enter to verify your phone number</p>
              </div>
              <div className="flex gap-6 items-center justify-center mb-2">
                {[0,1,2,3,4,5].map(i => (
                  <Input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={otp[i] || ''}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    className={`w-16 h-16 text-center text-2xl font-semibold border-2 border-gray-300 focus:border-[#16a34a] focus:ring-[#16a34a] rounded-lg bg-white`}
                  />
                ))}
              </div>
              <div className="text-green-500 text-base mb-2">You can request another OTP in 00:09:44</div>
              <div>
                <Button type="submit" disabled={otp.join('').length !== 6} className="bg-green-500/70 text-white font-semibold px-10 py-3 rounded-lg disabled:opacity-60">Continue</Button>
              </div>
            </form>
          )}

          {/* Placeholder for steps 4 and beyond */}
          {currentStep > 3 && (
            <div>
              {currentStep > 2 && (
                <div className="flex items-center justify-between mb-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="text-gray-900 font-medium hover:text-[#16a34a] transition-colors"
                  >
                    &lt; Back
                  </Button>
                </div>
              )}
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {steps[currentStep - 1].title}
              </h2>
              <p className="text-gray-600 mb-8 font-normal">This step is coming soon.</p>
              <div className="flex justify-end mt-8">
                <Button
                  onClick={handleContinue}
                >
                  {currentStep === 4 ? 'Complete' : 'Continue'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
