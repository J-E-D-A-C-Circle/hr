'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDate, formatDateTime } from '@/lib/utils';
import { FileText, Eye, Trash2, Loader2, AlertCircle } from 'lucide-react';
import AppointmentLetterModal from '@/components/AppointmentLetterModal';
import { getValidAuthToken, getStoredUser, clearAuthSession } from '@/lib/auth-client';
import { getFileViewUrl } from '@/lib/file-upload';

interface Application {
  id: number;
  nss_number: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  phone_number: string;
  email: string;
  residential_address: string;
  region: string;
  district: string;
  institution_name: string;
  course_program: string;
  year_of_completion: number;
  posting_region: string;
  posting_district: string;
  service_year: number;
  service_period_start: string;
  service_period_end: string;
  status: string;
  passport_photo?: string;
  id_card_copy?: string;
  appointment_letter?: string;
  certificates?: string;
  review_notes: string;
  created_at: string;
  reviewed_at: string;
  user_name: string;
  reviewer_name: string;
}

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const FIXED_SERVICE_PERIOD_START = '2026-11-02';
  const FIXED_SERVICE_PERIOD_END = '2027-10-29';

  const [reviewData, setReviewData] = useState({
    status: '',
    review_notes: '',
    service_period_start: FIXED_SERVICE_PERIOD_START,
    service_period_end: FIXED_SERVICE_PERIOD_END,
  });

  const handleDelete = async () => {
    if (!application) return;
    setIsDeleting(true);
    try {
      const token = getValidAuthToken();
      await axios.delete(`/api/applications/${application.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Applicant and associated files deleted successfully');
      router.push('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete applicant');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  useEffect(() => {
    const token = getValidAuthToken();
    const user = getStoredUser();

    if (!token || !user) {
      clearAuthSession();
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    fetchApplication();
  }, [router, params.id]);

  const fetchApplication = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/applications/view/${params.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const app = response.data.application;
      setApplication(app);
      setReviewData({
        status: app.status,
        review_notes: app.review_notes || '',
        service_period_start: FIXED_SERVICE_PERIOD_START,
        service_period_end: FIXED_SERVICE_PERIOD_END,
      });
    } catch (error) {
      console.error('Error fetching application:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewing(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        '/api/applications/review',
        {
          application_id: params.id,
          status: reviewData.status,
          review_notes: reviewData.review_notes,
          service_period_start: FIXED_SERVICE_PERIOD_START,
          service_period_end: FIXED_SERVICE_PERIOD_END,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchApplication();
      toast.success('Application reviewed successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to review application');
    } finally {
      setReviewing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Not Found</h2>
          <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="text-xl font-bold text-gray-900">
                DVLA NSS Portal - Admin
              </Link>
            </div>
            <div className="flex items-center">
              <Link
                href="/admin/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6 md:p-8">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Application: {application.first_name} {application.last_name}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">NSS Pin: {application.nss_number || 'N/A'}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsLetterModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F5132] text-white text-xs font-bold rounded-xl shadow hover:bg-[#0B3D26] transition cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Generate Appointment Letter</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  title="Delete Applicant"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadge(
                    application.status
                  )}`}
                >
                  {application.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Personal Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Full Name</span>
                  <p className="text-gray-900 font-medium">
                    {application.first_name} {application.middle_name} {application.last_name}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">NSS Number</span>
                  <p className="text-gray-900">{application.nss_number || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Date of Birth</span>
                  <p className="text-gray-900">{formatDate(application.date_of_birth)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Gender</span>
                  <p className="text-gray-900">{application.gender}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Nationality</span>
                  <p className="text-gray-900">{application.nationality}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Phone Number</span>
                  <p className="text-gray-900">{application.phone_number}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email</span>
                  <p className="text-gray-900">{application.email}</p>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Address Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Residential Address</span>
                  <p className="text-gray-900">{application.residential_address}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Region</span>
                    <p className="text-gray-900">{application.region}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">District</span>
                    <p className="text-gray-900">{application.district}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Educational Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Educational Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Institution Name</span>
                  <p className="text-gray-900">{application.institution_name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Course/Program</span>
                  <p className="text-gray-900">{application.course_program}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Year of Completion</span>
                  <p className="text-gray-900">{application.year_of_completion}</p>
                </div>
              </div>
            </div>

            {/* NSS Assignment Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">NSS Assignment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Service Year</span>
                  <p className="text-gray-900">{application.service_year}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Posting Region</span>
                  <p className="text-gray-900">{application.posting_region || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Posting District</span>
                  <p className="text-gray-900">{application.posting_district || 'N/A'}</p>
                </div>
                {application.service_period_start && (
                  <div>
                    <span className="text-sm text-gray-500">Service Period</span>
                    <p className="text-gray-900">
                      {formatDate(application.service_period_start)} -{' '}
                      {application.service_period_end
                        ? formatDate(application.service_period_end)
                        : 'Ongoing'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Application Metadata */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Application Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Submitted</span>
                  <p className="text-gray-900">{formatDateTime(application.created_at)}</p>
                </div>
                {application.reviewed_at && (
                  <div>
                    <span className="text-sm text-gray-500">Reviewed At</span>
                    <p className="text-gray-900">{formatDateTime(application.reviewed_at)}</p>
                  </div>
                )}
                {application.reviewer_name && (
                  <div>
                    <span className="text-sm text-gray-500">Reviewed By</span>
                    <p className="text-gray-900">{application.reviewer_name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Attached Documents */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Attached Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Passport Photo */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 block mb-1">Passport Photograph</span>
                    <span className="text-slate-500 text-[11px] block font-medium">Verified Image</span>
                  </div>
                  {application.passport_photo ? (
                    <a
                      href={getFileViewUrl(application.passport_photo)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0d5c2e] text-xs font-bold border border-slate-200"
                    >
                      <Eye className="w-4 h-4" /> View Passport Photo
                    </a>
                  ) : (
                    <span className="mt-4 text-slate-400 italic text-[11px] font-medium">No photo uploaded</span>
                  )}
                </div>

                {/* ID Card Copy */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 block mb-1">National ID Card</span>
                    <span className="text-slate-500 text-[11px] block font-medium">Ghana Card Copy</span>
                  </div>
                  {application.id_card_copy ? (
                    <a
                      href={getFileViewUrl(application.id_card_copy)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0d5c2e] text-xs font-bold border border-slate-200"
                    >
                      <Eye className="w-4 h-4" /> View Ghana Card
                    </a>
                  ) : (
                    <span className="mt-4 text-slate-400 italic text-[11px] font-medium">No ID uploaded</span>
                  )}
                </div>
                
                {/* Appointment Letter */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 block mb-1">Appointment Letter</span>
                    <span className="text-slate-500 text-[11px] block font-medium">Official DVLA Document</span>
                  </div>
                  {application.appointment_letter ? (
                    <a
                      href={getFileViewUrl(application.appointment_letter)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0d5c2e] text-xs font-bold border border-slate-200"
                    >
                      <Eye className="w-4 h-4" /> View Appointment Letter
                    </a>
                  ) : (
                    <span className="mt-4 text-slate-400 italic text-[11px] font-medium">No letter uploaded</span>
                  )}
                </div>

                {/* CV / Certificates */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 block mb-1">CV / Certificates</span>
                    <span className="text-slate-500 text-[11px] block font-medium">Additional Academic Records</span>
                  </div>
                  {application.certificates ? (
                    <a
                      href={getFileViewUrl(application.certificates)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0d5c2e] text-xs font-bold border border-slate-200"
                    >
                      <Eye className="w-4 h-4" /> View Certificates
                    </a>
                  ) : (
                    <span className="mt-4 text-slate-400 italic text-[11px] font-medium">No CV uploaded</span>
                  )}
                </div>
              </div>
            </div>

            {/* Review Form */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Application</h3>
              <form onSubmit={handleReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reviewData.status}
                    onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective / Start Date (Assumption of Duty)</label>
                  <input
                    type="date"
                    value={FIXED_SERVICE_PERIOD_START}
                    readOnly
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-slate-100 text-slate-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={FIXED_SERVICE_PERIOD_END}
                    readOnly
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-slate-100 text-slate-700 cursor-not-allowed"
                  />
                </div>
                <button
                  type="submit"
                  disabled={reviewing}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {reviewing ? 'Processing...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Appointment Letter Generator Modal */}
      {application && (
        <AppointmentLetterModal
          isOpen={isLetterModalOpen}
          onClose={() => setIsLetterModalOpen(false)}
          application={application}
        />
      )}

      {/* Confirmation Modal: Delete Applicant */}
      {showDeleteConfirm && application && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Applicant</h3>
                <p className="text-xs text-slate-500">Permanent data and file cleanup</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p>
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900">
                  {application.first_name} {application.last_name}
                </strong>{' '}
                ({application.nss_number || application.email})?
              </p>
              <div className="p-2.5 bg-rose-50/70 rounded-lg border border-rose-200 text-rose-800 font-medium space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  What will be deleted:
                </p>
                <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5 ml-1">
                  <li>Applicant database record and account</li>
                  <li>All uploaded files (Passport photo, ID, Appointment letter, Certificates/CV)</li>
                  <li>Associated placement & review data</li>
                </ul>
              </div>
              <p className="text-slate-500 italic text-[11px]">This action cannot be undone.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

