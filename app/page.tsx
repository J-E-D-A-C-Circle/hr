'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash screen first
    if (showSplash) {
      const splashTimer = setTimeout(() => {
        setShowSplash(false);
      }, 3000);

      return () => clearTimeout(splashTimer);
    } else {
      // After splash, check authentication and redirect
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/register');
      }
    }
  }, [showSplash, router]);

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-50 dvla-splash-container flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center z-10">
          {/* Animated Logo */}
          <div className="dvla-splash-logo relative z-20">
            <Image
              src="/oop.png"
              alt="DVLA Logo - Driver and Vehicle Licensing Authority"
              width={400}
              height={400}
              priority
              className="w-auto h-auto max-w-[450px] max-h-[450px] md:max-w-[500px] md:max-h-[500px]"
            />
          </div>
          
          {/* Subtle particles/glow effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d4f91] mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
