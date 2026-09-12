'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getValidAuthToken, getStoredUser } from '@/lib/auth-client';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      const token = getValidAuthToken();
      const user = getStoredUser();
      if (token && user) {
        if (user.role === 'admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/dashboard');
        }
      } else {
        router.replace('/login');
      }
    }, 2000);

    return () => clearTimeout(splashTimer);
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 dvla-splash-container flex items-center justify-center bg-gradient-to-br from-[#0d5c2e] via-[#073e1e] to-[#0d5c2e]">
      <div className="relative w-full h-full flex flex-col items-center justify-center z-10 gap-6">
        {/* Animated Logo */}
        <div className="dvla-splash-logo relative z-20">
          <Image
            src="/oop.png"
            alt="DVLA Logo - Driver and Vehicle Licensing Authority"
            width={280}
            height={280}
            priority
            className="w-auto h-auto max-w-[280px] md:max-w-[320px] drop-shadow-2xl"
          />
        </div>

        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          Loading DVLA Portal...
        </div>

        {/* Glow effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
