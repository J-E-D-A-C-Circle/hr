'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { isTokenExpired, clearAuthSession } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Clean up any expired auth tokens when landing on login page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && isTokenExpired(token)) {
        clearAuthSession();
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      if (emailParam) {
        setFormData(prev => ({ ...prev, email: emailParam }));
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(
        '/api/auth/login',
        formData,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        if (response.data.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-slate-900 text-slate-900 font-sans overflow-hidden">
      {/* DVLA Head Office Background Image with Faint Green Overlay */}
      <div 
        className="absolute inset-0 bg-no-repeat bg-cover bg-center"
        style={{ backgroundImage: "url('/abs.jpg')" }}
      />
      {/* Faint Green Color Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d5c2e]/92 via-[#0d5c2e]/88 to-[#073e1e]/92 backdrop-blur-[1px]" />

      {/* Top Header Bar */}
      <header className="relative z-20 px-6 py-4 border-b border-white/10 bg-black/10 backdrop-blur-md">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-10 h-10 p-1 bg-white rounded-xl shadow-md flex items-center justify-center">
              <Image
                src="/oop.png"
                alt="DVLA Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight block">DVLA NSS Portal</span>
              <span className="text-xs text-emerald-100/90 hidden sm:block">Driver and Vehicle Licensing Authority</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/register')}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
          >
            <span className="hidden sm:inline">Need an account? </span>
            <span>Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Login Card - Floating on top of faint DVLA Head Office background */}
      <main className="relative z-20 flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl p-7 sm:p-9 space-y-6">
          
          {/* Card Header & DVLA Logo */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 mx-auto p-1.5 bg-white rounded-2xl shadow-lg ring-4 ring-[#0d5c2e]/10 border border-slate-100 flex items-center justify-center">
              <Image
                src="/oop.png"
                alt="DVLA Logo"
                width={72}
                height={72}
                className="w-full h-full object-contain"
                priority
              />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to your account</h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Enter your credentials to access the DVLA National Service Scheme Portal.
              </p>
            </div>

          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0d5c2e] focus:ring-2 focus:ring-[#0d5c2e]/20 transition-all bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => router.push('/forgot')}
                  className="text-xs text-[#0d5c2e] hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0d5c2e] focus:ring-2 focus:ring-[#0d5c2e]/20 transition-all bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-6 rounded-xl bg-[#0d5c2e] hover:bg-[#084221] text-white font-bold text-sm shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Registration Link inside card */}
          <div className="pt-4 border-t border-slate-200/80 text-center text-xs text-slate-600">
            Need an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="font-bold text-[#0d5c2e] hover:underline cursor-pointer"
            >
              Register for NSS Placement
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 px-6 text-center border-t border-white/10 bg-black/10 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-emerald-100/90">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Driver and Vehicle Licensing Authority • Ghana</span>
          </div>
          <p>© {new Date().getFullYear()} DVLA Ghana. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
