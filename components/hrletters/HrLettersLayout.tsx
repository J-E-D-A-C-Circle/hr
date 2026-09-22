"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PenTool,
  Archive,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from "lucide-react";

interface HrLettersLayoutProps {
  children: React.ReactNode;
}

export function HrLettersLayout({ children }: HrLettersLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [user, setUser] = useState<{ fullName: string; role: string }>({ fullName: "HR Officer", role: "HR_OFFICER" });

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
    const savedTheme = localStorage.getItem("hrletters_theme") as "light" | "dark" | null;
    const initialTheme = savedTheme === "dark" ? "dark" : "light";
    setTheme(initialTheme);
    applyTheme(initialTheme);

    const savedCollapsed = localStorage.getItem("hrletters_sidebar_collapsed");
    if (savedCollapsed !== null) setCollapsed(savedCollapsed === "true");
  }, []);

  useEffect(() => {
    if (pathname !== "/hrletters/login") {
      fetch("/api/hrletters/auth/check")
        .then((res) => { if (!res.ok) router.push("/hrletters/login"); else return res.json(); })
        .then((data) => { if (data?.user) setUser({ fullName: data.user.fullName || "HR Officer", role: data.user.role || "HR_OFFICER" }); })
        .catch(() => {});
    }
  }, [pathname, router]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("hrletters_theme", nextTheme);
    applyTheme(nextTheme);
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("hrletters_sidebar_collapsed", String(next));
  };

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout-all?redirect=/hrletters/login", { method: "POST" });
    } catch {
      // Proceed regardless
    }
    window.location.href = "/hrletters/login";
  };

  if (pathname === "/hrletters/login") return <>{children}</>;

  const initials = (user.fullName || "HR")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const navItems = [
    { label: "Dashboard", href: "/hrletters/dashboard", icon: LayoutDashboard },
    { label: "Generate Letter", href: "/hrletters/generate", icon: PenTool },
    { label: "Letter Archive", href: "/hrletters/archive", icon: Archive },
    { label: "Templates", href: "/hrletters/templates", icon: FileText },
    { label: "Staff Registry", href: "/hrletters/staff", icon: Users },
  ];

  const PAGE_TITLES: Record<string, string> = {
    "/hrletters/dashboard": "HR Letters Dashboard",
    "/hrletters/generate": "Letter Generator",
    "/hrletters/archive": "Letter Archive",
    "/hrletters/templates": "Letter Templates",
    "/hrletters/staff": "Staff Registry",
  };

  const pageTitle = Object.entries(PAGE_TITLES).find(([k]) => pathname === k || pathname.startsWith(k + "/"))?.[1] || "HR Letters";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-colors duration-200">
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 p-0.5 flex items-center justify-center shadow-md shrink-0">
            <Image src="/oop.png" alt="DVLA Logo" width={32} height={32} className="object-contain" />
          </div>
          <span className="font-black text-slate-900 dark:text-white text-base tracking-tight">HR Letters</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {theme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-emerald-600" />}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} className="md:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs" />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex flex-col border-r border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-72"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Brand */}
        <div className={`p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-all ${collapsed ? "flex-col gap-3 py-5 px-2" : "p-6"}`}>
          <Link href="/hrletters/dashboard" className={`flex items-center gap-3 group ${collapsed ? "justify-center" : ""}`} title="HR Letters Home">
            <div className="h-11 w-11 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-lg shrink-0">
              <Image src="/oop.png" alt="DVLA Logo" width={36} height={36} className="object-contain" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 dark:text-white text-base tracking-tight whitespace-nowrap">HR Letters</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 uppercase">DVLA</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Official Document Generator</p>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <div className={`flex-1 py-4 space-y-1.5 overflow-y-auto ${collapsed ? "px-2" : "px-4"}`}>
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Main Menu</div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/hrletters/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center rounded-xl text-xs font-semibold transition-all group ${
                  collapsed ? "justify-center p-3" : "justify-between px-3.5 py-2.5"
                } ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-white"}`} />
                  {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </div>
                {!collapsed && isActive && <ChevronRight className="h-3.5 w-3.5 text-white/70" />}
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className={`border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 ${collapsed ? "p-2" : "p-4"}`}>
          {/* Theme Toggle */}
          {collapsed ? (
            <button type="button" onClick={toggleTheme} className="w-full p-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center hover:scale-105 transition">
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-emerald-600" />}
            </button>
          ) : (
            <div className="p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 flex items-center text-xs">
              <button
                type="button"
                onClick={() => { if (theme !== "light") toggleTheme(); }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${theme === "light" ? "bg-white text-slate-900 shadow-xs" : "text-slate-400 hover:text-slate-200"}`}
              >
                <Sun className="h-3.5 w-3.5 text-amber-500" /><span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => { if (theme !== "dark") toggleTheme(); }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${theme === "dark" ? "bg-slate-900 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                <Moon className="h-3.5 w-3.5 text-emerald-400" /><span>Dark</span>
              </button>
            </div>
          )}

          {/* User Card */}
          {collapsed ? (
            <div className="flex flex-col items-center gap-2 p-2 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {initials}
              </div>
              <button onClick={handleLogout} title="Sign Out" className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    {initials}
                  </div>
                  <div className="leading-tight overflow-hidden min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{user.fullName}</span>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                      {user.role === "HR_DIRECTOR" ? "HR Director" : "HR Officer"}
                    </span>
                  </div>
                </div>
                <button onClick={handleLogout} title="Sign Out" className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition shrink-0">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-4 hidden md:flex items-center justify-between transition-colors">
          <div className="flex items-center gap-4">
            <button type="button" onClick={toggleCollapsed} className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              {collapsed ? <PanelLeftOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs">
              <div className="h-6 w-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">{initials}</div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{user.fullName}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {user.role === "HR_DIRECTOR" ? "HR Director" : "HR Officer"}
                </span>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}

export default HrLettersLayout;
