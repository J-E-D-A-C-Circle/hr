"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { 
  Phone, 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Form states for Step 2
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | undefined>(undefined);

  // Resend Timer (60s countdown)
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP Code via SMS
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (!phoneNumber.trim() || cleanDigits.length < 9) {
      setError('Please enter a valid mobile phone number (at least 9 digits).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/forgot-password/send', {
        phoneNumber: phoneNumber.trim(),
      });

      if (response.data.debugOtp) {
        setDebugOtp(response.data.debugOtp);
      }

      setStep(2);
      setResendCooldown(60);
      setSuccessMsg('Verification code sent to your phone number via SMS.');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to send verification code. Please check your phone number and try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm OTP & Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Please enter the 6-digit SMS verification code.');
      return;
    }

    if (otp.trim().length !== 6) {
      setError('Verification code must be exactly 6 digits.');
      return;
    }

    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify and retype.');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/auth/forgot-password/confirm', {
        phoneNumber: phoneNumber.trim(),
        token: otp.trim(),
        newPassword,
      });

      setStep(3);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to reset password. Please check your verification code and try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Action
  const handleResendCode = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/forgot-password/send', {
        phoneNumber: phoneNumber.trim(),
      });

      if (response.data.debugOtp) {
        setDebugOtp(response.data.debugOtp);
      }

      setResendCooldown(60);
      setSuccessMsg('A new verification code has been dispatched to your phone!');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to resend verification code.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-green-100 p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-emerald-100/70 overflow-hidden transition-all duration-300">
        
        {/* Header Branding */}
        <div className="pt-8 pb-5 px-6 flex flex-col items-center border-b border-gray-100 bg-gradient-to-b from-emerald-50/60 to-transparent">
          <div className="relative mb-3 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            <Image 
              src="/oop.png" 
              width={70} 
              height={70} 
              alt="DVLA Logo" 
              priority
              className="relative rounded-2xl bg-white p-2 shadow-sm border border-emerald-100 object-contain" 
            />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 text-center tracking-tight">
            {step === 3 ? 'Password Changed!' : 'Reset Password'}
          </h1>
          <p className="text-xs font-semibold text-emerald-700 tracking-wider uppercase mt-1">
            DVLA NSS Portal
          </p>
        </div>

        <div className="p-6">
          {/* STEP 1: Enter Mobile Phone Number */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 mb-1 border border-emerald-200/60 shadow-sm">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-gray-900">
                  Mobile Phone Verification
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                  Enter your registered mobile phone number. We will send a 6-digit SMS verification code to reset your password.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs leading-relaxed animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSendCode} className="space-y-5">
                <div>
                  <label htmlFor="phoneNumber" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="phoneNumber"
                      type="tel"
                      required
                      autoFocus
                      placeholder="e.g. 024XXXXXXX or +233..."
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50/70 border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white rounded-xl text-sm font-medium transition-all outline-none"
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-gray-500 leading-normal">
                    Enter the phone number used during your NSS portal registration.
                  </p>
                </div>

                <button
                  type="submit"
                  id="sendCodeBtn"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending SMS Code...</span>
                    </>
                  ) : (
                    <span>Send Verification Code</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Enter OTP & Set New Password */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="font-semibold block text-gray-500 text-[10px] uppercase">SMS Sent To</span>
                    <span className="font-bold text-gray-900 truncate text-xs">{phoneNumber}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  className="text-emerald-700 hover:text-emerald-900 font-bold underline shrink-0 text-xs cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Dev Mode Demo Code Notice */}
              {debugOtp && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-2.5 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Demo Code:</strong> <code className="bg-amber-100 px-1.5 py-0.5 rounded font-bold text-amber-900">{debugOtp}</code></span>
                </div>
              )}

              {/* Feedback messages */}
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs leading-relaxed animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && !error && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* 6-Digit OTP */}
                <div>
                  <label htmlFor="otpCode" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    6-Digit SMS Verification Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="otpCode"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      autoFocus
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50/70 border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white rounded-xl text-lg font-mono font-bold tracking-widest text-center transition-all outline-none"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-10 py-3 bg-gray-50/70 border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white rounded-xl text-sm font-medium transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-10 py-3 bg-gray-50/70 border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white rounded-xl text-sm font-medium transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="resetPasswordBtn"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Set New Password</span>
                  )}
                </button>
              </form>

              {/* Resend Code Option */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || loading}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 
                    ? `Resend SMS code in ${resendCooldown}s` 
                    : 'Didn\'t receive code? Resend SMS'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <div className="py-4 text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900">Password Updated!</h2>
                <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                  Your password has been changed successfully. You can now log into your DVLA NSS account using your new credentials.
                </p>
              </div>

              <Link
                href="/login"
                id="backToLoginSuccessBtn"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm block"
              >
                Sign In to Portal
              </Link>
            </div>
          )}
        </div>

        {/* Footer Link */}
        {step !== 3 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
            <Link 
              href="/login" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-emerald-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
