'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
      // Final submission
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Sidebar */}
      <div className="w-1/3 bg-[#16a34a] flex flex-col p-8 relative">
        {/* Logo */}
        <div className="mb-12">
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
        <div className="text-white mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to DVLA - NSS Portal.</h1>
          <p className="text-xl font-normal">Get your account setup in just a few steps.</p>
        </div>

        {/* Step Navigation */}
        <div className="flex-1 flex flex-col justify-center">
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
          <button
            onClick={() => router.push('/login')}
            className="text-white flex items-center justify-between w-full hover:opacity-90 font-normal"
          >
            <span>Already have an account? Login</span>
            <span>→</span>
          </button>
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
        <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
          {currentStep === 1 && (
            <form onSubmit={handleContinue} className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Create an account.</h2>
                <p className="text-gray-600 font-normal">Provide your account information to continue.</p>
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Your Email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] outline-none font-normal"
                  placeholder="Enter your email"
                />
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                    Your Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#16a34a] text-sm font-medium hover:underline"
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] outline-none font-normal"
                  placeholder="Create a password."
                />
              </div>

              {/* Password Requirements */}
              <div className="text-sm text-gray-600 space-y-1">
                <ul className="list-disc list-inside space-y-1 ml-2 font-normal">
                  <li>Use at least 8 characters</li>
                  <li>Besides letters, include at least a number or symbol (!@#$%^&*-_+=).</li>
                  <li>Password is case sensitive.</li>
                </ul>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-2">
                  Confirm Your Password
                </label>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] outline-none font-normal"
                  placeholder="Confirm your password."
                />
              </div>

              {/* Continue Button */}
              <div className="flex justify-end mt-8">
                <button
                  type="submit"
                  className="bg-[#16a34a] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#15803d] transition-colors"
                >
                  Continue
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Profile Information */}
          {currentStep === 2 && (
            <form onSubmit={handleContinue} className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="text-gray-900 font-medium hover:text-[#16a34a] transition-colors"
                >
                  &lt; Back
                </button>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Create an account.</h2>
                <p className="text-gray-600 font-normal">Provide your personal information to get started.</p>
              </div>

              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 mb-2">
                  Your First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  required
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] outline-none font-normal"
                  placeholder="Enter Your First Name"
                />
              </div>

              {/* Middle Name */}
              <div>
                <label htmlFor="middleName" className="block text-sm font-medium text-gray-900 mb-2">
                  Your Middle Name
                </label>
                <input
                  type="text"
                  id="middleName"
                  value={formData.middleName}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] outline-none font-normal"
                  placeholder="Enter Other Names"
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 mb-2">
                  Your Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  required
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] outline-none font-normal"
                  placeholder="Enter Your Last Name"
                />
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-900 mb-2">
                  Select Your Gender
                </label>
                <div className="relative">
                  <select
                    id="gender"
                    required
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] outline-none appearance-none bg-white pr-10 font-normal"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-900 mb-2">
                  Your Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <span className="text-lg">🇬🇭</span>
                    <span className="text-gray-500">|</span>
                  </div>
                  <input
                    type="tel"
                    id="phoneNumber"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] outline-none font-normal"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Continue Button */}
              <div className="flex justify-end mt-8">
                <button
                  type="submit"
                  className="bg-[#16a34a] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#15803d] transition-colors"
                >
                  Continue
                </button>
              </div>
            </form>
          )}

          {/* Placeholder for steps 3 and 4 */}
          {currentStep > 2 && (
            <div>
              {currentStep > 2 && (
                <div className="flex items-center justify-between mb-6">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="text-gray-900 font-medium hover:text-[#16a34a] transition-colors"
                  >
                    &lt; Back
                  </button>
                </div>
              )}
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {steps[currentStep - 1].title}
              </h2>
              <p className="text-gray-600 mb-8 font-normal">This step is coming soon.</p>
              <div className="flex justify-end mt-8">
                <button
                  onClick={handleContinue}
                  className="bg-[#16a34a] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#15803d] transition-colors"
                >
                  {currentStep === 4 ? 'Complete' : 'Continue'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
