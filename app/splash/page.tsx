'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SplashPage() {
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

    // Show splash for 3 seconds, then redirect to login
    const timer = setTimeout(() => {
      router.push('/login');
    }, 3000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  return (
    <div className="dvla-splash-container">
      <div className="dvla-splash-content">
        {/* Animated Logo */}
        <div className="dvla-splash-logo">
          <Image
            src="/oop.png"
            alt="DVLA Logo"
            width={300}
            height={300}
            priority
            className="w-auto h-auto max-w-[400px] max-h-[400px]"
            style={{
              animation: 'logoFadeIn 1s ease-out, logoPulse 3s ease-in-out infinite 1s, logoGlow 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    </div>
  );
}
