"use client";

import React, { useEffect, useState } from "react";
import { Archive, Search, ShieldCheck, Eye, CheckCircle2, QrCode, X } from "lucide-react";
import { LetterPreviewModal } from "../LetterPreviewModal";
import { Badge, statusToBadgeVariant } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../ui/table";
import { Pagination } from "../ui/Pagination";

export const ArchiveView: React.FC = () => {
  const [letters, setLetters] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [verifyCodeInput, setVerifyCodeInput] = useState("");
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [previewLetter, setPreviewLetter] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 6;

  useEffect(() => {
    setLoading(true);
    fetch("/api/letters")
      .then((r) => r.json())
      .then((data) => { if (data.success) setLetters(data.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCodeInput) return;
    const match = letters.find(
      (l) => l.verificationCode.toLowerCase() === verifyCodeInput.trim().toLowerCase()
    );
    setVerificationResult(match || { notFound: true });
  };

  const filtered = letters.filter(
    (l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.verificationCode.toLowerCase().includes(search.toLowerCase()) ||
      l.staff?.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedLetters = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const inputCls = "w-full px-3 py-2 rounded-lg text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";
  const inputStyle = {
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text-1)",
  };

  return (
    <div className="space-y-5 animate-fade-up">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-1)" }}>
            Digital HR Archive
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-3)" }}>
            Search the secure document archive and verify document authenticity using verification tokens
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)", border: "1px solid var(--color-border)" }}
        >
          <Archive className="w-3.5 h-3.5" /> {letters.length} documents
        </div>
      </div>

      {/* ── Verification Tool ── */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--color-text-1)" }}>
          <QrCode className="w-4 h-4 text-emerald-500" /> Official Document Verification Lookup
        </h3>
        <form onSubmit={handleVerifyCode} className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Enter Verification Code (e.g. V-DVLA-123456)..."
            value={verifyCodeInput}
            onChange={(e) => setVerifyCodeInput(e.target.value)}
            className={`${inputCls} flex-1 font-mono`}
            style={inputStyle}
          />
          <Button variant="success" size="md" icon={<ShieldCheck className="w-4 h-4" />} type="submit">
            Verify Document
          </Button>
        </form>

        {verificationResult && (
          <div className="mt-1">
            {verificationResult.notFound ? (
              <div
                className="flex items-center gap-2 p-3 rounded-lg text-sm font-semibold"
                style={{ background: "rgba(239,68,68,0.08)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <X className="w-4 h-4" />
                Invalid code — no matching document found in the archive.
              </div>
            ) : (
              <div
                className="p-4 rounded-lg space-y-3"
                style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> VERIFIED OFFICIAL DOCUMENT
                  </span>
                  <code className="text-xs font-mono font-bold" style={{ color: "var(--color-accent)" }}>
                    {verificationResult.verificationCode}
                  </code>
                </div>
                <div className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
                  {verificationResult.title}
                </div>
                <p className="text-xs" style={{ color: "var(--color-text-3)" }}>
                  Recipient: {verificationResult.staff?.fullName} · {verificationResult.staff?.department}
                </p>
                <Button
                  variant="success"
                  size="sm"
                  icon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() => setPreviewLetter(verificationResult)}
                >
                  Preview Official Document
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Search Bar ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-4)" }} />
        <input
          type="text"
          placeholder="Search archive by staff name, document title, or letter code..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className={inputCls}
          style={{ ...inputStyle, paddingLeft: "2.5rem" }}
        />
      </div>

      {/* ── Archive Table (Shadcn UI Table) ── */}
      <div className="card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["Code", "Staff Recipient", "Document Title", "Issued Date", "Status", "View"].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <TableRow key={i}>
                  {Array(6).fill(0).map((_, j) => (
                    <TableCell key={j}>
                      <div className="skeleton h-4 rounded w-3/4" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedLetters.length > 0 ? (
              paginatedLetters.map((letDoc) => (
                <TableRow key={letDoc.id}>
                  <TableCell>
                    <code className="text-xs font-mono font-bold" style={{ color: "var(--color-accent)" }}>
                      {letDoc.verificationCode}
                    </code>
                  </TableCell>
                  <TableCell className="font-semibold text-sm" style={{ color: "var(--color-text-1)" }}>
                    {letDoc.staff?.fullName || "Staff"}
                  </TableCell>
                  <TableCell className="text-sm" style={{ color: "var(--color-text-2)" }}>
                    {letDoc.title}
                  </TableCell>
                  <TableCell className="text-xs font-mono" style={{ color: "var(--color-text-3)" }}>
                    {letDoc.issuedAt ? new Date(letDoc.issuedAt).toLocaleDateString("en-GB") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusToBadgeVariant(letDoc.status)} dot>
                      {letDoc.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setPreviewLetter(letDoc)}
                    >
                      Inspect
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm" style={{ color: "var(--color-text-4)" }}>
                  <Archive className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No matching documents in the archive.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {previewLetter && (
        <LetterPreviewModal letter={previewLetter} onClose={() => setPreviewLetter(null)} />
      )}
    </div>
  );
};
