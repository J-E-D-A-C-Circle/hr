'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin } from '@/app/actions/admin';
import Navbar from '@/components/Navbar';


export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await adminLogin(formData);
    setIsLoading(false);

    if (res.success) {
      router.push('/admin/dashboard');
    } else {
      setErrorMsg(res.error || 'Invalid credentials.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF6E3]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-[#0F5132] text-amber-400 font-black text-2xl rounded-full flex items-center justify-center mx-auto mb-3 shadow">
              ★
            </div>
            <h1 className="text-2xl font-black text-gray-900">DVLA Staff & Admin Sign In</h1>
            <p className="text-xs text-gray-500 mt-1">Authorized access for HR Officers & Department Admins</p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border-l-4 border-red-600 p-3 rounded text-red-800 text-xs mb-4">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Official Email Address *</label>
              <input
                type="email"
                name="email"
                required
                defaultValue="admin@dvla.gov.gh"
                placeholder="admin@dvla.gov.gh"
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                name="password"
                required
                defaultValue="Admin@123456"
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-bold py-3 rounded-lg text-sm shadow transition disabled:opacity-50"
            >
              {isLoading ? 'Signing In...' : 'Authenticate Admin Session'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center text-[11px] text-gray-500">
            Default credentials for testing: <strong>admin@dvla.gov.gh</strong> / <strong>Admin@123456</strong>
          </div>
        </div>
      </main>


    </div>
  );
}
