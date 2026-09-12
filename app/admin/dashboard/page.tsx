'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  X,
  Check,
  Building2,
  FileText,
  User,
  GraduationCap,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Printer,
  Eye,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileCheck
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import AppointmentLetterModal from '@/components/AppointmentLetterModal';
import { getValidAuthToken, getStoredUser, clearAuthSession } from '@/lib/auth-client';

import AdminSidebar, { AdminTabId } from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import OverviewTab from '@/components/admin/OverviewTab';
import ApplicationsTab from '@/components/admin/ApplicationsTab';
import PersonnelTab from '@/components/admin/PersonnelTab';
import StationsTab from '@/components/admin/StationsTab';
import AnalyticsTab from '@/components/admin/AnalyticsTab';
import AuditTab from '@/components/admin/AuditTab';
import { Application, FullApplication, Station } from '@/lib/types/admin';
import ShadcnSelect from '@/components/ui/ShadcnSelect';
import { getStoredStations, saveStoredStations } from '@/lib/stations-data';

const STATION_OPTIONS = [
  { value: 'DVLA Head Office - Cantonments', label: 'DVLA Head Office - Cantonments' },
  { value: 'Accra Regional Office - 37', label: 'Accra Regional Office - 37' },
  { value: 'Tema Regional Office', label: 'Tema Regional Office' },
  { value: 'Weija District Office', label: 'Weija District Office' },
  { value: 'Kumasi Regional Office - Adum', label: 'Kumasi Regional Office - Adum' },
  { value: 'Takoradi Regional Office', label: 'Takoradi Regional Office' },
  { value: 'Tamale Regional Office', label: 'Tamale Regional Office' },
  { value: 'Sunyani Regional Office', label: 'Sunyani Regional Office' },
  { value: 'Cape Coast Regional Office', label: 'Cape Coast Regional Office' },
];

