'use client';

import React from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  BarChart3,
  History,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';

export type AdminTabId = 
  | 'overview' 
  | 'applications' 
  | 'personnel' 
  | 'stations' 
  | 'analytics' 
  | 'audit';

interface AdminSidebarProps {
  activeTab: AdminTabId;
  setActiveTab: (tab: AdminTabId) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  pendingCount: number;
  totalPersonnelCount: number;
  user: any;
  onLogout: () => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  pendingCount,
  totalPersonnelCount,
  user,
  onLogout,
  mobileOpen = false,
  setMobileOpen
}: AdminSidebarProps) {
  const navItems = [
    {
      id: 'overview' as AdminTabId,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'applications' as AdminTabId,
      label: 'Applications Desk',
      icon: FileText,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: 'bg-amber-400 text-slate-950 border-amber-300',
    },
    {
      id: 'personnel' as AdminTabId,
      label: 'Personnel Roster',
      icon: Users,
      badge: totalPersonnelCount > 0 ? totalPersonnelCount : null,
      badgeColor: 'bg-emerald-200 text-[#0d5c2e] border-emerald-100',
    },
    {
      id: 'stations' as AdminTabId,
      label: 'Station & Placement',
      icon: Building2,
      badge: null,
    },
    {
      id: 'analytics' as AdminTabId,
      label: 'Analytics & Reports',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'audit' as AdminTabId,
      label: 'Audit & Activity Logs',
      icon: History,
      badge: null,
    },
  ];

  const handleTabClick = (tabId: AdminTabId) => {
    setActiveTab(tabId);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 md:z-30 flex flex-col h-screen bg-gradient-to-b from-[#0d5c2e] via-[#094824] to-[#063519] border-r border-[#094824] text-white shadow-xl transition-all duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-20' : 'md:w-72'}`}
      >
        {/* Header / Brand with Big DVLA Logo */}
        <div className="flex items-center justify-between p-4 border-b border-emerald-800/60">
          <div className="flex items-center gap-3.5 overflow-hidden">
            <div className="relative flex items-center justify-center w-14 h-14 p-2 bg-white rounded-2xl shadow-lg ring-2 ring-white/30 border border-emerald-100 shrink-0">
              <Image
                src="/dvla-logo.png"
                alt="DVLA Logo"
                width={56}
                height={56}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-lg tracking-tight text-white truncate">DVLA NSS</span>
                <span className="text-xs text-emerald-200/90 font-medium truncate">Admin Portal</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>

            {/* Mobile Close Button */}
            {mobileOpen && (
              <button
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className="md:hidden p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
          <div className={`px-3 mb-2 text-[11px] font-extrabold text-emerald-300/80 uppercase tracking-wider ${collapsed && !mobileOpen ? 'text-center' : ''}`}>
            {collapsed && !mobileOpen ? '•••' : 'Main Menu'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isCollapsedDesktop = collapsed && !mobileOpen;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`group relative flex items-center w-full px-3.5 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-[#0d5c2e] shadow-md shadow-emerald-950/40 font-extrabold scale-[1.01]'
                    : 'text-emerald-100/90 hover:text-white hover:bg-white/10 font-semibold'
                } ${isCollapsedDesktop ? 'justify-center' : 'justify-between'}`}
                title={isCollapsedDesktop ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-[#0d5c2e]' : 'text-emerald-200 group-hover:text-white'
                    }`}
                  />
                  {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
                </div>

                {(!collapsed || mobileOpen) && item.badge !== null && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-black border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Collapsed Badge Dot */}
                {isCollapsedDesktop && item.badge !== null && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-[#0d5c2e] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Profile & Logout */}
        <div className="p-3 border-t border-emerald-800/60 bg-black/20">
          {!collapsed || mobileOpen ? (
            <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/10 border border-white/15 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-white text-[#0d5c2e] flex items-center justify-center font-black text-sm shadow shrink-0">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-extrabold text-white truncate">
                    {user?.full_name || 'System Admin'}
                  </span>
                  <span className="text-[11px] text-emerald-200/90 font-medium truncate">
                    {user?.email || 'admin@dvla.gov.gh'}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900/40 transition-colors shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogout}
              className="flex items-center justify-center w-full p-2.5 rounded-xl text-rose-300 hover:text-white hover:bg-rose-900/40 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
