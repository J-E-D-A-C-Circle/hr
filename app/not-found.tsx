'use client';

import Image from 'next/image';
import Link from 'next/link';
import { NotFound, Illustration } from "@/components/ui/not-found";

export default function NotFoundPage() {
  return (
    <div className="relative flex flex-col w-full min-h-screen bg-slate-50 overflow-hidden">
      {/* Top Header Navigation Bar */}
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 p-1 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center transition-transform group-hover:scale-105">
              <Image
                src="/oop.png"
                alt="DVLA Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base md:text-lg text-slate-900 tracking-tight leading-tight group-hover:text-[#0d5c2e] transition-colors">
                DVLA NSS Portal
              </span>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline-block">
                Driver & Vehicle Licensing Authority
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#0d5c2e] hover:bg-emerald-50/60 rounded-lg transition-colors"
            >
              Home
            </Link>
            <Link
              href="/login"
              className="px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#0d5c2e] hover:bg-emerald-50/60 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0d5c2e] hover:bg-[#073e1e] rounded-xl transition-all shadow-sm active:scale-95"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      {/* Main 404 Content (Pushed Down) */}
      <main className="relative flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6">
        <Illustration className="absolute inset-0 w-full h-[55vh] opacity-[0.07] text-[#0d5c2e] pointer-events-none" />
        <NotFound
          title="Page Not Found"
          description="The page you are looking for might have been removed, had its name changed, or is temporarily unavailable in the DVLA NSS Portal."
          searchPlaceholder="Search DVLA NSS Portal..."
        />
      </main>

      {/* Footer text */}
      <footer className="mt-auto text-center text-slate-400 text-xs font-medium relative z-10 py-6 border-t border-slate-200/60 bg-white/50">
        &copy; {new Date().getFullYear()} Driver and Vehicle Licensing Authority. All rights reserved.
      </footer>
    </div>
  );
}
