'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import { LogOut, Home, Users, FileText, X, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Check, X as XIcon, Search, Download, ArrowUpDown, Filter, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';

interface Application {
  id: number;
  user_id: number;
  nss_number: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  user_name: string;
  region?: string;
  district?: string;
  posting_district?: string;
  posting_station?: string;
}

interface FullApplication extends Application {
  date_of_birth: string;
  gender: string;
  nationality: string;
  phone_number: string;
  residential_address: string;
  region: string;
  district: string;
  institution_name: string;
  course_program: string;
  year_of_completion: number;
  posting_region: string;
  posting_district: string;
  posting_station: string;
  posting_department: string;
  service_year: number;
  service_period_start: string;
  service_period_end: string;
  passport_photo: string;
  id_card_copy: string;
  appointment_letter: string;
  certificates: string;
  review_notes: string;
  reviewer_name: string;
}

interface StationStats {
  station: string;
  count: number;
}

const NAV = [
  { label: 'Dashboard', active: true },
  { label: 'Analytics and Reports', active: false },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<FullApplication | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingApplication, setLoadingApplication] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: '',
    review_notes: '',
    posting_station: '',
    posting_department: '',
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  
  // New state for enhanced features
  const [activeView, setActiveView] = useState<'dashboard' | 'analytics'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    region: '',
    district: '',
  });

  useEffect(() => {
    // Check if we have an active session
    // If not, this is a new tab - clear auth and redirect to login
    const hasActiveSession = sessionStorage.getItem('active_session');
    
    if (!hasActiveSession) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.replace('/login');
      return;
    }

    // Clear session when tab is closed
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('active_session');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.replace('/login');
      return;
    }

    const parsedUser = JSON.parse(userStr);
    if (parsedUser.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchApplications();

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [router]);

  const [allApplications, setAllApplications] = useState<Application[]>([]);

  const fetchApplications = async (status?: string) => {
    try {
      const token = localStorage.getItem('token');
      const url = status && status !== 'all'
        ? `http://localhost/api/applications.php?action=all&status=${status}`
        : 'http://localhost/api/applications.php?action=all';
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedApplications = response.data.applications || [];
      setAllApplications(fetchedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(filter !== 'all' ? filter : undefined);
  }, [filter]);

  // Filter, search, sort, and paginate applications
  const getFilteredApplications = () => {
    let filtered = [...allApplications];

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(app => app.status === filter);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        `${app.first_name} ${app.last_name}`.toLowerCase().includes(query) ||
        app.email.toLowerCase().includes(query) ||
        (app.nss_number && app.nss_number.toLowerCase().includes(query))
      );
    }

    // Apply advanced filters
    if (advancedFilters.dateFrom) {
      filtered = filtered.filter(app => 
        new Date(app.created_at) >= new Date(advancedFilters.dateFrom)
      );
    }
    if (advancedFilters.dateTo) {
      filtered = filtered.filter(app => 
        new Date(app.created_at) <= new Date(advancedFilters.dateTo + 'T23:59:59')
      );
    }
    if (advancedFilters.region) {
      filtered = filtered.filter(app => 
        app.region?.toLowerCase().includes(advancedFilters.region.toLowerCase())
      );
    }
    if (advancedFilters.district) {
      filtered = filtered.filter(app => 
        (app.district?.toLowerCase().includes(advancedFilters.district.toLowerCase()) ||
         app.posting_district?.toLowerCase().includes(advancedFilters.district.toLowerCase()))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof Application];
      const bValue = b[sortField as keyof Application];
      
      if (sortField === 'created_at') {
        const aDate = new Date(aValue as string).getTime();
        const bDate = new Date(bValue as string).getTime();
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });

    return filtered;
  };

  const filteredApplications = getFilteredApplications();
  
  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, advancedFilters, sortField, sortDirection]);

  const handleViewApplication = async (id: number) => {
    setLoadingApplication(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost/api/applications.php?action=view&id=${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSelectedApplication(response.data.application);
      setReviewData({
        status: response.data.application.status,
        review_notes: response.data.application.review_notes || '',
        posting_station: response.data.application.posting_station || '',
        posting_department: response.data.application.posting_department || '',
      });
      setModalOpen(true);
    } catch (error) {
      console.error('Error fetching application:', error);
      alert('Failed to load application details');
    } finally {
      setLoadingApplication(false);
    }
  };

  const handleReview = async (status: string, applicationId?: number) => {
    const targetApplication = applicationId 
      ? allApplications.find(app => app.id === applicationId)
      : selectedApplication;
    
    if (!targetApplication) return;
    
    if (status === 'approved' && (!reviewData.posting_station || !reviewData.posting_department)) {
      setNotification({
        type: 'error',
        message: 'Please provide posting station and department for approval'
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setReviewing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost/api/applications.php?action=review',
        {
          application_id: targetApplication.id,
          status: status,
          review_notes: reviewData.review_notes,
          posting_station: reviewData.posting_station,
          posting_department: reviewData.posting_department,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!applicationId) {
        setModalOpen(false);
      }
      
      // Remove from selected if bulk action
      if (applicationId) {
        setSelectedApplications(prev => prev.filter(id => id !== applicationId));
      }
      
      fetchApplications(filter !== 'all' ? filter : undefined);
      setNotification({
        type: 'success',
        message: `Application ${status === 'approved' ? 'approved' : 'rejected'} successfully!`
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (error: any) {
      console.error('Error reviewing application:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to review application'
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setReviewing(false);
    }
  };

  const handleBulkAction = async (status: string) => {
    if (selectedApplications.length === 0) {
      setNotification({
        type: 'error',
        message: 'Please select at least one application'
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    if (status === 'approved' && (!reviewData.posting_station || !reviewData.posting_department)) {
      setNotification({
        type: 'error',
        message: 'Please provide posting station and department for approval'
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setReviewing(true);
    try {
      const token = localStorage.getItem('token');
      const promises = selectedApplications.map(id => 
        axios.put(
          'http://localhost/api/applications.php?action=review',
          {
            application_id: id,
            status: status,
            review_notes: reviewData.review_notes,
            posting_station: reviewData.posting_station,
            posting_department: reviewData.posting_department,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
      );

      await Promise.all(promises);
      setSelectedApplications([]);
      fetchApplications(filter !== 'all' ? filter : undefined);
      setNotification({
        type: 'success',
        message: `${selectedApplications.length} application(s) ${status === 'approved' ? 'approved' : 'rejected'} successfully!`
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (error: any) {
      console.error('Error in bulk review:', error);
      setNotification({
        type: 'error',
        message: 'Failed to process bulk action. Some applications may have been updated.'
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setReviewing(false);
    }
  };

  const handleExportCSV = () => {
    const csvData = filteredApplications.map(app => ({
      'ID': app.id,
      'Name': `${app.first_name} ${app.last_name}`,
      'Email': app.email,
      'NSS Number': app.nss_number || 'N/A',
      'Status': app.status,
      'Submitted': new Date(app.created_at).toLocaleDateString(),
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `applications_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification({
      type: 'success',
      message: `Exported ${csvData.length} applications to CSV`
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
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

  const statusCounts = {
      all: allApplications.length,
    pending: allApplications.filter(app => app.status === 'pending').length,
    approved: allApplications.filter(app => app.status === 'approved').length,
    rejected: allApplications.filter(app => app.status === 'rejected').length,
  };

  // Calculate station statistics
  const getStationStats = (): StationStats[] => {
    const stationMap = new Map<string, number>();
    
    allApplications.forEach(app => {
      // Check both posting_station from the API and from FullApplication type
      const station = app.posting_station || (app as any).posting_station || 'Not Assigned';
      if (station && station !== '' && station !== '0' && station !== 'N/A' && station !== 'Not Assigned') {
        stationMap.set(station, (stationMap.get(station) || 0) + 1);
      }
    });
    
    // If no stations found, add a placeholder
    if (stationMap.size === 0) {
      return [];
    }
    
    return Array.from(stationMap.entries())
      .map(([station, count]) => ({ station, count }))
      .sort((a, b) => b.count - a.count);
  };

  const stationStats = getStationStats();

  const userDisplayName = user?.full_name || 'Admin';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-16 md:top-4 right-2 md:right-4 z-[10000] flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 rounded-xl shadow-2xl transform transition-all duration-300 max-w-sm ${
          notification.type === 'success' 
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' 
            : notification.type === 'error'
            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
        }`}>
          <div className="flex items-center gap-2 md:gap-3 flex-1">
            {notification.type === 'success' && (
              <div className="bg-white/20 rounded-full p-1 md:p-1.5 flex-shrink-0">
                <Check className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            )}
            {notification.type === 'error' && (
              <div className="bg-white/20 rounded-full p-1 md:p-1.5 flex-shrink-0">
                <XIcon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            )}
            <p className="font-semibold text-xs md:text-sm lg:text-base">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-white/80 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#22c55e] to-[#16a34a] shadow-lg border-b border-white/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Image 
              src="/oop.png" 
              width={40} 
              height={40} 
              alt="DVLA Logo" 
              className="rounded-full bg-white/90 p-1 shadow-md ring-2 ring-white/50" 
            />
            <div>
              <h2 className="text-white font-bold text-sm leading-tight">Admin Dashboard</h2>
              <p className="text-white/90 text-xs mt-0.5">{userDisplayName.split(' ')[0]}</p>
            </div>
          </div>
              <button
                onClick={handleLogout}
            className="flex items-center gap-1.5 text-white bg-red-500/90 hover:bg-red-600 active:bg-red-700 px-3 py-2 rounded-lg font-semibold transition-all duration-200 shadow-md active:scale-95"
              >
            <LogOut className="w-4 h-4" /> 
            <span className="text-xs">Sign Out</span>
              </button>
            </div>
          </div>

      {/* Sidebar */}
      <div className="hidden md:flex flex-col min-h-screen w-64 bg-gradient-to-b from-[#22c55e] to-[#16a34a] shadow-xl">
        <div className="pt-8 pb-6 px-7 flex flex-col items-center border-b border-white/20">
          <div className="relative mb-5">
            <Image 
              src="/oop.png" 
              width={64} 
              height={64} 
              alt="DVLA Logo" 
              className="rounded-full bg-white/90 p-2 shadow-lg ring-2 ring-white/50" 
            />
          </div>
          <h2 className="text-white font-bold text-lg tracking-wide">Admin Portal</h2>
        </div>
        <nav className="flex-1 flex flex-col gap-2 px-4 py-6">
          <div
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center font-medium text-base rounded-lg px-4 py-3 cursor-pointer transition-all duration-200 select-none 
              ${activeView === 'dashboard'
                ? 'bg-white/25 text-white shadow-md backdrop-blur-sm' 
                : 'text-white/95 hover:bg-white/15 hover:text-white'}`}
          >
            <span className="mr-3">
              <Home className="w-5 h-5" />
            </span>
            <span>Dashboard</span>
          </div>
          <div
            onClick={() => setActiveView('analytics')}
            className={`flex items-center font-medium text-base rounded-lg px-4 py-3 cursor-pointer transition-all duration-200 select-none 
              ${activeView === 'analytics'
                ? 'bg-white/25 text-white shadow-md backdrop-blur-sm' 
                : 'text-white/95 hover:bg-white/15 hover:text-white'}`}
          >
            <span className="mr-3">
              <BarChart3 className="w-5 h-5" />
            </span>
            <span>Analytics and Reports</span>
        </div>
      </nav>
        <div className="mt-auto mb-6 px-4 pt-4 border-t border-white/20">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 text-white bg-red-500/90 hover:bg-red-600 px-4 py-3 rounded-lg w-full font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
          >
            <LogOut className="w-5 h-5" /> 
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen px-4 md:px-0 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl w-full mx-auto py-10 md:py-10 pt-20 md:pt-10 px-0 md:px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
                  Welcome, {userDisplayName}
                </h1>
                <p className="text-lg md:text-xl text-gray-600">
                  {activeView === 'dashboard' 
                    ? 'Administrative dashboard for managing NSS applications.' 
                    : 'Analytics and reports for NSS applications and station assignments.'}
                </p>
            </div>
              <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-md">
                <div className="rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-bold w-10 h-10 flex items-center justify-center shadow-sm">
                  {userDisplayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
                <span className="text-gray-800 font-semibold text-sm">{userDisplayName}</span>
            </div>
            </div>

            {/* Stats Cards - Only show in Dashboard view */}
            {activeView === 'dashboard' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6">
                <div className="group bg-gradient-to-br from-slate-50 to-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-4 md:p-5 border border-gray-100 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <div className="p-1.5 md:p-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                      <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
            </div>
                  </div>
                  <div className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total</div>
                  <div className="text-2xl md:text-3xl font-extrabold text-gray-900">{statusCounts.all}</div>
          </div>

                <div className="group bg-gradient-to-br from-amber-50 to-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-4 md:p-5 border border-amber-100 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <div className="p-1.5 md:p-2 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                      <Clock className="w-4 h-4 md:w-5 md:h-5 text-amber-700" />
                    </div>
                  </div>
                  <div className="text-[10px] md:text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Pending</div>
                  <div className="text-2xl md:text-3xl font-extrabold text-amber-600">{statusCounts.pending}</div>
                </div>
                
                <div className="group bg-gradient-to-br from-emerald-50 to-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-4 md:p-5 border border-emerald-100 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <div className="p-1.5 md:p-2 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-700" />
                    </div>
                  </div>
                  <div className="text-[10px] md:text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Approved</div>
                  <div className="text-2xl md:text-3xl font-extrabold text-emerald-600">{statusCounts.approved}</div>
                </div>
                
                <div className="group bg-gradient-to-br from-red-50 to-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-4 md:p-5 border border-red-100 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <div className="p-1.5 md:p-2 bg-gradient-to-br from-red-100 to-red-200 rounded-lg">
                      <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-700" />
                    </div>
                  </div>
                  <div className="text-[10px] md:text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Rejected</div>
                  <div className="text-2xl md:text-3xl font-extrabold text-red-600">{statusCounts.rejected}</div>
                </div>
              </div>
            )}
          </div>

          {/* Analytics and Reports View */}
          {activeView === 'analytics' ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                      <Users className="w-5 h-5 text-blue-700" />
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Total Applicants</div>
                  <div className="text-2xl font-extrabold text-blue-900">{statusCounts.all}</div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl shadow-lg p-4 border border-amber-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                      <Clock className="w-5 h-5 text-amber-700" />
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Pending</div>
                  <div className="text-2xl font-extrabold text-amber-900">{statusCounts.pending}</div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl shadow-lg p-4 border border-emerald-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-emerald-700" />
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Approved</div>
                  <div className="text-2xl font-extrabold text-emerald-900">{statusCounts.approved}</div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-white rounded-xl shadow-lg p-4 border border-red-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-gradient-to-br from-red-100 to-red-200 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-700" />
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Rejected</div>
                  <div className="text-2xl font-extrabold text-red-900">{statusCounts.rejected}</div>
                </div>
              </div>

              {/* Station Statistics */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-[#16a34a]" />
                    Applicants by Station
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Distribution of applicants across various posting stations</p>
                </div>
                <div className="p-6">
                  {stationStats.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No station assignments found</p>
                      <p className="text-gray-400 text-sm mt-2">Assign applicants to stations to see statistics here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stationStats.map((stat, index) => {
                        const percentage = statusCounts.all > 0 ? (stat.count / statusCounts.all) * 100 : 0;
                        return (
                          <div key={stat.station} className="group">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#16a34a] to-[#15803d] flex items-center justify-center text-white font-bold shadow-sm">
                                  {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 truncate">{stat.station}</h3>
                                  <p className="text-sm text-gray-500">{stat.count} applicant{stat.count !== 1 ? 's' : ''}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-[#16a34a]">{stat.count}</div>
                                  <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                                </div>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-[#16a34a] to-[#22c55e] h-full rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    Pending Applications
                  </h3>
                  <div className="text-4xl font-extrabold text-amber-600 mb-2">{statusCounts.pending}</div>
                  <p className="text-sm text-gray-500">Applications awaiting review</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Approval Rate
                  </h3>
                  <div className="text-4xl font-extrabold text-blue-600 mb-2">
                    {statusCounts.all > 0 
                      ? ((statusCounts.approved / statusCounts.all) * 100).toFixed(1)
                      : '0.0'}%
                  </div>
                  <p className="text-sm text-gray-500">Percentage of approved applications</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Search and Filters Bar */}
          <div className="bg-white rounded-xl shadow-md mb-4 border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or NSS number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a34a] focus:border-transparent text-sm"
                />
              </div>
              
              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>

              {/* Export Button */}
              <button
                onClick={handleExportCSV}
                disabled={filteredApplications.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white rounded-lg hover:bg-[#15803d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date From</label>
                  <input
                    type="date"
                    value={advancedFilters.dateFrom}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, dateFrom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date To</label>
                  <input
                    type="date"
                    value={advancedFilters.dateTo}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, dateTo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Region</label>
                  <input
                    type="text"
                    placeholder="Filter by region..."
                    value={advancedFilters.region}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, region: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setAdvancedFilters({dateFrom: '', dateTo: '', region: '', district: ''})}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Filter Tabs and Bulk Actions */}
          <div className="bg-white rounded-xl shadow-md mb-6 border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <nav className="flex -mb-px bg-gradient-to-r from-gray-50 to-white overflow-x-auto">
                {['all', 'pending', 'approved', 'rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`relative px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                      filter === status
                        ? 'text-[#16a34a] bg-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {status.replace('_', ' ').toUpperCase()}
                    {filter === status && (
                      <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#16a34a] to-[#15803d] rounded-t-full"></span>
                    )}
                  </button>
                ))}
              </nav>
              
              {/* Bulk Actions */}
              {selectedApplications.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{selectedApplications.length} selected</span>
                  <button
                    onClick={() => handleBulkAction('approved')}
                    disabled={reviewing || !reviewData.posting_station || !reviewData.posting_department}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-semibold disabled:opacity-50"
                  >
                    Approve Selected
                  </button>
                  <button
                    onClick={() => handleBulkAction('rejected')}
                    disabled={reviewing}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-semibold disabled:opacity-50"
                  >
                    Reject Selected
                  </button>
                  <button
                    onClick={() => setSelectedApplications([])}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs font-semibold"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto -mx-0 md:mx-0">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedApplications.length === paginatedApplications.length && paginatedApplications.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedApplications(paginatedApplications.map(app => app.id));
                            } else {
                              setSelectedApplications([]);
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-[#16a34a] focus:ring-[#16a34a]"
                        />
                        <button
                          onClick={() => handleSort('first_name')}
                          className="flex items-center gap-1 hover:text-[#16a34a] transition-colors"
                        >
                      Applicant
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                      <button
                        onClick={() => handleSort('nss_number')}
                        className="flex items-center gap-1 hover:text-[#16a34a] transition-colors"
                      >
                      NSS Number
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center gap-1 hover:text-[#16a34a] transition-colors"
                      >
                      Email
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                      <button
                        onClick={() => handleSort('created_at')}
                        className="flex items-center gap-1 hover:text-[#16a34a] transition-colors"
                      >
                      Submitted
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 hover:text-[#16a34a] transition-colors"
                      >
                      Status
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedApplications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="w-12 h-12 text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium">
                            {searchQuery || Object.values(advancedFilters).some(v => v) 
                              ? 'No applications match your filters' 
                              : 'No applications found'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedApplications.map((application, index) => (
                      <tr 
                        key={application.id} 
                        className={`hover:bg-gradient-to-r hover:from-[#16a34a]/5 hover:to-transparent transition-all duration-200 border-b border-gray-50 group ${
                          selectedApplications.includes(application.id) ? 'bg-blue-50' : ''
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-3 md:px-6 py-3 md:py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedApplications.includes(application.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedApplications([...selectedApplications, application.id]);
                                } else {
                                  setSelectedApplications(selectedApplications.filter(id => id !== application.id));
                                }
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-[#16a34a] focus:ring-[#16a34a] flex-shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-[#16a34a] to-[#15803d] flex items-center justify-center mr-2 md:mr-3 shadow-sm">
                                <span className="text-white font-bold text-xs md:text-sm">
                                  {(application.first_name[0] + application.last_name[0]).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs md:text-sm font-semibold text-gray-900 truncate">
                            {application.first_name} {application.last_name}
                                </div>
                                <div className="text-[10px] md:text-xs text-gray-500 md:hidden">{application.email}</div>
                                <div className="text-[10px] md:text-xs text-gray-500 md:hidden mt-0.5">{application.nss_number || 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="text-xs md:text-sm font-medium text-gray-700">{application.nss_number || <span className="text-gray-400">N/A</span>}</div>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden lg:table-cell">
                          <div className="text-xs md:text-sm text-gray-600 truncate max-w-xs">{application.email}</div>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="text-xs md:text-sm text-gray-600">
                            {new Date(application.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <span
                            className={`px-2 md:px-3 py-1 md:py-1.5 inline-flex text-[10px] md:text-xs font-bold rounded-full capitalize shadow-sm ${getStatusBadge(
                              application.status
                            )}`}
                          >
                            {application.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewApplication(application.id)}
                            className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-white bg-gradient-to-r from-[#16a34a] to-[#15803d] rounded-lg hover:shadow-md transition-all duration-200 transform hover:scale-105"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span>
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredApplications.length)} of {filteredApplications.length} results
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="ml-2 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#16a34a]"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
          </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-[#16a34a] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
        </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" onClick={() => setModalOpen(false)}>
          <div className="flex items-center justify-center min-h-screen px-2 md:px-4 pt-4 pb-20 text-center sm:block sm:p-0" onClick={(e) => e.stopPropagation()}>
            {/* Background overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-900/60 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            ></div>

            {/* Modal panel */}
            <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle w-full max-w-4xl mx-auto border border-gray-200" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-[#16a34a] to-[#15803d] px-4 md:px-6 py-4 md:py-5 flex justify-between items-center sticky top-0 z-10">
                <h3 className="text-lg md:text-2xl font-bold text-white">
                  Application Details
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>

              <div className="bg-white px-4 md:px-6 py-4 md:py-6 max-h-[calc(100vh-120px)] overflow-y-auto">
                {loadingApplication ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#16a34a]/20 border-t-[#16a34a] mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading application details...</p>
                  </div>
                ) : selectedApplication && (
                  <>
                    {/* Personal Information */}
                    <div className="mb-4 md:mb-6 bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 md:p-5 border border-gray-200">
                      <h4 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                        <div className="w-1 h-5 md:h-6 bg-gradient-to-b from-[#16a34a] to-[#15803d] rounded-full"></div>
                        Personal Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Full Name</span>
                          <p className="text-gray-900 font-semibold text-base">{selectedApplication.first_name} {selectedApplication.middle_name || ''} {selectedApplication.last_name}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Date of Birth</span>
                          <p className="text-gray-900 font-medium">{new Date(selectedApplication.date_of_birth).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Gender</span>
                          <p className="text-gray-900 font-medium">{selectedApplication.gender}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Nationality</span>
                          <p className="text-gray-900 font-medium">{selectedApplication.nationality}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Phone Number</span>
                          <p className="text-gray-900 font-medium">{selectedApplication.phone_number}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Email</span>
                          <p className="text-gray-900 font-medium">{selectedApplication.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="mb-6 bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-[#16a34a] to-[#15803d] rounded-full"></div>
                        Address Information
                      </h4>
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Residential Address</span>
                          <p className="text-gray-900 font-medium">{selectedApplication.residential_address}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Region</span>
                            <p className="text-gray-900 font-medium">{selectedApplication.region}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">District</span>
                            <p className="text-gray-900 font-medium">{selectedApplication.district}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Educational Information */}
                    <div className="mb-6 bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-[#16a34a] to-[#15803d] rounded-full"></div>
                        Educational Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Institution Name</span>
                          <p className="text-gray-900 font-medium">{selectedApplication.institution_name}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Course/Program</span>
                          <p className="text-gray-900 font-medium">{selectedApplication.course_program}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Year of Completion</span>
                          <p className="text-gray-900 font-medium">{selectedApplication.year_of_completion}</p>
                        </div>
                      </div>
                    </div>

                    {/* NSS Assignment Details */}
                    <div className="mb-6 bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-[#16a34a] to-[#15803d] rounded-full"></div>
                        NSS Assignment Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Service Year</span>
                          <p className="text-gray-900 font-medium">{selectedApplication.service_year}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Posting Region</span>
                          <p className="text-gray-900 font-medium">{selectedApplication.posting_region || 'N/A'}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Posting District</span>
                          <p className="text-gray-900 font-medium">
                            {(selectedApplication.posting_district && selectedApplication.posting_district !== '0' && selectedApplication.posting_district !== 'N/A') 
                              ? selectedApplication.posting_district 
                              : selectedApplication.district || 'N/A'}
                          </p>
                        </div>
                        {selectedApplication.posting_station && (
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Posting Station</span>
                            <p className="text-gray-900 font-medium">{selectedApplication.posting_station}</p>
                          </div>
                        )}
                        {selectedApplication.posting_department && (
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Posting Department</span>
                            <p className="text-gray-900 font-medium">{selectedApplication.posting_department}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Uploaded Documents */}
                    <div className="mb-6 bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-[#16a34a] to-[#15803d] rounded-full"></div>
                        Uploaded Documents
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedApplication.passport_photo && (
                          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 hover:shadow-md transition-all duration-200">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900">Passport Photo</p>
                              <p className="text-xs text-gray-500 truncate">{selectedApplication.passport_photo}</p>
                            </div>
                            <a
                              href={`http://localhost/api/upload.php?action=serve&path=${encodeURIComponent(selectedApplication.passport_photo)}&token=${localStorage.getItem('token')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 whitespace-nowrap"
                            >
                              View
                            </a>
                          </div>
                        )}
                        {selectedApplication.id_card_copy && (
                          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 hover:shadow-md transition-all duration-200">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <FileText className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900">ID Card Copy</p>
                              <p className="text-xs text-gray-500 truncate">{selectedApplication.id_card_copy}</p>
                            </div>
                            <a
                              href={`http://localhost/api/upload.php?action=serve&path=${encodeURIComponent(selectedApplication.id_card_copy)}&token=${localStorage.getItem('token')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 whitespace-nowrap"
                            >
                              View
                            </a>
                          </div>
                        )}
                        {selectedApplication.appointment_letter && (
                          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 hover:shadow-md transition-all duration-200">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900">Appointment Letter</p>
                              <p className="text-xs text-gray-500 truncate">{selectedApplication.appointment_letter}</p>
                            </div>
                            <a
                              href={`http://localhost/api/upload.php?action=serve&path=${encodeURIComponent(selectedApplication.appointment_letter)}&token=${localStorage.getItem('token')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 whitespace-nowrap"
                            >
                              View
                            </a>
                          </div>
                        )}
                        {selectedApplication.certificates && (
                          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 hover:shadow-md transition-all duration-200">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <FileText className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900">CV / Certificates</p>
                              <p className="text-xs text-gray-500 truncate">{selectedApplication.certificates}</p>
                            </div>
                            <a
                              href={`http://localhost/api/upload.php?action=serve&path=${encodeURIComponent(selectedApplication.certificates)}&token=${localStorage.getItem('token')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 whitespace-nowrap"
                            >
                              View
                            </a>
                          </div>
                        )}
                        {!selectedApplication.passport_photo && !selectedApplication.id_card_copy && !selectedApplication.appointment_letter && !selectedApplication.certificates && (
                          <div className="col-span-2 text-center py-4 text-gray-500">
                            No documents uploaded
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Review Section */}
                    <div className="bg-gradient-to-br from-[#16a34a]/5 to-white rounded-xl p-5 border-2 border-[#16a34a]/20 mt-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-[#16a34a] to-[#15803d] rounded-full"></div>
                        Review Application
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Review Notes</label>
                          <textarea
                            value={reviewData.review_notes}
                            onChange={(e) => setReviewData({ ...reviewData, review_notes: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] transition-all duration-200"
                            placeholder="Enter review notes..."
                          />
                        </div>
                        
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Posting Station {reviewData.status !== 'approved' && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            value={reviewData.posting_station}
                            onChange={(e) => setReviewData({ ...reviewData, posting_station: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] transition-all duration-200"
                            placeholder="Enter station name..."
                          />
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Posting Department {reviewData.status !== 'approved' && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            value={reviewData.posting_department}
                            onChange={(e) => setReviewData({ ...reviewData, posting_department: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] transition-all duration-200"
                            placeholder="Enter department name..."
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                          <button
                            onClick={() => handleReview('approved')}
                            disabled={reviewing}
                            className="flex-1 bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-bold hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            {reviewing ? 'Processing...' : '✓ Approve'}
                          </button>
                          <button
                            onClick={() => handleReview('rejected')}
                            disabled={reviewing}
                            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-bold hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            {reviewing ? 'Processing...' : '✗ Reject'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
