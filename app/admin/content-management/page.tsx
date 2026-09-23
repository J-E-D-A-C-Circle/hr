'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FolderKanban,
  Building2,
  Users,
  Clock,
  FileCheck2,
  Trash2,
  Plus,
  Search,
  Edit2,
  FileSpreadsheet,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Save,
  Send,
  Database,
  Bell,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  headName: string;
  headEmail: string;
  active: boolean;
  regionId?: string;
  region: { id: string; name: string };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  branch?: { id: string; name: string };
  region?: { id: string; name: string };
}

interface Region {
  id: string;
  name: string;
}

const ITEMS_PER_PAGE = 10;

function ContentManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab State: STATIONS | USERS | DEADLINES | POLICIES | MAINTENANCE
  const initialTab = (searchParams.get('tab') as any) || 'STATIONS';
  const [activeTab, setActiveTab] = useState<'STATIONS' | 'USERS' | 'DEADLINES' | 'POLICIES' | 'MAINTENANCE'>(
    ['STATIONS', 'USERS', 'DEADLINES', 'POLICIES', 'MAINTENANCE'].includes(initialTab) ? initialTab : 'STATIONS'
  );

  // Data States
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [branchesPage, setBranchesPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);

  // Cutoff Config State
  const [cutoffDay, setCutoffDay] = useState(21);
  const [reminderDays, setReminderDays] = useState(3);
  const [triggering, setTriggering] = useState(false);

  // Policy Settings State
  const [maxFileSize, setMaxFileSize] = useState(30);
  const [policyGuidelines, setPolicyGuidelines] = useState(
    'All monthly payroll validation documents must be physically signed by the Station Manager and uploaded in PDF format prior to the 21st cutoff.'
  );

  // Modals State
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editBranch, setEditBranch] = useState<Partial<Branch> | null>(null);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState<Partial<User> & { password?: string } | null>(null);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // Confirmation Dialog States (Replaces native browser window.confirm popups)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [clearTarget, setClearTarget] = useState<'SUBMISSIONS_ONLY' | 'FULL_RESET' | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== 'HR_ADMIN') {
          router.push('/upload');
        } else {
          loadAllData();
        }
      });
  }, []);

  useEffect(() => {
    setBranchesPage(1);
    setUsersPage(1);
  }, [searchQuery, activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [bRes, uRes, dRes] = await Promise.all([
        fetch('/api/admin/branches'),
        fetch('/api/admin/users'),
        fetch('/api/admin/deadlines'),
      ]);

      const bData = await bRes.json();
      const uData = await uRes.json();
      const dData = await dRes.json();

      if (bData.branches) setBranches(bData.branches);
      if (bData.regions) setRegions(bData.regions);
      if (uData.users) setUsers(uData.users);
      if (dData.config) {
        setCutoffDay(dData.config.cutoffDayOfMonth);
        setReminderDays(dData.config.reminderDaysBefore);
      }
    } catch (e) {
      console.error('Failed loading Content Management data:', e);
      toast.error('Failed to load content management configuration');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const res = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to execute CSV bulk import');
      } else {
        toast.success(data.message || 'CSV Directory Import complete!');
        loadAllData();
        setShowBulkModal(false);
        setCsvFile(null);
      }
    } catch {
      toast.error('Network error uploading CSV');
    } finally {
      setImporting(false);
    }
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBranch?.name || !editBranch?.regionId) {
      toast.error('Station Name and Region are required');
      return;
    }

    try {
      const res = await fetch('/api/admin/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editBranch),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editBranch.id ? 'Station office updated' : 'New station office created');
        setShowBranchModal(false);
        setEditBranch(null);
        loadAllData();
      } else {
        toast.error(data.error || 'Failed to save station');
      }
    } catch {
      toast.error('Error saving station');
    }
  };

  const confirmDeleteBranch = (branchId: string, branchName: string) => {
    setDeleteTarget({ id: branchId, name: branchName });
  };

  const executeDeleteBranch = async () => {
    if (!deleteTarget) return;
    const { id: branchId, name: branchName } = deleteTarget;
    setDeleteTarget(null);

    try {
      const res = await fetch(`/api/admin/branches?id=${branchId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Station "${branchName}" deleted`);
        loadAllData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete station');
      }
    } catch {
      toast.error('Error deleting station');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser?.name || !editUser?.email || !editUser?.role) {
      toast.error('Name, Email, and Role are required');
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUser),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editUser.id ? 'User account updated' : 'New user account created');
        setShowUserModal(false);
        setEditUser(null);
        loadAllData();
      } else {
        toast.error(data.error || 'Failed to save user account');
      }
    } catch {
      toast.error('Error saving user');
    }
  };

  const handleSaveDeadlines = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cutoffDayOfMonth: cutoffDay, reminderDaysBefore: reminderDays }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Cutoff settings updated! Cutoff set to the ${cutoffDay}st/th of each month.`);
      } else {
        toast.error(data.error || 'Failed to update cutoff settings');
      }
    } catch {
      toast.error('Error saving cutoff settings');
    }
  };

  const handleTriggerReminders = async () => {
    setTriggering(true);
    try {
      const res = await fetch('/api/admin/reminders', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Reminders dispatched to unsubmitted stations');
      } else {
        toast.error(data.error || 'Failed to dispatch reminders');
      }
    } catch {
      toast.error('Error triggering reminder engine');
    } finally {
      setTriggering(false);
    }
  };

  const confirmClearData = (mode: 'SUBMISSIONS_ONLY' | 'FULL_RESET') => {
    setClearTarget(mode);
  };

  const executeClearData = async () => {
    if (!clearTarget) return;
    const mode = clearTarget;
    setClearTarget(null);

    try {
      const res = await fetch('/api/admin/clear-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Data cleared successfully!');
        loadAllData();
      } else {
        toast.error(data.error || 'Failed to clear data');
      }
    } catch {
      toast.error('Error clearing data');
    }
  };

  // Sample CSV format
  const sampleCSV = `branch_code,branch_name,region_name,head_name,head_email,initial_password
