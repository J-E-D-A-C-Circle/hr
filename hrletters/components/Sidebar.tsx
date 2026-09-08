"use client";

import React from "react";
import Image from "next/image";
import {
  BarChart3,
  FileCode2,
  FileCheck2,
  Archive,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
} from "lucide-react";
import { RoleType } from "./Navbar";

export type TabType =
  | "login"
  | "dashboard"
  | "staff"
  | "my-portal"
  | "templates"
  | "generator"
  | "archive"
  | "audit";

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
  roles: RoleType[];
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard",  label: "Dashboard",          icon: BarChart3,  roles: ["HR_OFFICER", "HR_DIRECTOR", "DEPT_HEAD"] },
  { id: "staff",      label: "Staff Directory",     icon: Users,      roles: ["HR_OFFICER", "HR_DIRECTOR", "DEPT_HEAD"] },
  { id: "my-portal",  label: "My Staff Portal",     icon: Users,      roles: ["STAFF"] },
  { id: "generator",  label: "Generate & Preview",  icon: FileCheck2, roles: ["HR_OFFICER", "HR_DIRECTOR", "DEPT_HEAD"] },
  { id: "templates",  label: "Letter Templates",    icon: FileCode2,  roles: ["HR_OFFICER", "HR_DIRECTOR"] },
  { id: "archive",    label: "Digital Archive",     icon: Archive,    roles: ["HR_OFFICER", "HR_DIRECTOR", "DEPT_HEAD"] },
  { id: "audit",      label: "Audit Logs",          icon: ShieldCheck,roles: ["HR_DIRECTOR", "HR_OFFICER"] },
];

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  currentRole: RoleType;
  theme: "dark" | "light";
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentRole,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const visible = NAV_ITEMS.filter((item) => item.roles.includes(currentRole));

  return (
    <aside
      className={`flex flex-col shrink-0 transition-all duration-200 ease-in-out ${
        isCollapsed ? "w-16" : "w-56"
      }`}
      style={{
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        minHeight: "calc(100vh - 56px)",
      }}
    >
      {/* Header with collapse button */}
      <div
        className={`flex items-center p-3 border-b ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
        style={{ borderColor: "var(--color-border)" }}
      >
        {!isCollapsed && (
          <span
            className="px-1 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-4)" }}
          >
            Workspace
          </span>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg transition-colors cursor-pointer hover:opacity-80"
            style={{ color: "var(--color-text-3)", background: "var(--color-bg)" }}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-blue-500" />
            )}
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-2 space-y-1">
        {visible.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              title={isCollapsed ? label : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-100 cursor-pointer ${
                isCollapsed ? "justify-center px-2" : "justify-start text-left"
              }`}
              style={
                isActive
                  ? { background: "var(--color-accent)", color: "#fff" }
                  : { color: "var(--color-text-2)" }
              }
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "var(--color-border-subtle)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon
                className="w-4 h-4 shrink-0"
                style={{ color: isActive ? "rgba(255,255,255,0.95)" : "var(--color-text-3)" }}
              />
              {!isCollapsed && <span className="truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 space-y-2 border-t" style={{ borderColor: "var(--color-border)" }}>
        {/* DVLA branding */}
        <div
          className={`flex items-center gap-2 px-2 py-1.5 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <div className="relative shrink-0" style={{ width: 22, height: 22 }}>
            <Image src="/oop.png" alt="DVLA" fill sizes="22px" className="object-contain" />
          </div>
          {!isCollapsed && (
            <span className="text-[11px] font-semibold truncate" style={{ color: "var(--color-text-4)" }}>
              DVLA Ghana · HR Letters
            </span>
          )}
        </div>

        {/* DB status */}
        <div
          className={`flex items-center gap-2.5 p-2 rounded-lg ${
            isCollapsed ? "justify-center" : "px-3 py-2.5"
          }`}
          style={{ border: "1px solid var(--color-border)", background: "var(--color-bg)" }}
          title={isCollapsed ? "Database Live (MAMP MySQL 3307)" : undefined}
        >
          <div className="relative shrink-0">
            <span className="block w-2 h-2 rounded-full bg-emerald-500" />
            <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold" style={{ color: "var(--color-text-1)" }}>Database Live</p>
              <p className="text-[11px]" style={{ color: "var(--color-text-3)" }}>
                MAMP MySQL · port <span className="font-mono">3307</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
