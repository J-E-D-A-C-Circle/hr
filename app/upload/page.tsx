'use client';

import { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import {
  FileUp,
  CheckCircle2,
  AlertCircle,
  Building,
  Calendar,
  Clock,
  UploadCloud,
  FileText,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Plus,
  RefreshCcw,
  Image as ImageIcon,
  Send,
  X,
  History,
  Search,
  Filter,
  Download,
  AlertTriangle,
} from 'lucide-react';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface Branch {
  id: string;
  name: string;
  code: string;
  region?: { id: string; name: string };
}

interface ImagePage {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
}

interface SubmissionRecord {
  id: string;
  branchId: string;
  month: number;
  year: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note?: string;
  reviewerNotes?: string;
  reviewedAt?: string;
  branch?: {
    name: string;
    code: string;
  };
}

export default function PublicValidationFormPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  // Form Fields
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [staffType, setStaffType] = useState<'PERMANENT' | 'CONTRACT'>('PERMANENT');
  const [signerName, setSignerName] = useState<string>('');
  const [attested, setAttested] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');

  // Upload Method Tab: 'PDF' | 'IMAGES'
  const [uploadMode, setUploadMode] = useState<'PDF' | 'IMAGES'>('PDF');

  // PDF Upload State
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Image Multi-Page State (up to 12 pages)
  const [imagePages, setImagePages] = useState<ImagePage[]>([]);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedResponse, setSubmittedResponse] = useState<any | null>(null);

  // OCR Pre-check warning state
  const [ocrWarning, setOcrWarning] = useState<string | null>(null);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [pendingSubmitFile, setPendingSubmitFile] = useState<File | null>(null);

  // Station History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyBranchId, setHistoryBranchId] = useState('');
  const [historyYear, setHistoryYear] = useState<string>('ALL');
  const [historyMonth, setHistoryMonth] = useState<string>('ALL');
  const [historyRecords, setHistoryRecords] = useState<SubmissionRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/branches')
      .then((res) => res.json())
      .then((data) => {
        if (data.branches && data.branches.length > 0) {
          setBranches(data.branches);
          setSelectedBranchId(data.branches[0].id);
          setHistoryBranchId(data.branches[0].id);
        }
        setLoadingBranches(false);
      })
      .catch(() => setLoadingBranches(false));
  }, []);

  // Fetch station history whenever history filters change
  useEffect(() => {
    if (!showHistoryModal || !historyBranchId) return;

    setLoadingHistory(true);
    let url = `/api/submissions?branchId=${historyBranchId}`;
    if (historyYear !== 'ALL') url += `&year=${historyYear}`;
    if (historyMonth !== 'ALL') url += `&month=${historyMonth}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.submissions) {
          setHistoryRecords(data.submissions);
        }
        setLoadingHistory(false);
      })
      .catch(() => setLoadingHistory(false));
  }, [showHistoryModal, historyBranchId, historyYear, historyMonth]);

  // Handle PDF file selection
  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setSubmitError('Please select a valid PDF file (.pdf)');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setSubmitError('File size exceeds 15MB limit.');
        return;
      }
      setPdfFile(file);
      setSubmitError(null);
    }
  };

  // Handle Image Selection (Up to 12 images)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    const validImages = filesArray.filter((file) =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)
    );

    if (validImages.length === 0) {
      setSubmitError('Please select valid image files (.jpg, .png, .webp)');
      return;
    }

    if (imagePages.length + validImages.length > 12) {
      setSubmitError(`Maximum 12 pages allowed. You can only add ${12 - imagePages.length} more image(s).`);
      return;
    }

    const newPages: ImagePage[] = validImages.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
    }));

    setImagePages((prev) => [...prev, ...newPages]);
    setSubmitError(null);
  };

  // Move Image Left
  const moveImageLeft = (index: number) => {
    if (index === 0) return;
    const updated = [...imagePages];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setImagePages(updated);
  };

  // Move Image Right
  const moveImageRight = (index: number) => {
    if (index === imagePages.length - 1) return;
    const updated = [...imagePages];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setImagePages(updated);
  };

  // Remove Image Page
  const removeImagePage = (id: string) => {
    setImagePages((prev) => prev.filter((p) => p.id !== id));
  };

  // Compile up to 12 images into a PDF File using jsPDF
  const compileImagesToPdf = async (): Promise<File> => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 0; i < imagePages.length; i++) {
      if (i > 0) doc.addPage();
      const page = imagePages[i];

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(page.file);
      });

      doc.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    }

    const pdfBlob = doc.output('blob');
    const branchCode = branches.find((b) => b.id === selectedBranchId)?.code || 'STATION';
    const compiledFileName = `Validation_${branchCode}_${year}_${month}_Compiled.pdf`;

    return new File([pdfBlob], compiledFileName, { type: 'application/pdf' });
  };

  // Perform Form Submission
  const processSubmission = async (fileToUpload: File) => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('branchId', selectedBranchId);
      formData.append('month', month.toString());
      formData.append('year', year.toString());
      formData.append('staffType', staffType);
      formData.append('file', fileToUpload);

      const formPayload = {
        staffType,
        signerName,
        uploadMode,
        contextNote: note,
      };

      formData.append('note', JSON.stringify(formPayload));

      const res = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit validation form');
      }

      setSubmittedResponse(data.submission);
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBranchId) {
      setSubmitError('Please select your station branch.');
      return;
    }

    if (!signerName) {
      setSubmitError('Please enter the station manager name.');
      return;
    }

    if (!attested) {
      setSubmitError('Please check the manager attestation confirmation box.');
      return;
    }

    let fileToSubmit: File | null = null;

    if (uploadMode === 'PDF') {
      if (!pdfFile) {
        setSubmitError('Please upload a PDF validation scan file.');
        return;
      }
      fileToSubmit = pdfFile;
    } else {
      if (imagePages.length === 0) {
        setSubmitError('Please add at least 1 image page to generate the PDF.');
        return;
      }
      setSubmitting(true);
      fileToSubmit = await compileImagesToPdf();
    }

    await processSubmission(fileToSubmit);
  };

  const selectedBranchName = branches.find((b) => b.id === selectedBranchId)?.name || 'Selected Station';

  if (loadingBranches) {
    return (
      <div className="flex h-96 items-center justify-center text-sm font-normal text-slate-500">
        Loading Station Branches...
      </div>
    );
  }

  // Response Recorded Confirmation View
  if (submittedResponse) {
    return (
      <div className="max-w-2xl mx-auto py-10 space-y-6 font-sans">
        <div className="bg-white border border-emerald-100 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-normal text-slate-900">Validation Form Submitted</h1>
            <p className="text-sm font-normal text-slate-600 max-w-md mx-auto">
              Your monthly payroll validation collection form has been recorded successfully and submitted for HR Admin review.
            </p>
          </div>

          {/* Receipt Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left text-xs font-normal text-slate-700 space-y-3">
            <div className="text-xs uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-200 flex items-center justify-between">
              <span>Submission Receipt</span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-normal">PENDING REVIEW</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="block text-slate-500">Station Branch:</span>
                <span className="text-slate-900 font-normal">{selectedBranchName}</span>
              </div>
              <div>
                <span className="block text-slate-500">Target Period:</span>
                <span className="text-slate-900 font-normal">
                  {month}/{year}
                </span>
              </div>
              <div className="col-span-2">
                <span className="block text-slate-500">Document Scan:</span>
                <span className="text-slate-900 font-normal truncate block">{submittedResponse.fileName}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setSubmittedResponse(null);
                setPdfFile(null);
                setImagePages([]);
                setAttested(false);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-normal transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCcw className="h-4 w-4" />
              <span>Submit Another Response</span>
            </button>

            <button
              onClick={() => setShowHistoryModal(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-normal transition border border-slate-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <History className="h-4 w-4 text-emerald-700" />
              <span>Check Station Submission History</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans py-4">
      {/* Top Banner with Station History Button */}
      <div className="bg-emerald-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-emerald-800 space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-lg bg-emerald-800 text-emerald-200 text-xs border border-emerald-700 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5" />
              {selectedBranchName}
            </span>
            <span className="px-3 py-1 rounded-lg bg-emerald-800 text-emerald-200 text-xs border border-emerald-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Monthly Cutoff: 21st
            </span>
          </div>

          {/* History Icon Trigger Button */}
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-800/90 hover:bg-emerald-800 text-white text-xs font-normal border border-emerald-700 shadow-sm transition cursor-pointer"
            title="Click to check station submission history by year and month"
          >
            <History className="h-4 w-4 text-emerald-300" />
            <span className="hidden sm:inline">Submission History</span>
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-normal text-white">Station Payroll Validation Form</h1>
        <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-2xl font-normal">
          Select your station, enter monthly payroll declaration details, and attach your physical signed PDF scan (or generate a PDF from up to 12 photo scans).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {submitError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-normal flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Section 1: Station Branch & Target Period */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-normal text-slate-900 uppercase tracking-wider">
              1. Choose Station & Month
            </h2>
            <span className="text-xs text-slate-400">Step 1 of 3</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Station Branch Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-normal text-slate-700">Select Station *</label>
              <Select
                value={selectedBranchId}
                onValueChange={(val) => {
                  setSelectedBranchId(val);
                  setHistoryBranchId(val);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select station branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}{b.code ? ` (${b.code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Period */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-normal text-slate-700">Month</label>
                <Select value={month.toString()} onValueChange={(val) => setMonth(parseInt(val))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ].map((m, idx) => (
                      <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                        {m} ({idx + 1})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-normal text-slate-700">Year</label>
                <Select value={year.toString()} onValueChange={(val) => setYear(parseInt(val))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Declaration Details */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-normal text-slate-900 uppercase tracking-wider">
              2. Payroll & Staff Information
            </h2>
            <span className="text-xs text-slate-400">Step 2 of 3</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Staff Category Select Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-normal text-slate-700">
                Staff Type *
              </label>
              <Select value={staffType} onValueChange={(val: any) => setStaffType(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERMANENT">Permanent Staff</SelectItem>
                  <SelectItem value="CONTRACT">Contract Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-normal text-slate-700 mb-1.5">
                Station Manager Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-300 p-2.5 text-xs font-normal text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-normal text-slate-700 mb-1.5">
              Additional Notes (Optional)
            </label>
            <textarea
              rows={2}
              maxLength={300}
              placeholder="e.g., Includes authorized overtime signatures for 3 relief officers..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-300 p-3 text-xs font-normal text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none transition resize-none"
            />
          </div>

          {/* Attestation Checkbox */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={attested}
                onChange={(e) => setAttested(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
              />
              <span className="text-xs font-normal text-slate-700 leading-relaxed">
                I hereby declare and certify that the attached payroll scan/images are authentic, accurate, and physically signed by the authorized station management.
              </span>
            </label>
          </div>
        </div>

        {/* Section 3: Document Attachment Method */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-normal text-slate-900 uppercase tracking-wider">
              3. Document Scan Attachment
            </h2>
            <span className="text-xs text-slate-400">Step 3 of 3</span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setUploadMode('PDF')}
              className={`flex-1 py-2.5 text-xs font-normal rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                uploadMode === 'PDF'
                  ? 'bg-white text-emerald-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="h-4 w-4 text-emerald-700" />
              <span>Upload Single PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setUploadMode('IMAGES')}
              className={`flex-1 py-2.5 text-xs font-normal rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                uploadMode === 'IMAGES'
                  ? 'bg-white text-emerald-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="h-4 w-4 text-emerald-700" />
              <span>Add Images (Up to 12) & PDF</span>
            </button>
          </div>

          {/* Tab 1: Single PDF File Upload */}
          {uploadMode === 'PDF' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handlePdfSelect}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300/80 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 rounded-2xl p-8 text-center cursor-pointer transition space-y-3"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-normal text-slate-900">
                    Click to select PDF document or drag file here
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Official signed PDF scan up to 15MB</div>
                </div>
              </div>

              {pdfFile && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-normal text-slate-800">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="h-5 w-5 text-emerald-700 shrink-0" />
                    <div className="truncate">
                      <span className="block truncate text-slate-900">{pdfFile.name}</span>
                      <span className="text-slate-500">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPdfFile(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Multi-Image to PDF Compiler (Up to 12 images) */}
          {uploadMode === 'IMAGES' && (
            <div className="space-y-5">
              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleImageSelect}
                className="hidden"
              />

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-normal text-slate-900">
                    Image Pages Attached ({imagePages.length} of 12)
                  </span>
                  <span className="block text-xs text-slate-500">
                    Add photos/scans of document pages. They will be merged into a single PDF.
                  </span>
                </div>

                <button
                  type="button"
                  disabled={imagePages.length >= 12}
                  onClick={() => imageInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-normal transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Images</span>
                </button>
              </div>

              {imagePages.length === 0 ? (
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl p-8 text-center cursor-pointer transition space-y-2"
                >
                  <ImageIcon className="h-8 w-8 text-slate-400 mx-auto" />
                  <div className="text-xs font-normal text-slate-800">
                    No images added yet. Click to select page photos (up to 12).
                  </div>
                  <div className="text-xs text-slate-500">Supports JPG, PNG, WEBP scan photos</div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {imagePages.map((page, idx) => (
                    <div
                      key={page.id}
                      className="group relative bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden p-2 space-y-2 text-center"
                    >
                      <div className="relative aspect-[3/4] bg-white rounded-xl overflow-hidden border border-slate-200">
                        <img
                          src={page.previewUrl}
                          alt={`Page ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded-md font-normal">
                          Page {idx + 1}
                        </span>
                      </div>

                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveImageLeft(idx)}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                            title="Move Left"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === imagePages.length - 1}
                            onClick={() => moveImageRight(idx)}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                            title="Move Right"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeImagePage(page.id)}
                          className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Page"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Form Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-normal transition shadow-md flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" />
                <span>Processing & Submitting Form...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit Validation Form</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Station Submission History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-emerald-900 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 text-emerald-200 border border-emerald-700">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-normal text-white">Station Submission History</h3>
                  <p className="text-xs text-emerald-200/80">Select station branch, year, and month to check history</p>
                </div>
              </div>

              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 rounded-xl text-emerald-200 hover:bg-emerald-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-500 font-normal">Station:</label>
                <Select value={historyBranchId} onValueChange={setHistoryBranchId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500 font-normal">Year:</label>
                <Select value={historyYear} onValueChange={setHistoryYear}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Years</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500 font-normal">Month:</label>
                <Select value={historyMonth} onValueChange={setHistoryMonth}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Months</SelectItem>
                    {[
                      'Jan (1)', 'Feb (2)', 'Mar (3)', 'Apr (4)', 'May (5)', 'Jun (6)',
                      'Jul (7)', 'Aug (8)', 'Sep (9)', 'Oct (10)', 'Nov (11)', 'Dec (12)'
                    ].map((m, idx) => (
                      <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingHistory ? (
                <div className="py-12 text-center text-xs font-normal text-slate-500">
                  Loading station submission history...
                </div>
              ) : historyRecords.length === 0 ? (
                <div className="py-12 text-center text-xs font-normal text-slate-500 space-y-2">
                  <Calendar className="h-8 w-8 text-slate-400 mx-auto" />
                  <div>No submissions found matching selected filters.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyRecords.map((sub) => {
                    let parsedMeta: any = null;
                    try {
                      if (sub.note && sub.note.startsWith('{')) {
                        parsedMeta = JSON.parse(sub.note);
                      }
                    } catch (e) {}

                    return (
                      <div
                        key={sub.id}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-emerald-300 transition space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-normal text-slate-900">
                              {sub.month}/{sub.year} Cycle
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">
                              Uploaded {new Date(sub.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-normal ${
                              sub.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : sub.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {sub.status === 'APPROVED'
                              ? '✓ APPROVED'
                              : sub.status === 'PENDING'
                              ? '⏳ PENDING REVIEW'
                              : '✕ REJECTED'}
                          </span>
                        </div>

                        {/* Metadata Row */}
                        {parsedMeta && (
                          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 text-xs text-slate-700">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Staff Covered:</span>
                              <span>{parsedMeta.employeeCount} Employees</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Payroll Total:</span>
                              <span>${parseFloat(parsedMeta.payrollAmount || '0').toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Signer:</span>
                              <span className="truncate block">{parsedMeta.signerName}</span>
                            </div>
                          </div>
                        )}

                        {/* Rejection Reviewer Feedback */}
                        {sub.status === 'REJECTED' && sub.reviewerNotes && (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                            <span className="font-normal text-rose-800 block">HR Reviewer Feedback:</span>
                            <p className="italic">{sub.reviewerNotes}</p>
                          </div>
                        )}

                        {/* File Action */}
                        <div className="pt-1 flex items-center justify-between text-xs">
                          <span className="text-slate-500 truncate max-w-xs">{sub.fileName}</span>
                          <a
                            href={`/api/submissions/${sub.id}/file`}
                            download={sub.fileName}
                            className="text-emerald-700 hover:text-emerald-900 font-normal flex items-center gap-1"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download PDF</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-normal transition cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
