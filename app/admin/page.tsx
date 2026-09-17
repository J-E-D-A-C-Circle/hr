'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RegionalStat {
  regionId: string;
  regionName: string;
  totalBranches: number;
  approvedCount: number;
  pendingCount: number;
  unsubmittedCount: number;
}

export default function ExecutiveDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalBranches: number;
    approvedCount: number;
    pendingCount: number;
    overdueCount: number;
    complianceRate: number;
    regionalBreakdown: RegionalStat[];
  } | null>(null);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/submissions?limit=500&year=2026&month=8');
      const data = await res.json();
      const branchesRes = await fetch('/api/admin/branches?limit=200');
      const branchesData = await branchesRes.json();

      const totalBranches = branchesData.branches?.length ?? 0;
      const submissions = data.submissions || [];

      const approved = submissions.filter((s: any) => s.status === 'APPROVED').length;
      const pending = submissions.filter((s: any) => s.status === 'PENDING').length;
      const unsubmitted = Math.max(0, totalBranches - (approved + pending));
      const complianceRate = totalBranches > 0 ? Math.round((approved / totalBranches) * 100) : 0;

      // Group by region
      const regionMap = new Map<string, RegionalStat>();
      (branchesData.branches || []).forEach((b: any) => {
        const regName = b.region?.name || 'Unassigned';
        const regId = b.regionId || 'unknown';
        if (!regionMap.has(regId)) {
          regionMap.set(regId, {
            regionId: regId,
            regionName: regName,
            totalBranches: 0,
            approvedCount: 0,
            pendingCount: 0,
            unsubmittedCount: 0,
          });
        }
        const stat = regionMap.get(regId)!;
        stat.totalBranches += 1;
      });

      submissions.forEach((s: any) => {
        const regId = s.branch?.regionId;
        if (regId && regionMap.has(regId)) {
          const stat = regionMap.get(regId)!;
          if (s.status === 'APPROVED') stat.approvedCount += 1;
          else if (s.status === 'PENDING') stat.pendingCount += 1;
        }
      });

      regionMap.forEach((stat) => {
        stat.unsubmittedCount = Math.max(0, stat.totalBranches - (stat.approvedCount + stat.pendingCount));
      });

      setStats({
        totalBranches,
        approvedCount: approved,
        pendingCount: pending,
        overdueCount: unsubmitted,
        complianceRate,
        regionalBreakdown: Array.from(regionMap.values()),
      });
    } catch (e) {
      console.error('Failed to load dashboard metrics:', e);
    } fontally: {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 border border-emerald-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-800 text-emerald-200 border-emerald-700">
              Executive View
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-normal">Dashboard</h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 font-normal max-w-2xl">
            Real-time compliance oversight for station offices across administrative regions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={fetchDashboardStats}
            variant="outline"
            className="border-emerald-700 bg-emerald-950/60 text-emerald-100 hover:bg-emerald-900 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Metrics</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Stations
            </CardTitle>
            <Building2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.totalBranches ?? 0}</div>
            <p className="text-[11px] text-slate-500 mt-1 font-normal">Registered Station Offices</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Approved
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{stats?.approvedCount ?? 0}</div>
            <p className="text-[11px] text-slate-500 mt-1 font-normal">Verified payroll forms</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.pendingCount ?? 0}</div>
            <p className="text-[11px] text-slate-500 mt-1 font-normal">Awaiting HR review</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Compliance Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.complianceRate ?? 0}%</div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, stats?.complianceRate ?? 0))}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Regional Performance Table */}
        <Card className="lg:col-span-8 border-slate-200/80 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Regional Compliance Matrix</CardTitle>
                <p className="text-xs text-slate-500 font-normal mt-0.5">Submission status broken down by administrative region</p>
              </div>
              <Link href="/compliance">
                <Button variant="outline" size="sm" className="text-xs text-slate-700">
                  View Full Grid
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <th className="p-4">Region</th>
                    <th className="p-4">Total Stations</th>
                    <th className="p-4">Approved</th>
                    <th className="p-4">Pending</th>
                    <th className="p-4">Unsubmitted</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Loading regional metrics...
                      </td>
                    </tr>
                  ) : !stats?.regionalBreakdown.length ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No station data available.
                      </td>
                    </tr>
                  ) : (
                    stats.regionalBreakdown.map((reg) => {
                      const rate = reg.totalBranches > 0 ? Math.round((reg.approvedCount / reg.totalBranches) * 100) : 0;
                      return (
                        <tr key={reg.regionId} className="hover:bg-slate-50 transition">
                          <td className="p-4 font-bold text-slate-900">{reg.regionName}</td>
                          <td className="p-4 text-slate-700">{reg.totalBranches}</td>
                          <td className="p-4 font-semibold text-emerald-700">{reg.approvedCount}</td>
                          <td className="p-4 font-semibold text-amber-600">{reg.pendingCount}</td>
                          <td className="p-4 font-semibold text-slate-500">{reg.unsubmittedCount}</td>
                          <td className="p-4 text-right">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                rate === 100
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : rate > 50
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {rate}% Rate
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Right Info Card */}
        <Card className="lg:col-span-4 border-slate-200/80 shadow-xs space-y-4 p-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">System Compliance Status</h3>
              <p className="text-xs text-slate-500 font-normal">Monthly validation overview</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-700">Monthly Cutoff Date</div>
              <div className="text-slate-900 font-bold text-sm">21st of every month</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-700">History & System Logging</div>
              <div className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Active & Monitoring
              </div>
            </div>
          </div>

          <Link href="/review">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs mt-2 shadow-xs">
              Go to Review Queue
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
