'use client';

import React, { useState, useEffect } from 'react';
import { submitJudgeScore } from '@/app/actions/judge';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  UserCheck,
  Award,
  Maximize2,
  X,
  Columns,
} from 'lucide-react';

export interface CandidateCardData {
  id: string;
  referenceNumber: string;
  applicant: {
    fullName: string;
    email: string;
  };
  position: {
    title: string;
    rubricCriteria: Array<{
      id: string;
      title: string;
      description?: string;
      maxMark: number;
      subcriteria: Array<{
        id: string;
        title: string;
        description?: string;
        maxMark: number;
      }>;
    }>;
  };
  department: {
    name: string;
  };
  cvDocument?: {
    fileUrl: string;
    fileName: string;
  } | null;
}

interface JudgeCardScorerProps {
  candidates: CandidateCardData[];
  judgeName: string;
  judgeDept: string;
  judgeDesignation: string;
  onResetSession: () => void;
}

export default function JudgeCardScorer({
  candidates,
  judgeName,
  judgeDept,
  judgeDesignation,
  onResetSession,
}: JudgeCardScorerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'scorer' | 'cv' | 'split'>('split');
  const [subscores, setSubscores] = useState<Record<string, { score: number; comments: string }>>({});
  const [generalNotes, setGeneralNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCvFullscreen, setIsCvFullscreen] = useState(false);
  const [cvHtmlContent, setCvHtmlContent] = useState<string | null>(null);
  const [isLoadingCvHtml, setIsLoadingCvHtml] = useState<boolean>(false);
  const [submittedModalData, setSubmittedModalData] = useState<{
    totalScore: number;
    candidateName: string;
    refNumber: string;
    countdown: number;
  } | null>(null);

  const currentCandidate = candidates[currentIndex];

  // Auto-countdown timer for success modal -> redirects to judge details entry
  useEffect(() => {
    if (!submittedModalData) return;

    if (submittedModalData.countdown <= 0) {
      setSubmittedModalData(null);
      onResetSession();
      return;
    }

    const timer = setTimeout(() => {
      setSubmittedModalData((prev) => (prev ? { ...prev, countdown: prev.countdown - 1 } : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [submittedModalData, onResetSession]);

  // Fetch DOCX HTML Content for Judge CV preview
  useEffect(() => {
    const doc = currentCandidate?.cvDocument;
    if (!doc || !doc.fileUrl) {
      setCvHtmlContent(null);
      setIsLoadingCvHtml(false);
      return;
    }

    const docName = doc.fileName || doc.fileUrl || '';
    const isWordDoc = docName.match(/\.(docx?|doc)$/i);

    if (isWordDoc) {
      setIsLoadingCvHtml(true);
      fetch(`/api/view-document?file=${encodeURIComponent(doc.fileUrl)}`)
        .then((res) => res.text())
        .then((html) => {
          setCvHtmlContent(html);
          setIsLoadingCvHtml(false);
        })
        .catch(() => {
          setCvHtmlContent('<div class="p-6 text-center text-red-600 font-bold">Failed to load CV document text.</div>');
          setIsLoadingCvHtml(false);
        });
    } else {
      setCvHtmlContent(null);
      setIsLoadingCvHtml(false);
    }
  }, [currentCandidate]);

  // Initialize subscores whenever selected candidate changes
  useEffect(() => {
    if (currentCandidate) {
      const initial: Record<string, { score: number; comments: string }> = {};
      currentCandidate.position.rubricCriteria.forEach((crit) => {
        crit.subcriteria.forEach((sub) => {
          initial[sub.id] = { score: 0, comments: '' };
        });
      });
      setSubscores(initial);
      setGeneralNotes('');
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [currentIndex, currentCandidate]);

  // Keyboard Navigation Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, candidates.length]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < candidates.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleScoreChange = (subcriteriaId: string, value: number, maxMark: number) => {
    const safeValue = Math.min(Math.max(0, value), maxMark);
    setSubscores((prev) => ({
      ...prev,
      [subcriteriaId]: {
        ...prev[subcriteriaId],
        score: safeValue,
      },
    }));
  };

  const totalScore = currentCandidate
    ? Object.values(subscores).reduce((acc, curr) => acc + (Number(curr.score) || 0), 0)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCandidate) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const scoresPayload = Object.entries(subscores).map(([subcriteriaId, val]) => ({
      subcriteriaId,
      score: val.score,
      comments: val.comments,
    }));

    const res = await submitJudgeScore({
      applicationId: currentCandidate.id,
      judgeName,
      judgeDepartment: judgeDept,
      judgeDesignation,
      scores: scoresPayload,
      notes: generalNotes,
    });

    setIsSubmitting(false);

    if (res.success) {
      setSubmittedModalData({
        totalScore: res.totalScore ?? 0,
        candidateName: currentCandidate.applicant.fullName,
        refNumber: currentCandidate.referenceNumber,
        countdown: 4,
      });
    } else {
      setErrorMessage(res.error || 'Failed to submit panel scores.');
    }
  };

  if (!currentCandidate) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-gray-200 space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-[#0F5132] rounded-full flex items-center justify-center mx-auto text-2xl font-black">
          ✓
        </div>
        <h2 className="text-2xl font-black text-gray-900">All Candidates Evaluated</h2>
        <p className="text-gray-600 text-sm">You have completed evaluating candidates in this batch.</p>
        <button
          onClick={onResetSession}
          className="bg-[#0F5132] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#0B3D26] transition shadow"
        >
          Back to Search / Reset Session
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Active Session & Card Navigation Header */}
      <div className="bg-gradient-to-r from-[#0F4327] to-[#0A2E1A] text-white rounded-3xl p-5 shadow-xl border border-emerald-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Judge Info Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-gray-950 flex items-center justify-center font-black text-lg shadow">
            <UserCheck className="w-5 h-5 text-gray-950" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Active Evaluation Deck</div>
            <div className="text-base font-extrabold text-white">{judgeName}</div>
            <div className="text-xs text-emerald-200">{judgeDesignation} — {judgeDept}</div>
          </div>
        </div>

        {/* Candidate Stack Swiper Controls */}
        <div className="flex items-center justify-between md:justify-end gap-3 bg-emerald-950/70 p-2 rounded-2xl border border-emerald-800/80">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="Previous Candidate (Left Arrow)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center px-3">
            <div className="text-[10px] font-bold uppercase text-emerald-300">Candidate Deck</div>
            <div className="text-sm font-black font-mono text-amber-400">
              {currentIndex + 1} <span className="text-white/60">/</span> {candidates.length}
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === candidates.length - 1}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="Next Candidate (Right Arrow)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Candidate Profile Summary Banner */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-[#0F5132] font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg border border-emerald-300">
              Ref: {currentCandidate.referenceNumber}
            </span>
            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-lg border border-amber-300">
              {currentCandidate.department.name}
            </span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mt-2">{currentCandidate.applicant.fullName}</h2>
          <div className="text-xs text-gray-500 font-medium">
            Position Applied: <strong className="text-gray-800">{currentCandidate.position.title}</strong>
          </div>
        </div>

        {/* View Switcher Tabs (Sliders / CV / Split) */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-2xl border border-gray-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('scorer')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === 'scorer'
                ? 'bg-[#0F5132] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Rubric Sliders</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cv')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === 'cv'
                ? 'bg-[#0F5132] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Candidate CV Document</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('split')}
            className={`hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === 'split'
                ? 'bg-[#0F5132] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Columns className="w-4 h-4" />
            <span>Split View</span>
          </button>
        </div>
      </div>

      {/* Main Scoring Deck Layout (Split Screen or Full Width Focus) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Rubric Sliders Form */}
        <div className={`space-y-6 ${
          activeTab === 'scorer'
            ? 'col-span-12 block'
            : activeTab === 'cv'
            ? 'hidden'
            : 'col-span-12 lg:col-span-7 block'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Feedback Alerts */}
            {successMessage && (
              <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-2xl text-emerald-900 font-bold text-sm flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-2xl text-red-900 font-bold text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Rubric Criteria Cards */}
            {currentCandidate.position.rubricCriteria.map((crit) => (
              <div key={crit.id} className="bg-white rounded-3xl shadow-md p-6 border border-gray-200 space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="font-black text-gray-900 text-lg">{crit.title}</h3>
                    {crit.description && <p className="text-xs text-gray-500 mt-0.5">{crit.description}</p>}
                  </div>
                  <span className="bg-emerald-100 text-[#0F5132] font-black text-xs px-3 py-1 rounded-full shrink-0">
                    Max {crit.maxMark} Marks
                  </span>
                </div>

                {/* Sub-Criteria Sliders */}
                <div className="space-y-6">
                  {crit.subcriteria.map((sub) => {
                    const currentVal = subscores[sub.id]?.score ?? 0;
                    const percent = sub.maxMark > 0 ? Math.round((currentVal / sub.maxMark) * 100) : 0;

                    return (
                      <div key={sub.id} className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-extrabold text-sm text-gray-900">{sub.title}</div>
                            {sub.description && <div className="text-xs text-gray-500">{sub.description}</div>}
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-black text-lg text-[#0F5132]">{currentVal}</span>
                            <span className="text-xs font-bold text-gray-500"> / {sub.maxMark}</span>
                          </div>
                        </div>

                        {/* Interactive Range Slider */}
                        <div className="space-y-2">
                          <input
                            type="range"
                            min="0"
                            max={sub.maxMark}
                            step="0.5"
                            value={currentVal}
                            onChange={(e) => handleScoreChange(sub.id, parseFloat(e.target.value) || 0, sub.maxMark)}
                            className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0F5132]"
                          />

                          {/* Preset Quick Score Buttons */}
                          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                            <button
                              type="button"
                              onClick={() => handleScoreChange(sub.id, 0, sub.maxMark)}
                              className="hover:text-gray-800"
                            >
                              0 (Fail)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleScoreChange(sub.id, sub.maxMark * 0.5, sub.maxMark)}
                              className="hover:text-gray-800"
                            >
                              50%
                            </button>
                            <button
                              type="button"
                              onClick={() => handleScoreChange(sub.id, sub.maxMark * 0.75, sub.maxMark)}
                              className="hover:text-gray-800"
                            >
                              75%
                            </button>
                            <button
                              type="button"
                              onClick={() => handleScoreChange(sub.id, sub.maxMark, sub.maxMark)}
                              className="hover:text-gray-800 text-[#0F5132]"
                            >
                              100% (Max)
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* General Notes Input */}
            <div className="bg-white rounded-3xl shadow-md p-6 border border-gray-200 space-y-2">
              <label className="block text-xs font-black uppercase text-gray-700 tracking-wider">
                Panel Judge Remarks / Justification (Optional)
              </label>
              <textarea
                rows={3}
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Enter qualitative comments, candidate strengths, or interview notes..."
                className="w-full border border-gray-300 rounded-2xl p-3.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#0F5132] focus:outline-none"
              />
            </div>

            {/* Total Evaluated Score Sticky Floating Card */}
            <div className="sticky bottom-4 bg-[#0F5132] text-white rounded-3xl p-6 shadow-2xl flex items-center justify-between border-2 border-amber-400 z-30">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  Total Evaluated Score Rollup
                </div>
                <div className="text-3xl font-black">{totalScore.toFixed(1)} / 100</div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-sm px-6 py-3.5 rounded-2xl shadow transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Score'}</span>
              </button>
            </div>

          </form>
        </div>

        {/* Right Column: Embedded Candidate CV Viewer */}
        <div className={`${
          activeTab === 'cv'
            ? 'col-span-12 block'
            : activeTab === 'scorer'
            ? 'hidden'
            : 'col-span-12 lg:col-span-5 block'
        }`}>
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-5 space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0F5132]" />
                <span className="font-black text-gray-900 text-sm">Candidate CV Document</span>
              </div>

              {currentCandidate.cvDocument && (
                <button
                  type="button"
                  onClick={() => setIsCvFullscreen(!isCvFullscreen)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-lg"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Fullscreen</span>
                </button>
              )}
            </div>

            {isLoadingCvHtml ? (
              <div className="w-full h-[600px] bg-white rounded-2xl border border-gray-300 flex flex-col items-center justify-center p-8 space-y-3">
                <FileText className="w-8 h-8 text-[#0F5132] animate-bounce" />
                <div className="text-xs font-bold text-gray-700">Extracting Candidate Word Document Text...</div>
              </div>
            ) : cvHtmlContent ? (
              <div className="space-y-3">
                <div className="w-full h-[600px] bg-white rounded-2xl overflow-hidden border border-gray-300 shadow-inner">
                  <iframe
                    srcDoc={cvHtmlContent}
                    className="w-full h-full border-none bg-white"
                    title={`${currentCandidate.applicant.fullName} CV`}
                  />
                </div>
                <div className="text-center">
                  <a
                    href={currentCandidate.cvDocument?.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#0F5132] underline hover:text-[#0B3D26]"
                  >
                    Open CV Original File ↗
                  </a>
                </div>
              </div>
            ) : currentCandidate.cvDocument ? (
              <div className="space-y-3">
                <div className="w-full h-[600px] bg-gray-100 rounded-2xl overflow-hidden border border-gray-300">
                  <iframe
                    src={
                      currentCandidate.cvDocument.fileUrl.startsWith('/api/')
                        ? currentCandidate.cvDocument.fileUrl
                        : `/api/view-document?file=${encodeURIComponent(currentCandidate.cvDocument.fileUrl)}`
                    }
                    className="w-full h-full border-none"
                    title={`${currentCandidate.applicant.fullName} CV`}
                  />
                </div>
                <div className="text-center">
                  <a
                    href={currentCandidate.cvDocument.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#0F5132] underline hover:text-[#0B3D26]"
                  >
                    Open CV in New Window ↗
                  </a>
                </div>
              </div>
            ) : (
              <div className="h-[400px] bg-gray-50 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-gray-400 space-y-2 border border-dashed border-gray-300">
                <FileText className="w-12 h-12 stroke-1" />
                <div className="text-sm font-bold text-gray-600">No CV File Attached</div>
                <p className="text-xs text-gray-400">Candidate did not submit a PDF or Word document.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Fullscreen CV Modal */}
      {isCvFullscreen && currentCandidate.cvDocument && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between text-white px-4">
            <span className="font-bold text-sm">{currentCandidate.applicant.fullName} — CV Preview</span>
            <button
              onClick={() => setIsCvFullscreen(false)}
              className="text-white hover:text-amber-400 font-black text-xl p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 bg-white rounded-2xl overflow-hidden">
            {cvHtmlContent ? (
              <iframe
                srcDoc={cvHtmlContent}
                className="w-full h-full border-none bg-white"
                title="Fullscreen CV"
              />
            ) : (
              <iframe
                src={
                  currentCandidate.cvDocument.fileUrl.startsWith('/api/')
                    ? currentCandidate.cvDocument.fileUrl
                    : `/api/view-document?file=${encodeURIComponent(currentCandidate.cvDocument.fileUrl)}`
                }
                className="w-full h-full border-none"
                title="Fullscreen CV"
              />
            )}
          </div>
        </div>
      )}

      {/* Submission Success Modal with 4-Second Countdown Redirect */}
      {submittedModalData && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-200 text-center space-y-5 relative overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Top Green Ribbon Accent */}
            <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-[#0F5132] via-emerald-500 to-amber-400" />

            {/* Checkmark Icon */}
            <div className="w-20 h-20 bg-emerald-100 border-4 border-emerald-200 rounded-full flex items-center justify-center mx-auto text-[#0F5132] shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0F5132] bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                Evaluation Submitted Successfully
              </span>
              <h2 className="text-2xl font-black text-gray-900 mt-3">Score Recorded!</h2>
              <p className="text-xs text-gray-600 mt-1">
                Candidate: <strong className="text-gray-900">{submittedModalData.candidateName}</strong> ({submittedModalData.refNumber})
              </p>
            </div>

            {/* Score Summary Card */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-1">
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total Marks Awarded</div>
              <div className="text-3xl font-black font-mono text-[#0F5132]">
                {submittedModalData.totalScore} <span className="text-xs font-bold text-gray-400">/ 100 Marks</span>
              </div>
              <div className="text-[11px] text-gray-500 pt-1">
                Logged under: <strong>{judgeName}</strong> ({judgeDesignation})
              </div>
            </div>

            {/* Countdown Banner */}
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Returning to Judge Login in...</span>
              </span>
              <span className="bg-amber-500 text-gray-950 px-2.5 py-0.5 rounded-full font-mono text-sm font-black shadow">
                {submittedModalData.countdown}s
              </span>
            </div>

            {/* Manual Return Button */}
            <button
              type="button"
              onClick={() => {
                setSubmittedModalData(null);
                onResetSession();
              }}
              className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg transition cursor-pointer"
            >
              Enter Next Judge Details Now →
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
