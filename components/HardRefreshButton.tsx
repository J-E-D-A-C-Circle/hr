'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

interface HardRefreshButtonProps {
  className?: string;
}

/**
 * Forces a cache-clearing hard refresh of the current route so users
 * always see the latest server data and client bundle.
 */
export default function HardRefreshButton({ className = '' }: HardRefreshButtonProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const handleHardRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);

    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((key) => window.caches.delete(key)));
      }
      router.refresh();
    } catch {
      // Proceed with hard reload even if CacheStorage is unavailable
    } finally {
      window.location.reload();
    }
  };

  return (
    <button
      type="button"
      onClick={handleHardRefresh}
      disabled={refreshing}
      title="Hard Refresh (clear cache & reload)"
      aria-label="Hard Refresh page"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition cursor-pointer disabled:opacity-60 ${className}`}
    >
      <RefreshCw className={`h-3.5 w-3.5 text-emerald-600 ${refreshing ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
    </button>
  );
}
