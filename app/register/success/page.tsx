'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

import { getValidAuthToken, getStoredUser } from '@/lib/auth-client';

export default function RegisterSuccess() {
  const router = useRouter();

  // Redirect if already authenticated with a valid token
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = getValidAuthToken();
      const user = getStoredUser();

      if (token && user) {
        if (user.role === 'admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/dashboard');
        }
      }
    }
  }, [router]);
  return (
    <div className="min-h-screen flex bg-white">
      {/* Side panel (desktop only, 30% width) */}
      <div className="hidden md:flex flex-col items-center justify-center w-[30vw] min-w-[260px] max-w-[420px] bg-gradient-to-br from-[#17803f] via-[#16a34a] to-[#149a5e] relative">
        <div className="absolute inset-0 bg-black/10" />
        <div className="z-10 flex flex-col items-center justify-center px-7">
          <Image src="/oop.png" width={100} height={100} alt="DVLA Logo" className="mx-auto mb-8 rounded-full bg-white/70 p-2 shadow" />
          <h1 className="text-3xl font-extrabold text-white mb-3 text-center">Welcome to <br />DVLA - NSS Portal</h1>
          <div className="text-lg font-medium text-white mb-2 text-center opacity-90">Track your NSS posting applications.</div>
        </div>
        <div className="absolute left-0 bottom-0 w-full px-7 pb-7 flex justify-between items-center">
          <span />
          <Button
            variant="ghost"
            className="bg-[#16a34a] text-white font-bold rounded-full px-6 py-3 text-base shadow-md hover:bg-[#15803d] flex items-center"
            onClick={() => router.replace('/login')}
          >
            Already have an account? Login <span className='text-xl ml-1'>→</span>
          </Button>
        </div>
      </div>
      {/* Main success card (70%) */}
      <div className="flex flex-col items-center justify-center w-full md:w-[70vw] min-h-screen px-4 bg-white">
        <div className="flex flex-col items-center w-full max-w-md mx-auto gap-6 py-14 md:py-0">
          <div className="bg-[#16a34a] rounded-full flex items-center justify-center w-24 h-24 mb-4">
            <Check className="w-14 h-14 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-1 text-center">Success!</h2>
          <p className="text-base text-gray-700 mb-6 text-center max-w-sm">You’ve successfully submitted your application.</p>
          <Button
            className="bg-[#16a34a] hover:bg-[#15803d] px-9 py-3 w-full font-semibold text-base rounded-full shadow"
            onClick={() => router.replace('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
