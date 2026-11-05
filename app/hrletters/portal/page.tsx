"use client";

import React, { useState } from "react";
import {
  FileText,
  Search,
  CheckCircle2,
  Calendar,
  Building,
  User,
  Eye,
  Download,
  ShieldCheck,
  Check,
  ArrowRight,
  Sparkles,
  Lock,
  Stamp,
  Clock,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { LetterPreviewModal } from "@/components/hrletters/LetterPreviewModal";
import { Badge, statusToBadgeVariant } from "@/components/hrletters/ui/Badge";
import { Button } from "@/components/hrletters/ui/Button";
import { format } from "date-fns";

export default function HrLettersPortalPage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<any | null>(null);
  const [letters, setLetters] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<any | null>(null);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = identifier.trim();
    if (!clean) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/portal/letters?query=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setStaff(data.staff);
        setLetters(data.letters || []);
      } else {
        setStaff(null);
        setLetters([]);
        setError(data.error || "Staff record not found in the employee directory.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to employee registry.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (letterId: string) => {
    setAcknowledgingId(letterId);
    try {
      const res = await fetch("/api/portal/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ letterId, staffId: staff?.staffId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLetters((prev) =>
          prev.map((l) => (l.id === letterId ? { ...l, status: "ACKNOWLEDGED", acknowledgedAt: new Date() } : l))
        );
        if (selectedLetter && selectedLetter.id === letterId) {
          setSelectedLetter((prev: any) => ({ ...prev, status: "ACKNOWLEDGED", acknowledgedAt: new Date() }));
        }
      } else {
        alert(data.error || "Failed to acknowledge letter.");
      }
    } catch (err: any) {
      alert(err.message || "Network error while acknowledging letter.");
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold" style={{ color: "var(--color-text-1)" }}>
              Staff Self-Service Document Portal
            </h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
              Employee Hub
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-3)" }}>
            Retrieve official letters, verify digital signatures, and submit digital acknowledgments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/hrletters/verify"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 transition-colors shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Verify Document Code
          </Link>
        </div>
      </div>

      {/* Lookup Card */}
      <div className="card p-6 md:p-8 space-y-4">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Staff Identification
          </div>
          <h3 className="text-lg font-bold" style={{ color: "var(--color-text-1)" }}>
            Access Employee HR Letters
          </h3>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-3)" }}>
            Enter a Staff ID (e.g. <code>DVLA-712986</code>, <code>TEMP-905</code>) or registered official email to retrieve all issued letters.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Staff ID (e.g. DVLA-712986) or Email"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              style={{
                background: "var(--color-bg)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-1)",
              }}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            icon={<Search className="w-4 h-4" />}
          >
            Retrieve Letters
          </Button>
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-semibold animate-fade-up">
            {error}
          </div>
        )}
      </div>

      {/* Staff Profile and Letters Results */}
      {searched && staff && (
        <div className="space-y-6 animate-fade-up">
          {/* Employee Header Info */}
          <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-emerald-500/30 ring-1 ring-emerald-500/20">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                {staff.fullName?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold" style={{ color: "var(--color-text-1)" }}>
                    {staff.fullName}
                  </h3>
                  <Badge variant="success">Active Personnel</Badge>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: <span className="font-bold">{staff.staffId}</span> &bull; {staff.department} &bull; {staff.jobTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-text-3)" }}>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Salary Grade</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{staff.salaryGrade || "Standard Scale"}</span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Letters</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{letters.length} documents</span>
              </div>
            </div>
          </div>

          {/* Letter Cards List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Official Letter Documents ({letters.length})
            </h4>

            {letters.length === 0 ? (
              <div className="card p-12 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold" style={{ color: "var(--color-text-2)" }}>
                  No letters issued yet
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  When the HR Directorate issues an appointment, promotion, or transfer letter, it will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {letters.map((doc) => {
                  const isAcked = doc.status === "ACKNOWLEDGED";
                  return (
                    <div
                      key={doc.id}
                      className="card p-5 flex flex-col justify-between gap-4 border hover:border-emerald-500/40 transition shadow-xs group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {doc.verificationCode}
                            </span>
                            <h5 className="text-sm font-bold mt-0.5 line-clamp-1" style={{ color: "var(--color-text-1)" }}>
                              {doc.title}
                            </h5>
                          </div>
                          <Badge variant={statusToBadgeVariant(doc.status)} dot>
                            {doc.status.replace("_", " ")}
                          </Badge>
                        </div>

                        <p className="text-xs font-serif text-slate-500 line-clamp-3 p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 leading-relaxed">
                          {doc.content}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            {doc.issuedAt ? format(new Date(doc.issuedAt), "dd MMM yyyy") : format(new Date(doc.createdAt), "dd MMM yyyy")}
                          </span>
                          {doc.digitalSignature && (
                            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                              <Stamp className="w-3.5 h-3.5" /> Digitally Sealed
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: "var(--color-border)" }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedLetter(doc)}
                        >
                          View Official Letterhead
                        </Button>

                        {!isAcked ? (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<Check className="w-3.5 h-3.5" />}
                            onClick={() => handleAcknowledge(doc.id)}
                            loading={acknowledgingId === doc.id}
                          >
                            Acknowledge Receipt
                          </Button>
                        ) : (
                          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 px-2 py-1 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Preview */}
      {selectedLetter && (
        <LetterPreviewModal
          letter={selectedLetter}
          isEmployeeView={true}
          onClose={() => setSelectedLetter(null)}
          onAcknowledge={handleAcknowledge}
        />
      )}
    </div>
  );
}

