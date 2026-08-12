'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileUp,
  ClipboardCheck,
  LayoutGrid,
  Building2,
  Clock,
  ShieldAlert,
  LogOut,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  X,
  UserCheck,
} from 'lucide-react';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  branchName?: string;
}

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
  activeMatch: (p: string) => boolean;
}

export default function Sidebar({ mobileOpen = false, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (pathname === '/login') {
    return null;
  }

  const isHrAdmin = user?.role === 'HR_ADMIN';

  const mainNav: NavItem[] = [
    {
      name: 'Review Queue',
      href: '/review',
      icon: ClipboardCheck,
      badge: 'Review',
      badgeColor: 'bg-emerald-800 text-emerald-200 border-emerald-700',
      activeMatch: (p: string) => p === '/review',
    },
    {
      name: 'Compliance Grid',
      href: '/compliance',
      icon: LayoutGrid,
      badge: 'Matrix',
      badgeColor: 'bg-emerald-800 text-emerald-200 border-emerald-700',
      activeMatch: (p: string) => p === '/compliance',
    },
    {
      name: 'Public Form Preview',
      href: '/upload',
      icon: FileUp,
      badge: 'Public',
      badgeColor: 'bg-emerald-800 text-emerald-200 border-emerald-700',
      activeMatch: (p: string) => p === '/' || p === '/upload',
    },
  ];

  const adminNav: NavItem[] = [
    {
      name: 'Station Directory',
      href: '/admin/branches-users',
      icon: Building2,
      activeMatch: (p: string) => p === '/admin/branches-users',
    },
    {
      name: 'Audit Trail Log',
      href: '/admin/audit',
      icon: ShieldAlert,
      activeMatch: (p: string) => p === '/admin/audit',
    },
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const renderNavLinks = (items: NavItem[]) => {
    return items.map((item) => {
      const isActive = item.activeMatch(pathname);
      const Icon = item.icon;

      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMobileOpen?.(false)}
          title={collapsed ? item.name : undefined}
          className={`group flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm transition-all duration-150 ${
            isActive
              ? 'bg-emerald-800 text-white border border-emerald-700 shadow-sm'
              : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white border border-transparent'
          }`}
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${
              isActive
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'bg-emerald-950/40 text-emerald-200 group-hover:bg-emerald-800 group-hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
          </div>

          {!collapsed && (
            <div className="flex flex-1 items-center justify-between overflow-hidden">
              <span className="truncate">{item.name}</span>
              {item.badge && (
                <span
                  className={`ml-2 shrink-0 rounded-md border px-2 py-0.5 text-xs ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </div>
          )}
        </Link>
      );
    });
  };

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between bg-emerald-900 text-white sidebar-scroll border-r border-emerald-800 shadow-xl">
      {/* Top Brand Header */}
      <div>
        <div className="flex h-16 items-center justify-between px-5 border-b border-emerald-800/80">
          <Link
            href="/"
            className="flex items-center gap-3 transition group overflow-hidden"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-900 shadow-md group-hover:scale-105 transition-transform">
              <FileCheck2 className="h-5 w-5 text-emerald-800" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg text-white">
                    PVC Portal
                  </span>
                  <span className="rounded-md bg-emerald-800 px-1.5 py-0.5 text-xs text-emerald-200 border border-emerald-700">
                    v1.0
                  </span>
                </div>
                <span className="text-xs text-emerald-200/80 truncate">
                  Payroll Validation Collection
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-800/80 text-emerald-200 hover:bg-emerald-800 hover:text-white transition border border-emerald-700/80 cursor-pointer"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-800 text-emerald-200 hover:bg-emerald-700 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Content */}
        <div className="space-y-5 px-3.5 py-4">
          {/* Main Navigation Group */}
          <div>
            {!collapsed && (
              <h2 className="mb-2 px-3 text-xs uppercase tracking-wider text-emerald-300/80">
                Workspace
              </h2>
            )}
            <nav className="space-y-1">{renderNavLinks(mainNav)}</nav>
          </div>

          {/* Admin Navigation Group */}
          {adminNav.length > 0 && (
            <div>
              {!collapsed && (
                <h2 className="mb-2 px-3 text-xs uppercase tracking-wider text-emerald-300/80">
                  Administration
                </h2>
              )}
              <nav className="space-y-1">{renderNavLinks(adminNav)}</nav>
            </div>
          )}
        </div>
      </div>

      {/* Bottom User Card */}
      <div className="border-t border-emerald-800/80 p-4 bg-emerald-950/80">
        {user ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-900 text-xs shadow-sm">
                {getInitials(user.name)}
              </div>

              {!collapsed && (
                <div className="flex flex-col truncate">
                  <span className="text-xs text-white truncate">
                    {user.name}
                  </span>
                  <span className="text-xs text-emerald-200/80 truncate">
                    {user.branchName || user.email}
                  </span>
                  <span className="inline-block mt-0.5 text-xs text-emerald-300 uppercase tracking-wider">
                    {user.role === 'HR_ADMIN' ? 'HR Administrator' : 'Station Manager'}
                  </span>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={handleLogout}
                title="Log Out"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-900 text-emerald-200 hover:bg-rose-900/60 hover:text-rose-200 border border-emerald-800 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-emerald-50 py-2.5 text-xs text-emerald-900 transition shadow-sm"
          >
            <UserCheck className="h-4 w-4" />
            {!collapsed && <span>Sign In</span>}
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar (w-80) */}
      <aside
        className={`hidden lg:block fixed left-0 top-0 bottom-0 z-30 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-80'
        }`}
      >
        {SidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen?.(false)}
          />
          <div className="relative z-10 w-80 max-w-[85vw] flex-1">
            {SidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
