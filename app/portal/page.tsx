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
} from "lucide-react";
import Link from "next/link";
import { LetterPreviewModal } from "@/components/hrletters/LetterPreviewModal";

export default function StaffPortalPage() {
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
        setError(data.error || "Staff record not found.");
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">DVLA Employee Document Portal</h1>
              <p className="text-[10px] text-slate-400">Staff Self-Service &bull; Official HR Letters</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/verify" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verify Letter
            </Link>
            <span className="text-slate-700">|</span>
            <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
              Staff / Admin Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Search Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 md:p-8 shadow-xl">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Official Letters & Contracts
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white">Access Your HR Letters</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your unique Staff ID or official email address to retrieve your appointment letters, confirmation orders, and contract renewals.
            </p>
          </div>

          <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Staff ID (e.g. DVLA-1082) or Email"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !identifier.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Search Letters"
              )}
            </button>
          </form>

          {error && (
            <p className="text-xs text-red-400 mt-3 font-medium flex items-center gap-1.5">
              <span>✕</span> {error}
            </p>
          )}
        </div>

        {/* Staff Profile and Letters List */}
        {staff && (
          <div className="space-y-6 animate-fade-in">
            {/* Personnel Summary Banner */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                  {staff.fullName?.charAt(0) || "D"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{staff.fullName}</h3>
                  <p className="text-xs text-slate-400">
                    Staff Code: <span className="font-mono text-emerald-400 font-semibold">{staff.staffId}</span> &bull; {staff.department} &bull; {staff.jobTitle}
                  </p>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 font-medium">
                Total Documents: <strong className="text-white">{letters.length}</strong>
              </div>
            </div>

            {/* Letters Grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Official Issued Letters</h3>
              {letters.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center text-xs text-slate-500">
                  No issued letters found for this employee account yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {letters.map((letter) => {
                    const isAcknowledged = letter.status === "ACKNOWLEDGED";
                    return (
                      <div
                        key={letter.id}
                        className="rounded-xl border border-slate-800/80 hover:border-slate-700 bg-slate-900/70 p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white">{letter.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isAcknowledged
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              }`}
                            >
                              {letter.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            Verification: <span className="font-mono text-emerald-400">{letter.verificationCode}</span> &bull; Type: {letter.letterType}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Issued: {letter.issuedAt ? new Date(letter.issuedAt).toLocaleDateString("en-GB") : "Pending"}
                            {letter.acknowledgedAt && ` • Acknowledged: ${new Date(letter.acknowledgedAt).toLocaleDateString("en-GB")}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                          <button
                            onClick={() => setSelectedLetter({ ...letter, staff })}
                            className="flex-1 md:flex-initial px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View / Print
                          </button>

                          {!isAcknowledged && (
                            <button
                              onClick={() => handleAcknowledge(letter.id)}
                              disabled={acknowledgingId === letter.id}
                              className="flex-1 md:flex-initial px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {acknowledgingId === letter.id ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledge Receipt
                                </>
                              )}
                            </button>
                          )}
                          {isAcknowledged && (
                            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10">
                              <Check className="w-3.5 h-3.5" /> Acknowledged
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
      </main>

      {/* Letter Preview Modal */}
      {selectedLetter && (
        <LetterPreviewModal
          letter={selectedLetter}
          onClose={() => setSelectedLetter(null)}
          onAcknowledge={handleAcknowledge}
          isEmployeeView={true}
        />
      )}
    </div>
  );
}

