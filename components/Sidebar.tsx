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
  FolderKanban,
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
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
  activeMatch: (p: string) => boolean;
}

export default function Sidebar({
  mobileOpen = false,
  setMobileOpen,
  collapsed: externalCollapsed,
  setCollapsed: externalSetCollapsed,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);

  // Internal state fallback if props not provided
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const setCollapsed = externalSetCollapsed || setInternalCollapsed;

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
  const isFinanceOfficer = user?.role === 'FINANCE_OFFICER';

  const mainNav: NavItem[] = [
    ...(isHrAdmin
      ? [
          {
            name: 'Dashboard',
            href: '/admin',
            icon: LayoutGrid,
            activeMatch: (p: string) => p === '/admin',
          },
          {
            name: 'Review Queue',
            href: '/review',
            icon: ClipboardCheck,
            badge: 'HR',
            badgeColor: 'bg-emerald-800 text-emerald-200 border-emerald-700',
            activeMatch: (p: string) => p === '/review',
          },
        ]
      : isFinanceOfficer
      ? [
          {
            name: 'Review Queue',
            href: '/review',
            icon: ClipboardCheck,
            badge: 'Finance',
            badgeColor: 'bg-teal-800 text-teal-200 border-teal-700',
            activeMatch: (p: string) => p === '/review',
          },
        ]
      : [
          {
            name: 'Upload Portal',
            href: '/upload',
            icon: FileUp,
            activeMatch: (p: string) => p === '/' || p === '/upload',
          },
        ]),
    {
      name: 'Compliance Grid',
      href: '/compliance',
      icon: FileCheck2,
      activeMatch: (p: string) => p === '/compliance',
    },
  ];

  const adminNav: NavItem[] = isHrAdmin
    ? [
        {
          name: 'Content Management',
          href: '/admin/content-management',
          icon: FolderKanban,
          activeMatch: (p: string) =>
            p.startsWith('/admin/content-management') ||
            p === '/admin/branches-users' ||
            p === '/admin/deadlines',
        },
        {
          name: 'History Logs',
          href: '/admin/audit',
          icon: ShieldAlert,
          activeMatch: (p: string) => p === '/admin/audit',
        },
      ]
    : [];

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
          className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-semibold transition-all duration-200 ${
            isActive
              ? 'bg-white text-emerald-900 shadow-md font-bold'
              : 'text-emerald-100/90 hover:bg-emerald-800/70 hover:text-white'
          }`}
          title={collapsed ? item.name : undefined}
        >
          <Icon
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
              isActive
                ? 'text-emerald-700 scale-110'
                : 'text-emerald-300 group-hover:scale-110 group-hover:text-white'
            }`}
          />
          {!collapsed && (
            <span className="flex-1 truncate tracking-normal font-semibold">
              {item.name}
            </span>
          )}

          {!collapsed && item.badge && (
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                item.badgeColor || 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30'
              }`}
            >
              {item.badge}
            </span>
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-md group-hover:scale-105 transition-transform overflow-hidden">
              <img src="/oop.png" alt="PVC Portal Logo" className="h-full w-full object-contain" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-lg text-white font-semibold">
                  PVC Portal
                </span>
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

          {/* Content Management Navigation Group */}
          {adminNav.length > 0 && (
            <div>
              {!collapsed && (
                <h2 className="mb-2 px-3 text-xs uppercase tracking-wider text-emerald-300/80">
                  Content Management
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
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-emerald-100 font-bold border border-emerald-700 text-xs shadow-inner">
                {getInitials(user.name)}
              </div>
              {!collapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-white truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-emerald-300 truncate">
                    {user.role === 'HR_ADMIN'
                      ? 'HR Administrator'
                      : user.role === 'FINANCE_OFFICER'
                      ? 'Finance Officer'
                      : user.branchName || 'Station Manager'}
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
            className="flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-emerald-50 py-2.5 text-xs text-emerald-900 font-semibold transition shadow-sm"
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
      {/* Desktop Fixed Sidebar */}
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
