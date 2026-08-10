'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';

import { checkApplicationStatus } from '@/app/actions/applicant';
import Link from 'next/link';

const STAGES = [
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'SHORTLISTED', label: 'Shortlisted' },
  { key: 'PANEL_SCORING', label: 'Panel Scoring' },
  { key: 'APPROVED', label: 'Approved' },
];

export default function StatusPage() {
  const [refNum, setRefNum] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [appData, setAppData] = useState<any | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refNum.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setAppData(null);

    const res = await checkApplicationStatus(refNum);
    setIsLoading(false);

    if (res.success && res.application) {
      setAppData(res.application);
    } else {
      setErrorMsg(res.error || 'No application record found.');
    }
  };

  const currentStageIndex = appData
    ? appData.currentStage === 'REJECTED'
      ? -1
      : STAGES.findIndex((s) => s.key === appData.currentStage)
    : -1;

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF6E3]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900">Application Status Lookup</h1>
          <p className="text-gray-600 text-sm mt-1">
            Track your recruitment or attachment placement status using your official DVLA Reference Number.
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-8 max-w-xl mx-auto flex gap-3">
          <input
            type="text"
            required
            value={refNum}
            onChange={(e) => setRefNum(e.target.value)}
            placeholder="Enter Reference Number (e.g. DVLA-2026-KM92A)"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-semibold uppercase focus:ring-2 focus:ring-[#0F5132] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#0F5132] hover:bg-[#0B3D26] text-white font-bold px-6 py-2.5 rounded-lg text-sm transition shadow disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded text-red-800 text-sm max-w-xl mx-auto mb-8">
            <span className="font-bold">Error: </span>{errorMsg}
          </div>
        )}

        {appData && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 md:p-8 space-y-8">
            
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-6 gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                  {appData.position.type} Placement
                </span>
                <h2 className="text-2xl font-black text-gray-900 mt-2">{appData.position.title}</h2>
                <div className="text-xs text-gray-500 font-semibold mt-1">
                  Applicant: <strong>{appData.applicant.fullName}</strong> ({appData.applicant.email})
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-gray-500">Reference Number</div>
                <div className="text-lg font-black text-[#0F5132] font-mono">{appData.referenceNumber}</div>
              </div>
            </div>

            {/* Stepper Stage Visualization */}
            {appData.currentStage === 'REJECTED' ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-900">
                <div className="text-3xl mb-2">❌</div>
                <div className="font-extrabold text-lg">Application Unsuccessful</div>
                <p className="text-xs text-red-700 mt-1 max-w-md mx-auto">
                  We regret to inform you that your application for this position was not selected. We appreciate your interest in joining DVLA Ghana.
                </p>
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold uppercase text-gray-500 mb-4 tracking-wider">Application Progress Stage</div>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {STAGES.map((stage, idx) => {
                    const isPassed = idx <= currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    return (
                      <div key={stage.key} className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 shadow-sm transition ${
                            isCurrent
                              ? 'bg-amber-500 text-gray-900 ring-4 ring-amber-100 font-extrabold scale-110'
                              : isPassed
                              ? 'bg-[#0F5132] text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {isPassed ? '✓' : idx + 1}
                        </div>
                        <span
                          className={`text-[11px] font-bold ${
                            isCurrent ? 'text-amber-800 font-extrabold' : isPassed ? 'text-[#0F5132]' : 'text-gray-400'
                          }`}
                        >
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Post Acceptance Banner if Approved */}
            {appData.currentStage === 'APPROVED' && (
              <div className="bg-emerald-50 border-2 border-emerald-600 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-[#0F5132] font-black text-lg flex items-center gap-2">
                    <span>🎉</span> Application Approved & Appointed!
                  </div>
                  <p className="text-xs text-emerald-950 mt-1">
                    Your appointment letter is available. Please visit the Post-Acceptance Document Center to download required forms and complete your onboarding checklist.
                  </p>
                </div>
                <Link
                  href={`/document-center?ref=${appData.referenceNumber}&email=${encodeURIComponent(appData.applicant.email)}`}
                  className="bg-[#0F5132] hover:bg-[#0B3D26] text-white font-bold text-xs px-6 py-3 rounded-lg shadow whitespace-nowrap transition"
                >
                  Access Document Hub →
                </Link>
              </div>
            )}

            {/* Stage History Log */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">Stage Audit History</h3>
              <div className="space-y-3">
                {appData.stageHistory.map((hist: any) => (
                  <div key={hist.id} className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 flex justify-between items-start text-xs">
                    <div>
                      <span className="font-bold text-gray-900 uppercase">{hist.toStage.replace('_', ' ')}</span>
                      {hist.notes && <div className="text-gray-600 mt-0.5">{hist.notes}</div>}
                    </div>
                    <span className="text-gray-400 font-mono text-[11px]">
                      {new Date(hist.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>


    </div>
  );
}
