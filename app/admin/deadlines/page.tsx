'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeadlinesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/content-management?tab=DEADLINES');
  }, [router]);

  return (
    <div className="p-12 text-center text-xs font-bold text-slate-500">
      Redirecting to Content Management Hub...
    </div>
  );
}
