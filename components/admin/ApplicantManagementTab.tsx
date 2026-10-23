'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  KeyRound,
  Edit3,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  X,
  FileCheck,
  Sparkles,
  Building,
  CheckCircle2,
  Lock,
  UserCheck
} from 'lucide-react';
import { getValidAuthToken } from '@/lib/auth-client';
import { formatDate } from '@/lib/utils';
import { ApplicantAccount } from '@/lib/types/admin';
import ShadcnSelect from '@/components/ui/ShadcnSelect';

const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Northern',
  'Volta',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Oti',
  'Savannah',
  'North East',
  'Western North',
];

interface ApplicantManagementTabProps {
  onRefreshParent?: () => void;
  refreshKey?: number;
}

export default function ApplicantManagementTab({
  onRefreshParent,
  refreshKey = 0,
}: ApplicantManagementTabProps) {
  const [applicants, setApplicants] = useState<ApplicantAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Single Password Reset Modal State
  const [singleResetTarget, setSingleResetTarget] = useState<ApplicantAccount | null>(null);
  const [singleNewPassword, setSingleNewPassword] = useState('DVLA2026!');
  const [showSinglePassword, setShowSinglePassword] = useState(true);
  const [resettingSingle, setResettingSingle] = useState(false);
  const [copiedSinglePassword, setCopiedSinglePassword] = useState(false);

  // Bulk Password Reset Modal State
  const [bulkResetOpen, setBulkResetOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<'selected' | 'all'>('selected');
  const [bulkNewPassword, setBulkNewPassword] = useState('DVLA2026!');
  const [showBulkPassword, setShowBulkPassword] = useState(true);
  const [resettingBulk, setResettingBulk] = useState(false);

  // Edit Profile Modal State
  const [editTarget, setEditTarget] = useState<ApplicantAccount | null>(null);
  const [editFormData, setEditFormData] = useState({
    email: '',
    phoneNumber: '',
    residentialAddress: '',
    firstName: '',
    middleName: '',
    lastName: '',
    nssNumber: '',
    region: 'Greater Accra',
    district: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Fetch applicant accounts from API
  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const token = getValidAuthToken();
      if (!token) return;

      const res = await axios.get('/api/admin/applicants', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setApplicants(res.data?.applicants || []);
    } catch (error: any) {
      console.error('Failed to fetch applicants:', error);
      toast.error(error.response?.data?.error || 'Failed to load applicant accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [refreshKey]);

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter((item) => {
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'no_app' && item.application_id !== null) return false;
        if (statusFilter !== 'no_app' && item.status !== statusFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = (item.user_full_name || `${item.first_name || ''} ${item.last_name || ''}`).toLowerCase();
        const email = (item.user_email || '').toLowerCase();
        const phone = (item.phone_number || '').toLowerCase();
        const nss = (item.nss_number || '').toLowerCase();
        const address = (item.residential_address || '').toLowerCase();

        if (
          !fullName.includes(q) &&
          !email.includes(q) &&
          !phone.includes(q) &&
          !nss.includes(q) &&
          !address.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [applicants, searchQuery, statusFilter]);

  // Generate a strong random temporary password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `Dvla@${rand}!`;
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredApplicants.map((a) => a.user_id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (userId: number) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Single password reset open
  const openSingleResetModal = (applicant: ApplicantAccount) => {
    setSingleResetTarget(applicant);
    setSingleNewPassword('DVLA2026!');
    setShowSinglePassword(true);
    setCopiedSinglePassword(false);
  };

  // Single password reset submit
  const handleConfirmSingleReset = async () => {
    if (!singleResetTarget) return;
    if (!singleNewPassword || singleNewPassword.trim().length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setResettingSingle(true);
    try {
      const token = getValidAuthToken();
      const res = await axios.post(
        '/api/admin/applicants/reset-password',
        {
          userId: singleResetTarget.user_id,
          newPassword: singleNewPassword.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(
        `Password reset successfully! ${singleResetTarget.user_email} can now log in with this password.`,
        { duration: 6000 }
      );
      setSingleResetTarget(null);
      fetchApplicants();
      if (onRefreshParent) onRefreshParent();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setResettingSingle(false);
    }
  };

  // Bulk password reset submit
  const handleConfirmBulkReset = async () => {
    if (!bulkNewPassword || bulkNewPassword.trim().length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setResettingBulk(true);
    try {
      const token = getValidAuthToken();
      const res = await axios.post(
        '/api/admin/applicants/reset-password',
        {
          userIds: bulkMode === 'all' ? 'all' : selectedIds,
          newPassword: bulkNewPassword.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(
        res.data?.message || `Successfully reset password for applicants!`,
        { duration: 6000 }
      );
      setBulkResetOpen(false);
      setSelectedIds([]);
      fetchApplicants();
      if (onRefreshParent) onRefreshParent();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reset passwords');
    } finally {
      setResettingBulk(false);
    }
  };

  // Open edit modal
  const openEditModal = (applicant: ApplicantAccount) => {
    setEditTarget(applicant);
    setEditFormData({
      email: applicant.user_email || applicant.application_email || '',
      phoneNumber: applicant.phone_number || '',
      residentialAddress: applicant.residential_address || '',
      firstName: applicant.first_name || applicant.user_full_name?.split(' ')[0] || '',
      middleName: applicant.middle_name || '',
      lastName: applicant.last_name || applicant.user_full_name?.split(' ').slice(1).join(' ') || '',
      nssNumber: applicant.nss_number || '',
      region: applicant.region || 'Greater Accra',
      district: applicant.district || '',
    });
  };

  // Save profile edit submit
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    if (!editFormData.email.trim() || !editFormData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSavingEdit(true);
    try {
      const token = getValidAuthToken();
      await axios.put(
        '/api/admin/applicants/update-profile',
        {
          userId: editTarget.user_id,
          applicationId: editTarget.application_id,
          email: editFormData.email.trim(),
          phoneNumber: editFormData.phoneNumber.trim(),
          residentialAddress: editFormData.residentialAddress.trim(),
          firstName: editFormData.firstName.trim(),
          middleName: editFormData.middleName.trim(),
          lastName: editFormData.lastName.trim(),
          nssNumber: editFormData.nssNumber.trim(),
          region: editFormData.region.trim(),
          district: editFormData.district.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Applicant profile updated successfully in the database!');
      setEditTarget(null);
      fetchApplicants();
      if (onRefreshParent) onRefreshParent();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update applicant profile');
    } finally {
      setSavingEdit(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredApplicants.length === 0) {
      toast.error('No applicants to export');
      return;
    }

    const headers = [
      'User ID',
      'Full Name',
      'Login Email',
      'Phone Number',
      'Residential Address',
      'NSS Number',
      'Region',
      'District',
      'Application Status',
      'Registered Date',
    ];

    const rows = filteredApplicants.map((a) => [
      a.user_id,
      `"${[a.first_name || a.user_full_name, a.middle_name, a.last_name].filter(Boolean).join(' ')}"`,
      `"${a.user_email}"`,
      `"${a.phone_number || 'N/A'}"`,
      `"${(a.residential_address || 'N/A').replace(/"/g, '""')}"`,
      `"${a.nss_number || 'N/A'}"`,
      `"${a.region || 'N/A'}"`,
      `"${a.district || 'N/A'}"`,
      `"${a.status || 'No Application'}"`,
      `"${a.user_created_at ? formatDate(a.user_created_at) : ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `DVLA_Applicants_Accounts_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Applicant roster exported successfully');
  };

  // Metrics
  const totalCount = applicants.length;
  const withAppCount = applicants.filter((a) => a.application_id !== null).length;
  const approvedCount = applicants.filter((a) => a.status === 'approved').length;
  const noAppCount = applicants.filter((a) => a.application_id === null).length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Banner Alert Notice */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d5c2e] via-[#094824] to-emerald-950 p-5 text-white shadow-lg border border-emerald-800">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-amber-300 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Applicant Accounts & Credentials Manager
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 border border-amber-300">
                  Live DB Sync
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
                Directly reset applicant login passwords, update phone numbers, emails, and residential addresses.
                All updates immediately reflect in the database so applicants can log in straight away.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => {
                setBulkMode('all');
                setBulkNewPassword('DVLA2026!');
                setBulkResetOpen(true);
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md cursor-pointer transition active:scale-95"
              title="Reset passwords for all registered applicants"
            >
              <KeyRound className="w-4 h-4" />
              <span>Reset All Passwords</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition cursor-pointer"
              title="Export all applicant credentials as CSV"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={fetchApplicants}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition cursor-pointer disabled:opacity-50"
              title="Reload applicant accounts"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-[#0d5c2e] border border-emerald-200 shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xl sm:text-2xl font-black text-slate-900 block truncate">
              {totalCount}
            </span>
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold truncate">
              Total Applicants
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="p-3 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
            <FileCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xl sm:text-2xl font-black text-slate-900 block truncate">
              {withAppCount}
            </span>
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold truncate">
              Completed Profiles
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xl sm:text-2xl font-black text-slate-900 block truncate">
              {approvedCount}
            </span>
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold truncate">
              Approved Personnel
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
            <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xl sm:text-2xl font-black text-slate-900 block truncate">
              {noAppCount}
            </span>
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold truncate">
              Pending First Form
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Live Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone, NSS number, or address..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0d5c2e] focus:bg-white transition"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-52">
            <ShadcnSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Statuses', badge: applicants.length },
                { value: 'approved', label: 'Approved', badge: approvedCount },
                {
                  value: 'pending',
                  label: 'Pending',
                  badge: applicants.filter((a) => a.status === 'pending').length,
                },
                {
                  value: 'under_review',
                  label: 'Under Review',
                  badge: applicants.filter((a) => a.status === 'under_review').length,
                },
                {
                  value: 'rejected',
                  label: 'Rejected',
                  badge: applicants.filter((a) => a.status === 'rejected').length,
                },
                { value: 'no_app', label: 'Registered Only', badge: noAppCount },
              ]}
              placeholder="Filter by status..."
            />
          </div>
        </div>

        {/* Bulk Action Bar (Visible when rows selected) */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl shrink-0">
            <span className="text-xs font-bold text-[#0d5c2e]">
              {selectedIds.length} selected
            </span>
            <button
              onClick={() => {
                setBulkMode('selected');
                setBulkNewPassword('DVLA2026!');
                setBulkResetOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0d5c2e] text-white text-xs font-bold hover:bg-[#0a4824] transition shadow-xs cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Reset Passwords</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 transition"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Applicant Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 pl-4 pr-2 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredApplicants.length > 0 &&
                      selectedIds.length === filteredApplicants.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0d5c2e] focus:ring-[#0d5c2e] border-slate-300 cursor-pointer"
                    aria-label="Select all applicants"
                  />
                </th>
                <th className="py-3.5 px-3">Applicant & NSS</th>
                <th className="py-3.5 px-3">Login Email</th>
                <th className="py-3.5 px-3">Phone Number</th>
                <th className="py-3.5 px-3">Residential Address</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#0d5c2e]" />
                      <span className="font-semibold text-xs text-slate-600">
                        Loading applicant accounts...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredApplicants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No applicants found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredApplicants.map((applicant) => {
                  const isSelected = selectedIds.includes(applicant.user_id);
                  const fullName =
                    applicant.user_full_name ||
                    [applicant.first_name, applicant.middle_name, applicant.last_name]
                      .filter(Boolean)
                      .join(' ') ||
                    'Applicant';
                  const initial = fullName.charAt(0).toUpperCase();

                  return (
                    <tr
                      key={applicant.user_id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-emerald-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-4 pr-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(applicant.user_id)}
                          className="w-4 h-4 rounded text-[#0d5c2e] focus:ring-[#0d5c2e] border-slate-300 cursor-pointer"
                          aria-label={`Select ${fullName}`}
                        />
                      </td>

                      {/* Name & NSS */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0d5c2e] to-emerald-700 text-white flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                              {fullName}
                            </span>
                            <span className="text-[10px] font-mono text-[#0d5c2e] font-extrabold block truncate">
                              {applicant.nss_number || 'NSS: Not Assigned'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5 group">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span
                            className="font-medium text-slate-700 truncate max-w-[180px]"
                            title={applicant.user_email}
                          >
                            {applicant.user_email}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(applicant.user_email);
                              toast.success('Email copied to clipboard');
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 p-0.5 transition"
                            title="Copy email"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-3">
                        {applicant.phone_number ? (
                          <div className="flex items-center gap-1.5 group">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-700 font-mono text-[11px]">
                              {applicant.phone_number}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(applicant.phone_number || '');
                                toast.success('Phone copied to clipboard');
                              }}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 p-0.5 transition"
                              title="Copy phone number"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No phone on file</span>
                        )}
                      </td>

                      {/* Residential Address */}
                      <td className="py-3.5 px-3">
                        {applicant.residential_address ? (
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="min-w-0 max-w-[200px]">
                              <span
                                className="font-medium text-slate-800 line-clamp-1 text-[11px]"
                                title={applicant.residential_address}
                              >
                                {applicant.residential_address}
                              </span>
                              {applicant.region && (
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {applicant.region}
                                  {applicant.district ? `, ${applicant.district}` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Not provided</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        {applicant.status ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              applicant.status === 'approved'
                                ? 'bg-emerald-100 text-[#0d5c2e] border-emerald-300'
                                : applicant.status === 'rejected'
                                ? 'bg-rose-100 text-rose-700 border-rose-300'
                                : applicant.status === 'under_review'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {applicant.status.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                            Registered
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-4 pl-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Reset Password Button */}
                          <button
                            onClick={() => openSingleResetModal(applicant)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[11px] transition shadow-2xs cursor-pointer active:scale-95"
                            title="Reset password for this applicant"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                            <span>Reset Pass</span>
                          </button>

                          {/* Edit Details Button */}
                          <button
                            onClick={() => openEditModal(applicant)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-[11px] transition shadow-2xs cursor-pointer active:scale-95"
                            title="Edit phone number, email, address, etc."
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Showing <strong className="text-slate-800">{filteredApplicants.length}</strong> of{' '}
            <strong className="text-slate-800">{applicants.length}</strong> applicant accounts
          </span>
          <span className="text-[11px] text-slate-400">
            Tip: Password resets update the database hash directly for immediate login access.
          </span>
        </div>
      </div>

      {/* SINGLE PASSWORD RESET MODAL */}
      {singleResetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in-up">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl text-slate-950">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-950">
                    Reset Applicant Password
                  </h3>
                  <p className="text-xs text-slate-900/80 font-medium">
                    Immediate database update
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSingleResetTarget(null)}
                className="p-1 rounded-lg hover:bg-black/10 text-slate-950 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Applicant Info Box */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                  Target Account
                </span>
                <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                  {singleResetTarget.user_full_name}
                </span>
                <span className="text-xs text-emerald-800 font-medium block">
                  {singleResetTarget.user_email}
                </span>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSinglePassword ? 'text' : 'password'}
                    value={singleNewPassword}
                    onChange={(e) => setSingleNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)..."
                    className="w-full pl-3.5 pr-20 py-2.5 text-sm font-mono rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0d5c2e] focus:bg-white transition"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowSinglePassword(!showSinglePassword)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
                      title={showSinglePassword ? 'Hide password' : 'Show password'}
                    >
                      {showSinglePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(singleNewPassword);
                        setCopiedSinglePassword(true);
                        toast.success('Password copied to clipboard!');
                        setTimeout(() => setCopiedSinglePassword(false), 2000);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
                      title="Copy password to clipboard"
                    >
                      {copiedSinglePassword ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSingleNewPassword(generateRandomPassword())}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0d5c2e] border border-emerald-200 text-xs font-bold transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Strong Password</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSingleNewPassword('DVLA2026!')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  Default (DVLA2026!)
                </button>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-900 text-xs leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Once confirmed, this password is immediately active in the MySQL database. The
                  applicant can navigate to the Login page and sign in immediately.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSingleResetTarget(null)}
                disabled={resettingSingle}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleReset}
                disabled={resettingSingle}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0d5c2e] hover:bg-[#0a4824] text-white text-xs font-black shadow-md transition cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {resettingSingle && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Save & Set New Password</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK PASSWORD RESET MODAL */}
      {bulkResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in-up">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl text-white">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Bulk Reset Applicant Passwords
                  </h3>
                  <p className="text-xs text-rose-100 font-medium">
                    Batch update credentials in database
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBulkResetOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Important Confirmation</span>
                </div>
                <p>
                  You are about to reset passwords for{' '}
                  <strong className="font-extrabold text-rose-950">
                    {bulkMode === 'all'
                      ? `ALL ${applicants.length} registered applicants`
                      : `${selectedIds.length} selected applicants`}
                  </strong>
                  .
                </p>
                <p className="text-rose-800/90">
                  This will immediately replace their existing login passwords in the database with the
                  new password specified below.
                </p>
              </div>

              {/* Mode switch */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setBulkMode('selected')}
                  disabled={selectedIds.length === 0}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    bulkMode === 'selected'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 disabled:opacity-40'
                  }`}
                >
                  Selected Applicants ({selectedIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBulkMode('all')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    bulkMode === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All Applicants ({applicants.length})
                </button>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Uniform Temporary Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showBulkPassword ? 'text' : 'password'}
                    value={bulkNewPassword}
                    onChange={(e) => setBulkNewPassword(e.target.value)}
                    placeholder="Enter uniform password..."
                    className="w-full pl-3.5 pr-12 py-2.5 text-sm font-mono rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0d5c2e] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBulkPassword(!showBulkPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showBulkPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkNewPassword('DVLA2026!')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition"
                >
                  Default (DVLA2026!)
                </button>
                <button
                  type="button"
                  onClick={() => setBulkNewPassword('Welcome@2026')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition"
                >
                  Welcome@2026
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setBulkResetOpen(false)}
                disabled={resettingBulk}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkReset}
                disabled={resettingBulk}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {resettingBulk && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  Confirm & Reset {bulkMode === 'all' ? `All (${applicants.length})` : `(${selectedIds.length})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL (PHONE, EMAIL, ADDRESS, NAMES, NSS, ETC.) */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in-up">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-[#0d5c2e] via-[#094824] to-emerald-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl text-white">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Update Applicant Profile
                  </h3>
                  <p className="text-xs text-emerald-200/90 font-medium">
                    Edit phone, email, residential address & details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditTarget(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Account Header Banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Account ID #{editTarget.user_id}
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 block">
                    {editTarget.user_full_name}
                  </span>
                </div>
                {editTarget.status && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      editTarget.status === 'approved'
                        ? 'bg-emerald-100 text-[#0d5c2e] border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {editTarget.status.replace('_', ' ')}
                  </span>
                )}
              </div>

              {/* Grid Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email Address */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#0d5c2e]" />
                    Login Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, email: e.target.value })
                    }
                    required
                    placeholder="applicant@example.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0d5c2e] focus:bg-white transition"
                  />
                  <p className="text-[10px] text-slate-500">
                    Changing this email updates their login identifier in both user accounts and
                    applications.
                  </p>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#0d5c2e]" />
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.phoneNumber}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, phoneNumber: e.target.value })
                    }
                    placeholder="e.g. 0244123456 or +233244123456"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0d5c2e] focus:bg-white transition"
                  />
                  <p className="text-[10px] text-slate-500">Used for SMS alerts & verification</p>
                </div>

                {/* NSS Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-[#0d5c2e]" />
                    NSS Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.nssNumber}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, nssNumber: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. NSSGHA123456"
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0d5c2e] focus:bg-white transition"
                  />
                  <p className="text-[10px] text-slate-500">National Service identification number</p>
                </div>

                {/* Residential Address */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0d5c2e]" />
                    Residential Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.residentialAddress}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, residentialAddress: e.target.value })
                    }
                    placeholder="House number, Street name, Landmark, Town/City"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0d5c2e] focus:bg-white transition"
                  />
                </div>

                {/* First Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">First Name</label>
                  <input
                    type="text"
                    value={editFormData.firstName}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, firstName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0d5c2e] focus:bg-white transition"
                  />
                </div>

                {/* Middle Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Middle Name (Optional)</label>
                  <input
                    type="text"
                    value={editFormData.middleName}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, middleName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0d5c2e] focus:bg-white transition"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Last Name</label>
                  <input
                    type="text"
                    value={editFormData.lastName}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, lastName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0d5c2e] focus:bg-white transition"
                  />
                </div>

                {/* Region */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Region</label>
                  <select
                    value={editFormData.region}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, region: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0d5c2e] focus:bg-white transition"
                  >
                    {GHANA_REGIONS.map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">District / Sub-metro</label>
                  <input
                    type="text"
                    value={editFormData.district}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, district: e.target.value })
                    }
                    placeholder="e.g. Ayawaso West / Kumasi Metro"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0d5c2e] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0d5c2e] hover:bg-[#0a4824] text-white text-xs font-black shadow-md transition cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {savingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
