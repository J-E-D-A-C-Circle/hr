"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Building2,
  Menu,
  X,
  Clock,
  LogOut,
  ChevronRight,
  Search,
  Sun,
  Moon,
  Calculator,
  TrendingUp,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
} from "lucide-react";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [stats, setStats] = useState<{ active: number; expiring: number } | null>(null);

  // Theme state: "light" or "dark" (default to light mode)
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const applyTheme = (t: "light" | "dark") => {
    if (t === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  };

  useEffect(() => {
    // Check saved theme preference (default to light)
    const savedTheme = localStorage.getItem("tempstaff_theme") as "light" | "dark" | null;
    const initialTheme = savedTheme === "dark" ? "dark" : "light";
    setTheme(initialTheme);
    applyTheme(initialTheme);

    // Check saved sidebar collapsed state
    const savedCollapsed = localStorage.getItem("tempstaff_sidebar_collapsed");
    if (savedCollapsed !== null) {
      setCollapsed(savedCollapsed === "true");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("tempstaff_theme", nextTheme);
    applyTheme(nextTheme);
  };

  const toggleCollapsed = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    localStorage.setItem("tempstaff_sidebar_collapsed", String(nextState));
  };

  useEffect(() => {
    // Check active session status
    if (pathname !== "/login") {
      fetch("/api/auth/check")
        .then((res) => {
          if (!res.ok) {
            router.push("/login");
          }
        })
        .catch(() => {});
    }

    // Fetch quick stats for sidebar badges
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.statusCounts) {
          setStats({
            active: json.data.statusCounts["Active"] || 0,
            expiring: json.data.statusCounts["Expiring Soon"] || 0,
          });
        }
      })
      .catch(() => {});
  }, [pathname, router]);

  const userRole = "HR Manager";

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: "Staff Directory",
      href: "/staff",
      icon: Users,
      badge: stats?.active !== undefined ? `${stats.active}` : null,
      badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    },
    {
      label: "Deductions",
      href: "/deductions",
      icon: Calculator,
      badge: null,
    },
    {
      label: "History & Analytics",
      href: "/history",
      icon: TrendingUp,
      badge: null,
    },
    {
      label: "Audit Logs",
      href: "/audit-logs",
      icon: ShieldCheck,
      badge: null,
    },
    {
      label: "Staff Payslips",
      href: "/payslip",
      icon: Receipt,
      badge: null,
    },
    {
      label: "Monthly Export",
      href: "/export",
      icon: Download,
      badge: null,
    },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Don't render sidebar on login page
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-colors duration-200">
      {/* Mobile Top App Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 p-0.5 flex items-center justify-center shadow-md shadow-emerald-500/10 shrink-0">
            <img src="/oop.png" alt="DVLA Logo" className="h-full w-full object-contain" />
          </div>
          <span className="font-black text-slate-900 dark:text-white text-base tracking-tight">
            TempStaff
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Switcher Button Mobile */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            {theme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-emerald-600" />}
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs"
        />
      )}

      {/* Modern Responsive Vertical Sidebar (Supports Collapsible Desktop View) */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex flex-col border-r border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-72"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Brand Section & Desktop Collapse Button */}
        <div
          className={`p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-all ${
            collapsed ? "flex-col gap-3 py-5 px-2" : "p-6"
          }`}
        >
          <Link href="/dashboard" className={`flex items-center gap-3 group ${collapsed ? "justify-center" : ""}`} title="TempStaff Home">
            <div className="h-11 w-11 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform shrink-0">
              <img src="/oop.png" alt="DVLA Logo" className="h-full w-full object-contain" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden transition-all duration-200">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 dark:text-white text-base tracking-tight whitespace-nowrap">
                    TempStaff
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                  6-Mo Rolling Contracts
                </p>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? "Expand Sidebar (Ctrl+\\)" : "Collapse Sidebar (Ctrl+\\)"}
            className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>

        {/* Expiring Warning Alert Widget (Sidebar) */}
        {stats?.expiring !== undefined && stats.expiring > 0 && (
          collapsed ? (
            <Link
              href="/dashboard"
              title={`${stats.expiring} contract(s) expiring soon! Click to review.`}
              className="mx-auto mt-4 p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 hover:scale-105 transition relative group"
            >
              <Clock className="h-5 w-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                {stats.expiring}
              </span>
            </Link>
          ) : (
            <div className="mx-4 mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse shrink-0" />
                <span className="font-medium text-[11px]">
                  <strong>{stats.expiring}</strong> contract{stats.expiring > 1 ? "s" : ""} expiring soon
                </span>
              </div>
              <Link
                href="/dashboard"
                className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline uppercase shrink-0"
              >
                Review
              </Link>
            </div>
          )
        )}

        {/* Navigation Menu */}
        <div className={`flex-1 py-4 space-y-1.5 overflow-y-auto ${collapsed ? "px-2" : "px-4"}`}>
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Main Menu
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? `${item.label}${item.badge ? ` (${item.badge})` : ""}` : undefined}
                className={`flex items-center rounded-xl text-xs font-semibold transition-all group ${
                  collapsed ? "justify-center p-3" : "justify-between px-3.5 py-2.5"
                } ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                  <Icon
                    className={`h-4 w-4 transition-transform group-hover:scale-110 shrink-0 ${
                      isActive
                        ? "text-white"
                        : "text-slate-400 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-white"
                    }`}
                  />
                  {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </div>

                {!collapsed && item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isActive ? "bg-white/20 text-white border-white/20" : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {collapsed && item.badge && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Theme Toggle Pill & Admin Profile Section */}
        <div className={`border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 ${collapsed ? "p-2" : "p-4"}`}>
          {/* Light / Dark Mode Toggle Bar */}
          {collapsed ? (
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
              className="w-full p-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:scale-105 transition"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-emerald-600" />}
            </button>
          ) : (
            <div className="p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 flex items-center text-xs">
              <button
                type="button"
                onClick={() => {
                  if (theme !== "light") toggleTheme();
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                  theme === "light"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (theme !== "dark") toggleTheme();
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                  theme === "dark"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Moon className="h-3.5 w-3.5 text-emerald-400" />
                <span>Dark</span>
              </button>
            </div>
          )}

          {/* HR Manager User Card */}
          {collapsed ? (
            <div className="flex flex-col items-center gap-2 p-2 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div
                title="Active Session: HR Manager"
                className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs"
              >
                HR
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    HR
                  </div>
                  <div className="leading-tight overflow-hidden">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                      Active Session
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                      HR Manager
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Controls Bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-4 hidden md:flex items-center justify-between transition-colors">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleCollapsed}
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>

            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {pathname === "/dashboard" && "Dashboard Overview"}
              {pathname === "/deductions" && "SSNIT Statutory Deductions Manager"}
              {pathname === "/history" && "History & Payroll Analytics"}
              {pathname === "/audit-logs" && "System Audit & Activity Logs"}
              {pathname.startsWith("/staff/new") && "Add Temporary Staff"}
              {pathname.startsWith("/staff/") && pathname !== "/staff/new" && "Staff Member Profile"}
              {pathname === "/staff" && "Temporary Staff Directory"}
              {pathname === "/import" && "Excel Data Migration Hub"}
              {pathname === "/export" && "Monthly Payroll Export"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* RBAC Active Role Indicator Pill */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">HR Manager</span>
            </div>
            <Link href="/staff" className="relative hidden lg:block">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                <Search className="h-3.5 w-3.5" />
                <span>Search staff records...</span>
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 ml-2">
                  ⌘K
                </kbd>
              </div>
            </Link>
          </div>
        </header>

        {/* Page View Body */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}

export default SidebarLayout;
