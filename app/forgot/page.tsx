"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { 
  Mail, 
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
  ShieldCheck
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
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

  // Resend Timer
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleMethodChange = (newMethod: 'email' | 'phone') => {
    setMethod(newMethod);
    setIdentifier('');
    setError('');
  };

  // Step 1: Send OTP Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError(method === 'email' ? 'Please enter your email address.' : 'Please enter your phone number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/forgot-password/send', {
        method,
        identifier: identifier.trim(),
      });

      if (response.data.debugOtp) {
        setDebugOtp(response.data.debugOtp);
      }

      setStep(2);
      setResendCooldown(60);
      setSuccessMsg(`Verification code sent to your ${method === 'email' ? 'email address' : 'phone number'}.`);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to send verification code. Please try again.';
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
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (otp.trim().length !== 6) {
      setError('Verification code must be 6 digits.');
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
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/auth/forgot-password/confirm', {
        method,
        identifier: identifier.trim(),
        token: otp.trim(),
        newPassword,
      });

      setStep(3);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to reset password. Please verify your code and try again.';
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
        method,
        identifier: identifier.trim(),
      });

      if (response.data.debugOtp) {
        setDebugOtp(response.data.debugOtp);
      }

      setResendCooldown(60);
      setSuccessMsg('A new verification code has been sent!');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to resend code.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-slate-50 to-emerald-100 p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-emerald-100/60 overflow-hidden">
        
        {/* Header Branding */}
        <div className="pt-8 pb-4 px-6 flex flex-col items-center border-b border-gray-100 bg-gradient-to-b from-emerald-50/50 to-transparent">
          <div className="relative mb-3">
            <Image 
              src="/oop.png" 
              width={68} 
              height={68} 
              alt="DVLA Logo" 
              className="rounded-2xl bg-white p-2 shadow-sm border border-emerald-100 object-contain" 
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center tracking-tight">
            {step === 3 ? 'Password Reset!' : 'Reset Password'}
          </h2>
          <p className="text-xs font-semibold text-emerald-700 tracking-wider uppercase mt-1">
            DVLA NSS Portal
          </p>
        </div>

        <div className="p-6">
          {/* STEP 1: Select Method & Enter Contact */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-600 text-center mb-5 leading-relaxed">
                  Select your preferred recovery method to receive a password reset code.
                </p>

                {/* Method Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100 rounded-2xl mb-6">
                  <button
                    type="button"
                    onClick={() => handleMethodChange('email')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      method === 'email'
                        ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email Address</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMethodChange('phone')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      method === 'phone'
                        ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    <span>Phone Number</span>
                  </button>
                </div>
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
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    {method === 'email' ? 'Registered Email Address' : 'Registered Phone Number'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      {method === 'email' ? <Mail className="w-5 h-5 text-gray-400" /> : <Phone className="w-5 h-5 text-gray-400" />}
                    </div>
                    <input
                      type={method === 'email' ? 'email' : 'tel'}
                      required
                      autoFocus
                      placeholder={method === 'email' ? 'you@example.com' : '024XXXXXXX or +233...'}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={loading}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white rounded-xl text-sm font-medium transition-all outline-none"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {method === 'email' 
                      ? 'We will send a 6-digit verification code to this email.'
                      : 'We will send a 6-digit SMS code to this phone number.'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <span>Send Verification Code</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Enter OTP & New Password */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 text-xs text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden pr-2">
                  {method === 'email' ? <Mail className="w-4 h-4 text-emerald-600 shrink-0" /> : <Phone className="w-4 h-4 text-emerald-600 shrink-0" />}
                  <div className="truncate">
                    <span className="font-semibold block text-gray-500 text-[10px] uppercase">Sent to</span>
                    <span className="font-bold text-gray-900 truncate">{identifier}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  className="text-emerald-700 hover:text-emerald-900 font-bold underline shrink-0 text-xs"
                >
                  Change
                </button>
              </div>

              {/* Dev Mode Debug OTP Notice */}
              {debugOtp && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-2.5 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Demo Code:</strong> <code className="bg-amber-100 px-1.5 py-0.5 rounded font-bold text-amber-900">{debugOtp}</code></span>
                </div>
              )}

              {/* Feedback messages */}
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs leading-relaxed">
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
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <KeyRound className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      disabled={loading}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white rounded-xl text-lg font-mono font-bold tracking-widest text-center transition-all outline-none"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pl-11 pr-10 py-3 bg-gray-50/50 border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white rounded-xl text-sm font-medium transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pl-11 pr-10 py-3 bg-gray-50/50 border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white rounded-xl text-sm font-medium transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </form>

              {/* Resend Code Option */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || loading}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 
                    ? `Resend code in ${resendCooldown}s` 
                    : 'Didn\'t receive code? Resend'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <div className="py-4 text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Password Changed!</h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  Your password has been reset successfully. You can now log in to the portal using your new password.
                </p>
              </div>

              <Link
                href="/login"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm block"
              >
                Back to Login
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
