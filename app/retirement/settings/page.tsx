"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  ShieldCheck,
  Server,
  Lock,
  ExternalLink,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Award,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import RetirementHeader from "@/components/retirement/RetirementHeader";

export default function SettingsPage() {
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Clearance Items state
  const [clearanceItems, setClearanceItems] = useState<any[]>([]);
  const [newClearanceTitle, setNewClearanceTitle] = useState("");
  const [newClearanceDept, setNewClearanceDept] = useState("Internal Audit");
  const [addingClearance, setAddingClearance] = useState(false);

  // Retirement Grades state
  const [grades, setGrades] = useState<any[]>([]);
  const [newGradeName, setNewGradeName] = useState("");
  const [newGradeFactor, setNewGradeFactor] = useState("1.0");
  const [addingGrade, setAddingGrade] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchClearanceItems();
    fetchGrades();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/retirement/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.systemInfo) setSystemInfo(data.systemInfo);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchClearanceItems = async () => {
    try {
      const res = await fetch("/api/retirement/clearance");
      if (res.ok) {
        const data = await res.json();
        setClearanceItems(data.items || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGrades = async () => {
    try {
      const res = await fetch("/api/retirement/grades");
      if (res.ok) {
        const data = await res.json();
        setGrades(data.grades || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddClearance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClearanceTitle.trim() || !newClearanceDept.trim()) return;

    setAddingClearance(true);
    try {
      const res = await fetch("/api/retirement/clearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newClearanceTitle.trim(),
          requiredDept: newClearanceDept.trim(),
          order: clearanceItems.length + 1,
        }),
      });
      if (res.ok) {
        setNewClearanceTitle("");
        fetchClearanceItems();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingClearance(false);
    }
  };

  const handleDeleteClearance = async (id: number) => {
    if (!confirm("Are you sure you want to remove this clearance item?")) return;
    try {
      const res = await fetch(`/api/retirement/clearance?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchClearanceItems();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGradeName.trim()) return;

    setAddingGrade(true);
    try {
      const res = await fetch("/api/retirement/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gradeName: newGradeName.trim(),
          pensionFactor: parseFloat(newGradeFactor) || 1.0,
        }),
      });
      if (res.ok) {
        setNewGradeName("");
        setNewGradeFactor("1.0");
        fetchGrades();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingGrade(false);
    }
  };

  const handleDeleteGrade = async (id: number) => {
    if (!confirm("Are you sure you want to delete this grade level?")) return;
    try {
      const res = await fetch(`/api/retirement/grades?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchGrades();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-8 text-xs text-slate-500 animate-pulse">Loading system settings...</div>;
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <RetirementHeader
        icon={Settings}
        title="System Settings & Parameters"
        subtitle="Statutory retirement parameters, exit clearances, pension grade factors, and authority details."
      />

      {/* Super Admin Notice Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-xl shrink-0">
            <Lock size={20} />
          </div>
          <div>
            <h3 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">
              Centralized User Access Management
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-400 mt-1 leading-relaxed">
              All HR user accounts, roles, and administrative credentials are managed centrally by Super Administrators in the Super Admin Portal.
            </p>
          </div>
        </div>
        <Link
          href="/admin/users"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-2 shrink-0 shadow-xs"
        >
          <span>Open Super Admin Portal</span>
          <ExternalLink size={14} />
        </Link>
      </div>

      {/* Card 1: Statutory Pension & Retirement Rule */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Statutory Pension Rule
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Statutory Retirement Age (Compulsory)
            </label>
            <input
              type="text"
              value="60 Years (Fixed)"
              disabled
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              In accordance with Public Services Commission &amp; Ghana Statutory Act, compulsory exit age is set at 60 years.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Automatic Computation Rule</label>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Retirement Exit Date is dynamically computed as exact date turning 60 (<span className="font-mono font-bold text-slate-900 dark:text-slate-100">DOB + 60 Years</span>). Status tags update automatically.
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Exit Clearance Requirements Management */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Statutory Exit Clearance Checklist
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Total: {clearanceItems.length} items</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Pre-retirement exit clearances required across DVLA Directorates (Audit, Transport, Stores, Finance) before final gratuity disbursement.
        </p>

        {/* Existing Items */}
        <div className="space-y-2">
          {clearanceItems.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No custom clearance items registered yet.</p>
          ) : (
            clearanceItems.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{item.title}</span>
                    <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {item.requiredDept}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteClearance(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Delete item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Item Form */}
        <form onSubmit={handleAddClearance} className="pt-2 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newClearanceTitle}
            onChange={(e) => setNewClearanceTitle(e.target.value)}
            placeholder="Clearance Item Title (e.g. Handover of Official Vehicle)"
            className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          <input
            type="text"
            value={newClearanceDept}
            onChange={(e) => setNewClearanceDept(e.target.value)}
            placeholder="Responsible Directorate (e.g. Transport Directorate)"
            className="w-full sm:w-56 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={addingClearance || !newClearanceTitle.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus size={14} /> Add Clearance
          </button>
        </form>
      </div>

      {/* Card 3: Pension Grades & Factors Management */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Staff Grade Levels &amp; Pension Factors
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Total: {grades.length} grades</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Standardized DVLA salary grade classifications and statutory pension multipliers applied during gratuity computations.
        </p>

        {/* Grades Table */}
        <div className="space-y-2">
          {grades.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No grade levels registered yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {grades.map((grade) => (
                <div
                  key={grade.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{grade.gradeName}</span>
                    <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                      Factor: {grade.pensionFactor}x
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteGrade(grade.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Delete grade"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Grade Form */}
        <form onSubmit={handleAddGrade} className="pt-2 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newGradeName}
            onChange={(e) => setNewGradeName(e.target.value)}
            placeholder="Grade Designation (e.g. Principal Licensing Officer)"
            className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          <input
            type="number"
            step="0.05"
            value={newGradeFactor}
            onChange={(e) => setNewGradeFactor(e.target.value)}
            placeholder="Pension Multiplier (e.g. 1.25)"
            className="w-full sm:w-44 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
          />
          <button
            type="submit"
            disabled={addingGrade || !newGradeName.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus size={14} /> Add Grade
          </button>
        </form>
      </div>

      {/* Card 4: System Environment & Info */}
      {systemInfo && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Server className="h-5 w-5 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              System Environment &amp; Information
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Application Name</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{systemInfo.appName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Version</span>
              <span className="font-mono font-bold text-amber-600">{systemInfo.version}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Head Office</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{systemInfo.headOffice}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Environment</span>
              <span className="font-mono text-emerald-600 uppercase font-bold">{systemInfo.environment}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
