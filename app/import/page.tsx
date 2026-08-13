"use client";

import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import SidebarLayout from "@/components/SidebarLayout";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  FileSpreadsheet,
  Upload,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Download,
  Building,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  TARGET_STAFF_FIELDS,
  autoSuggestMapping,
  validateMappedRows,
  ParsedRowResult,
} from "@/lib/excel";

export default function ImportExcelPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // File state
  const [fileName, setFileName] = useState<string>("");
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);

  // Mapping state: { [ExcelColumnName]: TargetSchemaKey }
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Validation state
  const [validatedRows, setValidatedRows] = useState<ParsedRowResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    insertedCount: number;
    errors: string[];
  } | null>(null);

  // Pagination State (25 items per page)
  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(validatedRows.length / PAGE_SIZE));

  const paginatedImportRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return validatedRows.slice(start, start + PAGE_SIZE);
  }, [validatedRows, currentPage]);

  // Download Sample Template Spreadsheet
  const handleDownloadSample = () => {
    const sampleData = [
      {
        "Emp Code": "EMP-9001",
        "Full Name": "Michael Chang",
        "Position": "Lead Accountant",
        "Department": "Finance",
        "Mobile": "+1 (555) 901-2345",
        "Bank Name": "Chase Bank",
        "Account Number": "9988776655",
        "Monthly Wage": 4800,
        "Contract Start": "2026-06-01",
      },
      {
        "Emp Code": "EMP-9002",
        "Full Name": "Sophia Al-Mansoor",
        "Position": "Content Specialist",
        "Department": "Marketing",
        "Mobile": "+1 (555) 012-3456",
        "Bank Name": "Citibank",
        "Account Number": "1122334455",
        "Monthly Wage": 4100,
        "Contract Start": "2026-03-15",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Migration Template");
    XLSX.writeFile(wb, "Sample_Temp_Staff_Migration.xlsx");
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonRows.length === 0) {
          alert("Uploaded Excel sheet is empty.");
          return;
        }

        const headers = Object.keys(jsonRows[0]);
        setRawHeaders(headers);
        setRawRows(jsonRows);

        // Auto suggest column mappings
        const suggested = autoSuggestMapping(headers);
        setMapping(suggested);

        setStep(2);
      } catch (err: any) {
        alert("Failed to parse Excel file: " + err.message);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Run validation when moving to step 3
  const handleProceedToPreview = async () => {
    // Ensure required mappings exist
    const mappedValues = Object.values(mapping);
    if (!mappedValues.includes("full_name")) {
      alert("Please map a column to 'Full Name' (Required field).");
      return;
    }
    if (!mappedValues.includes("start_date")) {
      alert("Please map a column to 'Contract Start Date' (Required field).");
      return;
    }

    // Fetch existing staff codes from DB to check duplicates
    try {
      const res = await fetch("/api/staff");
      const json = await res.json();
      const existingCodes = new Set<string>();

      if (json.success && Array.isArray(json.data)) {
        json.data.forEach((s: any) => {
          if (s.staff_code) existingCodes.add(s.staff_code.trim());
        });
      }

      const results = validateMappedRows(rawRows, mapping, existingCodes);
      setValidatedRows(results);
      setStep(3);
    } catch (err: any) {
      alert("Validation check failed: " + err.message);
    }
  };

  // Execute Batch Import
  const handleExecuteImport = async () => {
    const validRowsToImport = validatedRows.filter((r) => r.isValid).map((r) => r.data);

    if (validRowsToImport.length === 0) {
      alert("No valid rows available to import.");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: validRowsToImport }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Batch import failed.");
      }

      setImportResult({
        insertedCount: json.insertedCount,
        errors: json.errors || [],
      });
      setStep(4);
    } catch (err: any) {
      alert("Import execution error: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const validCount = validatedRows.filter((r) => r.isValid).length;
  const invalidCount = validatedRows.length - validCount;

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
              <span>Excel Staff Data Migration</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Upload legacy spreadsheets, map columns to schema, preview & batch import staff records
            </p>
          </div>

          <button
            onClick={handleDownloadSample}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition self-start sm:self-auto"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Download Sample Template</span>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs">
          <div className={`p-2.5 rounded-xl font-bold transition ${step === 1 ? "bg-indigo-600 text-white" : step > 1 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" : "text-slate-400"}`}>
            1. File Upload
          </div>
          <div className={`p-2.5 rounded-xl font-bold transition ${step === 2 ? "bg-indigo-600 text-white" : step > 2 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" : "text-slate-400"}`}>
            2. Column Mapper
          </div>
          <div className={`p-2.5 rounded-xl font-bold transition ${step === 3 ? "bg-indigo-600 text-white" : step > 3 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" : "text-slate-400"}`}>
            3. Preview & Validate
          </div>
          <div className={`p-2.5 rounded-xl font-bold transition ${step === 4 ? "bg-emerald-600 text-white" : "text-slate-400"}`}>
            4. Import Summary
          </div>
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-4">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
              <Upload className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Upload Existing Excel Sheet (.xlsx / .csv)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                Select your spreadsheet containing staff details and contract start dates. Headers will be matched automatically in the next step.
              </p>
            </div>

            <div className="pt-2">
              <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer transition">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Select Excel File</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* STEP 2: COLUMN MAPPER */}
        {step === 2 && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Map Sheet Columns to Database Schema
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  File: <strong className="text-indigo-600 font-mono">{fileName}</strong> ({rawRows.length} total rows parsed)
                </p>
              </div>
              <button
                onClick={handleProceedToPreview}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>Preview Parsed Rows</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TARGET_STAFF_FIELDS.map((targetField) => {
                const currentMappedCol = Object.keys(mapping).find(
                  (col) => mapping[col] === targetField.key
                ) || "";

                return (
                  <div
                    key={targetField.key}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {targetField.label}
                      </span>
                      {targetField.required && (
                        <span className="text-[10px] font-semibold text-rose-500 uppercase">Required</span>
                      )}
                    </div>

                    <div className="w-56">
                      <Select
                        value={currentMappedCol || "unmapped"}
                        onValueChange={(colSelected) => {
                          const newMap = { ...mapping };
                          Object.keys(newMap).forEach((col) => {
                            if (newMap[col] === targetField.key) {
                              delete newMap[col];
                            }
                          });
                          if (colSelected && colSelected !== "unmapped") {
                            newMap[colSelected] = targetField.key;
                          }
                          setMapping(newMap);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unmapped">-- Unmapped --</SelectItem>
                          {rawHeaders.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & VALIDATION */}
        {step === 3 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Preview & Real-Time Data Validation
                </h3>
                <div className="flex items-center gap-3 text-xs mt-1">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ {validCount} Valid Records Ready
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">
                      ⚠ {invalidCount} Invalid Rows (Skipped)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700"
                >
                  Adjust Mappings
                </button>
                <button
                  onClick={handleExecuteImport}
                  disabled={importing || validCount === 0}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {importing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4" />
                      <span>Execute Import ({validCount} Rows)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="p-3">Excel Row</th>
                    <th className="p-3">Staff Code</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Role / Dept</th>
                    <th className="p-3">Start Date</th>
                    <th className="p-3">Status / Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {paginatedImportRows.map((row) => (
                    <tr
                      key={row.rowIndex}
                      className={row.isValid ? "bg-white dark:bg-slate-900" : "bg-rose-50/50 dark:bg-rose-950/30"}
                    >
                      <td className="p-3 font-mono font-semibold">Row #{row.rowIndex}</td>
                      <td className="p-3 font-mono">{row.data.staff_code || "Auto"}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {row.data.full_name || <span className="text-rose-500">Missing</span>}
                      </td>
                      <td className="p-3">
                        {row.data.department || "-"} / {row.data.role || "-"}
                      </td>
                      <td className="p-3 font-medium">
                        {row.data.start_date || <span className="text-rose-500">Missing</span>}
                      </td>
                      <td className="p-3">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                          </span>
                        ) : (
                          <div className="text-rose-600 dark:text-rose-400 space-y-0.5">
                            {row.errors.map((e, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                <span>{e}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 25-Item Pagination Controls Footer Bar */}
            {validatedRows.length > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-950/40">
                <div className="text-slate-500 dark:text-slate-400 font-medium">
                  Showing <strong>{Math.min((currentPage - 1) * PAGE_SIZE + 1, validatedRows.length)}</strong> to{" "}
                  <strong>{Math.min(currentPage * PAGE_SIZE, validatedRows.length)}</strong> of{" "}
                  <strong>{validatedRows.length}</strong> imported parsed rows
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
        )}

        {/* STEP 4: IMPORT SUMMARY */}
        {step === 4 && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-6">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Migration Completed Successfully!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Successfully inserted <strong>{importResult?.insertedCount}</strong> staff records with initial 6-month contract periods into database.
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <a
                href="/staff"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                View Staff Directory
              </a>
              <button
                onClick={() => {
                  setStep(1);
                  setRawRows([]);
                  setRawHeaders([]);
                  setValidatedRows([]);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Import Another Sheet
              </button>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