const DEPARTMENT_OPTIONS = [
  { value: 'Driver Licensing & Training', label: 'Driver Licensing & Training' },
  { value: 'Vehicle Inspection & Registration', label: 'Vehicle Inspection & Registration' },
  { value: 'Administration & Human Resources', label: 'Administration & Human Resources' },
  { value: 'Information & Communication Tech (ICT)', label: 'Information & Communication Tech (ICT)' },
  { value: 'Finance & Accounting', label: 'Finance & Accounting' },
  { value: 'Legal & Compliance', label: 'Legal & Compliance' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [stations, setStations] = useState<Station[]>([]);

  // Modal Review States
  const [selectedApplication, setSelectedApplication] = useState<FullApplication | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingApplication, setLoadingApplication] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'profile' | 'education' | 'documents' | 'review'>('profile');

  const [reviewData, setReviewData] = useState({
    status: '',
    review_notes: '',
    posting_station: '',
    posting_department: '',
  });

  // Appointment letter generator modal
  const [isLetterGeneratorOpen, setIsLetterGeneratorOpen] = useState(false);
  const [letterApplication, setLetterApplication] = useState<any>(null);

  useEffect(() => {
    const validToken = getValidAuthToken();
    const parsedUser = getStoredUser();

    if (!validToken || !parsedUser) {
      clearAuthSession();
      router.replace('/login');
      return;
    }

    if (parsedUser.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
    setUser(parsedUser);
    setStations(getStoredStations());
    fetchApplications();
  }, [router]);

  const handleUpdateStations = (updatedList: Station[]) => {
    setStations(updatedList);
    saveStoredStations(updatedList);
  };

  const fetchApplications = async () => {
    setLoading(true);
    // 2-second maximum loading fallback safeguard
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    try {
      const token = getValidAuthToken();
      if (!token) return;
      const response = await axios.get('/api/applications/all', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 2000,
      });
      setApplications(response.data.applications || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      if (error.response?.status === 401) {
        clearAuthSession();
        router.replace('/login');
      }
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  };

  const handleSelectApplication = async (id: number) => {
    setLoadingApplication(true);
    try {
      const token = getValidAuthToken();
      const response = await axios.get(`/api/applications/view/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const app = response.data.application;
      setSelectedApplication(app);
      
      const currentStations = stations.length > 0 ? stations : getStoredStations();
      const defaultStation = app.posting_station || currentStations[0]?.name || 'DVLA Head Office - Cantonments';
      const stationObj = currentStations.find((s) => s.name === defaultStation);
      const defaultDept = app.posting_department || stationObj?.departments[0] || 'IT & Software Engineering';

      setReviewData({
        status: app.status || 'pending',
        review_notes: app.review_notes || '',
        posting_station: defaultStation,
        posting_department: defaultDept,
      });
      setActiveModalTab('profile');
      setModalOpen(true);
    } catch (error) {
      console.error('Error fetching application details:', error);
      toast.error('Failed to load application details');
    } finally {
      setLoadingApplication(false);
    }
  };

  const handleSaveReview = async (statusOverride?: string) => {
    if (!selectedApplication) return;
    const finalStatus = statusOverride || reviewData.status;

    if (finalStatus === 'approved' && (!reviewData.posting_station || !reviewData.posting_department)) {
      toast.error('Posting station and department are required for approval');
      return;
    }

    setReviewing(true);
    try {
      const token = getValidAuthToken();
      await axios.put(
        '/api/applications/review',
        {
          application_id: selectedApplication.id,
          status: finalStatus,
          review_notes: reviewData.review_notes,
          posting_station: reviewData.posting_station,
          posting_department: reviewData.posting_department,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(`Application ${finalStatus.toUpperCase()} successfully!`);
      const updatedApp = {
        ...selectedApplication,
        status: finalStatus,
        posting_station: reviewData.posting_station,
        posting_department: reviewData.posting_department,
        review_notes: reviewData.review_notes,
      };
      setSelectedApplication(updatedApp);
      setApplications((prev) =>
        prev.map((app) => (app.id === selectedApplication.id ? { ...app, ...updatedApp } : app))
      );
      fetchApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setReviewing(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject', ids: number[]) => {
    const defaultStation = 'DVLA Head Office - Cantonments';
    const defaultDept = 'Administration & HR';

    toast.loading(`Processing bulk ${action}...`);
    try {
      const token = getValidAuthToken();
      await Promise.all(
        ids.map((id) =>
          axios.put(
            '/api/applications/review',
            {
              application_id: id,
              status: action === 'approve' ? 'approved' : 'rejected',
              posting_station: action === 'approve' ? defaultStation : null,
              posting_department: action === 'approve' ? defaultDept : null,
              review_notes: `Bulk ${action} by Admin`,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );
      toast.dismiss();
      toast.success(`Successfully updated ${ids.length} applications`);
      fetchApplications();
    } catch (err: any) {
      toast.dismiss();
      toast.error('Failed processing bulk actions');
    }
  };

  const handleExportCSV = (items: Application[]) => {
    if (items.length === 0) {
      toast.error('No items to export');
      return;
    }
    const headers = ['ID', 'NSS Number', 'Full Name', 'Email', 'Status', 'Region', 'Posting Station', 'Posting Department', 'Date'];
    const rows = items.map((a) => [
      a.id,
      a.nss_number || '',
      `"${a.first_name} ${a.middle_name || ''} ${a.last_name}"`,
      a.email,
      a.status,
      a.region || '',
      `"${a.posting_station || ''}"`,
      `"${a.posting_department || ''}"`,
      a.created_at,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DVLA_NSS_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report exported successfully');
  };

  const handleLogout = () => {
    clearAuthSession();
    toast.success('Logged out successfully');
    router.replace('/login');
  };

  // Station Stats Calculation
  const stationCounts: Record<string, number> = {};
  applications
    .filter((a) => a.status === 'approved' && a.posting_station)
    .forEach((a) => {
      stationCounts[a.posting_station!] = (stationCounts[a.posting_station!] || 0) + 1;
    });

  const stationStats = Object.entries(stationCounts).map(([station, count]) => ({
    station,
    count,
  }));

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const approvedCount = applications.filter((a) => a.status === 'approved').length;

  const tabTitles: Record<AdminTabId, { title: string; subtitle: string }> = {
    overview: { title: 'Overview', subtitle: 'Executive overview & personnel placement status' },
    applications: { title: 'Applications Desk', subtitle: 'Manage, search, filter, and review intake submissions' },
    personnel: { title: 'Personnel Roster', subtitle: 'Directory of approved and assigned NSS personnel' },
    stations: { title: 'Station & Placement Hub', subtitle: 'DVLA station headcounts and capacity metrics' },
    analytics: { title: 'Analytics & Intelligence', subtitle: 'Demographic reports and status breakdown charts' },
    audit: { title: 'Audit & Activity Logs', subtitle: 'Timestamped administrative history trail' },
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Collapsible Modern Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        pendingCount={pendingCount}
        totalPersonnelCount={approvedCount}
        user={user}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminHeader
          activeTabTitle={tabTitles[activeTab].title}
          activeTabSubtitle={tabTitles[activeTab].subtitle}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onRefresh={fetchApplications}
          loading={loading}
          totalApplications={applications.length}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          mobileSidebarOpen={mobileSidebarOpen}
        />

        {/* Tab View Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50">
          {activeTab === 'overview' && (
            <OverviewTab
              applications={applications}
              onNavigateTab={setActiveTab}
              onSelectApplication={handleSelectApplication}
              stationStats={stationStats}
            />
          )}

          {activeTab === 'applications' && (
            <ApplicationsTab
              applications={applications}
              onSelectApplication={handleSelectApplication}
              onBulkAction={handleBulkAction}
              onExportCSV={handleExportCSV}
              loading={loading}
            />
          )}

          {activeTab === 'personnel' && (
            <PersonnelTab
              applications={applications}
              onSelectApplication={handleSelectApplication}
              onExportCSV={handleExportCSV}
            />
          )}

          {activeTab === 'stations' && (
            <StationsTab
              stations={stations}
              applications={applications}
              onNavigateTab={setActiveTab}
              onUpdateStations={handleUpdateStations}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab applications={applications} onExportCSV={handleExportCSV} />
          )}

          {activeTab === 'audit' && <AuditTab />}
        </main>
      </div>

      {/* Modern Slide-over Review Modal Drawer */}
      {modalOpen && selectedApplication && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in-up">
          <div className="w-full max-w-3xl h-full bg-white border-l border-slate-200 flex flex-col shadow-2xl overflow-hidden animate-slide-in-right">
            {/* Modal Drawer Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0d5c2e] to-emerald-700 flex items-center justify-center font-black text-white shadow">
                  {(selectedApplication.first_name || 'A').charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {selectedApplication.first_name} {selectedApplication.middle_name || ''} {selectedApplication.last_name}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      selectedApplication.status === 'approved'
                        ? 'bg-emerald-100 text-[#0d5c2e] border-emerald-300'
                        : selectedApplication.status === 'rejected'
                        ? 'bg-rose-100 text-rose-700 border-rose-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {selectedApplication.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#0d5c2e] font-extrabold">{selectedApplication.nss_number}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedApplication.status === 'approved' && (
                  <button
                    onClick={() => {
                      setLetterApplication(selectedApplication);
                      setIsLetterGeneratorOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d5c2e] hover:bg-emerald-800 text-white text-xs font-bold shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Letter
                  </button>
                )}
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-tabs in Review Drawer */}
            <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 border-b border-slate-200 text-xs font-extrabold">
              <button
                onClick={() => setActiveModalTab('profile')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeModalTab === 'profile' ? 'bg-[#0d5c2e] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                Personal Details
              </button>
              <button
                onClick={() => setActiveModalTab('education')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeModalTab === 'education' ? 'bg-[#0d5c2e] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                Education & Assignment
              </button>
              <button
                onClick={() => setActiveModalTab('documents')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeModalTab === 'documents' ? 'bg-[#0d5c2e] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                Attached Documents
              </button>
              <button
                onClick={() => setActiveModalTab('review')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeModalTab === 'review' ? 'bg-[#0d5c2e] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                Admin Review Decision
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs text-slate-700 font-medium">
              {activeModalTab === 'profile' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#0d5c2e]" /> Personal Dossier
                  </h4>
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-slate-500 block font-medium">Full Name</span>
                      <span className="font-bold text-slate-900">
                        {selectedApplication.first_name} {selectedApplication.middle_name || ''} {selectedApplication.last_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">NSS Number</span>
                      <span className="font-mono font-bold text-[#0d5c2e]">{selectedApplication.nss_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Email Address</span>
                      <span className="font-semibold text-slate-800">{selectedApplication.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Phone Number</span>
                      <span className="font-semibold text-slate-800">{selectedApplication.phone_number || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Gender</span>
                      <span className="font-semibold text-slate-800">{selectedApplication.gender || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Residential Address</span>
                      <span className="font-semibold text-slate-800">{selectedApplication.residential_address || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'education' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#0d5c2e]" /> Educational Background
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div>
                      <span className="text-slate-500 block font-medium">Institution</span>
                      <span className="font-bold text-slate-900">{selectedApplication.institution_name || 'University of Ghana'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Course / Program</span>
                      <span className="font-semibold text-slate-800">{selectedApplication.course_program || 'BSc Computer Science'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Completion Year</span>
                      <span className="font-mono font-bold text-slate-700">{selectedApplication.year_of_completion || 2026}</span>
                    </div>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pt-2">
                    <Building2 className="w-4 h-4 text-[#0d5c2e]" /> Posting & Station Assignment
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div>
                      <span className="text-slate-500 block font-medium">Assigned Station</span>
                      <span className="font-bold text-[#0d5c2e]">{selectedApplication.posting_station || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Assigned Department</span>
                      <span className="font-semibold text-slate-800">{selectedApplication.posting_department || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'documents' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0d5c2e]" /> Attached Application Files
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Passport Photo */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div>
                        <span className="font-extrabold text-slate-900 block mb-1">Passport Photograph</span>
                        <span className="text-slate-500 text-[11px] block font-medium">Verified Image</span>
                      </div>
                      {selectedApplication.passport_photo ? (
                        <a
                          href={`/uploads/${selectedApplication.passport_photo}`}
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
                      {selectedApplication.id_card_copy ? (
                        <a
                          href={`/uploads/${selectedApplication.id_card_copy}`}
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
                  </div>
                </div>
              )}

              {activeModalTab === 'review' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#0d5c2e]" /> Admin Approval Form
                  </h4>

                  <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Posting Station *</label>
                      <ShadcnSelect
                        options={stations.map((s) => ({ value: s.name, label: s.name }))}
                        value={reviewData.posting_station}
                        onChange={(val) => {
                          const targetStation = stations.find((s) => s.name === val);
                          const firstDept = targetStation?.departments[0] || '';
                          setReviewData({
                            ...reviewData,
                            posting_station: val,
                            posting_department: targetStation?.departments.includes(reviewData.posting_department)
                              ? reviewData.posting_department
                              : firstDept
                          });
                        }}
                        placeholder="Select Station..."
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Department (Filtered by Station) *</label>
                      <ShadcnSelect
                        options={
                          stations.find((s) => s.name === reviewData.posting_station)?.departments.map((d) => ({
                            value: d,
                            label: d
                          })) || []
                        }
                        value={reviewData.posting_department}
                        onChange={(val) => setReviewData({ ...reviewData, posting_department: val })}
                        placeholder="Select Station Department..."
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Review Notes / Remarks</label>
                      <textarea
                        rows={3}
                        value={reviewData.review_notes}
                        onChange={(e) => setReviewData({ ...reviewData, review_notes: e.target.value })}
                        placeholder="Add review remarks or internal notes..."
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#0d5c2e]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Drawer Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700"
              >
                Close Drawer
              </button>

              <div className="flex items-center gap-2">
                {selectedApplication.status === 'rejected' ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2 rounded-xl bg-rose-100 text-rose-800 border border-rose-300 text-xs font-extrabold flex items-center gap-1.5">
                      <X className="w-4 h-4 text-rose-600" /> Currently Rejected
                    </span>
                    <button
                      onClick={() => handleSaveReview('approved')}
                      disabled={reviewing}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0d5c2e] hover:bg-emerald-800 text-white text-xs font-extrabold shadow-xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Change to Approved
                    </button>
                  </div>
                ) : selectedApplication.status === 'approved' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveReview('rejected')}
                      disabled={reviewing}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Change to Rejected
                    </button>
                    <span className="px-3.5 py-2.5 rounded-xl bg-emerald-100 text-[#0d5c2e] border border-emerald-300 text-xs font-extrabold flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-[#0d5c2e]" /> Posted & Approved
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveReview('rejected')}
                      disabled={reviewing}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                    <button
                      onClick={() => handleSaveReview('approved')}
                      disabled={reviewing}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0d5c2e] hover:bg-emerald-800 text-white text-xs font-extrabold shadow-xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Approve & Post
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Appointment Letter Modal */}
      {isLetterGeneratorOpen && letterApplication && (
        <AppointmentLetterModal
          isOpen={isLetterGeneratorOpen}
          onClose={() => setIsLetterGeneratorOpen(false)}
          application={letterApplication}
        />
      )}
    </div>
  );
}
