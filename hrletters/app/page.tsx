"use client";

import React, { useState, useEffect } from "react";
import { Navbar, RoleType } from "../components/Navbar";
import { Sidebar, TabType } from "../components/Sidebar";

import { LoginView }          from "../components/views/LoginView";
import { DashboardView }      from "../components/views/DashboardView";
import { StaffView }          from "../components/views/StaffView";
import { EmployeePortalView } from "../components/views/EmployeePortalView";
import { TemplateView }       from "../components/views/TemplateView";
import { GeneratorView }      from "../components/views/GeneratorView";
import { ArchiveView }        from "../components/views/ArchiveView";
import { AuditView }          from "../components/views/AuditView";

export default function Home() {
  const [currentRole, setCurrentRole] = useState<RoleType>("HR_OFFICER");
  const [activeTab, setActiveTab] = useState<TabType>("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [initialized, setInitialized] = useState(true);

  useEffect(() => {
    // Check saved theme or default to light
    const savedTheme = localStorage.getItem("hr_letters_theme") as "dark" | "light" | null;
    if (savedTheme === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }

    // Non-blocking background sync/seed
    fetch("/api/seed").catch(() => {});
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("hr_letters_theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const handleRoleChange = (role: RoleType) => {
    setCurrentRole(role);
    if (role === "STAFF") {
      setActiveTab("my-portal");
    } else if (activeTab === "my-portal" || activeTab === "login") {
      setActiveTab("generator");
    }
  };

  const handleDemoLogin = (role: RoleType | "STAFF", userDetails?: any) => {
    setCurrentRole(role as RoleType);
    setCurrentUser(userDetails || null);
    setIsLoggedIn(true);

    if (role === "STAFF") {
      setActiveTab("my-portal");
    } else if (role === "DEPT_HEAD") {
      setActiveTab("dashboard");
    } else {
      setActiveTab("generator");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveTab("login");
  };

  const handleSelectStaffForLetter = (staff: any) => {
    setSelectedStaff(staff);
    setActiveTab("generator");
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-bg)", color: "var(--color-text-1)" }}
    >
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onLogout={isLoggedIn ? handleLogout : undefined}
        notificationsCount={2}
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleSidebar={toggleSidebar}
        isSidebarCollapsed={sidebarCollapsed}
      />

      <div className="flex flex-1 overflow-hidden">
        {isLoggedIn && activeTab !== "login" && (
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            currentRole={currentRole}
            theme={theme}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
          />
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="w-full max-w-[1380px] mx-auto px-8 py-6">
            {!isLoggedIn || activeTab === "login" ? (
              <LoginView onLogin={handleDemoLogin} />
            ) : (
              <>
                {activeTab === "dashboard"  && <DashboardView onNavigateTab={setActiveTab} />}
                {activeTab === "staff"      && <StaffView onSelectStaffForLetter={handleSelectStaffForLetter} />}
                {activeTab === "my-portal"  && <EmployeePortalView currentUser={currentUser} />}
                {activeTab === "templates"  && <TemplateView />}
                {activeTab === "generator"  && <GeneratorView currentRole={currentRole} theme={theme} selectedStaff={selectedStaff} />}
                {activeTab === "archive"    && <ArchiveView />}
                {activeTab === "audit"      && <AuditView />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
