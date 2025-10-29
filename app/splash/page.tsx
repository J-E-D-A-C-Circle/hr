'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SplashPage() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash for 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
      
      // Check if user is logged in and redirect accordingly
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
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  if (!showSplash) {
    return null;
  }

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

