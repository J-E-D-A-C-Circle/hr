"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Megaphone,
  ScrollText,
  Settings,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Clock,
  Activity,
  Menu,
  X,
  Database,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "UTC",
        }) + " GMT"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Login page render without layout shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  };

  const navItems = [
    { name: "Mission Control", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "User Management", href: "/admin/users", icon: Users },
    { name: "Extensive CMS", href: "/admin/cms", icon: Database },
    { name: "Cross Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
    { name: "Combined Audit", href: "/admin/audit", icon: ScrollText },
    { name: "System Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E17] text-slate-100 font-sans flex flex-col md:flex-row antialiased selection:bg-cyan-500 selection:text-black">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950/80 border-r border-slate-800/80 backdrop-blur-xl shrink-0 p-4 space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="relative w-10 h-10 bg-slate-900 border border-slate-700/80 rounded-xl p-1 flex items-center justify-center shrink-0 shadow-lg">
            <Image src="/oop.png" alt="DVLA Logo" width={32} height={32} className="object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h2 className="font-bold text-sm text-white tracking-wide">DVLA HR</h2>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-cyan-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Super Admin
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Navigation Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/5"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* System Quick Launchers */}
        <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Quick Subsystem Launch
          </div>
          <Link
            href="/dashboard"
            target="_blank"
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium transition"
          >
            TempStaff System
            <ExternalLink className="w-3 h-3" />
          </Link>
          <Link
            href="/retirement"
            target="_blank"
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[11px] font-medium transition"
          >
            Retirement System
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* User Info & Logout */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs">
              SA
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Super Admin</p>
              <p className="text-[10px] text-slate-400">Command Access</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout of Admin Panel"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-slate-950/60 border-b border-slate-800/80 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-semibold text-slate-300">DVLA HR Central Command</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {currentTime || "00:00:00 GMT"}
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              System Status: Optimal
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-800 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-900"
                >
                  <Icon className="w-4 h-4 text-cyan-400" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
