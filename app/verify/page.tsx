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
} from "lucide-react";
import Link from "next/link";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Top Banner */}
      <div className="w-full max-w-2xl text-center mb-8">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <ShieldCheck className="w-4 h-4" /> Official Document Verification System
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Driver and Vehicle Licensing Authority
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Republic of Ghana &bull; HR Directorate Master Document Register
        </p>
      </div>

      {/* Verification Card */}
      <div className="w-full max-w-2xl bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md">
        <form onSubmit={handleSubmit} className="mb-6">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Enter Verification Code / CUID
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. V-DVLA-739201"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Verify Now"
              )}
            </button>
          </div>
        </form>

        {/* Verification Result */}
        {searched && (
          <div>
            {result ? (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-5 md:p-6 space-y-5 animate-fade-in">
                {/* Status Badge */}
                <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <BadgeCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                          Official Authenticated Document
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 uppercase">
                          {result.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">{result.title}</h3>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] font-mono text-slate-400">DVLA REGISTRY CODE</span>
                    <p className="text-xs font-mono font-bold text-emerald-300">{result.verificationCode}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-400" /> Issued To
                    </span>
                    <p className="font-bold text-white text-sm">{result.recipientName}</p>
                    <p className="text-slate-400 mt-0.5 font-mono">Staff ID: {result.recipientStaffId}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Department / Post
                    </span>
                    <p className="font-bold text-white text-sm">{result.department}</p>
                    <p className="text-slate-400 mt-0.5">{result.positionTitle}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-400" /> Authorized Signatory
                    </span>
                    <p className="font-bold text-white text-sm">{result.signatoryName}</p>
                    <p className="text-slate-400 mt-0.5">{result.signatoryTitle}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Document Date
                    </span>
                    <p className="font-bold text-white text-sm">
                      {result.issuedAt
                        ? new Date(result.issuedAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : result.effectiveDate || "N/A"}
                    </p>
                    <p className="text-emerald-400 mt-0.5 font-medium">
                      {result.acknowledgedAt ? "✓ Receipt Acknowledged by Staff" : "Official Letter Active"}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    This record was confirmed against the authoritative Driver and Vehicle Licensing Authority (DVLA) personnel archive.
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-5 text-center space-y-2">
                <XCircle className="w-8 h-8 text-red-400 mx-auto" />
                <h3 className="text-sm font-bold text-red-300">Document Verification Failed</h3>
                <p className="text-xs text-slate-400">{error}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>DVLA Human Resource Information System</span>
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
            Staff / Portal Login <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DocumentVerificationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Verification Engine...</div>}>
      <VerifyContent />
    </Suspense>
  );
}

