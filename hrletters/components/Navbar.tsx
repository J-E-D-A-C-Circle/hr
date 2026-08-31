"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Bell, Sun, Moon, UserCheck, PanelLeft } from "lucide-react";
import { Select } from "./ui/Select";

export type RoleType = "HR_OFFICER" | "HR_DIRECTOR" | "DEPT_HEAD";

const ROLE_CONFIG: Record<RoleType, { label: string; color: string }> = {
  HR_OFFICER:  { label: "HR Officer",     color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  HR_DIRECTOR: { label: "HR Director",    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  DEPT_HEAD:   { label: "Dept Head",      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" },
};

const ROLE_OPTIONS = [
  { value: "HR_OFFICER",  label: "HR Officer — Drafting & Records" },
  { value: "HR_DIRECTOR", label: "HR Director — Approvals & Signatures" },
  { value: "DEPT_HEAD",   label: "Dept Head — Recommender" },
];

interface NavbarProps {
  currentRole: RoleType;
  onRoleChange: (role: RoleType) => void;
  notificationsCount: number;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
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

      {/* ── Controls ── */}
      <div className="flex items-center gap-2">
        <div className="w-64 hidden md:block">
          <Select
            value={currentRole}
            onChange={(v) => onRoleChange(v as RoleType)}
            options={ROLE_OPTIONS}
            icon={<UserCheck className="w-4 h-4 text-blue-500" />}
          />
        </div>

        <span className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${role.color}`}>
          {role.label}
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
