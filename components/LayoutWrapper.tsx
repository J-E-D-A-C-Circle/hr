'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { FileCheck2, ShieldCheck, LogIn } from 'lucide-react';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === '/login') {
    return <div className="min-h-screen bg-slate-900">{children}</div>;
  }

  const isPublicFormPage = pathname === '/' || pathname === '/upload';

  if (isPublicFormPage) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100/80 font-sans">
        {/* Public Clean Header */}
        <header className="sticky top-0 z-20 w-full border-b border-emerald-100 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900 text-white shadow-sm">
                <FileCheck2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-normal text-slate-900 leading-none">PVC Portal</span>
                <span className="text-xs text-slate-500 font-normal mt-0.5">Payroll Validation Form</span>
              </div>
            </Link>
          </div>
        </header>

        {/* Form Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 font-normal px-4">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>PVC Payroll Validation Collection &copy; 2026. All rights reserved.</div>
            <div className="flex items-center gap-4 text-slate-600">
              <span>Monthly Cutoff: 21st</span>
              <span>•</span>
              <span>Central Audit Trail Active</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100/80">
      {/* Sidebar Navigation for Admin Suite */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-80 transition-all duration-300">
        <Header onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">{children}</main>
        <footer className="border-t border-slate-200/80 bg-white/70 py-4 text-center text-xs text-slate-500 font-normal backdrop-blur-md px-4">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>PVC Payroll Validation Collection &copy; 2026. All rights reserved.</div>
            <div className="flex items-center gap-4 text-slate-600">
              <span>Monthly Cutoff: 21st</span>
              <span>•</span>
              <span>Central Audit Trail Active</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
