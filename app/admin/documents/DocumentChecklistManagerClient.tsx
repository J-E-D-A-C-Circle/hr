'use client';

import { useState } from 'react';
import { createRequiredDocument, deleteRequiredDocument } from '@/app/actions/admin';

interface DocumentChecklistManagerClientProps {
  initialDocuments: Array<{
    id: string;
    title: string;
    description: string | null;
    isMandatory: boolean;
    _count: { submittedDocuments: number };
  }>;
  userRole: string;
}

export default function DocumentChecklistManagerClient({
  initialDocuments,
  userRole,
}: DocumentChecklistManagerClientProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenCreateModal = () => {
    setTitle('');
    setDescription('');
    setIsMandatory(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await createRequiredDocument(title, description, isMandatory);
    setIsSubmitting(false);

    if (res.success && res.requiredDocument) {
      setDocuments((prev) => [...prev, res.requiredDocument as any]);
      setIsModalOpen(false);
    } else {
      setErrorMsg(res.error || 'Failed to create required document checklist item.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document checklist requirement?')) return;
    const res = await deleteRequiredDocument(id);
    if (res.success) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } else {
      alert(res.error || 'Failed to delete requirement.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FAF0D7] p-5 rounded-3xl shadow-sm border border-[#E6D7A8]">
        <div>
          <div className="text-sm font-bold text-gray-900">Required Post-Acceptance Document Requirements</div>
          <div className="text-2xl font-black text-[#15803D]">{documents.length} Configured Document Requirements</div>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-[#15803D] hover:bg-[#166534] text-white px-5 py-2.5 rounded-2xl font-extrabold text-sm shadow-md transition transform hover:-translate-y-0.5 cursor-pointer"
        >
          ➕ Add Document Requirement
        </button>
      </div>

      <div className="bg-[#FAF0D7] rounded-3xl shadow-md border border-[#E6D7A8] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-emerald-900 text-white text-xs uppercase font-extrabold tracking-wider">
            <tr>
              <th className="px-6 py-4">Document Title</th>
              <th className="px-6 py-4">Description / Instructions</th>
              <th className="px-6 py-4">Requirement Type</th>
              <th className="px-6 py-4">Submissions Received</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-amber-50/40 transition">
                <td className="px-6 py-4 font-bold text-gray-900">{doc.title}</td>
                <td className="px-6 py-4 text-xs text-gray-600 max-w-xs">{doc.description || 'N/A'}</td>
                <td className="px-6 py-4">
                  {doc.isMandatory ? (
                    <span className="bg-red-100 text-red-900 text-xs font-extrabold px-2.5 py-1 rounded-xl border border-red-300">
                      Mandatory
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-xl border border-gray-300">
                      Optional
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 font-bold text-emerald-800">{doc._count?.submittedDocuments || 0} Submissions</td>
                <td className="px-6 py-4 text-right">
                  {userRole === 'SUPER_ADMIN' && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-red-200 transition"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-lg font-black text-gray-900">Add Required Document Requirement</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border-l-4 border-red-600 p-3 rounded-2xl text-red-800 text-xs">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Signed Acceptance Letter"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide instructions for approved candidates uploading this document..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isMandatory"
                  checked={isMandatory}
                  onChange={(e) => setIsMandatory(e.target.checked)}
                  className="w-4 h-4 text-[#15803D] rounded border-gray-300 focus:ring-[#15803D]"
                />
                <label htmlFor="isMandatory" className="text-xs font-bold text-gray-800">
                  Mandatory Requirement (Mandatory for placement confirmation)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 border border-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-[#15803D] hover:bg-[#166534] shadow transition"
                >
                  {isSubmitting ? 'Saving...' : 'Add Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
