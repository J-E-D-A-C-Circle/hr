'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
}

export default function ViewApplicationPage() {
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchApplication();
  }, [router]);

  const fetchApplication = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost/api/applications.php?action=my-application',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setApplication(response.data.application);
    } catch (error) {
      console.error('Error fetching application:', error);
    } finally {
      setLoading(false);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Application Found</h2>
          <p className="text-gray-600 mb-4">You haven't submitted an application yet.</p>
          <Link
            href="/dashboard/apply"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Submit Application
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
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                DVLA NSS Portal
              </Link>
            </div>
            <div className="flex items-center">
              <Link
                href="/dashboard"
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
              <h2 className="text-2xl font-bold text-gray-900">My Application Details</h2>
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

            {/* Application Status */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Application Status</h3>
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
              </div>
              {application.review_notes && (
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Review Notes</span>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-900">{application.review_notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

