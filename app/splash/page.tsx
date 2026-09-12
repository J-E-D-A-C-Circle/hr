'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getValidAuthToken, getStoredUser } from '@/lib/auth-client';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
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

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="dvla-splash-container flex items-center justify-center min-h-screen bg-slate-950">
      <div className="dvla-splash-content flex flex-col items-center justify-center gap-6">
        <div className="dvla-splash-logo">
          <Image
            src="/oop.png"
            alt="DVLA Logo"
            width={260}
            height={260}
            priority
            className="w-auto h-auto max-w-[280px]"
          />
        </div>
      </div>
    </div>
  );
}
