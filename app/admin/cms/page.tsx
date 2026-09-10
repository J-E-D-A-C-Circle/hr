"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  Building2,
  Building,
  ShieldCheck,
  Award,
  CheckSquare,
  Plus,
  Trash2,
  X,
  Loader2,
  Search,
} from "lucide-react";

export default function AdminCMSPage() {
  const [activeTab, setActiveTab] = useState<"BANKS" | "INSURANCE" | "CLEARANCE" | "GRADES">("BANKS");

  // State lists
  const [banks, setBanks] = useState<any[]>([]);
  const [insurance, setInsurance] = useState<any[]>([]);
  const [clearance, setClearance] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [bankForm, setBankForm] = useState({ bankName: "", branchName: "", code: "" });
  const [insuranceForm, setInsuranceForm] = useState({ name: "", policyType: "TIER_3", defaultPremium: "0" });
  const [clearanceForm, setClearanceForm] = useState({ title: "", description: "", requiredDept: "Audit & Finance", order: "1" });
  const [gradeForm, setGradeForm] = useState({ gradeName: "", pensionFactor: "1.0", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchCMSData = async () => {
    setLoading(true);
    try {
      const [bRes, iRes, cRes, gRes] = await Promise.all([
        fetch("/api/admin/cms/banks"),
        fetch("/api/admin/cms/insurance"),
        fetch("/api/admin/cms/clearance"),
        fetch("/api/admin/cms/grades"),
      ]);

      const bData = await bRes.json();
      const iData = await iRes.json();
      const cData = await cRes.json();
      const gData = await gRes.json();

      if (bData.success) setBanks(bData.banks || []);
      if (iData.success) setInsurance(iData.providers || []);
      if (cData.success) setClearance(cData.items || []);
      if (gData.success) setGrades(gData.grades || []);
    } catch (err) {
      console.error("CMS fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCMSData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let endpoint = "";
    let payload = {};

    if (activeTab === "BANKS") {
      endpoint = "/api/admin/cms/banks";
      payload = bankForm;
    } else if (activeTab === "INSURANCE") {
      endpoint = "/api/admin/cms/insurance";
      payload = insuranceForm;
    } else if (activeTab === "CLEARANCE") {
      endpoint = "/api/admin/cms/clearance";
      payload = clearanceForm;
    } else if (activeTab === "GRADES") {
      endpoint = "/api/admin/cms/grades";
      payload = gradeForm;
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setModalOpen(false);
        fetchCMSData();
      } else {
        alert(data.error || "Operation failed");
      }
    } catch {
      alert("Failed to create entry");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this CMS entry?")) return;
    let endpoint = "";
    if (activeTab === "BANKS") endpoint = `/api/admin/cms/banks?id=${id}`;
    if (activeTab === "INSURANCE") endpoint = `/api/admin/cms/insurance?id=${id}`;
    if (activeTab === "CLEARANCE") endpoint = `/api/admin/cms/clearance?id=${id}`;
    if (activeTab === "GRADES") endpoint = `/api/admin/cms/grades?id=${id}`;

    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) fetchCMSData();
    } catch {
      alert("Failed to delete item");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-cyan-400 font-semibold uppercase tracking-wider">
            <Database className="w-4 h-4 text-indigo-600 dark:text-cyan-400" /> System CMS
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Extensive Content & Master Data Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control master lists for Banks, Insurance Providers, Retirement Clearance Checklists, and Grade Multipliers.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add New {activeTab.slice(0, -1)} Entry
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-200/60 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab("BANKS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === "BANKS"
              ? "bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Building className="w-4 h-4 text-indigo-500 dark:text-cyan-400" />
          TempStaff Banks ({banks.length})
        </button>

        <button
          onClick={() => setActiveTab("INSURANCE")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === "INSURANCE"
              ? "bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          Insurance Schemes ({insurance.length})
        </button>

        <button
          onClick={() => setActiveTab("CLEARANCE")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === "CLEARANCE"
              ? "bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <CheckSquare className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          Retirement Clearance Items ({clearance.length})
        </button>

        <button
          onClick={() => setActiveTab("GRADES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === "GRADES"
              ? "bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          Retirement Grade Hierarchy ({grades.length})
        </button>
      </div>

      {/* Content Table / Cards */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl backdrop-blur-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600 dark:text-cyan-400 mb-2" />
            Loading CMS Master Records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === "BANKS" && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Bank Name</th>
                    <th className="py-3 px-4">Branch Name</th>
                    <th className="py-3 px-4">Sort / Bank Code</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {banks.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-slate-400">No bank master entries. Click "Add New BANK Entry".</td></tr>
                  ) : (
                    banks.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{b.bankName}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{b.branchName}</td>
                        <td className="py-3 px-4 font-mono text-indigo-600 dark:text-cyan-400 font-bold">{b.code}</td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "INSURANCE" && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Provider Name</th>
                    <th className="py-3 px-4">Scheme Policy Type</th>
                    <th className="py-3 px-4">Default Monthly Premium</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {insurance.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-slate-400">No insurance providers listed. Click "Add New INSURANCE Entry".</td></tr>
                  ) : (
                    insurance.map((i) => (
                      <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{i.name}</td>
                        <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">{i.policyType}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">GHS {i.defaultPremium.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "CLEARANCE" && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Clearance Requirement</th>
                    <th className="py-3 px-4">Responsible Department</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {clearance.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-slate-400">No clearance items. Click "Add New CLEARANCE Entry".</td></tr>
                  ) : (
                    clearance.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-bold text-slate-400 font-mono">#{c.order}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{c.title}</div>
                          <div className="text-[11px] text-slate-500">{c.description}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">{c.requiredDept}</td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "GRADES" && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Grade Title</th>
                    <th className="py-3 px-4">Pension Gratuity Multiplier</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {grades.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-slate-400">No grade entries listed. Click "Add New GRADE Entry".</td></tr>
                  ) : (
                    grades.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{g.gradeName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{g.pensionFactor.toFixed(2)}x</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{g.description || "Standard Grade"}</td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                Add New {activeTab} Master Entry
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {activeTab === "BANKS" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      placeholder="e.g. GCB Bank Ltd"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Branch Name</label>
                    <input
                      type="text"
                      required
                      value={bankForm.branchName}
                      onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                      placeholder="e.g. High Street Branch"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              {activeTab === "INSURANCE" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Provider Name</label>
                    <input
                      type="text"
                      required
                      value={insuranceForm.name}
                      onChange={(e) => setInsuranceForm({ ...insuranceForm, name: e.target.value })}
                      placeholder="e.g. Enterprise Life Insurance"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Default Monthly Premium (GHS)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={insuranceForm.defaultPremium}
                      onChange={(e) => setInsuranceForm({ ...insuranceForm, defaultPremium: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              {activeTab === "CLEARANCE" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Requirement Title</label>
                    <input
                      type="text"
                      required
                      value={clearanceForm.title}
                      onChange={(e) => setClearanceForm({ ...clearanceForm, title: e.target.value })}
                      placeholder="e.g. Return Company Asset ID Card"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Responsible Department</label>
                    <input
                      type="text"
                      required
                      value={clearanceForm.requiredDept}
                      onChange={(e) => setClearanceForm({ ...clearanceForm, requiredDept: e.target.value })}
                      placeholder="e.g. Internal Audit"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              {activeTab === "GRADES" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Grade Title</label>
                    <input
                      type="text"
                      required
                      value={gradeForm.gradeName}
                      onChange={(e) => setGradeForm({ ...gradeForm, gradeName: e.target.value })}
                      placeholder="e.g. Senior Director Level 1"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Pension Multiplier Factor (e.g. 1.25)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={gradeForm.pensionFactor}
                      onChange={(e) => setGradeForm({ ...gradeForm, pensionFactor: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  {submitting ? "Saving..." : "Save Master Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
