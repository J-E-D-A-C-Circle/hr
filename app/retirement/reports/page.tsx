"use client";

import React, { useState, useEffect } from "react";
import { FileBarChart, Download, Printer, Filter, Building2, Users, Calendar } from "lucide-react";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"summary" | "upcoming" | "department" | "retired">("summary");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [departments, setDepartments] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const limit = 8;

  useEffect(() => {
    setPage(1);
    fetchReportData();
  }, [reportType, deptFilter]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("type", reportType);
      if (deptFilter !== "ALL") params.set("departmentId", deptFilter);

      const res = await fetch(`/api/retirement/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }

      const deptRes = await fetch("/api/retirement/staff?limit=1");
      if (deptRes.ok) {
        const dData = await deptRes.json();
        setDepartments(dData.departments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const recordsList = reportType === "department" ? (reportData?.departments || []) : (reportData?.records || []);
  const totalPages = Math.ceil(recordsList.length / limit) || 1;
  const paginatedItems = recordsList.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-6 pb-12 print:p-0 print:bg-white">
      {/* Header (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <FileBarChart size={20} />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Retirement Reports & Analytics</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate, preview, and export official DVLA HR Directorate retirement analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintPDF}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition flex items-center gap-2 shadow-xs"
          >
            <Printer size={15} />
            <span>Print PDF Report</span>
          </button>

          <a
            href={`/api/retirement/reports?type=${reportType}&departmentId=${deptFilter}&export=excel`}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-2 shadow-md"
          >
            <Download size={15} />
            <span>Export to Excel</span>
          </a>
        </div>
      </div>

      {/* Report Controls & Filter Selector (Hidden on Print) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setReportType("summary")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              reportType === "summary"
                ? "bg-slate-900 text-amber-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Retirement Summary
          </button>
          <button
            onClick={() => setReportType("upcoming")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              reportType === "upcoming"
                ? "bg-slate-900 text-amber-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Upcoming Retirements
          </button>
          <button
            onClick={() => setReportType("department")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              reportType === "department"
                ? "bg-slate-900 text-amber-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Department Exposure
          </button>
          <button
            onClick={() => setReportType("retired")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              reportType === "retired"
                ? "bg-slate-900 text-amber-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Retired Staff Archive
          </button>
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
        >
          <option value="ALL">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id.toString()}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Report Document Paper Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Printable Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              DRIVER & VEHICLE LICENSING AUTHORITY (DVLA)
            </h1>
            <h2 className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {reportData?.title || "Official HR Retirement Analytics Report"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">DVLA Head Office — Human Resource Directorate, Accra</p>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono">
            <p>Generated: {new Date().toLocaleDateString()}</p>
            <p>Statutory Age: 60 Years</p>
          </div>
        </div>

        {loading || !reportData ? (
          <div className="py-12 text-center text-xs text-slate-500 animate-pulse">Generating report data preview...</div>
        ) : reportType === "summary" ? (
          <div className="space-y-6">
            {/* KPI Summary Block */}
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-500">TOTAL WORKFORCE</p>
                <p className="text-2xl font-black">{reportData.summary?.totalStaff}</p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 rounded-xl border border-emerald-200">
                <p className="text-[10px] font-bold">ACTIVE (&gt;5Y)</p>
                <p className="text-2xl font-black">{reportData.summary?.active}</p>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-700 rounded-xl border border-amber-200">
                <p className="text-[10px] font-bold">NEARING (1-5Y)</p>
                <p className="text-2xl font-black">{reportData.summary?.nearingRetirement}</p>
              </div>
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 rounded-xl border border-rose-200">
                <p className="text-[10px] font-bold">DUE THIS YEAR (&lt;1Y)</p>
                <p className="text-2xl font-black">{reportData.summary?.dueThisYear}</p>
              </div>
            </div>

            {/* Records Table */}
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Staff ID</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Job Title</th>
                  <th className="py-2.5 px-3">Age</th>
                  <th className="py-2.5 px-3">Retirement Date</th>
                  <th className="py-2.5 px-3">Remaining</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedItems.map((s: any) => (
                  <tr key={s.id}>
                    <td className="py-2.5 px-3 font-mono font-bold">{s.staffId}</td>
                    <td className="py-2.5 px-3 font-semibold">{s.fullName}</td>
                    <td className="py-2.5 px-3">{s.departmentName || "Unassigned"}</td>
                    <td className="py-2.5 px-3">{s.jobTitle}</td>
                    <td className="py-2.5 px-3 font-mono">{s.currentAgeFormatted}</td>
                    <td className="py-2.5 px-3 font-mono">{s.retirementDateFormatted}</td>
                    <td className="py-2.5 px-3 font-mono">{s.timeRemainingFormatted}</td>
                    <td className="py-2.5 px-3 font-bold">{s.statusLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : reportType === "department" ? (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Department Name</th>
                <th className="py-2.5 px-3">Head of Department</th>
                <th className="py-2.5 px-3">Total Staff</th>
                <th className="py-2.5 px-3">Active</th>
                <th className="py-2.5 px-3">Nearing (1-5y)</th>
                <th className="py-2.5 px-3 text-rose-600">Due This Year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedItems.map((d: any) => (
                <tr key={d.id}>
                  <td className="py-2.5 px-3 font-mono font-bold">{d.code}</td>
                  <td className="py-2.5 px-3 font-bold">{d.name}</td>
                  <td className="py-2.5 px-3">{d.headOfDept || "N/A"}</td>
                  <td className="py-2.5 px-3 font-mono font-bold">{d.totalStaff}</td>
                  <td className="py-2.5 px-3 font-mono">{d.active}</td>
                  <td className="py-2.5 px-3 font-mono text-amber-600 font-bold">{d.nearingRetirement}</td>
                  <td className="py-2.5 px-3 font-mono text-rose-600 font-bold">{d.dueThisYear}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Staff ID</th>
                <th className="py-2.5 px-3">Full Name</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Job Title</th>
                <th className="py-2.5 px-3">Statutory Retirement Date</th>
                <th className="py-2.5 px-3">Time Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedItems.map((s: any) => (
                <tr key={s.id}>
                  <td className="py-2.5 px-3 font-mono font-bold">{s.staffId}</td>
                  <td className="py-2.5 px-3 font-semibold">{s.fullName}</td>
                  <td className="py-2.5 px-3">{s.departmentName || "Unassigned"}</td>
                  <td className="py-2.5 px-3">{s.jobTitle}</td>
                  <td className="py-2.5 px-3 font-mono">{s.retirementDateFormatted}</td>
                  <td className="py-2.5 px-3 font-mono font-bold">{s.timeRemainingFormatted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Report Pagination Footer (Hidden on Print) */}
        {!loading && reportData && totalPages > 1 && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs print:hidden">
            <p className="text-slate-500">
              Page <strong className="text-slate-900 dark:text-slate-100">{page}</strong> of <strong className="text-slate-900 dark:text-slate-100">{totalPages}</strong> ({recordsList.length} items total)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
