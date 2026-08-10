'use client';

import React, { useState, useEffect } from 'react';
import { getPanelMonitorData, togglePanelDiscussionFlag } from '@/app/actions/judge';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Flag,
  Sparkles,
  RefreshCw,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  BarChart2,
} from 'lucide-react';

export default function AdminPanelMonitor() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  // Flag Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [discussionNotes, setDiscussionNotes] = useState('');
  const [isSavingFlag, setIsSavingFlag] = useState(false);

  const fetchMonitorData = async () => {
    setIsLoading(true);
    const res = await getPanelMonitorData();
    setIsLoading(false);

    if (res.success && res.monitoredCandidates) {
      setCandidates(res.monitoredCandidates);
    } else {
      setError(res.error || 'Failed to load panel monitor data.');
    }
  };

  useEffect(() => {
    fetchMonitorData();
  }, []);

  const handleOpenFlagModal = (cand: any) => {
    setSelectedCandidate(cand);
    setDiscussionNotes(cand.discussionNotes || '');
  };

  const handleSaveFlag = async (isFlagged: boolean) => {
    if (!selectedCandidate) return;

    setIsSavingFlag(true);
    const res = await togglePanelDiscussionFlag(selectedCandidate.id, isFlagged, discussionNotes);
    setIsSavingFlag(false);

    if (res.success) {
      setSelectedCandidate(null);
      fetchMonitorData();
    }
  };

  const wildDisagreementCount = candidates.filter((c) => c.isWildDivergence).length;
  const flaggedCount = candidates.filter((c) => c.isFlaggedForDiscussion).length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#0F4327] to-emerald-900 text-white rounded-3xl p-6 shadow-xl border-2 border-amber-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-400 text-gray-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Real-Time Panel Consensus & Divergence Monitor</span>
          </div>
          <h2 className="text-2xl font-black text-white">Multi-Judge Evaluation Dashboard</h2>
          <p className="text-xs text-emerald-200 mt-1 max-w-2xl">
            Live evaluation monitor analyzing candidate scores submitted by multiple panel judges. Automatically detects score divergence and flags wildly conflicting scores for committee discussion.
          </p>
        </div>

        <button
          onClick={fetchMonitorData}
          disabled={isLoading}
          className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-2xl border border-white/20 transition flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Scores</span>
        </button>
      </div>

      {/* Analytics KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow border border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase">Candidates Under Panel Review</div>
            <div className="text-3xl font-black text-gray-900 mt-1">{candidates.length}</div>
          </div>
          <div className="w-12 h-12 bg-emerald-100 text-[#0F5132] rounded-2xl flex items-center justify-center font-black">
            <BarChart2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow border border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-red-600 uppercase">Wild Disagreement Flags</div>
            <div className="text-3xl font-black text-red-600 mt-1">{wildDisagreementCount}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Score delta &ge; 20 marks</div>
          </div>
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center font-black">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow border border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-700 uppercase">Flagged for Discussion</div>
            <div className="text-3xl font-black text-amber-600 mt-1">{flaggedCount}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Marked by Admin</div>
          </div>
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center font-black">
            <Flag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Candidates List Table */}
      {candidates.length > 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-black text-gray-900 text-base">Candidate Evaluation Consensus Matrix</h3>
            <span className="text-xs font-bold text-gray-500">{candidates.length} Record(s)</span>
          </div>

          <div className="divide-y divide-gray-200">
            {candidates.map((cand) => {
              const isExpanded = expandedAppId === cand.id;

              return (
                <div key={cand.id} className="p-5 hover:bg-gray-50/50 transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Candidate Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gray-900 text-base">{cand.applicantName}</span>
                        <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-300">
                          {cand.referenceNumber}
                        </span>

                        {cand.isWildDivergence && (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full border border-red-300 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            Wild Disagreement ({cand.scoreDelta} pts delta)
                          </span>
                        )}

                        {cand.isFlaggedForDiscussion && (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 font-extrabold text-[11px] px-2 py-0.5 rounded-full border border-amber-300">
                            <Flag className="w-3 h-3 text-amber-700" />
                            Flagged for Committee Discussion
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500">
                        Position: <strong>{cand.positionTitle}</strong> ({cand.departmentName})
                      </div>
                    </div>

                    {/* Consensus Metrics & Actions */}
                    <div className="flex items-center gap-4">
                      
                      {/* Metric Badges */}
                      <div className="flex items-center gap-2 text-center">
                        <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          <div className="text-[10px] font-bold text-gray-500 uppercase">Average</div>
                          <div className="text-sm font-black text-[#0F5132] font-mono">{cand.averageScore}</div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl">
                          <div className="text-[10px] font-bold text-gray-500 uppercase">Judges</div>
                          <div className="text-sm font-black text-blue-900 font-mono">{cand.judgeCount}</div>
                        </div>

                        <div className={`px-3 py-1.5 rounded-xl border ${cand.isWildDivergence ? 'bg-red-50 border-red-200 text-red-900' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                          <div className="text-[10px] font-bold uppercase">Spread / StdDev</div>
                          <div className="text-sm font-black font-mono">
                            {cand.scoreDelta} pts / &sigma;={cand.stdDev}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenFlagModal(cand)}
                          className={`text-xs font-extrabold px-3 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer ${
                            cand.isFlaggedForDiscussion
                              ? 'bg-amber-500 text-gray-950 hover:bg-amber-400 shadow'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span>{cand.isFlaggedForDiscussion ? 'Edit Discussion Flag' : 'Flag Candidate'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpandedAppId(isExpanded ? null : cand.id)}
                          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                          title="Toggle Judge Breakdown"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                    </div>

                  </div>

                  {/* Expanded Side-by-Side Judge Scores Matrix */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 bg-gray-50/80 p-4 rounded-2xl">
                      <div className="text-xs font-bold text-gray-700 uppercase">Individual Judge Submissions</div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cand.panelScores.map((score: any) => (
                          <div key={score.id} className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-extrabold text-xs text-gray-900">{score.judgeName}</div>
                                <div className="text-[11px] text-gray-500">{score.judgeDesignation} ({score.judgeDepartment})</div>
                              </div>
                              <span className="font-mono font-black text-sm text-[#0F5132] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {score.totalScore} / 100
                              </span>
                            </div>
                            {score.notes && (
                              <div className="text-[11px] text-gray-600 italic bg-gray-50 p-2 rounded border border-gray-100">
                                &ldquo;{score.notes}&rdquo;
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {cand.discussionNotes && (
                        <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl text-xs text-amber-900 space-y-1">
                          <div className="font-bold uppercase tracking-wider text-[10px] text-amber-800">Admin Committee Notes:</div>
                          <div>{cand.discussionNotes}</div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center shadow border border-gray-200 space-y-2">
          <Users className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-700">No Panel Evaluations Recorded Yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Once panel judges begin scoring candidates through the Judge Portal, live consensus scores and divergence flags will automatically populate here.
          </p>
        </div>
      )}

      {/* Flag Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-gray-900 text-lg">Flag Candidate for Discussion</h3>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-600">
              Flagging <strong>{selectedCandidate.applicantName}</strong> ({selectedCandidate.referenceNumber}) for committee discussion.
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase text-gray-700">Discussion Notes / Justification</label>
              <textarea
                rows={4}
                value={discussionNotes}
                onChange={(e) => setDiscussionNotes(e.target.value)}
                placeholder="Enter reasons for flagging (e.g. Wild disagreement between judges on technical section)..."
                className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#0F5132] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSaveFlag(true)}
                disabled={isSavingFlag}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold py-3 rounded-xl text-sm transition shadow cursor-pointer"
              >
                Flag Candidate
              </button>

              {selectedCandidate.isFlaggedForDiscussion && (
                <button
                  type="button"
                  onClick={() => handleSaveFlag(false)}
                  disabled={isSavingFlag}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-4 py-3 rounded-xl text-sm transition cursor-pointer"
                >
                  Unflag
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
