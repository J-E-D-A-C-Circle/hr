'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { savePositionRubric, CriteriaInput } from '@/app/actions/admin';
import { CheckCircle2, AlertTriangle, Plus, Trash2, Save, FileSpreadsheet } from 'lucide-react';

export default function RubricBuilderClient({ position }: { position: any }) {
  const router = useRouter();

  // Initialize state with existing criteria or sample default structure
  const [criteriaList, setCriteriaList] = useState<CriteriaInput[]>(
    position.rubricCriteria.length > 0
      ? position.rubricCriteria.map((c: any) => ({
          title: c.title,
          description: c.description || '',
          maxMark: c.maxMark,
          subcriteria: c.subcriteria.map((s: any) => ({
            title: s.title,
            description: s.description || '',
            maxMark: s.maxMark,
          })),
        }))
      : [
          {
            title: 'Technical & Practical Skills',
            description: 'Core domain competencies and hands-on ability.',
            maxMark: 50,
            subcriteria: [
              { title: 'Fundamentals & Logic', description: '', maxMark: 25 },
              { title: 'Applied Technical Knowledge', description: '', maxMark: 25 },
            ],
          },
          {
            title: 'Communication & Presentation',
            description: 'Clarity, confidence, and articulation during assessment.',
            maxMark: 30,
            subcriteria: [
              { title: 'Verbal Expression', description: '', maxMark: 15 },
              { title: 'Clarity & Confidence', description: '', maxMark: 15 },
            ],
          },
          {
            title: 'General Suitability & Professionalism',
            description: 'Work ethic, attitude, and authority alignment.',
            maxMark: 20,
            subcriteria: [
              { title: 'Professional Conduct', description: '', maxMark: 10 },
              { title: 'Culture & Integrity Fit', description: '', maxMark: 10 },
            ],
          },
        ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Mark calculations
  const totalMaxMarks = criteriaList.reduce((sum, c) => sum + (Number(c.maxMark) || 0), 0);
  const isValidTotal = Math.abs(totalMaxMarks - 100) < 0.01;

  const handleAddCriteria = () => {
    setCriteriaList((prev) => [
      ...prev,
      {
        title: 'New Evaluation Criteria',
        description: '',
        maxMark: 10,
        subcriteria: [{ title: 'Sub-criterion 1', description: '', maxMark: 10 }],
      },
    ]);
  };

  const handleRemoveCriteria = (index: number) => {
    setCriteriaList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCriteriaChange = (index: number, field: string, value: any) => {
    setCriteriaList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddSubcriteria = (criteriaIndex: number) => {
    setCriteriaList((prev) =>
      prev.map((c, i) =>
        i === criteriaIndex
          ? {
              ...c,
              subcriteria: [...c.subcriteria, { title: 'New Sub-criterion', description: '', maxMark: 5 }],
            }
          : c
      )
    );
  };

  const handleRemoveSubcriteria = (criteriaIndex: number, subIndex: number) => {
    setCriteriaList((prev) =>
      prev.map((c, i) =>
        i === criteriaIndex
          ? { ...c, subcriteria: c.subcriteria.filter((_, sI) => sI !== subIndex) }
          : c
      )
    );
  };

  const handleSubcriteriaChange = (
    criteriaIndex: number,
    subIndex: number,
    field: string,
    value: any
  ) => {
    setCriteriaList((prev) =>
      prev.map((c, i) =>
        i === criteriaIndex
          ? {
              ...c,
              subcriteria: c.subcriteria.map((s, sI) =>
                sI === subIndex ? { ...s, [field]: value } : s
              ),
            }
          : c
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await savePositionRubric(position.id, criteriaList);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('Rubric successfully saved & published for panel judges!');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Failed to save rubric.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Total Calculation Card */}
      <div
        className={`p-6 rounded-3xl border-2 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isValidTotal ? 'bg-emerald-50/80 border-emerald-500' : 'bg-red-50 border-red-500'
        }`}
      >
        <div>
          <div className="text-xs uppercase font-extrabold tracking-wider text-gray-700 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-[#15803D]" />
            <span>Rubric Total Mark Validation</span>
          </div>
          <div className="text-3xl font-black text-gray-900 mt-1">
            {totalMaxMarks} / 100 <span className="text-sm font-bold text-gray-600">Total Parent Marks</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {isValidTotal
              ? 'Parent criteria sum to exactly 100 marks. Valid for judge scoring.'
              : 'Validation Error: Total parent criteria marks MUST sum to exactly 100 marks.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {isValidTotal ? (
            <span className="bg-emerald-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Valid 100 Marks</span>
            </span>
          ) : (
            <span className="bg-red-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Invalid Mark Sum</span>
            </span>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isValidTotal}
            className="bg-[#15803D] hover:bg-[#166534] text-white font-black text-sm px-6 py-3 rounded-2xl shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving Rubric...' : 'Save & Publish Rubric'}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-2xl text-green-900 text-xs font-semibold shadow-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-2xl text-red-900 text-xs font-semibold shadow-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Criteria Cards */}
      <div className="space-y-6">
        {criteriaList.map((crit, cIndex) => {
          const subTotal = crit.subcriteria.reduce((sum, s) => sum + (Number(s.maxMark) || 0), 0);
          const isSubValid = Math.abs(subTotal - (Number(crit.maxMark) || 0)) < 0.01;

          return (
            <div key={cIndex} className="bg-[#FAF0D7] rounded-3xl p-6 shadow-md border border-[#E6D7A8] space-y-4">
              
              {/* Criteria Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                      Parent Criteria #{cIndex + 1} Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={crit.title}
                      onChange={(e) => handleCriteriaChange(cIndex, 'title', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#15803D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Max Mark *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={crit.maxMark}
                      onChange={(e) => handleCriteriaChange(cIndex, 'maxMark', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm font-black text-gray-900 focus:ring-2 focus:ring-[#15803D]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveCriteria(cIndex)}
                  className="text-xs font-bold text-red-600 hover:text-red-800 self-start md:self-auto flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Criteria</span>
                </button>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Description / Instructions for Judges</label>
                <input
                  type="text"
                  value={crit.description || ''}
                  onChange={(e) => handleCriteriaChange(cIndex, 'description', e.target.value)}
                  placeholder="Optional guidance notes..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-700"
                />
              </div>

              {/* Subcriteria Section */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 uppercase">Sub-criteria Items</span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-xl flex items-center gap-1 ${
                      isSubValid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      Sub-total: {subTotal} / {crit.maxMark} Marks {isSubValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddSubcriteria(cIndex)}
                    className="text-xs font-extrabold text-[#15803D] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Sub-criterion</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {crit.subcriteria.map((sub, sIndex) => (
                    <div key={sIndex} className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col md:flex-row items-center gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Sub-criterion title..."
                        value={sub.title}
                        onChange={(e) => handleSubcriteriaChange(cIndex, sIndex, 'title', e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 font-semibold"
                      />

                      <input
                        type="text"
                        placeholder="Sub-criterion description..."
                        value={sub.description || ''}
                        onChange={(e) => handleSubcriteriaChange(cIndex, sIndex, 'description', e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600"
                      />

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          required
                          step="0.5"
                          min="0.5"
                          value={sub.maxMark}
                          onChange={(e) => handleSubcriteriaChange(cIndex, sIndex, 'maxMark', parseFloat(e.target.value) || 0)}
                          className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold text-center text-gray-900"
                        />
                        <span className="text-xs text-gray-500 font-semibold">Marks</span>

                        <button
                          type="button"
                          onClick={() => handleRemoveSubcriteria(cIndex, sIndex)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-gray-300 pt-6">
        <button
          type="button"
          onClick={handleAddCriteria}
          className="bg-white hover:bg-gray-50 text-gray-800 font-bold border border-gray-300 text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#15803D]" />
          <span>Add New Parent Criteria</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting || !isValidTotal}
          className="bg-[#15803D] hover:bg-[#166534] text-white font-black text-sm px-6 py-3 rounded-2xl shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSubmitting ? 'Saving...' : 'Save & Publish Rubric'}</span>
        </button>
      </div>
    </form>
  );
}
