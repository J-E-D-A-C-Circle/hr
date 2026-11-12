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
  Search,
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
  onDownloadForStation?: (station: string, year: string, month: string) => void;
  onDownloadAll?: (year: string, month: string) => void;
}

export default function StationAdditionsReport({
  onSelectStationForExport,
  onDownloadForStation,
  onDownloadAll,
}: StationAdditionsReportProps) {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(
    now.toLocaleString("en-US", { month: "long" })
  );
  const [station, setStation] = useState("");
  const [tableSearch, setTableSearch] = useState("");
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
        <div className="flex items-center gap-2">
          {onDownloadAll && (
            <button
              type="button"
              onClick={() => onDownloadAll(year, month)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export All Stations</span>
            </button>
          )}
          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
        </div>
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
          <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Monthly Additions ({year === "all" ? "All Years" : year})
              </span>
              {station && (
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {station}
                </span>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">Month</th>
                    <th className="text-right px-4 py-2 font-semibold">Overall Added</th>
                    {station && (
                      <th className="text-right px-4 py-2 font-semibold">Station Added</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {report.monthlyBreakdown.map((row) => {
                    const isActiveMonth =
                      month.toLowerCase() === row.monthName.toLowerCase();
                    return (
                      <tr
                        key={row.monthIndex}
                        onClick={() => setMonth(row.monthName)}
                        className={`cursor-pointer transition-colors ${
                          isActiveMonth
                            ? "bg-emerald-100/70 dark:bg-emerald-950 font-semibold"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/80"
                        }`}
                      >
                        <td className="px-4 py-2 text-slate-900 dark:text-white">
                          {row.monthName}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-slate-900 dark:text-white">
                          {row.totalAdded}
                        </td>
                        {station && (
                          <td className="px-4 py-2 text-right font-mono text-emerald-700 dark:text-emerald-400 font-bold">
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
          <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-xs flex flex-col">
            <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Breakdown by Station ({periodLabel})
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {report.stationBreakdown.length}
                </span>
              </div>
              {/* Suggestive typing search filter directly inside the breakdown card */}
              <div className="relative w-full sm:w-48">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Search station..."
                  className="w-full pl-8 pr-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">Station</th>
                    <th className="text-right px-4 py-2 font-semibold">Added</th>
                    <th className="text-right px-4 py-2 font-semibold">Total</th>
                    {(onDownloadForStation || onSelectStationForExport) && (
                      <th className="text-right px-3 py-2 font-semibold">Download / Filter</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {report.stationBreakdown
                    .filter((row) =>
                      !tableSearch.trim() ||
                      row.station.toLowerCase().includes(tableSearch.trim().toLowerCase())
                    )
                    .map((row) => (
                      <tr
                        key={row.station}
                        onClick={() => {
                          if (row.station !== "UNASSIGNED") setStation(row.station);
                        }}
                        className={`cursor-pointer transition-colors ${
                          station === row.station
                            ? "bg-amber-100/70 dark:bg-amber-950/60 font-semibold"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/80"
                        }`}
                      >
                        <td className="px-4 py-2 text-slate-900 dark:text-white">
                          {row.station}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                          {row.addedInPeriod}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-slate-700 dark:text-slate-300">
                          {row.totalStaff}
                        </td>
                        {(onDownloadForStation || onSelectStationForExport) && (
                          <td className="px-3 py-2 text-right">
                            {row.station !== "UNASSIGNED" && (
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                {onDownloadForStation && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDownloadForStation(row.station, year, month);
                                    }}
                                    title={`Download Excel export directly for ${row.station}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[11px] font-bold shadow-xs transition-colors"
                                  >
                                    <Download className="h-3 w-3" />
                                    <span>Download</span>
                                  </button>
                                )}
                                {onSelectStationForExport && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectStationForExport(row.station);
                                    }}
                                    title={`Filter table preview by ${row.station}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-semibold transition-colors"
                                  >
                                    <span>Filter</span>
                                  </button>
                                )}
                              </div>
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
