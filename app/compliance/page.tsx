'use client';

import { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Building2,
  PieChart,
  RefreshCw,
  Search,
  Archive,
} from 'lucide-react';
import Papa from 'papaparse';
import AuditZipExportModal from '@/components/AuditZipExportModal';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface Branch {
  id: string;
  name: string;
  code: string;
  region: { id: string; name: string };
  submissions: {
    id: string;
    month: number;
    year: number;
    status: string;
    uploadedAt: string;
    reviewedAt?: string;
  }[];
}

interface Region {
  id: string;
  name: string;
}

export default function CompliancePage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [showZipModal, setShowZipModal] = useState(false);

  const [regionFilter, setRegionFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState(2026);
  const [searchQuery, setSearchQuery] = useState('');

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const currentMonth = 8; // August 2026

  useEffect(() => {
    loadData();
  }, [regionFilter, yearFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const bRes = await fetch('/api/admin/branches');
      const bData = await bRes.json();
      if (bData.regions) setRegions(bData.regions);

      const subRes = await fetch(`/api/submissions?year=${yearFilter}`);
      const subData = await subRes.json();

      if (bData.branches && subData.submissions) {
        const subsMap = new Map<string, any[]>();
        subData.submissions.forEach((s: any) => {
          if (!subsMap.has(s.branchId)) subsMap.set(s.branchId, []);
          subsMap.get(s.branchId)!.push(s);
        });

        const merged = bData.branches.map((b: any) => ({
          ...b,
          submissions: subsMap.get(b.id) || [],
        }));

        setBranches(merged);
      }
    } catch (e) {
      console.error('Failed to load compliance data:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredBranches = branches.filter((b: Branch) => {
    if (regionFilter !== 'ALL' && b.region.id !== regionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q);
    }
    return true;
  });

  let totalRequiredCells = 0;
  let totalApproved = 0;
  let totalPending = 0;
  let totalOverdue = 0;

  filteredBranches.forEach((b: Branch) => {
    months.forEach((m) => {
      if (m <= currentMonth) {
        totalRequiredCells++;
        const sub = b.submissions.find((s: any) => s.month === m && s.year === yearFilter);
        if (sub?.status === 'APPROVED') totalApproved++;
        else if (sub?.status === 'PENDING') totalPending++;
        else totalOverdue++;
      }
    });
  });

  const complianceRate = totalRequiredCells > 0 ? ((totalApproved / totalRequiredCells) * 100).toFixed(1) : '0.0';

  const exportCSV = () => {
    const csvRows: any[] = [];

    filteredBranches.forEach((b: Branch) => {
      months.forEach((m) => {
        const sub = b.submissions.find((s: any) => s.month === m && s.year === yearFilter);
        let cellStatus = 'Not Yet Due';
        if (sub?.status === 'APPROVED') cellStatus = 'Approved';
        else if (sub?.status === 'PENDING') cellStatus = 'Pending Review';
        else if (sub?.status === 'REJECTED') cellStatus = 'Needs Resubmission';
        else if (m <= currentMonth) cellStatus = 'Overdue / Missing';

        csvRows.push({
          Station_Code: b.code,
          Station_Name: b.name,
          Region: b.region.name,
          Month: m,
          Year: yearFilter,
          Status: cellStatus,
          Submitted_Date: sub ? new Date(sub.uploadedAt).toLocaleDateString() : 'N/A',
          Reviewed_Date: sub?.reviewedAt ? new Date(sub.reviewedAt).toLocaleDateString() : 'N/A',
        });
      });
    });

    const csvStr = Papa.unparse(csvRows);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PVC_Compliance_Report_${yearFilter}_Region_${regionFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Zip Export Modal */}
      <AuditZipExportModal isOpen={showZipModal} onClose={() => setShowZipModal(false)} />

      {/* Top Header Card */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 border border-emerald-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 flex items-center gap-1.5 shadow-2xs">
              <LayoutGrid className="h-3.5 w-3.5 text-emerald-300" />
              Compliance Table
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-normal">Station Compliance Grid</h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 font-normal max-w-2xl mt-1">
            Check monthly submission progress across all stations for {yearFilter}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowZipModal(true)}
            className="px-4 py-2.5 text-xs font-normal rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Archive className="h-4 w-4 text-emerald-200" />
            <span>Download Zip Files for Audit</span>
          </button>

          <button
            onClick={loadData}
            className="px-4 py-2.5 text-xs font-normal rounded-xl bg-emerald-950/80 hover:bg-emerald-950 text-white border border-emerald-800 transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 text-emerald-300" />
            <span>Refresh Table</span>
          </button>

          <button
            onClick={exportCSV}
            className="px-4 py-2.5 text-xs font-normal rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="h-4 w-4 text-white" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Modern High-Contrast KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Compliance Rate */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Overall Rate</span>
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold border border-teal-200">
              <PieChart className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{complianceRate}%</div>
          <p className="text-[11px] text-slate-500 mt-1">Approved forms out of total due</p>
        </div>

        {/* Total Approved */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Approved Forms</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{totalApproved}</div>
          <p className="text-[11px] text-emerald-700 mt-1">Checked and approved</p>
        </div>

        {/* Pending Review */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pending Review</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold border border-amber-200">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{totalPending}</div>
          <p className="text-[11px] text-amber-700 mt-1">Waiting for review</p>
        </div>

        {/* Overdue / Missing */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Overdue / Missing</span>
            <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold border border-rose-200">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{totalOverdue}</div>
          <p className="text-[11px] text-rose-700 mt-1">Needs station submission</p>
        </div>
      </div>

      {/* Region Completion Progress Strip */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900 uppercase tracking-wider">Regional Compliance Status (Month {currentMonth}/{yearFilter})</span>
          <span className="text-slate-500 font-mono">50+ Station Grid Matrix</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {regions.map((reg) => {
            const regBranches = branches.filter((b) => b.region.id === reg.id);
            const regApproved = regBranches.filter((b) =>
              b.submissions.some((s) => s.month === currentMonth && s.year === yearFilter && s.status === 'APPROVED')
            ).length;
            const pct = regBranches.length > 0 ? Math.round((regApproved / regBranches.length) * 100) : 0;

            return (
              <div
                key={reg.id}
                onClick={() => setRegionFilter(regionFilter === reg.id ? 'ALL' : reg.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition flex items-center gap-2 ${
                  regionFilter === reg.id
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <span>{reg.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    pct === 100
                      ? 'bg-emerald-100 text-emerald-800'
                      : pct > 50
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {pct}% ({regApproved}/{regBranches.length})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls & Filter Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search station name or code..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-normal text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none transition"
            />
          </div>

          {/* Region Dropdown */}
          <div className="space-y-1 min-w-[140px]">
            <label className="block text-[11px] text-slate-500 font-normal">Region</label>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Regions</SelectItem>
                {regions.map((r: Region) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Dropdown */}
          <div className="space-y-1 min-w-[110px]">
            <label className="block text-[11px] text-slate-500 font-normal">Year</label>
            <Select value={yearFilter.toString()} onValueChange={(val) => setYearFilter(parseInt(val))}>
              <SelectTrigger>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-600 shadow-2xs"></span>
            <span className="text-slate-900 font-bold">Approved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-500 shadow-2xs"></span>
            <span className="text-slate-900 font-bold">Pending Review</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-600 shadow-2xs"></span>
            <span className="text-slate-900 font-bold">Overdue / Rejected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-slate-300 shadow-2xs"></span>
            <span className="text-slate-500 font-semibold">Future Cycle</span>
          </div>
        </div>
      </div>

      {/* Compliance Grid Matrix */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-emerald-900 text-white font-semibold uppercase tracking-wider border-b border-emerald-800">
                <th className="p-4 min-w-[220px] sticky left-0 bg-emerald-900 z-10 border-r border-emerald-800">
                  Station Name
                </th>
                <th className="p-4 min-w-[120px] border-r border-slate-800">Region</th>
                {months.map((m) => {
                  const mName = [
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                  ][m - 1];
                  return (
                    <th key={m} className="p-3 text-center min-w-[65px] border-r border-slate-800">
                      {mName}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={14} className="py-16 text-center text-xs font-bold text-slate-600">
                    Loading matrix grid across 50+ stations...
                  </td>
                </tr>
              ) : filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-16 text-center text-xs font-semibold text-slate-500">
                    No stations found.
                  </td>
                </tr>
              ) : (
                filteredBranches.map((b: Branch) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    {/* Station Info (Sticky Left) */}
                    <td className="p-3.5 sticky left-0 bg-white border-r border-slate-200 z-10 font-medium">
                      <div className="text-slate-900 font-black">{b.name}</div>
                      <div className="text-[10px] text-indigo-700 font-mono font-bold">{b.code}</div>
                    </td>

                    {/* Region */}
                    <td className="p-3.5 border-r border-slate-200 text-slate-700 font-bold text-[11px]">
                      {b.region.name}
                    </td>

                    {/* Months 1-12 Status Cells */}
                    {months.map((m) => {
                      const sub = b.submissions.find((s: any) => s.month === m && s.year === yearFilter);

                      let bgClass = 'bg-slate-100 text-slate-400';
                      let statusText = '—';
                      let statusTitle = `Month ${m}: Not due yet`;

                      if (sub) {
                        if (sub.status === 'APPROVED') {
                          bgClass = 'bg-emerald-600 text-white font-black shadow-2xs';
                          statusText = '✓';
                          statusTitle = `Approved on ${new Date(sub.uploadedAt).toLocaleDateString()}`;
                        } else if (sub.status === 'PENDING') {
                          bgClass = 'bg-amber-500 text-white font-black shadow-2xs';
                          statusText = '⏳';
                          statusTitle = 'Pending HR Review';
                        } else if (sub.status === 'REJECTED') {
                          bgClass = 'bg-rose-600 text-white font-black shadow-2xs';
                          statusText = '✕';
                          statusTitle = 'Rejected - Needs Resubmission';
                        }
                      } else if (m <= currentMonth) {
                        bgClass = 'bg-rose-600 text-white font-black shadow-2xs';
                        statusText = '!';
                        statusTitle = 'Overdue / Not Submitted';
                      }

                      return (
                        <td
                          key={m}
                          title={statusTitle}
                          className="p-2 text-center border-r border-slate-200 text-xs transition cursor-default"
                        >
                          <div className={`h-8 w-8 mx-auto rounded-lg flex items-center justify-center ${bgClass}`}>
                            {statusText}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
