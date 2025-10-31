'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if this is a new tab session
    // If sessionStorage doesn't have 'active_session', this is a new tab
    // Clear localStorage auth data so user must login again
    const hasActiveSession = sessionStorage.getItem('active_session');
    
    if (!hasActiveSession) {
      // New tab - clear any existing auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Mark this as an active session
      sessionStorage.setItem('active_session', 'true');
    }

    // Clear session when tab is closed/unloaded
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('active_session');
    };

    // Clear session when page is hidden (tab switch or close)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Don't clear immediately, wait for beforeunload
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Show splash screen for 3 seconds, then redirect to login
    const splashTimer = setTimeout(() => {
      router.push('/login');
    }, 3000);

    return () => {
      clearTimeout(splashTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
