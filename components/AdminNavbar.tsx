'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Building2, Briefcase, MapPin, ClipboardList } from 'lucide-react';

export default function AdminNavbar({ userRole, userName }: { userRole?: string; userName?: string }) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <div className="bg-[#15803D] text-white shadow-md border-b-2 border-[#D97706]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 gap-3">
          
          {/* Brand & User Role Tag */}
          <div className="flex items-center space-x-3">
            <span className="bg-amber-400 text-gray-950 font-black text-xs px-2.5 py-1 rounded-xl uppercase tracking-wide">
              ADMIN CMS HUB
            </span>
            <div className="text-xs font-semibold text-emerald-100">
              Logged in as <strong className="text-white">{userName || 'Officer'}</strong> ({userRole || 'ADMIN'})
            </div>
          </div>

          {/* Quick CMS Navigation Links */}
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs font-extrabold">
            <Link
              href="/admin/dashboard"
              className={`px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1.5 ${
                pathname === '/admin/dashboard'
                  ? 'bg-white text-[#15803D] font-black shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Applications</span>
            </Link>

            <Link
              href="/admin/departments"
              className={`px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1.5 ${
                isActive('/admin/departments')
                  ? 'bg-white text-[#15803D] font-black shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Departments CMS</span>
            </Link>

            <Link
              href="/admin/positions"
              className={`px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1.5 ${
                isActive('/admin/positions') || isActive('/admin/rubrics')
                  ? 'bg-white text-[#15803D] font-black shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Positions & Rubrics</span>
            </Link>

            <Link
              href="/admin/stations"
              className={`px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1.5 ${
                isActive('/admin/stations')
                  ? 'bg-white text-[#15803D] font-black shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>DVLA Stations CMS</span>
            </Link>

            <Link
              href="/admin/documents"
              className={`px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1.5 ${
                isActive('/admin/documents')
                  ? 'bg-white text-[#15803D] font-black shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Document Checklist CMS</span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
