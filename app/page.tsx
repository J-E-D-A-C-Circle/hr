'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    const splashTimer = setTimeout(() => {
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.role === 'admin') {
            router.replace('/admin/dashboard');
          } else {
            router.replace('/dashboard');
          }
          return;
        } catch (e) {}
      }
      router.push('/login');
    }, 2000);

    return () => clearTimeout(splashTimer);
  }, [router]);

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
