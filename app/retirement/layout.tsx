"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  AlertTriangle,
  UserCheck,
  FileBarChart,
  Bell,
  UserCog,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  Building2,
  Menu,
  X,
  CheckCircle2,
} from "lucide-react";

export default function RetirementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>({
    fullName: "DVLA HR Officer",
    email: "admin@dvla.gov.gh",
    role: "HR_ADMINISTRATOR",
  });
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [alertsList, setAlertsList] = useState<any[]>([]);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Fetch current user & unread alerts
  useEffect(() => {
    if (pathname !== "/retirement/login") {
      fetchSessionAndAlerts();
    }
  }, [pathname]);

  // If on login page, don't show dashboard shell
  if (pathname === "/retirement/login") {
    return <>{children}</>;
  }


  const fetchSessionAndAlerts = async () => {
    try {
      const authRes = await fetch("/api/retirement/auth");
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.user) setCurrentUser(authData.user);
      }

      const alertRes = await fetch("/api/retirement/alerts?unreadOnly=true");
      if (alertRes.ok) {
        const alertData = await alertRes.json();
        setUnreadAlerts(alertData.unreadCount || 0);
        setAlertsList(alertData.alerts || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGlobalSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/retirement/staff?search=${encodeURIComponent(query)}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.staff || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/retirement/auth", { method: "DELETE" });
      router.push("/retirement/login");
    } catch (e) {
      console.error(e);
    }
  };

  const markAlertsRead = async () => {
    try {
      await fetch("/api/retirement/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setUnreadAlerts(0);
      setNotificationsOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/retirement", icon: LayoutDashboard },
    { label: "Staff Directory", href: "/retirement/staff", icon: Users },
    { label: "Nearing Retirement", href: "/retirement/nearing", icon: Clock },
    { label: "Due This Year", href: "/retirement/due-this-year", icon: AlertTriangle, badge: "Urgent" },
    { label: "Retired Staff", href: "/retirement/retired", icon: UserCheck },
    { label: "Stations & Departments", href: "/retirement/departments", icon: Building2 },
    { label: "Reports & Analytics", href: "/retirement/reports", icon: FileBarChart },
    { label: "Alert Center", href: "/retirement/alerts", icon: Bell, count: unreadAlerts },
    ...(currentUser?.role === "HR_ADMINISTRATOR"
      ? [
          { label: "User Management", href: "/retirement/users", icon: UserCog },
          { label: "Settings", href: "/retirement/settings", icon: Settings },
        ]
      : []),
  ];

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col antialiased overflow-hidden">
      {/* Top Mobile Bar */}
      <header className="lg:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 rounded text-slate-300 hover:text-white">
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-amber-400" />
            <span className="font-semibold text-sm tracking-wide">DVLA RETIREMENT</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setGlobalSearchOpen(true)} className="p-1.5 text-slate-300 hover:text-white">
            <Search size={20} />
          </button>
          <div className="relative">
            <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="p-1.5 text-slate-300 hover:text-white relative">
              <Bell size={20} />
              {unreadAlerts > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadAlerts}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden h-full">
        {/* Left Sidebar (Desktop - Static & Fixed) */}
        <aside
          className={`hidden lg:flex flex-col bg-emerald-800 text-white border-r border-emerald-600 shadow-xl transition-all duration-300 ease-in-out relative z-30 shrink-0 h-full ${
            collapsed ? "w-20" : "w-64"
          }`}
        >
          {/* Brand Header */}
          <div className="h-20 px-4 flex items-center justify-between border-b border-emerald-700/80 bg-emerald-900/40">
            {!collapsed ? (
              <Link href="/retirement" className="flex items-center gap-3 text-white">
                <div className="h-11 w-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0 border border-emerald-600">
                  <img src="/oop.png" alt="DVLA Logo" className="h-full w-full object-contain" />
                </div>
                <div>
                  <h1 className="font-extrabold text-sm leading-tight text-white tracking-wide">DVLA HR</h1>
                  <p className="text-[10px] text-yellow-300 font-extrabold tracking-widest uppercase">Retirement Tracker</p>
                </div>
              </Link>
            ) : (
              <div className="mx-auto">
                <div className="h-11 w-11 rounded-xl bg-white p-1 flex items-center justify-center shadow border border-emerald-600">
                  <img src="/oop.png" alt="DVLA Logo" className="h-full w-full object-contain" />
                </div>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-md text-emerald-100 hover:text-white hover:bg-emerald-700 transition"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-yellow-400 text-slate-950 shadow-md font-extrabold"
                      : "text-emerald-50 hover:bg-emerald-700/80 hover:text-white"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-slate-950" : "text-emerald-200"}`} />
                  {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-black bg-rose-500 text-white rounded uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                  {!collapsed && item.count !== undefined && item.count > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-black bg-slate-950 text-yellow-300 rounded-full">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Sign Out at Bottom of Sidebar */}
          <div className="p-3 border-t border-emerald-700 bg-emerald-900/60 space-y-2">
            {!collapsed ? (
              <div>
                <div className="flex items-center gap-2.5 overflow-hidden p-1">
                  <div className="h-8 w-8 rounded-full bg-emerald-900 text-yellow-300 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-600">
                    {currentUser?.fullName ? currentUser.fullName.substring(0, 2).toUpperCase() : "HR"}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-extrabold text-white truncate">{currentUser.fullName}</p>
                    <span className="text-[10px] font-extrabold text-yellow-300 uppercase tracking-wider bg-yellow-400/20 px-1.5 py-0.5 rounded border border-yellow-400/40 inline-block">
                      {currentUser.role === "HR_ADMINISTRATOR" ? "HR Admin" : "HR Officer"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full mt-2.5 py-2 px-3 bg-slate-950/80 hover:bg-slate-950 text-yellow-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-yellow-400/30 shadow-xs"
                  title="Sign Out of Portal"
                >
                  <LogOut size={15} className="text-yellow-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-emerald-900 text-yellow-300 flex items-center justify-center font-bold text-xs border border-emerald-600">
                  {currentUser?.fullName ? currentUser.fullName.substring(0, 2).toUpperCase() : "HR"}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-slate-950/80 text-yellow-300 hover:bg-slate-950 rounded-xl transition"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex">
            <div className="w-72 bg-emerald-800 text-white flex flex-col h-full shadow-2xl">
              <div className="p-4 border-b border-emerald-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/oop.png" alt="Logo" className="h-7 w-7 object-contain bg-white rounded p-0.5" />
                  <span className="font-bold text-sm text-white">DVLA RETIREMENT SYSTEM</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-emerald-200 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-colors ${
                        isActive ? "bg-yellow-400 text-slate-950 font-extrabold" : "text-emerald-50 hover:bg-emerald-700"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? "text-slate-950" : "text-emerald-200"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-emerald-700 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">{currentUser.fullName}</p>
                  <p className="text-[10px] text-yellow-300 font-bold">{currentUser.role}</p>
                </div>
                <button onClick={handleLogout} className="p-2 text-yellow-300 hover:bg-emerald-900 rounded-xl">
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {/* Top Header (Desktop) */}
          <header className="hidden lg:flex h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 items-center justify-between sticky top-0 z-20 shadow-xs">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-slate-500" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                DVLA Head Office — HR Directorate
              </span>
            </div>

            {/* Header Right Actions: Search & Notifications */}
            <div className="flex items-center gap-4">
              {/* Global Quick Search Button */}
              <button
                onClick={() => setGlobalSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition w-64 justify-between"
              >
                <span className="flex items-center gap-2">
                  <Search size={14} className="text-slate-400" />
                  <span>Search staff ID, name...</span>
                </span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-500">
                  Ctrl+K
                </kbd>
              </button>

              {/* Notification Center Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition relative"
                  title="Retirement Notifications"
                >
                  <Bell size={18} />
                  {unreadAlerts > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadAlerts}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        Milestone Alerts ({unreadAlerts})
                      </h4>
                      {unreadAlerts > 0 && (
                        <button onClick={markAlertsRead} className="text-[11px] text-amber-600 hover:underline font-medium">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {alertsList.length > 0 ? (
                        alertsList.slice(0, 5).map((a) => (
                          <Link
                            key={a.id}
                            href={`/retirement/staff/${a.staffId}`}
                            onClick={() => setNotificationsOpen(false)}
                            className="p-3 block hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="p-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">
                                {a.milestone.replace("_", " ")}
                              </span>
                              <div>
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                  {a.staff?.fullName} ({a.staff?.staffId})
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Retires in {a.timeRemainingFormatted} ({a.staff?.departmentName || "Staff"})
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="py-6 text-center text-xs text-slate-500">No new alerts at this time.</div>
                      )}
                    </div>
                    <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center">
                      <Link
                        href="/retirement/alerts"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-xs font-semibold text-slate-700 hover:text-amber-600"
                      >
                        View Notification Center &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile & Logout Button in Top Header */}
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-800 text-yellow-300 font-bold text-xs flex items-center justify-center border border-emerald-700">
                    {currentUser?.fullName ? currentUser.fullName.substring(0, 2).toUpperCase() : "HR"}
                  </div>
                  <div className="hidden xl:block text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">{currentUser.fullName}</p>
                    <span className="text-[10px] text-yellow-700 dark:text-yellow-400 font-bold uppercase">{currentUser.role === "HR_ADMINISTRATOR" ? "Admin" : "Officer"}</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-700 transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                  title="Sign Out of DVLA Retirement System"
                >
                  <LogOut size={14} className="text-slate-500 hover:text-rose-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Body */}
          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
        </div>
      </div>

      {/* Global Quick Search Modal Dialog */}
      {globalSearchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                placeholder="Search staff by ID, full name, or department..."
                className="w-full text-sm bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                autoFocus
              />
              <button onClick={() => setGlobalSearchOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {searchResults.length > 0 ? (
                searchResults.map((staff) => (
                  <Link
                    key={staff.id}
                    href={`/retirement/staff/${staff.id}`}
                    onClick={() => setGlobalSearchOpen(false)}
                    className="p-3 rounded-lg flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{staff.fullName}</p>
                      <p className="text-[11px] text-slate-500">
                        {staff.staffId} &bull; {staff.departmentName || "General"} &bull; {staff.jobTitle}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      staff.computedStatus === "DUE_THIS_YEAR" ? "bg-rose-100 text-rose-700" :
                      staff.computedStatus === "NEARING_RETIREMENT" ? "bg-amber-100 text-amber-800" :
                      staff.computedStatus === "RETIRED" ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {staff.timeRemainingFormatted}
                    </span>
                  </Link>
                ))
              ) : searchQuery.trim() ? (
                <div className="p-6 text-center text-xs text-slate-500">No staff members found matching "{searchQuery}".</div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">Type a staff name, ID (e.g. DVLA-10001), or department name.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
