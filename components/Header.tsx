'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Clock,
  Building,
  FileUp,
  ClipboardCheck,
  LayoutGrid,
  Building2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  branchName?: string;
}

export default function Header({ onOpenMobileMenu }: HeaderProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => setUser(null));
  }, [pathname]);

  if (pathname === '/login') return null;

  // Map route to title and icon
  const routeMeta: Record<string, { title: string; subtitle: string; icon: any }> = {
    '/': { title: 'Upload Portal', subtitle: 'Station Payroll Validation Upload', icon: FileUp },
    '/upload': { title: 'Upload Portal', subtitle: 'Station Payroll Validation Upload', icon: FileUp },
    '/review': { title: 'Review Queue', subtitle: 'HR Payroll Compliance Review', icon: ClipboardCheck },
    '/compliance': { title: 'Compliance Grid', subtitle: '50+ Station Monthly Grid Matrix', icon: LayoutGrid },
    '/admin/branches-users': { title: 'Stations & Users', subtitle: 'Branch & User Account Management', icon: Building2 },
    '/admin/deadlines': { title: 'Deadlines & Reminders', subtitle: 'Monthly Cycle Cutoff Management', icon: Clock },
    '/admin/audit': { title: 'Audit Trail', subtitle: 'System-wide Security & Action Log', icon: ShieldAlert },
  };

  const currentMeta = routeMeta[pathname] || {
    title: 'Payroll Validation System',
    subtitle: 'PVC Enterprise Management Portal',
    icon: ShieldCheck,
  };

  const PageIcon = currentMeta.icon;

  const currentDate = new Date();
  const cutoffDay = 21;
  const daysRemaining = cutoffDay - currentDate.getDate();
  const isOverdue = currentDate.getDate() > cutoffDay;

  return (
    <header className="sticky top-0 z-20 w-full border-b border-emerald-100/90 bg-white/90 backdrop-blur-xl transition-all shadow-xs">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Trigger & Page Title */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
            aria-label="Open sidebar navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
              <PageIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-normal text-slate-900 font-sans leading-none">
                  {currentMeta.title}
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5 hidden sm:block">
                {currentMeta.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Cycle Cutoff Pill & Station Badge */}
        <div className="flex items-center gap-3">
          {/* Station Branch Pill */}
          {user?.branchName && (
            <div className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold shadow-2xs">
              <Building className="h-3.5 w-3.5 text-emerald-600" />
              <span>{user.branchName}</span>
            </div>
          )}

          {/* Cutoff Status Badge */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border shadow-2xs transition-all ${
              isOverdue
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200/90'
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>
              {isOverdue ? 'Cutoff Passed (21st)' : `Cutoff: ${daysRemaining} day(s) left`}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
