'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useState, useMemo } from 'react';
import { Search, MapPin, Award, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Position {
  id: string;
  title: string;
  type: string;
  description: string;
  requirements: string | null;
  department: { name: string };
  rubricCriteria: { maxMark: number }[];
}

interface PositionsClientProps {
  positions: Position[];
  departments: { id: string; name: string }[];
}

const TYPE_LABELS: Record<string, string> = {
  ATTACHMENT: 'Attachment',
  INTERNSHIP: 'Internship',
  TEMPORARY: 'Temporary',
  PERMANENT: 'Permanent',
};

const TYPE_COLORS: Record<string, string> = {
  ATTACHMENT: 'bg-emerald-100 text-emerald-800',
  INTERNSHIP: 'bg-blue-100 text-blue-800',
  TEMPORARY: 'bg-amber-100 text-amber-800',
  PERMANENT: 'bg-purple-100 text-purple-800',
};

export default function PositionsClient({ positions, departments }: PositionsClientProps) {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Merged display: Attachment covers both ATTACHMENT and INTERNSHIP db values
  const DISPLAY_TYPES = [
    { label: 'Attachment', value: 'ATTACHMENT' },
    { label: 'Temporary', value: 'TEMPORARY' },
    { label: 'Permanent', value: 'PERMANENT' },
  ];

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return positions.filter((p) => {
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.department.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q)) ||
        (p.requirements?.toLowerCase().includes(q));
      // Attachment option matches both ATTACHMENT and INTERNSHIP
      const matchesType =
        selectedType === 'ALL' ||
        (selectedType === 'ATTACHMENT'
          ? p.type === 'ATTACHMENT' || p.type === 'INTERNSHIP'
          : p.type === selectedType);
      const matchesDept = selectedDept === 'ALL' || p.department.name === selectedDept;
      return matchesQuery && matchesType && matchesDept;
    });
  }, [positions, query, selectedType, selectedDept]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF6E3]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl text-gray-900">Vacancies & Placement Opportunities</h1>
          <p className="text-gray-500 text-sm mt-1">
            {positions.length} open position{positions.length !== 1 ? 's' : ''} at DVLA Ghana
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search input - 6 columns */}
          <div className="relative md:col-span-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by position title, department, or keywords..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F5132] bg-gray-50/50"
            />
          </div>

          {/* Type filter - 3 columns */}
          <div className="md:col-span-3">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full bg-gray-50/50 border-gray-200 text-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {DISPLAY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department filter - 3 columns */}
          <div className="md:col-span-3">
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="w-full bg-gray-50/50 border-gray-200 text-sm">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear filters */}
          {(query || selectedType !== 'ALL' || selectedDept !== 'ALL') && (
            <div className="md:col-span-12 flex justify-end pt-1">
              <button
                onClick={() => { setQuery(''); setSelectedType('ALL'); setSelectedDept('ALL'); }}
                className="text-xs font-bold text-gray-500 hover:text-red-700 underline transition cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        {(query || selectedType !== 'ALL' || selectedDept !== 'ALL') && (
          <p className="text-xs text-gray-500 mb-4">
            Showing {filtered.length} of {positions.length} positions
          </p>
        )}

        {/* Position Cards */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-14 text-center">
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-700">No positions match your search</h3>
            <p className="text-sm text-gray-400 mt-1">Try different keywords or reset your filters.</p>
            <button
              onClick={() => { setQuery(''); setSelectedType('ALL'); setSelectedDept('ALL'); }}
              className="mt-4 text-xs text-[#0F5132] underline"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((pos) => (
              <div
                key={pos.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${TYPE_COLORS[pos.type] ?? 'bg-gray-100 text-gray-700'}`}>
                      {TYPE_LABELS[pos.type] ?? pos.type}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />
                      {pos.department.name}
                    </span>
                  </div>

                  <h2 className="text-base text-gray-900 mb-2">{pos.title}</h2>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-3">{pos.description}</p>

                  {pos.requirements && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs text-gray-600 mb-4">
                      <span className="text-gray-800 block mb-1">Requirements:</span>
                      {pos.requirements}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                  <Link
                    href={`/apply?positionId=${pos.id}`}
                    className="flex items-center gap-1 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs px-4 py-2 rounded-xl shadow-sm transition"
                  >
                    Apply for Position
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
