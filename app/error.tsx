'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-72 h-72 bg-red-200 rounded-full blur-3xl opacity-30 pointer-events-none" />
      
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-10 text-center relative z-10 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />
        
        {/* Logo or Icon */}
        <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 border-8 border-white shadow-sm ring-1 ring-slate-100">
          <AlertOctagon className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
          System Error
        </h1>
        
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          We encountered an unexpected error while processing your request in the DVLA NSS Portal. Our technical team has been notified.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all active:scale-95 shadow-md hover:shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
          
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-all active:scale-95 shadow-sm hover:shadow"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
      
      {/* Footer text */}
      <div className="mt-12 text-center text-slate-400 text-xs font-medium relative z-10">
        &copy; {new Date().getFullYear()} Driver and Vehicle Licensing Authority
      </div>
    </div>
  );
}
