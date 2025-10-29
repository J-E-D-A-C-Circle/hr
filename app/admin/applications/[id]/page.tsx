'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

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
  const [reviewData, setReviewData] = useState({
    status: '',
    review_notes: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
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
        `http://localhost/api/applications.php?action=view&id=${params.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setApplication(response.data.application);
      setReviewData({
        status: response.data.application.status,
        review_notes: response.data.application.review_notes || '',
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
        'http://localhost/api/applications.php?action=review',
        {
          application_id: params.id,
          status: reviewData.status,
          review_notes: reviewData.review_notes,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchApplication();
      alert('Application reviewed successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to review application');
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Application: {application.first_name} {application.last_name}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadge(
                  application.status
                )}`}
              >
                {application.status.replace('_', ' ')}
              </span>
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
                  <p className="text-gray-900">{new Date(application.date_of_birth).toLocaleDateString()}</p>
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
                      {new Date(application.service_period_start).toLocaleDateString()} -{' '}
                      {application.service_period_end
                        ? new Date(application.service_period_end).toLocaleDateString()
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
                  <p className="text-gray-900">{new Date(application.created_at).toLocaleString()}</p>
                </div>
                {application.reviewed_at && (
                  <div>
                    <span className="text-sm text-gray-500">Reviewed At</span>
                    <p className="text-gray-900">{new Date(application.reviewed_at).toLocaleString()}</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes</label>
                  <textarea
                    value={reviewData.review_notes}
                    onChange={(e) => setReviewData({ ...reviewData, review_notes: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter review notes..."
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
    </div>
  );
}

