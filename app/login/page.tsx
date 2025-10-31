'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/dashboard');
        }
      } catch (e) {
        // Invalid user data, continue to login
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(
        `http://localhost/api/auth.php?action=login`,
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
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* HEADER FOR MOBILE (below md) */}
      <div className="block md:hidden w-full bg-[#16a34a] px-4 py-2 flex items-center justify-center gap-3">
        <Image src="/oop.png" alt="DVLA Logo" width={36} height={36} className="w-9 h-9 object-contain" priority />
        <span className="text-base font-semibold text-white tracking-tight">DVLA NSS Portal</span>
      </div>

      {/* REGISTER LINK MOBILE */}
      <div className="block md:hidden w-full bg-[#15803d] px-4 py-2">
        <button
          type="button"
          onClick={() => router.push('/register')}
          className="text-white w-full flex items-center justify-between font-normal hover:opacity-90"
        >
          <span>Need an account? Register</span>
          <span>→</span>
        </button>
      </div>

      {/* SIDEBAR FOR DESKTOP */}
      <div
        className="hidden md:flex md:fixed md:left-0 md:top-0 md:w-80 md:h-screen bg-[#16a34a] flex-col p-6 relative bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1920&q=80)' }}
      >
        <div className="absolute inset-0 bg-[#16a34a]/90"></div>
        <div className="relative z-10 flex flex-col h-full justify-between overflow-hidden">
          <div className="flex flex-col items-center">
            <div className="mb-6 mt-2">
              <div className="w-20 h-20 mx-auto mb-2">
                <Image src="/oop.png" alt="DVLA Logo" width={80} height={80} className="w-full h-full object-contain" priority />
              </div>
              <div className="text-white text-xl font-bold text-center">DVLA NSS Portal</div>
              <div className="bg-white/10 rounded-xl px-4 py-3 text-sm italic text-white text-center shadow-md mt-2 max-w-xs">Empowering Ghana's Service. Together.</div>
            </div>
          </div>
          <div className="mt-auto flex flex-col items-center">
            <Button
              type="button"
              onClick={() => router.push('/register')}
              className="mt-4 w-full py-3 px-6 bg-[#16a34a] text-white text-base font-bold rounded-full hover:bg-[#15803d] hover:translate-y-[-2px] transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Need an account? Register <span className='text-xl ml-1'>→</span>
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="md:ml-80 ml-0 min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4 md:p-10 flex flex-col">
        {/* Beautiful register CTA under card for mobile */}
        <div className="block md:hidden max-w-md w-full mx-auto mt-2 mb-6">
          <Button
            type="button"
            onClick={() => router.push('/register')}
            className="w-full py-3 px-6 bg-[#16a34a] text-white text-base font-bold rounded-full hover:bg-[#15803d] transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Need an account? Register <span className='text-xl ml-1'>→</span>
          </Button>
        </div>
        <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
          <div className="w-full rounded-2xl bg-white/95 backdrop-blur-lg shadow-lg ring-1 ring-black/10 px-4 py-6 md:px-8 md:py-9 relative overflow-hidden">
            {/* Logo with pop-in and headline */}
            <div className="flex flex-col items-center animate-fadeInUp mb-5 z-10 relative">
              <Image src="/oop.png" alt="DVLA Logo" width={80} height={80} className="drop-shadow rounded-full bg-white/95 p-1 mb-2" priority />
              <span className="italic text-gray-500 text-center text-base mb-1">Get access to your DVLA NSS Portal</span>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
              {error && (
                <div className="mb-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm md:text-base">
                  {error}
                </div>
              )}
              <div>
                <Label htmlFor="email" className="mb-2 block text-sm md:text-base">Email Address</Label>
                <Input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password" className="mb-2 block text-sm md:text-base">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#16a34a] transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    tabIndex={-1}
                    className="text-[#16a34a] text-xs md:text-sm font-medium underline underline-offset-2 hover:text-[#15803d] transition-colors"
                    onClick={() => router.push('/forgot')}
                  >Forgot password?</button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full text-base font-semibold py-2.5 mt-1 bg-[#16a34a] hover:bg-[#15803d] transition-colors rounded-xl shadow focus:ring-2 focus:ring-[#16a34a]/30 focus:outline-none"
              >
                {loading ? 'Processing...' : 'Sign In'}
              </Button>
            </form>
            <style jsx global>{`
              @keyframes fadeInUp {
                0% { opacity:0; transform: translateY(30px) scale(0.94); }
                80% { opacity:1; transform: translateY(-4px) scale(1.05); }
                100% { opacity:1; transform: translateY(0) scale(1); }
              }
              .animate-fadeInUp { animation: fadeInUp 0.77s cubic-bezier(.6,.4,0,1) both; }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );
}

