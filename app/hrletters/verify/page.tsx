"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Building2,
  Calendar,
  User,
  FileText,
  BadgeCheck,
  Award,
  ArrowRight,
  ExternalLink,
  Stamp,
  Lock,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/hrletters/ui/Button";
import { Badge } from "@/components/hrletters/ui/Badge";
import { format } from "date-fns";

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performVerification = async (targetCode: string) => {
    const clean = targetCode.trim();
    if (!clean) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/verify?code=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (res.ok && data.verified && data.document) {
        setResult(data.document);
      } else {
        setResult(null);
        setError(data.error || "Document not found or invalid verification code.");
      }
    } catch (err: any) {
      setResult(null);
      setError(err.message || "Failed to reach verification service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      performVerification(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(code);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold" style={{ color: "var(--color-text-1)" }}>
              Official Document Anti-Tamper Verification
            </h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
              Public Ledger
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-3)" }}>
            Cryptographic authenticity check for DVLA appointment, promotion, and service letters
          </p>
        </div>
      </div>

      {/* Verification Search Card */}
      <div className="card p-6 md:p-8 space-y-4">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Anti-Tamper Security Gate
          </div>
          <h3 className="text-lg font-bold" style={{ color: "var(--color-text-1)" }}>
            Verify Official Letter Authenticity
          </h3>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-3)" }}>
            Enter the unique verification code printed at the bottom of the official letter (e.g. <code>V-DVLA-712986</code>) or embedded in the QR seal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. V-DVLA-712986"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-mono uppercase font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
            icon={<ShieldCheck className="w-4 h-4" />}
          >
            Verify Document
          </Button>
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2 animate-fade-up">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Verification Result */}
      {searched && result && (
        <div className="card p-6 md:p-8 space-y-6 border-emerald-500/40 ring-1 ring-emerald-500/30 animate-fade-up">
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-emerald-500/20 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                <BadgeCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Official Authenticated Document
                </span>
                <h3 className="text-lg font-bold" style={{ color: "var(--color-text-1)" }}>
                  {result.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="success">
                {result.status}
              </Badge>
              <code className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                {result.verificationCode}
              </code>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recipient Full Name</span>
              <span className="text-sm font-bold" style={{ color: "var(--color-text-1)" }}>
                {result.recipient?.fullName}
              </span>
              <span className="text-xs text-slate-400 font-mono block mt-0.5">{result.recipient?.staffId}</span>
            </div>

            <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Department &amp; Role</span>
              <span className="text-sm font-bold" style={{ color: "var(--color-text-1)" }}>
                {result.recipient?.jobTitle}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">{result.recipient?.department}</span>
            </div>

            <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DVLA Reference No.</span>
              <span className="text-xs font-mono font-bold" style={{ color: "var(--color-text-1)" }}>
                {result.customRefNumber || "—"}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Salary: {result.salaryGrade || "Standard"}</span>
            </div>

            <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date Issued</span>
              <span className="text-sm font-bold" style={{ color: "var(--color-text-1)" }}>
                {result.issuedAt ? format(new Date(result.issuedAt), "dd MMMM yyyy") : format(new Date(result.createdAt), "dd MMMM yyyy")}
              </span>
              <span className="text-[10px] text-emerald-600 block mt-0.5 font-semibold">
                Signatory: {result.signatory?.title || "Director HR"}
              </span>
            </div>
          </div>

          {/* Letter Body Excerpt */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Authenticated Content Excerpt</span>
            <div
              className="p-4 rounded-xl border text-xs font-serif leading-relaxed"
              style={{
                background: "var(--color-bg)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-2)",
              }}
            >
              {result.content}
            </div>
          </div>

          {/* Digital Signature Footer */}
          <div className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Stamp className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  Cryptographically Signed by {result.signatory?.name || "HR Director"}
                </span>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                  {result.signatory?.title} &bull; {result.signatory?.forTitle}
                </p>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Verified against DVLA Head Office Master Records
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HrLettersVerifyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-semibold text-slate-400">Loading Verification Gateway...</div>}>
      <VerifyContent />
    </Suspense>
  );
}

