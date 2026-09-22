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
  ChevronRight,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminName, setAdminName] = useState("Super Admin");
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

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((d) => { if (d?.user?.name) setAdminName(d.user.name); })
      .catch(() => {});
  }, []);

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

  const navGroups = [
    {
      label: "Overview",
      items: [
        { name: "Mission Control", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Cross Analytics", href: "/admin/analytics", icon: BarChart3 },
        { name: "Combined Audit", href: "/admin/audit", icon: ScrollText },
      ],
    },
    {
      label: "Management",
      items: [
        { name: "User Management", href: "/admin/users", icon: Users },
        { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
        { name: "System CMS", href: "/admin/cms", icon: Database },
        { name: "System Settings", href: "/admin/settings", icon: Settings },
      ],
    },
  ];

  const subsystems = [
    { label: "TempStaff System", href: "/dashboard", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200" },
    { label: "Retirement Portal", href: "/retirement/dashboard", dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50 hover:bg-blue-100 border-blue-200" },
    { label: "HR Letters Portal", href: "/hrletters/dashboard", dot: "bg-green-500", text: "text-green-700", bg: "bg-green-50 hover:bg-green-100 border-green-200" },
  ];

  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col md:flex-row antialiased">

      {/* ── Sidebar Desktop ── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0 h-screen sticky top-0 shadow-sm">

        {/* Brand */}
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-gray-100 border border-gray-200 rounded-xl p-1 flex items-center justify-center shrink-0 shadow-sm">
              <Image src="/oop.png" alt="DVLA Logo" width={32} height={32} className="object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-sm text-gray-900 tracking-wide">DVLA HR</h2>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-cyan-100 text-cyan-700 border border-cyan-200">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-cyan-600 font-medium flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3" /> Super Admin Panel
              </p>
            </div>
          </div>
        </div>

        {/* Nav Groups */}
        <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                        isActive
                          ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-cyan-600" : "text-gray-400"}`} />
                        {item.name}
                      </div>
                      {isActive && <ChevronRight className="w-3 h-3 text-cyan-400" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Subsystem Launch */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Quick Portal Launch
            </div>
            <div className="space-y-1.5">
              {subsystems.map((sys) => (
                <Link
                  key={sys.href}
                  href={sys.href}
                  target="_blank"
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-[11px] font-semibold transition ${sys.bg} ${sys.text}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${sys.dot}`} />
                    {sys.label}
                  </div>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-700 font-bold text-xs">
                {initials}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">{adminName}</p>
                <p className="text-[10px] text-gray-400">Super Administrator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Container ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-semibold text-gray-600 hidden sm:block">DVLA HR Central Command</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              {currentTime || "00:00:00 GMT"}
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              All Systems Online
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-medium transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 p-4 space-y-1 shadow-sm">
            {navGroups.flatMap((g) => g.items).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100"
                >
                  <Icon className="w-4 h-4 text-cyan-500" />
                  {item.name}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-gray-200 space-y-1">
              {subsystems.map((sys) => (
                <Link
                  key={sys.href}
                  href={sys.href}
                  target="_blank"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-100"
                >
                  {sys.label}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
