'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { clearAuthSession, isTokenExpired } from '@/lib/auth-client';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_BEFORE_MS = 60 * 1000; // Warn 1 minute before logout
const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot', '/splash'];

export default function SessionTimeoutGuard() {
  const pathname = usePathname();
  const lastActivityRef = useRef<number>(Date.now());
  const warnedRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || (p !== '/' && pathname?.startsWith(p + '/')));
    if (isPublic) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    if (isTokenExpired(token)) {
      clearAuthSession();
      window.location.href = '/login?reason=timeout';
      return;
    }

    lastActivityRef.current = Date.now();
    warnedRef.current = false;

    const recordActivity = () => {
      lastActivityRef.current = Date.now();
      warnedRef.current = false;
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((evt) => window.addEventListener(evt, recordActivity, { passive: true }));

    const checkIdle = () => {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) return;

      if (isTokenExpired(currentToken)) {
        clearAuthSession();
        window.location.href = '/login?reason=timeout';
        return;
      }

      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs >= IDLE_TIMEOUT_MS) {
        clearAuthSession();
        window.location.href = '/login?reason=timeout';
        return;
      }

      if (idleMs >= IDLE_TIMEOUT_MS - WARNING_BEFORE_MS && !warnedRef.current) {
        warnedRef.current = true;
        toast('You will be logged out in 1 minute due to inactivity.', { icon: '⏳' });
      }
    };

    const interval = setInterval(checkIdle, 15000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkIdle();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      events.forEach((evt) => window.removeEventListener(evt, recordActivity));
    };
  }, [pathname]);

  return null;
}
