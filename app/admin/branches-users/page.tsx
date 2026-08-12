'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  Upload,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Mail,
  Shield,
  FileSpreadsheet,
  AlertCircle,
  X,
  Download,
} from 'lucide-react';

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

export default function BranchesUsersPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'BRANCHES' | 'USERS'>('BRANCHES');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk import modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [importError, setImportError] = useState('');

  // Single Branch Modal
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editBranch, setEditBranch] = useState<Partial<Branch> | null>(null);

  // Single User Modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState<Partial<User> & { password?: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== 'HR_ADMIN') {
          router.push('/upload');
        } else {
          loadData();
        }
      });
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, uRes] = await Promise.all([
        fetch('/api/admin/branches'),
        fetch('/api/admin/users'),
      ]);

      const bData = await bRes.json();
      const uData = await uRes.json();

      if (bData.branches) setBranches(bData.branches);
      if (bData.regions) setRegions(bData.regions);
      if (uData.users) setUsers(uData.users);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setImporting(true);
    setImportMsg('');
    setImportError('');

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const res = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error || 'Failed to execute CSV bulk import');
      } else {
        setImportMsg(data.message || 'CSV Import complete!');
        loadData();
        setTimeout(() => setShowBulkModal(false), 2000);
      }
    } catch {
      setImportError('Network error uploading CSV');
    } finally {
      setImporting(false);
    }
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBranch?.name || !editBranch?.code || !editBranch?.regionId || !editBranch?.headEmail) return;

    try {
      const res = await fetch('/api/admin/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editBranch),
      });
      const data = await res.json();
      if (res.ok) {
        setShowBranchModal(false);
        loadData();
      } else {
        alert(data.error || 'Failed to save station');
      }
    } catch {
      alert('Error saving station');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser?.name || !editUser?.email || !editUser?.role) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUser),
      });
      const data = await res.json();
      if (res.ok) {
        setShowUserModal(false);
        loadData();
      } else {
        alert(data.error || 'Failed to save user account');
      }
    } catch {
      alert('Error saving user');
    }
  };

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
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 border border-emerald-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 flex items-center gap-1.5 shadow-2xs">
              <Building2 className="h-3.5 w-3.5 text-emerald-300" />
              HR Admin Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-normal">Stations & User Accounts</h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 font-normal max-w-2xl mt-1">
            Manage station branches, assign station managers, and import bulk station directories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/dvla_ghana_offices_directory.csv"
            download="DVLA_Ghana_Offices_Directory.csv"
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-emerald-950/80 hover:bg-emerald-950 text-white border border-emerald-800 transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Download className="h-4 w-4 text-emerald-300" />
            <span>Download DVLA Directory (CSV)</span>
          </a>

          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-emerald-950/80 hover:bg-emerald-950 text-white border border-emerald-800 transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-300" />
            <span>CSV Directory Import</span>
          </button>

          {activeTab === 'BRANCHES' ? (
            <button
              onClick={() => {
                setEditBranch({ name: '', code: '', headName: '', headEmail: '', active: true, regionId: regions[0]?.id || '' });
                setShowBranchModal(true);
              }}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Station</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditUser({ name: '', email: '', role: 'STATION_MANAGER', active: true });
                setShowUserModal(true);
              }}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add User</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('BRANCHES')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'BRANCHES'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Station Roster ({branches.length})
          </button>
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'USERS'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            User Accounts ({users.length})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Table View */}
      {activeTab === 'BRANCHES' ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <th className="p-4">Code</th>
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
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading station roster...
                  </td>
                </tr>
              ) : branches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No stations configured yet. Click &ldquo;CSV Bulk Import&rdquo; to load 50+ stations.
                  </td>
                </tr>
              ) : (
                branches
                  .filter(
                    (b) =>
                      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      b.headName.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-mono font-bold text-indigo-700">{b.code}</td>
                      <td className="p-4 font-bold text-slate-900">{b.name}</td>
                      <td className="p-4 text-slate-600">{b.region.name}</td>
                      <td className="p-4 text-slate-800 font-medium">{b.headName}</td>
                      <td className="p-4 font-mono text-slate-600">{b.headEmail}</td>
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
                        <button
                          onClick={() => {
                            setEditBranch(b);
                            setShowBranchModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-semibold transition inline-flex items-center gap-1"
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
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
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
              ) : (
                users
                  .filter(
                    (u) =>
                      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      u.email.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((u) => (
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
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-semibold transition inline-flex items-center gap-1"
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
        </div>
      )}

      {/* CSV Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-teal-700">
                <FileSpreadsheet className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">CSV Bulk Station Import</h3>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {importError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {importError}
              </div>
            )}

            {importMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                {importMsg}
              </div>
            )}

            <form onSubmit={handleBulkImport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Select CSV File</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-2">
                <div className="font-bold text-slate-800">Expected CSV Header Format:</div>
                <pre className="p-2 rounded bg-white border border-slate-200 font-mono text-[10px] text-teal-700 overflow-x-auto">
                  {sampleCSV}
                </pre>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!csvFile || importing}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm disabled:opacity-50"
                >
                  {importing ? 'Processing Import...' : 'Import 50+ Stations'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Station Branch Modal */}
      {showBranchModal && editBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editBranch.id ? 'Edit Station Branch' : 'Add Station Branch'}
              </h3>
              <button onClick={() => setShowBranchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Station Code</label>
                <input
                  type="text"
                  required
                  value={editBranch.code || ''}
                  onChange={(e) => setEditBranch({ ...editBranch, code: e.target.value })}
                  placeholder="BR-055"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Station Name</label>
                <input
                  type="text"
                  required
                  value={editBranch.name || ''}
                  onChange={(e) => setEditBranch({ ...editBranch, name: e.target.value })}
                  placeholder="Central Station 15"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Region</label>
                <select
                  value={editBranch.regionId || ''}
                  onChange={(e) => setEditBranch({ ...editBranch, regionId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                >
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Station Manager Name</label>
                <input
                  type="text"
                  required
                  value={editBranch.headName || ''}
                  onChange={(e) => setEditBranch({ ...editBranch, headName: e.target.value })}
                  placeholder="Manager Full Name"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Station Manager Email</label>
                <input
                  type="email"
                  required
                  value={editBranch.headEmail || ''}
                  onChange={(e) => setEditBranch({ ...editBranch, headEmail: e.target.value })}
                  placeholder="manager@pvc.local"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBranchModal(false)}
                  className="px-4 py-2 font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  Save Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showUserModal && editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editUser.id ? 'Edit User Account' : 'Add User Account'}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editUser.name || ''}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  placeholder="Full Name"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editUser.email || ''}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  placeholder="user@pvc.local"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Password {editUser.id && '(Leave blank to keep existing)'}
                </label>
                <input
                  type="password"
                  required={!editUser.id}
                  value={editUser.password || ''}
                  onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Role</label>
                <select
                  value={editUser.role || 'STATION_MANAGER'}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                >
                  <option value="STATION_MANAGER">Station Manager</option>
                  <option value="HR_ADMIN">HR Admin</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
