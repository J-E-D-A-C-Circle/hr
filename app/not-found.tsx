import Link from 'next/link';
import Image from 'next/image';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-72 h-72 bg-emerald-200 rounded-full blur-3xl opacity-30 pointer-events-none" />
      
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-10 text-center relative z-10 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600" />
        
        {/* Logo or Icon */}
        <div className="mx-auto w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border-8 border-white shadow-sm ring-1 ring-slate-100">
          <AlertTriangle className="w-10 h-10 text-emerald-600" />
        </div>
        
        <h1 className="text-6xl font-black text-slate-900 mb-2 tracking-tighter">
          4<span className="text-emerald-500">0</span>4
        </h1>
        
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Page Not Found
        </h2>
        
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable in the DVLA NSS Portal.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all active:scale-95 shadow-md hover:shadow-lg"
          >
            <Home className="w-4 h-4" />
            Return Home
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
