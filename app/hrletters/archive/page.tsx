"use client";

import React, { useEffect, useState } from "react";
import { Search, Archive, Eye, Download, RefreshCw, Filter } from "lucide-react";
import { Badge, statusToBadgeVariant } from "@/components/hrletters/ui/Badge";
import { Button } from "@/components/hrletters/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/hrletters/ui/table";
import { Pagination } from "@/components/hrletters/ui/Pagination";
import { LetterPreviewModal } from "@/components/hrletters/LetterPreviewModal";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "ISSUED", label: "Issued" },
  { value: "ACKNOWLEDGED", label: "Acknowledged" },
  { value: "REJECTED", label: "Rejected" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "APPOINTMENT", label: "Appointment" },
  { value: "PROMOTION", label: "Promotion" },
  { value: "CONFIRMATION", label: "Confirmation" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "WARNING", label: "Warning" },
  { value: "LEAVE_APPROVAL", label: "Leave Approval" },
  { value: "CONTRACT_RENEWAL", label: "Contract Renewal" },
];

export default function HrLettersArchivePage() {
  const [letters, setLetters] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [previewLetter, setPreviewLetter] = useState<any | null>(null);
  const pageSize = 10;

  useEffect(() => {
    loadLetters();
  }, []);

  useEffect(() => {
    let result = letters;
    const q = search.toLowerCase();
    if (q) result = result.filter(l =>
      l.staff?.fullName?.toLowerCase().includes(q) ||
      l.verificationCode?.toLowerCase().includes(q) ||
      l.title?.toLowerCase().includes(q) ||
      l.customRefNumber?.toLowerCase().includes(q)
    );
    if (statusFilter) result = result.filter(l => l.status === statusFilter);
    if (typeFilter) result = result.filter(l => l.letterType === typeFilter);
    setFiltered(result);
    setCurrentPage(1);
  }, [letters, search, statusFilter, typeFilter]);

  const loadLetters = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hrletters/letters");
      const data = await res.json();
      if (data.success) setLetters(data.data);
    } finally {
      setLoading(false);
    }
  };

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-1)" }}>Letter Archive</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-3)" }}>Full history and audit trail of all HR letter documents</p>
        </div>
        <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={loadLetters}>Refresh</Button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-4)" }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, reference, or title..."
            className="input-base pl-9" style={{ paddingLeft: "2.25rem" }}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <select
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="input-base text-xs" style={{ width: "160px" }}
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="input-base text-xs" style={{ width: "160px" }}
          >
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>All Letters</h3>
          </div>
          <span className="text-xs" style={{ color: "var(--color-text-4)" }}>{filtered.length} records</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {["Verification Code", "Ref Number", "Recipient", "Type", "Title", "Status", "Date Created", "Actions"].map(h => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>{Array(8).fill(0).map((_, j) => <TableCell key={j}><div className="skeleton h-4 rounded" style={{ width: "70%" }} /></TableCell>)}</TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-sm" style={{ color: "var(--color-text-4)" }}>
                  {search || statusFilter || typeFilter ? "No letters match your filters." : "No letters in the archive yet."}
                </TableCell>
              </TableRow>
            ) : paginated.map(doc => (
              <TableRow key={doc.id}>
                <TableCell><code className="text-xs font-mono font-semibold" style={{ color: "var(--color-accent)" }}>{doc.verificationCode}</code></TableCell>
                <TableCell className="text-xs font-mono" style={{ color: "var(--color-text-3)" }}>{doc.customRefNumber || "—"}</TableCell>
                <TableCell className="font-semibold text-sm" style={{ color: "var(--color-text-1)" }}>{doc.staff?.fullName || "—"}</TableCell>
                <TableCell>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md border" style={{ background: "var(--color-border-subtle)", borderColor: "var(--color-border)", color: "var(--color-text-3)" }}>
                    {doc.letterType?.replace("_", " ")}
                  </span>
                </TableCell>
                <TableCell className="text-sm max-w-[200px] truncate" style={{ color: "var(--color-text-2)" }}>{doc.title}</TableCell>
                <TableCell><Badge variant={statusToBadgeVariant(doc.status)} dot>{doc.status.replace("_", " ")}</Badge></TableCell>
                <TableCell className="text-xs" style={{ color: "var(--color-text-3)" }}>
                  {format(new Date(doc.createdAt), "dd MMM yyyy")}
                </TableCell>
                <TableCell>
                  <Button variant="secondary" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => setPreviewLetter(doc)}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setCurrentPage} />
      </div>

      {previewLetter && <LetterPreviewModal letter={previewLetter} onClose={() => setPreviewLetter(null)} />}
    </div>
  );
}
