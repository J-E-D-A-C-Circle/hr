'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { adminLogout } from '@/app/actions/admin';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  MapPin,
  ClipboardList,
  Globe,
  LogOut,
  ShieldCheck,
  Settings2,
} from 'lucide-react';

export default function AdminSidebar({ userRole, userName }: { userRole?: string; userName?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = searchParams.get('tab') || 'departments';
  const isCmsRoute = pathname.startsWith('/admin/cms') || ['/admin/departments', '/admin/positions', '/admin/stations', '/admin/documents'].some((p) => pathname.startsWith(p));

  const handleLogout = async () => {
    await adminLogout();
    router.push('/admin/login');
  };

  return (
    <aside className="w-72 md:w-80 bg-[#0F4327] text-white flex flex-col shrink-0 h-screen sticky top-0 border-r-4 border-[#D97706] shadow-2xl z-40">
      {/* Brand Header */}
      <div className="p-5 border-b border-emerald-800/60 bg-[#0B3D26] shrink-0">
        <Link href="/admin/dashboard" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white p-0.5 shadow-md border-2 border-amber-400 flex items-center justify-center shrink-0">
            <Image
              src="/oop.png"
              alt="DVLA Ghana Logo"
              width={40}
              height={40}
              className="object-contain w-full h-full"
            />
          </div>
          <div>
            <div className="font-black text-lg text-white group-hover:text-amber-300 transition tracking-wide leading-tight">
              DVLA DRAP
            </div>
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>ADMIN CMS HUB</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Officer Info Card */}
      <div className="p-3.5 mx-4 my-3 bg-emerald-950/70 border border-emerald-700/60 rounded-2xl shrink-0">
        <div className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Signed In Officer</div>
        <div className="font-extrabold text-sm text-white truncate mt-0.5">{userName || 'Administrator'}</div>
        <span className="inline-block mt-1 bg-amber-400 text-gray-950 font-black text-[10px] px-2.5 py-0.5 rounded-lg uppercase">
          {userRole?.replace('_', ' ') || 'ADMIN'}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1.5 text-xs font-bold overflow-y-auto min-h-0">
        <div className="text-[10px] uppercase font-extrabold text-emerald-300/70 px-3 pt-2 pb-1 tracking-wider">
          Management Console
        </div>

        <Link
          href="/admin/dashboard"
          className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl transition ${
            pathname === '/admin/dashboard'
              ? 'bg-amber-500 text-gray-950 font-black shadow-md'
              : 'text-emerald-100 hover:bg-white/10 hover:text-white'
          }`}
          style={{ height: '42px', maxHeight: '42px' }}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Applications Dashboard</span>
        </Link>

        {/* Main CMS Suite Tab */}
        <Link
          href="/admin/cms?tab=departments"
          className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl transition ${
            isCmsRoute
              ? 'bg-amber-500 text-gray-950 font-black shadow-md'
              : 'text-emerald-100 hover:bg-white/10 hover:text-white'
          }`}
          style={{ height: '42px', maxHeight: '42px' }}
        >
          <Settings2 className="w-4 h-4 shrink-0 text-amber-950" />
          <span>CMS Management Suite</span>
        </Link>

        {/* CMS Sub-Switcher Items */}
        <div className="pl-4 pr-1 space-y-1 pt-1 border-l-2 border-emerald-700/50 ml-4 my-1">
          <Link
            href="/admin/cms?tab=departments"
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[11px] transition ${
              isCmsRoute && activeTab === 'departments'
                ? 'bg-white/20 text-amber-300 font-extrabold'
                : 'text-emerald-200/80 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span>Departments</span>
          </Link>

          <Link
            href="/admin/cms?tab=positions"
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[11px] transition ${
              isCmsRoute && activeTab === 'positions'
                ? 'bg-white/20 text-amber-300 font-extrabold'
                : 'text-emerald-200/80 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            <span>Positions & Rubrics</span>
          </Link>

          <Link
            href="/admin/cms?tab=stations"
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[11px] transition ${
              isCmsRoute && activeTab === 'stations'
                ? 'bg-white/20 text-amber-300 font-extrabold'
                : 'text-emerald-200/80 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>DVLA Stations</span>
          </Link>

          <Link
            href="/admin/cms?tab=documents"
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[11px] transition ${
              isCmsRoute && activeTab === 'documents'
                ? 'bg-white/20 text-amber-300 font-extrabold'
                : 'text-emerald-200/80 hover:text-white'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 shrink-0" />
            <span>Document Checklist</span>
          </Link>

          <Link
            href="/admin/cms?tab=panel-monitor"
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[11px] transition ${
              isCmsRoute && activeTab === 'panel-monitor'
                ? 'bg-white/20 text-amber-300 font-extrabold'
                : 'text-emerald-200/80 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Panel Consensus Monitor</span>
          </Link>

          <Link
            href="/admin/cms?tab=fraud"
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[11px] transition ${
              isCmsRoute && activeTab === 'fraud'
                ? 'bg-white/20 text-amber-300 font-extrabold'
                : 'text-emerald-200/80 hover:text-white'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 shrink-0 text-red-400" />
            <span>Fraud & Authenticity Hub</span>
          </Link>
        </div>
      </nav>

      {/* Bottom Action Buttons */}
      <div className="p-4 border-t border-emerald-800/60 bg-[#0B3D26] space-y-2 shrink-0">
        <Link
          href="/"
          target="_blank"
          className="w-full flex items-center justify-center space-x-2 bg-emerald-800 hover:bg-emerald-700 text-white px-4 rounded-xl font-bold text-xs shadow transition border border-emerald-600/50"
          style={{ height: '40px', maxHeight: '40px' }}
        >
          <Globe className="w-4 h-4 shrink-0" />
          <span>Go to Main Website ↗</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 rounded-xl font-bold text-xs shadow transition cursor-pointer"
          style={{ height: '40px', maxHeight: '40px' }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out Session</span>
        </button>
      </div>
    </aside>
  );
}
