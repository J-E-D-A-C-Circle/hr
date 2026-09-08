"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Bell, Sun, Moon, UserCheck, PanelLeft, LogOut } from "lucide-react";
import { Select } from "./ui/Select";

export type RoleType = "HR_OFFICER" | "HR_DIRECTOR" | "DEPT_HEAD" | "STAFF";

const ROLE_CONFIG: Record<RoleType, { label: string; color: string }> = {
  HR_OFFICER:  { label: "HR Officer",     color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  HR_DIRECTOR: { label: "HR Director",    color: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20" },
  DEPT_HEAD:   { label: "Dept Head",      color: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20" },
  STAFF:       { label: "Staff Member",   color: "bg-emerald-600/10 text-emerald-800 dark:text-emerald-300 border-emerald-600/20" },
};

const ROLE_OPTIONS = [
  { value: "HR_OFFICER",  label: "HR Officer — Drafting & Records" },
  { value: "HR_DIRECTOR", label: "HR Director — Approvals & Signatures" },
  { value: "DEPT_HEAD",   label: "Dept Head — Recommender" },
  { value: "STAFF",       label: "Staff Portal User — Employee" },
];

interface NavbarProps {
  currentRole: RoleType;
  onRoleChange: (role: RoleType) => void;
  onLogout?: () => void;
  notificationsCount: number;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  onLogout,
  notificationsCount,
  theme,
  onToggleTheme,
  onToggleSidebar,
}) => {
  const [showNotes, setShowNotes] = useState(false);
  const role = ROLE_CONFIG[currentRole];

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-5"
      style={{
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        height: "56px",
      }}
    >
      {/* ── Brand ── */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg transition-colors cursor-pointer hover:opacity-80"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-2)",
            }}
            title="Toggle Sidebar"
          >
            <PanelLeft className="w-4 h-4 text-blue-500" />
          </button>
        )}

        <div className="relative shrink-0" style={{ width: 34, height: 34 }}>
          <Image src="/oop.png" alt="DVLA Seal" fill sizes="34px" className="object-contain" priority />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight" style={{ color: "var(--color-text-1)" }}>
            DVLA <span className="text-blue-600 dark:text-blue-400">HR Portal</span>
          </span>
          <span className="text-[11px] font-medium hidden sm:block" style={{ color: "var(--color-text-3)" }}>
            Letters · Staff Records · Archive
          </span>
        </div>
      </div>

      {/* ── User & Controls ── */}
      <div className="flex items-center gap-2.5">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${role?.color || ''}`}>
          <UserCheck className="w-3.5 h-3.5" />
          {role?.label || 'Guest'}
        </span>

        <div className="w-px h-5 mx-1 shrink-0" style={{ background: "var(--color-border)" }} />

        <button
          onClick={onToggleTheme}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer hover:opacity-80"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-2)",
          }}
          title="Toggle theme"
        >
          {theme === "dark"
            ? <Sun className="w-3.5 h-3.5 text-amber-500" />
            : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
          <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
        </button>

        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20"
            title="Log Out to Demo Login Page"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer hover:opacity-80"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-2)",
            }}
          >
            <Bell className="w-4 h-4" />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {notificationsCount}
              </span>
            )}
          </button>

          {showNotes && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden animate-fade-up z-50"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
                <span className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>Notifications</span>
                <span className="text-xs" style={{ color: "var(--color-text-3)" }}>Live</span>
              </div>
              <div className="p-2 space-y-1">
                {[
                  { title: "Appointment Letter Pending Approval", sub: "Draft ready for Kofi Mensah (Ref: V-DVLA-712986)", time: "2m ago" },
                  { title: "Letter Acknowledged", sub: "Ama Asante confirmed receipt of Promotion Letter", time: "18m ago" },
                ].map((n, i) => (
                  <div
                    key={i}
                    className="flex gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                    style={{ color: "var(--color-text-1)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-border-subtle)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{n.title}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-3)" }}>{n.sub}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-4)" }}>{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
