"use client";

import React, { useState, useEffect } from "react";
import { Navbar, RoleType } from "../components/Navbar";
import { Sidebar, TabType } from "../components/Sidebar";

import { DashboardView }      from "../components/views/DashboardView";
import { TemplateView }       from "../components/views/TemplateView";
import { GeneratorView }      from "../components/views/GeneratorView";
import { ArchiveView }        from "../components/views/ArchiveView";
import { AuditView }          from "../components/views/AuditView";

export default function Home() {
  const [currentRole, setCurrentRole] = useState<RoleType>("HR_OFFICER");
  const [activeTab, setActiveTab] = useState<TabType>("generator");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetch("/api/seed")
      .then((r) => r.json())
      .then(() => setInitialized(true))
      .catch(() => setInitialized(true));
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const handleRoleChange = (role: RoleType) => {
    setCurrentRole(role);
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
        notificationsCount={2}
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleSidebar={toggleSidebar}
        isSidebarCollapsed={sidebarCollapsed}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentRole={currentRole}
          theme={theme}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="w-full max-w-[1380px] mx-auto px-8 py-6">
            {!initialized ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-8 h-8 border-2 border-[--color-accent] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium" style={{ color: "var(--color-text-3)" }}>
                  Initialising HR Portal Database on MAMP MySQL…
                </p>
              </div>
            ) : (
              <>
                {activeTab === "dashboard"  && <DashboardView onNavigateTab={setActiveTab} />}
                {activeTab === "templates"  && <TemplateView />}
                {activeTab === "generator"  && <GeneratorView currentRole={currentRole} theme={theme} />}
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
