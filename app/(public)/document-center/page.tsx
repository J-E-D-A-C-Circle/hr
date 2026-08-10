'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';

import { getApplicantDocumentCenter, uploadPostAcceptanceDocument } from '@/app/actions/documentCenter';

export default function DocumentCenterPage() {
  const [refNum, setRefNum] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hubData, setHubData] = useState<any | null>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const res = await getApplicantDocumentCenter(refNum, email);
    setIsLoading(false);

    if (res.success && res.checklist) {
      setHubData(res);
    } else {
      setErrorMsg(res.error || 'Failed to verify document hub access.');
    }
  };

  const handleFileUpload = async (requiredDocId: string, submissionId?: string, file?: File) => {
    if (!file || !hubData) return;
    setUploadingDocId(requiredDocId);

    const formData = new FormData();
    formData.set('file', file);
    if (submissionId) formData.set('submissionId', submissionId);

    const res = await uploadPostAcceptanceDocument(hubData.application.id, requiredDocId, formData);
    setUploadingDocId(null);

    if (res.success) {
      // Refresh checklist
      const refreshed = await getApplicantDocumentCenter(refNum, email);
      if (refreshed.success) {
        setHubData(refreshed);
      }
    } else {
      alert(res.error || 'Upload failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF6E3]">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full">
        <div className="text-center mb-8">
          <div className="inline-block bg-amber-500 text-gray-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            Post-Acceptance Portal
          </div>
          <h1 className="text-3xl font-black text-gray-900">Post-Acceptance Document Hub</h1>
          <p className="text-gray-600 text-sm mt-1 max-w-xl mx-auto">
            Approved applicants can access their universal document checklist, download fillable forms, and submit onboarding documents.
          </p>
        </div>

        {/* Access Form */}
        {!hubData && (
          <form onSubmit={handleAccess} className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-8 max-w-lg mx-auto space-y-4">
            {errorMsg && (
              <div className="bg-red-50 border-l-4 border-red-600 p-3 rounded text-red-800 text-xs">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Application Reference Number *</label>
              <input
                type="text"
                required
                value={refNum}
                onChange={(e) => setRefNum(e.target.value)}
                placeholder="e.g. DVLA-2026-AO48B"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm uppercase font-mono font-semibold text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Applicant Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. abena.osei@dvla.gov.gh"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-bold py-3 rounded-lg text-sm shadow transition disabled:opacity-50"
            >
              {isLoading ? 'Verifying Credentials...' : 'Access Document Center'}
            </button>
          </form>
        )}

        {/* Document Hub Dashboard */}
        {hubData && (
          <div className="space-y-8">
            
            {/* Applicant Summary Header */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="bg-emerald-100 text-[#0F5132] text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                  Status: Approved
                </span>
                <h2 className="text-xl font-extrabold text-gray-900 mt-2">{hubData.application.applicant.fullName}</h2>
                <div className="text-xs text-gray-500 font-medium">
                  {hubData.application.position.title} ({hubData.application.department.name})
                </div>
              </div>

              {/* Progress Counter */}
              <div className="bg-[#FDF6E3] border border-amber-300 rounded-lg p-4 text-center min-w-[200px]">
                <div className="text-xs font-bold uppercase text-amber-800 tracking-wider mb-1">Submission Progress</div>
                <div className="text-2xl font-black text-[#0F5132]">
                  {hubData.progress.submittedCount} of {hubData.progress.totalCount} Documents
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className="bg-[#0F5132] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${hubData.progress.percentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 md:p-8 space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-bold text-gray-900">Universal Required Documents Checklist</h3>
                <p className="text-xs text-gray-500">
                  All appointed candidates across departments must complete and upload these mandatory onboarding documents.
                </p>
              </div>

              <div className="space-y-4">
                {hubData.checklist.map((item: any) => {
                  const req = item.requiredDocument;
                  const sub = item.submission;
                  const isUploading = uploadingDocId === req.id;

                  return (
                    <div
                      key={req.id}
                      className="border border-gray-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-gray-300 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900 text-sm">{req.title}</h4>
                          {req.isMandatory && (
                            <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded uppercase">
                              Required
                            </span>
                          )}
                          {sub && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                sub.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : sub.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {sub.status}
                            </span>
                          )}
                        </div>

                        {req.description && <p className="text-xs text-gray-600 mb-2">{req.description}</p>}

                        {/* Fillable Template Download Link */}
                        {req.isFillableTemplate && (
                          <div className="mt-2">
                            <a
                              href={req.templateFileUrl || '#'}
                              download
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#0F5132] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded transition"
                            >
                              <span>📥</span> Download Fillable Template Form (PDF)
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Action Area */}
                      <div className="flex items-center gap-3">
                        {sub && (
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-gray-700 hover:text-[#0F5132] underline"
                          >
                            View Uploaded ({sub.fileName})
                          </a>
                        )}

                        <label className="cursor-pointer bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold px-4 py-2 rounded shadow transition inline-flex items-center gap-1">
                          <span>{isUploading ? 'Uploading...' : sub ? 'Re-upload' : 'Upload File'}</span>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            disabled={isUploading}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(req.id, sub?.id, file);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </main>


    </div>
  );
}
