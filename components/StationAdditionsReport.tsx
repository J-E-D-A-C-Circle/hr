"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Calendar,
  Download,
  Users,
  TrendingUp,
  MapPin,
  Loader2,
} from "lucide-react";
import StationSelect from "@/components/StationSelect";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CALENDAR_MONTHS } from "@/lib/status";

interface StationReportData {
  overallTotal: number;
  addedInYear: number;
  addedInMonth: number;
  selectedStation: string | null;
  stationTotal: number;
  stationAddedInYear: number;
  stationAddedInMonth: number;
  monthlyBreakdown: {
    monthIndex: number;
    monthName: string;
    totalAdded: number;
    stationAdded: number;
  }[];
  stationBreakdown: {
    station: string;
    totalStaff: number;
    addedInPeriod: number;
  }[];
  availableYears: string[];
}

interface StationAdditionsReportProps {
  onSelectStationForExport?: (station: string) => void;
}

export default function StationAdditionsReport({
  onSelectStationForExport,
}: StationAdditionsReportProps) {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(
    now.toLocaleString("en-US", { month: "long" })
  );
  const [station, setStation] = useState("");
  const [report, setReport] = useState<StationReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        year,
        month,
        station,
      });
      const res = await fetch(`/api/reports/stations?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setReport(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch station report:", err);
    } finally {
      setLoading(false);
    }
  }, [year, month, station]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const periodLabel =
    month === "all"
      ? year === "all"
        ? "All Time"
        : `Year ${year}`
      : `${month} ${year === "all" ? "" : year}`.trim();

  const yearsList =
    report?.availableYears && report.availableYears.length > 0
      ? report.availableYears
      : [String(now.getFullYear())];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <span>Station &amp; Monthly Staff Addition Reports</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track overall staff added and station-specific additions by year and month.
          </p>
        </div>
        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Updating report...</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Year
          </label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {yearsList.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Month
          </label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {CALENDAR_MONTHS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Station (Optional)
          </label>
          <StationSelect
            allowAll
            allLabel="All Stations"
            value={station}
            onChange={setStation}
            placeholder="Type or select station..."
          />
        </div>
      </div>

      {/* KPI Summary Cards */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <span>Overall Added ({periodLabel})</span>
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">
              {report.addedInMonth.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {year === "all"
                ? `${report.overallTotal.toLocaleString()} total in database`
                : `${report.addedInYear.toLocaleString()} added in ${year}`}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-300">
              <span>Total Staff in Database</span>
              <Users className="h-4 w-4" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">
              {report.overallTotal.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Across {report.stationBreakdown.length} stations
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-300">
              <span className="truncate">
                {station ? `${station} Added (${periodLabel})` : "Station Added (Select Station)"}
              </span>
              <MapPin className="h-4 w-4 shrink-0" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">
              {station ? report.stationAddedInMonth.toLocaleString() : "—"}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {station
                ? year === "all"
                  ? `${report.stationTotal.toLocaleString()} total at station`
                  : `${report.stationAddedInYear.toLocaleString()} added in ${year}`
                : "Select a station above to filter"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="truncate">
                {station ? `${station} Total Staff` : "Active Stations"}
              </span>
              <Calendar className="h-4 w-4 shrink-0" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">
              {station
                ? report.stationTotal.toLocaleString()
                : report.stationBreakdown.filter((s) => s.addedInPeriod > 0).length}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {station
                ? "Current headcount at selected station"
                : `Stations with additions in ${periodLabel}`}
            </p>
          </div>
        </div>
      )}

      {/* Breakdowns: Monthly & Station */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Month-by-Month Breakdown for Selected Year */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Monthly Additions ({year === "all" ? "All Years" : year})
              </span>
              {station && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {station}
                </span>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/60 dark:bg-slate-900 sticky top-0 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">Month</th>
                    <th className="text-right px-4 py-2 font-semibold">Overall Added</th>
                    {station && (
                      <th className="text-right px-4 py-2 font-semibold">Station Added</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {report.monthlyBreakdown.map((row) => {
                    const isActiveMonth =
                      month.toLowerCase() === row.monthName.toLowerCase();
                    return (
                      <tr
                        key={row.monthIndex}
                        onClick={() => setMonth(row.monthName)}
                        className={`cursor-pointer transition-colors ${
                          isActiveMonth
                            ? "bg-emerald-50/70 dark:bg-emerald-950/30 font-semibold"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="px-4 py-2 text-slate-800 dark:text-slate-200">
                          {row.monthName}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-slate-900 dark:text-white">
                          {row.totalAdded}
                        </td>
                        {station && (
                          <td className="px-4 py-2 text-right font-mono text-emerald-700 dark:text-emerald-400">
                            {row.stationAdded}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Station Breakdown Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Breakdown by Station ({periodLabel})
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {report.stationBreakdown.length} stations
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/60 dark:bg-slate-900 sticky top-0 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">Station</th>
                    <th className="text-right px-4 py-2 font-semibold">Added</th>
                    <th className="text-right px-4 py-2 font-semibold">Total</th>
                    {onSelectStationForExport && (
                      <th className="text-right px-3 py-2 font-semibold">Export</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {report.stationBreakdown.map((row) => (
                    <tr
                      key={row.station}
                      onClick={() => {
                        if (row.station !== "UNASSIGNED") setStation(row.station);
                      }}
                      className={`cursor-pointer transition-colors ${
                        station === row.station
                          ? "bg-amber-50/70 dark:bg-amber-950/30 font-semibold"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <td className="px-4 py-2 text-slate-800 dark:text-slate-200">
                        {row.station}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-emerald-700 dark:text-emerald-400">
                        {row.addedInPeriod}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-slate-700 dark:text-slate-300">
                        {row.totalStaff}
                      </td>
                      {onSelectStationForExport && (
                        <td className="px-3 py-2 text-right">
                          {row.station !== "UNASSIGNED" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectStationForExport(row.station);
                              }}
                              title={`Filter export by ${row.station}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors"
                            >
                              <Download className="h-3 w-3" />
                              <span>Select</span>
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
