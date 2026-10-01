"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import SidebarLayout from "@/components/SidebarLayout";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import AddStaffModal from "@/components/AddStaffModal";
import {
  Calculator,
  ShieldCheck,
  Building,
  Download,
  Save,
  Percent,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserPlus,
  PauseCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Hash,
  FileSpreadsheet,
} from "lucide-react";
import { PaymentStatusModal } from "@/components/PaymentStatusModal";

import { DEFAULT_2026_GRA_BRACKETS, PayeBracketItem } from "@/lib/payroll";

export default function DeductionsPage() {
  const router = useRouter();
  const [deductionsData, setDeductionsData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [paymentStatusTarget, setPaymentStatusTarget] = useState<any | null>(null);

  // User Role State
  const [userRole, setUserRole] = useState<string>("HR_ADMINISTRATOR");

  useEffect(() => {
    fetch("/api/auth/check")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.role) {
          setUserRole(data.user.role);
          if (data.user.role === "HR Officer") {
            router.push("/dashboard");
          }
        }
      })
      .catch(() => {});
  }, [router]);

  const canEditSettings = useMemo(() => {
    const r = (userRole || "").toUpperCase();
    return r.includes("SUPER_ADMIN") || r.includes("ADMIN") || r.includes("MANAGER") || r.includes("DIRECTOR");
  }, [userRole]);

  // Pagination State (25 items per page)
  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [departmentFilter, paymentStatusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(deductionsData.length / PAGE_SIZE));

  const paginatedDeductions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return deductionsData.slice(start, start + PAGE_SIZE);
  }, [deductionsData, currentPage]);

  // CMS Settings State
  const [cmsRates, setCmsRates] = useState({
    ssnit_employee_rate: 5.5,
    ssnit_employer_rate: 13.0,
    petra_employee_rate: 5.0,
    petra_employer_rate: 5.0,
  });

  const [payeBrackets, setPayeBrackets] = useState<PayeBracketItem[]>(DEFAULT_2026_GRA_BRACKETS);

  const [savingCms, setSavingCms] = useState(false);
  const [cmsSuccessMessage, setCmsSuccessMessage] = useState<string | null>(null);

  const fetchDeductions = async () => {
    setLoading(true);
    try {
      const deptParam = departmentFilter !== "all" ? departmentFilter : "";
      const payParam = paymentStatusFilter !== "all" ? paymentStatusFilter : "";
      const queryParam = search.trim() ? encodeURIComponent(search) : "";
      const res = await fetch(
        `/api/deductions?department=${encodeURIComponent(deptParam)}&paymentStatus=${encodeURIComponent(payParam)}&search=${queryParam}`
      );
      const json = await res.json();
      if (res.ok && json.success) {
        setDeductionsData(json.data);
        setSummary(json.summary);
        if (json.summary?.rates) {
          setCmsRates(json.summary.rates);
        }
      }

      // Fetch CMS tax settings & brackets
      const setRes = await fetch("/api/deductions/settings");
      const setJson = await setRes.json();
      if (setRes.ok && setJson.payeBrackets && setJson.payeBrackets.length > 0) {
        setPayeBrackets(setJson.payeBrackets);
      }
    } catch (err: any) {
      console.error("Fetch deductions error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeductions();
  }, [departmentFilter, paymentStatusFilter, search]);

  const handleSaveCmsRates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSettings) {
      alert("Unauthorized: Only HR Manager and Super Admin can modify statutory deduction settings.");
      return;
    }
    setSavingCms(true);
    setCmsSuccessMessage(null);

    try {
      const res = await fetch("/api/deductions/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cmsRates,
          payeBrackets,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update CMS rates");
      }

      setCmsSuccessMessage("CMS Statutory Rates & 2026 GRA Tax Schedule updated! Recalculating all staff deductions...");
      fetchDeductions();
      setTimeout(() => setCmsSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingCms(false);
    }
  };

  const handleExportSsnit = () => {
    const deptParam = departmentFilter !== "all" ? departmentFilter : "";
    const queryParam = search.trim() ? encodeURIComponent(search) : "";
    window.open(
      `/api/deductions?department=${encodeURIComponent(deptParam)}&search=${queryParam}&format=ssnit`,
      "_blank"
    );
  };

  const handleExportGra = () => {
    const deptParam = departmentFilter !== "all" ? departmentFilter : "";
    const queryParam = search.trim() ? encodeURIComponent(search) : "";
    window.open(
      `/api/deductions?department=${encodeURIComponent(deptParam)}&search=${queryParam}&format=gra`,
      "_blank"
    );
  };

  const handleExportPetra = () => {
    const deptParam = departmentFilter !== "all" ? departmentFilter : "";
    const queryParam = search.trim() ? encodeURIComponent(search) : "";
    window.open(
      `/api/deductions?department=${encodeURIComponent(deptParam)}&search=${queryParam}&format=petra`,
      "_blank"
    );
  };

  const handleExportFullExcel = () => {
    const deptParam = departmentFilter !== "all" ? departmentFilter : "";
    const queryParam = search.trim() ? encodeURIComponent(search) : "";
    window.open(
      `/api/deductions?department=${encodeURIComponent(deptParam)}&search=${queryParam}&format=excel`,
      "_blank"
    );
  };

  // Get unique departments for Shadcn select
  const departmentsList = Array.from(
    new Set(deductionsData.map((d) => d.department).filter(Boolean))
  ).sort();

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <span>Statutory SSNIT & Payroll Deductions</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage statutory SSNIT contributions (5.5% Employee), GRA PAYE Income Tax & SSNIT payment exports
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold shadow-md transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Staff</span>
            </button>
            <button
              onClick={handleExportGra}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition"
            >
              <Building className="h-4 w-4" />
              <span>Export GRA Schedule (.xlsx)</span>
            </button>
            <button
              onClick={handleExportSsnit}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export SSNIT Schedule (.xlsx)</span>
            </button>
            <button
              onClick={handleExportPetra}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export Petra Tier 2 (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* CMS Configuration Card: SSNIT Percentage Manager */}
        <form
          onSubmit={handleSaveCmsRates}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Percent className="h-4 w-4" />
                <span>Statutory & Pension Contribution Percentage CMS</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure global contribution rates for SSNIT Tier-1 and Petra Pension Tier-3
              </p>
            </div>

            <button
              type="submit"
              disabled={savingCms}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 self-start sm:self-auto transition disabled:opacity-50"
            >
              {savingCms ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save CMS Rates</span>
            </button>
          </div>

          {cmsSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{cmsSuccessMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* SSNIT Employee */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white block">
                SSNIT Employee Rate (%)
              </span>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={cmsRates.ssnit_employee_rate}
                  onChange={(e) =>
                    setCmsRates({ ...cmsRates, ssnit_employee_rate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full pl-3 pr-8 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[10px] text-slate-400">Ghana Tier 1 Employee Rate: 5.5%</p>
            </div>

            {/* SSNIT Employer */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white block">
                SSNIT Employer Rate (%)
              </span>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={cmsRates.ssnit_employer_rate}
                  onChange={(e) =>
                    setCmsRates({ ...cmsRates, ssnit_employer_rate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full pl-3 pr-8 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[10px] text-slate-400">Ghana Tier 1 Employer Match: 13.0%</p>
            </div>

            {/* Petra Employee */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white block">
                Petra Employee Rate (%)
              </span>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={cmsRates.petra_employee_rate}
                  onChange={(e) =>
                    setCmsRates({ ...cmsRates, petra_employee_rate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full pl-3 pr-8 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[10px] text-slate-400">Petra Tier 3 Employee Rate: 5.0%</p>
            </div>

            {/* Petra Employer */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white block">
                Petra Employer Rate (%)
              </span>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={cmsRates.petra_employer_rate}
                  onChange={(e) =>
                    setCmsRates({ ...cmsRates, petra_employer_rate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full pl-3 pr-8 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[10px] text-slate-400">Petra Tier 3 Employer Match: 5.0%</p>
            </div>
          </div>

          {/* Official 2026 GRA Monthly Income Tax Schedule CMS Table */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>MONTHLY - Official GRA Income Tax Schedule (Year of Assessment 2026)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure Ghana GRA Chargeable Income Tax Bands applied to all temporary staff taxable salaries
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700">Year of Assessment 2026</th>
                    <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700">Chargeable Income (GH₵)</th>
                    <th className="p-3 text-center">Rate (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                  {payeBrackets.map((b, idx) => (
                    <tr key={b.band_order || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-bold text-center border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                        {b.label}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                        <div className="relative max-w-xs mx-auto">
                          <span className="absolute left-3 top-2.5 text-slate-400 font-bold">GH₵</span>
                          <input
                            type="number"
                            step="0.01"
                            disabled={!canEditSettings}
                            value={b.chargeable_amount}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const copy = [...payeBrackets];
                              copy[idx] = { ...copy[idx], chargeable_amount: val };
                              setPayeBrackets(copy);
                            }}
                            className="w-full pl-11 pr-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </td>
                      <td className="p-2.5">
                        <div className="relative max-w-xs mx-auto">
                          <input
                            type="number"
                            step="0.1"
                            disabled={!canEditSettings}
                            value={b.rate_percent}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const copy = [...payeBrackets];
                              copy[idx] = { ...copy[idx], rate_percent: val };
                              setPayeBrackets(copy);
                            }}
                            className="w-full pl-3 pr-8 py-1.5 text-xs font-mono font-bold text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </form>

        {/* Summary KPI Pool Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* SSNIT Pool */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <span>SSNIT Monthly Pool</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                  {(cmsRates.ssnit_employee_rate + cmsRates.ssnit_employer_rate).toFixed(1)}% Combined
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  GH₵{summary.totalSsnitCombined.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex justify-between font-medium">
                <span>Emp (5.5%): GH₵{summary.totalSsnitEmpPool.toFixed(2)}</span>
                <span>Employer Match: GH₵{summary.totalSsnitErPool.toFixed(2)}</span>
              </div>
            </div>

            {/* Total Employee Deductions */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <span>Total Statutory Deductions Pool</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                  SSNIT + GRA PAYE
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  GH₵{summary.totalEmployeeDeductionsPool.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400 font-medium">
                Deducted from employee gross salaries
              </div>
            </div>

            {/* Net Payroll Take Home */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <span>Net Employee Take-Home Pay</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                  {summary.totalStaffCount} Active Staff
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  GH₵{summary.totalNetSalaryPool.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex justify-between font-medium">
                <span>Gross Payroll: GH₵{summary.totalGrossSalary.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Staff Deductions Toolbar & Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                SSNIT & Statutory Deductions Schedule
              </h3>
              <p className="text-xs text-slate-500">
                Showing <strong>{deductionsData.length}</strong> active staff members
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search name, code, SSNIT no..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              {/* Station Filter Select */}
              <div className="w-full sm:w-44">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Stations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stations</SelectItem>
                    {departmentsList.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status Select */}
              <div className="w-full sm:w-44">
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Payout Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payout Statuses</SelectItem>
                    <SelectItem value="paid">Paid Only</SelectItem>
                    <SelectItem value="unpaid">Unpaid / On Hold Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Table with crisp black text for deduction amounts */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">Staff Member & SSNIT No</th>
                  <th className="p-3">Station / Location</th>
                  <th className="p-3">Payout Status</th>
                  <th className="p-3 text-slate-900 dark:text-white">Basic Gross Salary</th>
                  <th className="p-3 text-slate-900 dark:text-white bg-slate-200/50 dark:bg-slate-800/80">SSNIT Emp ({cmsRates.ssnit_employee_rate}%)</th>
                  <th className="p-3 text-slate-900 dark:text-white">GRA PAYE Tax</th>
                  <th className="p-3 text-slate-900 dark:text-white bg-slate-200/50 dark:bg-slate-800/80">Total Deductions</th>
                  <th className="p-3 text-emerald-700 dark:text-emerald-400">Net Take-Home Pay</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Calculating statutory SSNIT deductions...
                    </td>
                  </tr>
                ) : deductionsData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No matching staff deduction records found.
                    </td>
                  </tr>
                ) : (
                  paginatedDeductions.map((item) => {
                    const isPaid = item.payment_status === "paid";

                    return (
                      <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${!isPaid ? "bg-amber-50/30 dark:bg-amber-950/10" : ""}`}>
                        {/* Name & SSNIT Number */}
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">{item.full_name}</div>
                          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>{item.staff_code}</span>
                            {item.ssnit_no && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                                SSNIT: {item.ssnit_no}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Station */}
                        <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{item.department}</td>
                        
                        {/* Payout Status Badge */}
                        <td className="p-3">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              <span>Paid</span>
                            </span>
                          ) : (
                            <div className="inline-flex flex-col">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-[10px] border border-amber-300 dark:border-amber-800">
                                <PauseCircle className="h-3 w-3 text-amber-600" />
                                <span>Unpaid / On Hold</span>
                              </span>
                              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium italic mt-0.5">
                                {item.unpaid_reason || "Payment On Hold"}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Basic Gross Salary */}
                        <td className="p-3 font-mono font-black text-slate-900 dark:text-white">
                          GH₵{item.salary.toFixed(2)}
                        </td>

                        {/* SSNIT Emp (5.5%) - BLACK TEXT */}
                        <td className="p-3 font-mono font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950/50">
                          GH₵{item.ssnit_employee_amount.toFixed(2)}
                        </td>

                        {/* GRA PAYE Tax - BLACK TEXT */}
                        <td className="p-3 font-mono font-black text-slate-900 dark:text-white">
                          GH₵{item.paye_tax_amount.toFixed(2)}
                        </td>

                        {/* Total Deductions - BLACK TEXT */}
                        <td className="p-3 font-mono font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950/50">
                          GH₵{item.total_employee_deductions.toFixed(2)}
                        </td>

                        {/* Net Take-Home Pay (1,200.72 for 1,400 basic) */}
                        <td className="p-3 font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          GH₵{item.net_take_home_salary.toFixed(2)}
                        </td>

                        <td className="p-3 text-right">
                          <button
                            onClick={() => setPaymentStatusTarget(item)}
                            title="Update Payment Status (Paid / Unpaid Hold)"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <PauseCircle className="h-4 w-4 text-amber-500" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 25-Item Pagination Controls Footer Bar */}
          {deductionsData.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-950/40">
              <div className="text-slate-500 dark:text-slate-400 font-medium">
                Showing <strong>{Math.min((currentPage - 1) * PAGE_SIZE + 1, deductionsData.length)}</strong> to{" "}
                <strong>{Math.min(currentPage * PAGE_SIZE, deductionsData.length)}</strong> of{" "}
                <strong>{deductionsData.length}</strong> staff deduction records
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  title="First Page"
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Previous Page"
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="px-3 py-1 font-bold text-slate-800 dark:text-slate-200">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Next Page"
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  title="Last Page"
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={showAddStaffModal}
        onClose={() => setShowAddStaffModal(false)}
        onSuccess={() => fetchDeductions()}
      />

      {/* Payment Status Modal */}
      <PaymentStatusModal
        isOpen={!!paymentStatusTarget}
        onClose={() => setPaymentStatusTarget(null)}
        staff={paymentStatusTarget}
        onSuccess={() => fetchDeductions()}
      />
    </SidebarLayout>
  );
}