DVLA-ACC-01,DVLA Head Office (Cantonments 37),Greater Accra Region,Emmanuel Arhin,head.acc01@pvc.local,password123
DVLA-ASH-01,DVLA Kumasi Regional Office (Asokwa),Ashanti Region,Kwame Mensah,head.ash01@pvc.local,password123`;

  const roleLabels: Record<string, string> = {
    STATION_MANAGER: 'Station Manager',
    BRANCH_HEAD: 'Station Manager',
    HR_ADMIN: 'HR Admin',
    ADMIN: 'HR Admin',
    SYSADMIN: 'HR Admin',
    EXEC: 'HR Admin',
    FINANCE_OFFICER: 'Finance Officer',
  };

  // Filtered Lists
  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.code && b.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.headName && b.headName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Paginated Slices
  const totalBranchPages = Math.ceil(filteredBranches.length / ITEMS_PER_PAGE) || 1;
  const paginatedBranches = filteredBranches.slice(
    (branchesPage - 1) * ITEMS_PER_PAGE,
    branchesPage * ITEMS_PER_PAGE
  );

  const totalUserPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const paginatedUsers = filteredUsers.slice(
    (usersPage - 1) * ITEMS_PER_PAGE,
    usersPage * ITEMS_PER_PAGE
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 border border-emerald-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 flex items-center gap-1.5 shadow-2xs">
              <FolderKanban className="h-3.5 w-3.5 text-emerald-300" />
              Central Content Management Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-normal">Content Management</h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 font-normal max-w-2xl mt-1">
            Manage station rosters, user account credentials, deadline cutoff rules, validation policies, and database maintenance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/dvla_ghana_offices_directory.csv"
            download="DVLA_Ghana_Offices_Directory.csv"
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-emerald-950/80 hover:bg-emerald-950 text-white border border-emerald-800 transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Download className="h-4 w-4 text-emerald-300" />
            <span>Download CSV Directory Template</span>
          </a>

          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-emerald-950/80 hover:bg-emerald-950 text-white border border-emerald-800 transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-300" />
            <span>CSV Directory Import</span>
          </button>

          <button
            onClick={loadAllData}
            className="px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Sub-Tab Bar (5 Clean Tabs) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-sm flex flex-wrap items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('STATIONS')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'STATIONS'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Stations Roster</span>
          <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-800/40 text-emerald-100 font-mono">
            {branches.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'USERS'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Accounts</span>
          <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-800/40 text-emerald-100 font-mono">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('DEADLINES')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'DEADLINES'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Deadlines & Cutoffs</span>
        </button>

        <button
          onClick={() => setActiveTab('POLICIES')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'POLICIES'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>Validation Policy</span>
        </button>

        <button
          onClick={() => setActiveTab('MAINTENANCE')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'MAINTENANCE'
              ? 'bg-rose-700 text-white shadow-sm'
              : 'text-rose-600 hover:bg-rose-50 hover:text-rose-800'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Database Maintenance</span>
        </button>
      </div>

      {/* TAB 1: STATIONS ROSTER */}
      {activeTab === 'STATIONS' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search station name, code, or manager..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                setEditBranch({ name: '', code: '', headName: '', headEmail: '', active: true, regionId: regions[0]?.id || '' });
                setShowBranchModal(true);
              }}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Station Office</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="p-4">Station Name</th>
                  <th className="p-4">Region</th>
                  <th className="p-4">Station Manager Name</th>
                  <th className="p-4">Manager Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Loading stations roster...
                    </td>
                  </tr>
                ) : filteredBranches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-normal">
                      No stations added yet. Click &ldquo;Add Station Office&rdquo; or use &ldquo;CSV Directory Import&rdquo; to populate your stations roster.
                    </td>
                  </tr>
                ) : (
                  paginatedBranches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-bold text-slate-900">
                        {b.name}
                        {b.code && <span className="ml-2 text-[10px] text-emerald-800 font-mono">({b.code})</span>}
                      </td>
                      <td className="p-4 text-slate-600">{b.region?.name || '—'}</td>
                      <td className="p-4 text-slate-800 font-medium">{b.headName || '—'}</td>
                      <td className="p-4 font-mono text-slate-600">{b.headEmail || '—'}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                            b.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {b.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditBranch(b);
                              setShowBranchModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3 text-slate-500" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => confirmDeleteBranch(b.id, b.name)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {filteredBranches.length > 0 && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div>
                  Showing <span className="font-semibold">{((branchesPage - 1) * ITEMS_PER_PAGE) + 1}</span> to{' '}
                  <span className="font-semibold">
                    {Math.min(branchesPage * ITEMS_PER_PAGE, filteredBranches.length)}
                  </span>{' '}
                  of <span className="font-semibold">{filteredBranches.length}</span> stations
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={branchesPage === 1}
                    onClick={() => setBranchesPage((p) => Math.max(p - 1, 1))}
                    className="h-8 px-3 text-xs flex items-center gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </Button>
                  <span className="text-slate-700 font-medium px-2">
                    Page {branchesPage} of {totalBranchPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={branchesPage >= totalBranchPages}
                    onClick={() => setBranchesPage((p) => Math.min(p + 1, totalBranchPages))}
                    className="h-8 px-3 text-xs flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: USER ACCOUNTS */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user name or email..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                setEditUser({ name: '', email: '', role: 'STATION_MANAGER', active: true });
                setShowUserModal(true);
              }}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add User Account</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Assigned Station</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-normal">
                      No user accounts found.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-bold text-slate-900">{u.name}</td>
                      <td className="p-4 font-mono text-slate-600">{u.email}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                            u.role === 'HR_ADMIN'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {roleLabels[u.role] || u.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{u.branch?.name || '—'}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                            u.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {u.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setEditUser(u);
                            setShowUserModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3 text-slate-500" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {filteredUsers.length > 0 && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div>
                  Showing <span className="font-semibold">{((usersPage - 1) * ITEMS_PER_PAGE) + 1}</span> to{' '}
                  <span className="font-semibold">
                    {Math.min(usersPage * ITEMS_PER_PAGE, filteredUsers.length)}
                  </span>{' '}
                  of <span className="font-semibold">{filteredUsers.length}</span> accounts
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={usersPage === 1}
                    onClick={() => setUsersPage((p) => Math.max(p - 1, 1))}
                    className="h-8 px-3 text-xs flex items-center gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </Button>
                  <span className="text-slate-700 font-medium px-2">
                    Page {usersPage} of {totalUserPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={usersPage >= totalUserPages}
                    onClick={() => setUsersPage((p) => Math.min(p + 1, totalUserPages))}
                    className="h-8 px-3 text-xs flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DEADLINES & CUTOFFS */}
      {activeTab === 'DEADLINES' && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Monthly Cutoff Settings</h2>
                <p className="text-xs text-slate-500">Configure cutoff date and reminder rules</p>
              </div>
            </div>

            <form onSubmit={handleSaveDeadlines} className="space-y-5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-2">
                  Monthly Cutoff Day (1 - 31)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    value={cutoffDay}
                    onChange={(e) => setCutoffDay(parseInt(e.target.value))}
                    className="w-32 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-bold focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                  <span className="text-slate-600 font-medium">st / th of each month</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-2">
                  Lead Days for Automated Reminders (T-Minus Days)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={15}
                    required
                    value={reminderDays}
                    onChange={(e) => setReminderDays(parseInt(e.target.value))}
                    className="w-32 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-bold focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                  <span className="text-slate-600 font-medium">days before cutoff</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Save Deadline Configuration</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: VALIDATION POLICY */}
      {activeTab === 'POLICIES' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Payroll Validation Guidelines & Policy Rules</h2>
              <p className="text-xs text-slate-500">Set validation requirements and instructions displayed on the upload portal</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast.success('Validation policy guidelines updated successfully!');
            }}
            className="space-y-5 text-xs max-w-2xl"
          >
            <div>
              <label className="block text-slate-700 font-bold mb-2">Maximum Allowed PDF File Size Limit (MB)</label>
              <input
                type="number"
                min={5}
                max={100}
                value={maxFileSize}
                onChange={(e) => setMaxFileSize(parseInt(e.target.value))}
                className="w-32 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-bold focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">Default is 30MB per submission.</p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-2">Instructions & Guidelines Text for Station Managers</label>
              <textarea
                rows={4}
                value={policyGuidelines}
                onChange={(e) => setPolicyGuidelines(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Save Validation Policy</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: DATABASE MAINTENANCE & CLEAR DUMMY DATA */}
      {activeTab === 'MAINTENANCE' && (
        <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Database Maintenance & Data Wipe Tools</h2>
              <p className="text-xs text-slate-500">Clear test data when ready to input real production data</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-amber-600" />
                <span>Clear Test Submissions & Upload Files</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Deletes all validation form submissions and removes uploaded PDF files from disk storage. Keeps station branches and user accounts intact.
              </p>
              <button
                onClick={() => confirmClearData('SUBMISSIONS_ONLY')}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-sm cursor-pointer"
              >
                Clear Submissions Only
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
              <h3 className="font-bold text-rose-900 text-sm flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <span>Full Reset to Clean State</span>
              </h3>
              <p className="text-rose-800 leading-relaxed">
                Deletes all stations, manager accounts, test submissions, and audit logs. Preserves HR Admin access and region definitions.
              </p>
              <button
                onClick={() => confirmClearData('FULL_RESET')}
                className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold transition shadow-sm cursor-pointer"
              >
                Full Database Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHADCN UI MODAL: Add/Edit Station */}
      <Dialog open={showBranchModal} onOpenChange={setShowBranchModal}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editBranch?.id ? 'Edit Station Office' : 'Add Station Office'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Enter official station details and assign default Station Manager.
            </DialogDescription>
          </DialogHeader>

          {editBranch && (
            <form onSubmit={handleSaveBranch} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Station Code (Optional)</label>
                <Input
                  type="text"
                  value={editBranch.code || ''}
                  onChange={(e) => setEditBranch({ ...editBranch, code: e.target.value })}
                  placeholder="e.g. ST-01"
                  className="bg-slate-50 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Station Name *</label>
                <Input
                  type="text"
                  required
                  value={editBranch.name || ''}
                  onChange={(e) => setEditBranch({ ...editBranch, name: e.target.value })}
                  placeholder="Central Office 15"
                  className="bg-slate-50 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-semibold">Region *</label>
                <Select
                  value={editBranch.regionId || ''}
                  onValueChange={(val) => setEditBranch({ ...editBranch, regionId: val })}
                >
                  <SelectTrigger className="bg-white text-xs">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Station Manager Name</label>
                <Input
                  type="text"
                  value={editBranch.headName || ''}
                  onChange={(e) => setEditBranch({ ...editBranch, headName: e.target.value })}
                  placeholder="Manager Full Name"
                  className="bg-slate-50 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Station Manager Email</label>
                <Input
                  type="email"
                  value={editBranch.headEmail || ''}
                  onChange={(e) => setEditBranch({ ...editBranch, headEmail: e.target.value })}
                  placeholder="manager@company.com"
                  className="bg-slate-50 text-xs"
                />
              </div>

              <DialogFooter className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowBranchModal(false)} className="text-xs rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  Save Station
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* SHADCN UI MODAL: Add/Edit User */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editUser?.id ? 'Edit User Account' : 'Add User Account'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure user credentials and access permissions.
            </DialogDescription>
          </DialogHeader>

          {editUser && (
            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                <Input
                  type="text"
                  required
                  value={editUser.name || ''}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  placeholder="Full Name"
                  className="bg-slate-50 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email *</label>
                <Input
                  type="email"
                  required
                  value={editUser.email || ''}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  placeholder="user@company.com"
                  className="bg-slate-50 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Password {editUser.id && '(Leave blank to keep existing)'}
                </label>
                <Input
                  type="password"
                  required={!editUser.id}
                  value={editUser.password || ''}
                  onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="bg-slate-50 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-semibold">Role *</label>
                <Select
                  value={editUser.role || 'STATION_MANAGER'}
                  onValueChange={(val) => setEditUser({ ...editUser, role: val })}
                >
                  <SelectTrigger className="bg-white text-xs">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STATION_MANAGER">Station Manager</SelectItem>
                    <SelectItem value="HR_ADMIN">HR Admin</SelectItem>
                    <SelectItem value="FINANCE_OFFICER">Finance Officer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowUserModal(false)} className="text-xs rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  Save Account
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* SHADCN UI MODAL: CSV Bulk Import */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-800 text-lg font-bold">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              CSV Directory Import
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Upload a standard CSV file to automatically import station offices and assign default manager accounts.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBulkImport} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Select CSV File</label>
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-900 bg-slate-50 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-2">
              <div className="font-bold text-slate-800">Expected CSV Header Format:</div>
              <pre className="p-2 rounded bg-white border border-slate-200 font-mono text-[10px] text-emerald-700 overflow-x-auto">
                {sampleCSV}
              </pre>
            </div>

            <DialogFooter className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowBulkModal(false)} className="text-xs rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={!csvFile || importing} className="text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm">
                {importing ? 'Processing Import...' : 'Import Stations'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SHADCN UI MODAL: Confirm Delete Station */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700 text-lg font-bold">
              <div className="h-9 w-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-rose-600" />
              </div>
              Delete Station Office
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 pt-1 leading-relaxed">
              Are you sure you want to delete station office <strong className="text-slate-900 font-semibold">{deleteTarget?.name}</strong>? This action will permanently remove the record and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={executeDeleteBranch}
              className="text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm"
            >
              Delete Station
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SHADCN UI MODAL: Confirm Clear Data */}
      <Dialog open={!!clearTarget} onOpenChange={(open) => !open && setClearTarget(null)}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700 text-lg font-bold">
              <div className="h-9 w-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
              </div>
              {clearTarget === 'FULL_RESET' ? 'Confirm Full Database Reset' : 'Clear Submission Records'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 pt-1 leading-relaxed">
              {clearTarget === 'FULL_RESET'
                ? 'WARNING: This will permanently wipe ALL stations, manager accounts, test submissions, and uploaded PDF files from the system. You will be able to enter real production data immediately.'
                : 'Are you sure you want to clear all submitted monthly validation records and uploaded PDF files? Station offices and user accounts will be kept.'}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setClearTarget(null)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={executeClearData}
              className={`text-xs rounded-xl font-bold shadow-sm ${
                clearTarget === 'FULL_RESET'
                  ? 'bg-rose-700 hover:bg-rose-800 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              {clearTarget === 'FULL_RESET' ? 'Yes, Reset Database' : 'Yes, Clear Submissions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ContentManagementPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs font-bold text-slate-500">Loading Content Management Hub...</div>}>
      <ContentManagementContent />
    </Suspense>
  );
}
