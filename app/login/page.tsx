'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileCheck2, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Building, Shield, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed. Please check your credentials.');
      } else {
        if (data.user.role === 'HR_ADMIN') {
          router.push('/review');
        } else {
          router.push('/upload');
        }
        router.refresh();
      }
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'password123' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Quick login failed');
      } else {
        if (data.user.role === 'HR_ADMIN') {
          router.push('/review');
        } else {
          router.push('/upload');
        }
        router.refresh();
      }
    } catch {
      setError('Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Ambient Radial Gradients */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 shadow-xl shadow-emerald-600/30 text-white ring-8 ring-emerald-50">
            <FileCheck2 className="h-8 w-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-bold tracking-normal text-slate-900 font-sans">PVC Portal</h1>
            <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              AI Edition
            </span>
          </div>
          <p className="text-sm font-normal text-slate-600 max-w-xs mx-auto">
            Payroll Validation Collection portal for station managers & HR compliance team.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/5 backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-800 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@pvc.local"
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition font-normal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-800 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition font-normal"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Quick Logins */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Demo Accounts Quick Login</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('head.branch1@pvc.local')}
                className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-left transition flex flex-col gap-1 group shadow-2xs cursor-pointer"
              >
                <span className="font-bold flex items-center justify-between text-emerald-900">
                  Station Manager
                  <Building className="h-3.5 w-3.5 text-emerald-600" />
                </span>
                <span className="text-[10px] text-emerald-700 font-mono font-bold">head.branch1@pvc.local</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@pvc.local')}
                className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-left transition flex flex-col gap-1 group shadow-2xs cursor-pointer"
              >
                <span className="font-bold flex items-center justify-between text-emerald-900">
                  HR Admin
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                </span>
                <span className="text-[10px] text-emerald-700 font-mono font-bold">admin@pvc.local</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-3 font-mono font-semibold">Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
