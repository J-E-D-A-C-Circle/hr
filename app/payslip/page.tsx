"use client";

import React, { useState, useEffect, useMemo } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import StatusBadge from "@/components/StatusBadge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Receipt,
  Printer,
  Download,
  Search,
  Building,
  User,
  CreditCard,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { formatDateReadable, getCurrentMonthYearString, getRecentMonthOptions } from "@/lib/status";
import { calculateGhanaDeductions } from "@/lib/payroll";

export default function PayslipPage() {
  const currentMonthStr = getCurrentMonthYearString();
  const recentMonths = getRecentMonthOptions(12);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [month, setMonth] = useState<string>(currentMonthStr);
  const [search, setSearch] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch all staff
  useEffect(() => {
    setLoading(true);
    fetch("/api/staff")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setStaffList(json.data);
          if (json.data.length > 0) {
            setSelectedStaffId(json.data[0].id);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Filtered staff dropdown list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      if (departmentFilter !== "all" && s.department !== departmentFilter) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const matchName = s.full_name?.toLowerCase().includes(q);
      const matchCode = s.staff_code?.toLowerCase().includes(q) || `emp-${s.id}`.includes(q);
      const matchSsnit = s.ssnit_no?.toLowerCase().includes(q);
      const matchBank = s.bank_account?.toLowerCase().includes(q);
      const matchDept = s.department?.toLowerCase().includes(q);
      return matchName || matchCode || matchSsnit || matchBank || matchDept;
    });
  }, [staffList, search, departmentFilter]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    staffList.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set).sort();
  }, [staffList]);

  // Selected Staff Record
  const currentStaff = useMemo(() => {
    if (!selectedStaffId) return filteredStaff[0] || null;
    return staffList.find((s) => s.id === selectedStaffId) || filteredStaff[0] || null;
  }, [staffList, selectedStaffId, filteredStaff]);

  // Financial Computations for Current Staff
  const financials = useMemo(() => {
    if (!currentStaff) return null;
    const basic = currentStaff.salary ? Number(currentStaff.salary) : 1400.00;
    const ghanaCalc = calculateGhanaDeductions(basic);
    const gross = basic;
    const ssnitEmployee = ghanaCalc.ssnit_employee_amount;
    const ssnitEmployer = ghanaCalc.ssnit_employer_amount;
    const petraTier2 = ghanaCalc.petra_employee_amount;
    const graPaye = ghanaCalc.paye_tax_amount;
    const totalDeductions = ghanaCalc.total_employee_deductions;
    const netPay = ghanaCalc.net_take_home_salary;

    return {
      basic,
      gross,
      ssnitEmployee,
      ssnitEmployer,
      petraTier2,
      graPaye,
      totalDeductions,
      netPay,
    };
  }, [currentStaff]);

  // Index for Prev/Next Navigation
  const currentIndex = useMemo(() => {
    if (!currentStaff) return -1;
    return filteredStaff.findIndex((s) => s.id === currentStaff.id);
  }, [filteredStaff, currentStaff]);

  const handlePrevStaff = () => {
    if (currentIndex > 0) {
      setSelectedStaffId(filteredStaff[currentIndex - 1].id);
    }
  };

  const handleNextStaff = () => {
    if (currentIndex < filteredStaff.length - 1) {
      setSelectedStaffId(filteredStaff[currentIndex + 1].id);
    }
  };

  const handlePrintPayslip = () => {
    window.print();
  };

  const handleDownloadExcelPayslip = () => {
    if (!currentStaff) return;
    const params = new URLSearchParams({
      staff_id: String(currentStaff.id),
      month,
      format: "excel",
    });
    window.open(`/api/payslip?${params.toString()}`, "_blank");
  };

  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Suggestions for autocomplete popup
  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return staffList
      .filter((s) => {
        if (departmentFilter !== "all" && s.department !== departmentFilter) {
          return false;
        }
        const matchName = s.full_name?.toLowerCase().includes(q);
        const matchCode = s.staff_code?.toLowerCase().includes(q) || `emp-${s.id}`.includes(q);
        const matchSsnit = s.ssnit_no?.toLowerCase().includes(q);
        const matchBank = s.bank_account?.toLowerCase().includes(q);
        const matchDept = s.department?.toLowerCase().includes(q);
        return matchName || matchCode || matchSsnit || matchBank || matchDept;
      })
      .slice(0, 10);
  }, [staffList, search, departmentFilter]);

  // Controls & Search Bar (hidden during print)
  return (
    <SidebarLayout>
      <style>{`
        @media print {
          /* Hide all UI shell elements during print */
          header, sidebar, nav, .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .payslip-print-card {
            border: 2px solid #047857 !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 800px !important;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Page Header Bar (hidden during print) */}
        <div className="no-print bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="h-6 w-6 text-emerald-600" />
              <span>Official Staff Salary Payslip Generator</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Search staff member, preview official DVLA payslip, print single-page PDF or download styled Excel
            </p>
          </div>

          {currentStaff && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handlePrintPayslip}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold shadow-md hover:bg-slate-800 transition"
              >
                <Printer className="h-4 w-4" />
                <span>Print / Save PDF</span>
              </button>

              <button
                onClick={handleDownloadExcelPayslip}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Download Excel Payslip (.xlsx)</span>
              </button>
            </div>
          )}
        </div>

        {/* Controls & Search Bar (hidden during print) */}
        <div className="no-print bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Search Input with Autocomplete Dropdown */}
            <div className="md:col-span-2 relative">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Search Staff Name (Live Autocomplete)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type name, staff code (e.g. TEMP-805), SSNIT, account..."
                  value={search}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && suggestions.length > 0) {
                      const firstMatch = suggestions[0];
                      setSelectedStaffId(firstMatch.id);
                      setSearch(firstMatch.full_name);
                      setShowSuggestions(false);
                    }
                  }}
                  className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-xs"
                />
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setShowSuggestions(false);
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Autocomplete Suggestions Dropdown Popup */}
              {showSuggestions && search.trim().length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  {suggestions.length > 0 ? (
                    suggestions.map((staff) => (
                      <button
                        key={staff.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevents input blur before click executes
                          setSelectedStaffId(staff.id);
                          setSearch(staff.full_name);
                          setShowSuggestions(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-between transition group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-black flex items-center justify-center text-xs group-hover:scale-105 transition border border-emerald-200 dark:border-emerald-800">
                            {staff.full_name?.charAt(0) || "S"}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{staff.full_name}</span>
                              <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                {staff.staff_code || `EMP-${staff.id}`}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{staff.department || "General Station"}</span>
                              {staff.ssnit_no && <span>• SSNIT: {staff.ssnit_no}</span>}
                              {staff.bank_account && <span>• Acc: {staff.bank_account}</span>}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-center text-xs text-slate-400 italic">
                      No matching staff found for &quot;{search}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Select Staff Dropdown */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Staff Record ({filteredStaff.length} Matches)
              </label>
              <Select
                value={currentStaff ? String(currentStaff.id) : ""}
                onValueChange={(val) => setSelectedStaffId(Number(val))}
              >
                <SelectTrigger className="w-full text-xs font-bold">
                  <SelectValue placeholder="Choose Staff" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredStaff.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.full_name} ({s.staff_code || `EMP-${s.id}`}) - {s.department || "General"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pay Period Month */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payslip Month / Pay Period
              </label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-full text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {recentMonths.map((m, idx) => {
                    const isCurrent = idx === 0;
                    return (
                      <React.Fragment key={m}>
                        <SelectItem
                          value={m}
                          className={isCurrent ? "font-bold text-emerald-600 dark:text-emerald-400" : "font-medium"}
                        >
                          {m} {isCurrent ? "(Current)" : ""}
                        </SelectItem>
                        <SelectItem value={`${m} (Supplementary)`} className="font-bold text-amber-600 dark:text-amber-400">
                          {m} (Supplementary)
                        </SelectItem>
                      </React.Fragment>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Staff Navigation Bar */}
          {filteredStaff.length > 0 && currentStaff && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <span>Staff <strong>{currentIndex + 1}</strong> of <strong>{filteredStaff.length}</strong></span>
                <span>•</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{currentStaff.full_name}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentIndex <= 0}
                  onClick={handlePrevStaff}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 font-semibold transition flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous Staff</span>
                </button>
                <button
                  disabled={currentIndex >= filteredStaff.length - 1}
                  onClick={handleNextStaff}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 font-semibold transition flex items-center gap-1"
                >
                  <span>Next Staff</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PAYSLIP DOCUMENT CARD PREVIEW */}
        {loading ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            Loading staff records...
          </div>
        ) : !currentStaff || !financials ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No matching staff record found. Try clearing your search query.
          </div>
        ) : (
          <div className="payslip-print-card bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-600 dark:border-emerald-500 shadow-2xl overflow-hidden max-w-4xl mx-auto transition">
            {/* Payslip Header Banner */}
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 p-6 text-white text-center relative border-b-4 border-amber-500">
              <div className="flex items-center justify-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 font-black text-xl">
                  DVLA
                </div>
                <h2 className="text-xl font-black tracking-wider uppercase">
                  Driver and Vehicle Licensing Authority
                </h2>
              </div>
              <h3 className="text-sm font-bold tracking-widest text-emerald-200 uppercase mt-1">
                Official Temporary Staff Salary Payslip
              </h3>
              <div className="inline-block mt-2 px-4 py-1 rounded-full bg-emerald-700/80 border border-emerald-500/50 font-mono text-xs font-bold text-amber-300">
                PAY PERIOD: {month.toUpperCase()}
              </div>
            </div>

            {/* Employee Information Section */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-950/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Staff Code / ID:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {currentStaff.staff_code || `EMP-${currentStaff.id}`}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Full Employee Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white uppercase">{currentStaff.full_name}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Station / Location:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{currentStaff.department || "Head Office"}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Designation / Role:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{currentStaff.role || "Temporary Staff"}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">SSNIT Number:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{currentStaff.ssnit_no || "N/A"}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Ghana Card (NIA):</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{currentStaff.nia_number || "N/A"}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Bank Name & Branch:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {currentStaff.bank_name ? `${currentStaff.bank_name} (${currentStaff.bank_branch || "Main"})` : "N/A"}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Bank Account No:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{currentStaff.bank_account || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Earnings vs Deductions Table */}
            <div className="p-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Earnings Column */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="bg-emerald-700 text-white font-bold p-2.5 text-center uppercase tracking-wider text-[11px]">
                      Earnings & Allowances
                    </div>
                    <div className="p-4 space-y-2.5">
                      <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                        <span>Basic Monthly Salary</span>
                        <span className="font-mono font-bold">GH₵ {financials.basic.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-800 p-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center font-bold text-slate-900 dark:text-white">
                    <span>GROSS SALARY PAY</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                      GH₵ {financials.gross.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Deductions Column */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="bg-rose-700 text-white font-bold p-2.5 text-center uppercase tracking-wider text-[11px]">
                      Statutory Deductions
                    </div>
                    <div className="p-4 space-y-2.5">
                      <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                        <span>SSNIT Employee Contribution (5.5%)</span>
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          - GH₵ {financials.ssnitEmployee.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                        <span>GRA PAYE Income Tax</span>
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          - GH₵ {financials.graPaye.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span>* SSNIT Employer Contribution (13%)</span>
                        <span className="font-mono">GH₵ {financials.ssnitEmployer.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 text-[11px]">
                        <span>* Petra Tier 2 Contribution (5%)</span>
                        <span className="font-mono">GH₵ {financials.petraTier2.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-800 p-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center font-bold text-slate-900 dark:text-white">
                    <span>TOTAL DEDUCTIONS</span>
                    <span className="font-mono text-rose-600 dark:text-rose-400 text-sm">
                      - GH₵ {financials.totalDeductions.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* NET TAKE-HOME PAY HIGHLIGHT BOX */}
              <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-emerald-950 border-2 border-emerald-500 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div>
                  <div className="text-xs uppercase tracking-widest text-emerald-300 font-bold">
                    Net Take-Home Amount
                  </div>
                  <div className="text-xs text-emerald-100 mt-0.5">
                    Direct Credit to Bank Account #{currentStaff.bank_account || "N/A"} ({currentStaff.bank_name || "N/A"})
                  </div>
                </div>
                <div className="text-3xl font-black font-mono text-amber-300 tracking-tight">
                  GH₵ {financials.netPay.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Signatures & Stamp Footer */}
              <div className="mt-8 pt-6 border-t border-dashed border-slate-300 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-8 text-[11px] text-slate-500 dark:text-slate-400">
                <div>
                  <div className="border-b border-slate-300 dark:border-slate-700 h-10 mb-1 flex items-end">
                    <span className="italic text-slate-400">Signed electronically by DVLA Payroll</span>
                  </div>
                  <div className="font-bold text-slate-700 dark:text-slate-300">
                    Authorized HR & Payroll Officer
                  </div>
                  <div>Driver and Vehicle Licensing Authority</div>
                </div>

                <div>
                  <div className="border-b border-slate-300 dark:border-slate-700 h-10 mb-1"></div>
                  <div className="font-bold text-slate-700 dark:text-slate-300">
                    Employee Acknowledgment Signature
                  </div>
                  <div>Date: ____ / ____ / ________</div>
                </div>
              </div>
            </div>

            {/* Document Watermark Footer */}
            <div className="bg-slate-100 dark:bg-slate-850 px-6 py-3 text-center text-[10px] text-slate-400 font-mono border-t border-slate-200 dark:border-slate-800">
              CONFIDENTIAL COMPUTER GENERATED SALARY PAYSLIP • DVLA TEMPORARY STAFF HR MANAGEMENT SYSTEM
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
