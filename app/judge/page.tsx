'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';

import { searchCandidatesForScoring } from '@/app/actions/judge';
import JudgeCardScorer from '@/components/JudgeCardScorer';
import { Search, UserCheck, ShieldCheck, Sparkles, SlidersHorizontal } from 'lucide-react';

export default function JudgePage() {
  // Judge Session Info State
  const [judgeName, setJudgeName] = useState('');
  const [judgeDept, setJudgeDept] = useState('');
  const [judgeDesignation, setJudgeDesignation] = useState('');
  const [isSessionSet, setIsSessionSet] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (judgeName.trim() && judgeDept.trim() && judgeDesignation.trim()) {
      setIsSessionSet(true);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const res = await searchCandidatesForScoring(searchQuery);
    setIsSearching(false);

    if (res.success && res.candidates) {
      setCandidates(res.candidates);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF6E3]">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900">Panel Judge Scoring Deck</h1>
          <p className="text-gray-600 text-sm max-w-2xl mx-auto">
            Evaluate shortlisted candidates using interactive card swiping and touch-friendly sub-criteria sliders. Blinded evaluation isolates candidate CVs.
          </p>
        </div>

        {/* Step 1: Judge Session Setup */}
        {!isSessionSet ? (
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200 max-w-md mx-auto space-y-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#0F5132] text-amber-400 flex items-center justify-center font-black text-lg">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Panel Judge Session</h2>
                <div className="text-xs text-gray-500">Enter officer details to start scoring session</div>
              </div>
            </div>

            <form onSubmit={handleStartSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Judge Full Name *</label>
                <input
                  type="text"
                  required
                  value={judgeName}
                  onChange={(e) => setJudgeName(e.target.value)}
                  placeholder="e.g. Dr. Emmanuel Addo"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#0F5132] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Department / Organization *</label>
                <input
                  type="text"
                  required
                  value={judgeDept}
                  onChange={(e) => setJudgeDept(e.target.value)}
                  placeholder="e.g. Vehicle Inspection & Testing"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#0F5132] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Official Designation *</label>
                <input
                  type="text"
                  required
                  value={judgeDesignation}
                  onChange={(e) => setJudgeDesignation(e.target.value)}
                  placeholder="e.g. Senior Technical Assessor"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#0F5132] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-extrabold py-3.5 rounded-xl text-sm shadow transition cursor-pointer"
              >
                Start Evaluation Session Deck →
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Candidate Search Box */}
            {candidates.length === 0 && (
              <form onSubmit={handleSearch} className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200 space-y-3 max-w-3xl mx-auto">
                <label className="block text-xs font-black uppercase text-gray-700 tracking-wider">
                  Search Candidate Deck
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    required
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search candidate by Full Name, Email, or Reference Number (e.g. Kwame or DVLA-2026-KM92A)..."
                    className="flex-1 border border-gray-300 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#0F5132] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="bg-[#0F5132] hover:bg-[#0B3D26] text-white font-extrabold px-6 py-3 rounded-2xl text-sm transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>{isSearching ? 'Searching...' : 'Find Candidates'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Candidate Card Deck Scorer */}
            {candidates.length > 0 ? (
              <JudgeCardScorer
                candidates={candidates}
                judgeName={judgeName}
                judgeDept={judgeDept}
                judgeDesignation={judgeDesignation}
                onResetSession={() => setCandidates([])}
              />
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center shadow border border-gray-200 max-w-xl mx-auto space-y-3">
                <SlidersHorizontal className="w-12 h-12 text-gray-400 mx-auto" />
                <h3 className="text-lg font-bold text-gray-800">Ready to Evaluate</h3>
                <p className="text-xs text-gray-500">
                  Search for candidate applications using the search bar above to launch the swipeable candidate evaluation deck.
                </p>
              </div>
            )}

          </div>
        )}

      </main>


    </div>
  );
}
