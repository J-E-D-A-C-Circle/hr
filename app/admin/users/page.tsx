"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Briefcase,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState<"ALL" | "SUPER_ADMIN" | "RETIREMENT" | "TEMPSTAFF" | "HR_LETTERS">("ALL");

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Password Visibility Toggles
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Form States
  const [createForm, setCreateForm] = useState({
    system: "TEMPSTAFF",
    username: "",
    email: "",
    name: "",
    password: "",
    role: "HR Officer",
  });

  const [editForm, setEditForm] = useState({
    id: "",
    system: "TEMPSTAFF",
    username: "",
    name: "",
    email: "",
    role: "HR Officer",
    password: "",
  });

  const [newPassword, setNewPassword] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter logic
  const filteredUsers = users.filter((u) => {
    const matchesTab = selectedTab === "ALL" || u.system === selectedTab;
    const query = search.toLowerCase();
    const matchesSearch =
      u.name?.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.role?.toLowerCase().includes(query);
    return matchesTab && matchesSearch;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setActionError(data.error || "Failed to create user account");
        setSubmitting(false);
        return;
      }

      setActionSuccess(`Successfully created ${createForm.name} in ${createForm.system}`);
      setCreateModalOpen(false);
      setCreateForm({
        system: "TEMPSTAFF",
        username: "",
        email: "",
        name: "",
        password: "",
        role: "HR Officer",
      });
      fetchUsers();
    } catch (err: any) {
      setActionError("Unexpected error occurred while creating user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      id: user.id,
      system: user.system,
      username: user.username || "",
      name: user.name || "",
      email: user.email || "",
      role: user.role || "HR Officer",
      password: "",
    });
    setShowEditPassword(false);
    setActionError(null);
    setEditModalOpen(true);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editForm.id,
          system: editForm.system,
          action: "UPDATE_USER",
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionError(data.error || "Failed to update user account");
        setSubmitting(false);
        return;
      }

      // Reset password if provided during edit
      if (editForm.password.trim()) {
        await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editForm.id,
            system: editForm.system,
            action: "RESET_PASSWORD",
            newPassword: editForm.password.trim(),
          }),
        });
      }

      setActionSuccess(`User account ${editForm.name} updated successfully.`);
      setEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setActionError("Failed to update user details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          system: user.system,
          action: "TOGGLE_STATUS",
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || "Failed to change user status");
      }
    } catch (err) {
      alert("Error toggling user status");
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser.id,
          system: selectedUser.system,
          action: "RESET_PASSWORD",
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionError(data.error || "Failed to reset password");
        setSubmitting(false);
        return;
      }

      setActionSuccess(`Password reset successfully for ${selectedUser.name}`);
      setResetModalOpen(false);
      setNewPassword("");
      setSelectedUser(null);
    } catch {
      setActionError("Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Are you sure you want to delete user ${user.name} (${user.username})? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/users?id=${user.id}&system=${user.system}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`User ${user.name} removed.`);
        fetchUsers();
      } else {
        alert(data.error || "Failed to delete user");
      }
    } catch {
      alert("Failed to delete user");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-600 font-semibold uppercase tracking-wider">
            <Users className="w-4 h-4 text-cyan-500" /> System CMS
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Unified User Management</h1>
          <p className="text-xs text-gray-500">
            Create, edit, assign roles, view credentials, suspend, and manage users across all DVLA portal systems.
          </p>
        </div>

        <button
          onClick={() => {
            setActionError(null);
            setShowCreatePassword(false);
            setCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Create New User Account
        </button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            {actionSuccess}
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tab Selection */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 border border-gray-200 rounded-xl overflow-x-auto">
          {[
            { id: "ALL", label: "All Portals" },
            { id: "TEMPSTAFF", label: "TempStaff HR" },
            { id: "RETIREMENT", label: "Retirement" },
            { id: "HR_LETTERS", label: "HR Letters" },
            { id: "SUPER_ADMIN", label: "Super Admins" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                selectedTab === tab.id
                  ? "bg-white text-cyan-700 shadow border border-gray-200 font-bold"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, username, role..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Portal / System</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 font-medium">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-cyan-500 mb-2" />
                    Loading system user accounts...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 font-medium">
                    No matching user accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={`${user.system}_${user.id}`} className="hover:bg-gray-50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{user.name}</div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-2 font-mono">
                        <span>@{user.username}</span> • <span>{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                          user.system === "SUPER_ADMIN"
                            ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                            : user.system === "RETIREMENT"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : user.system === "HR_LETTERS"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {user.system}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {user.role}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          user.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-600 border-rose-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Never"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit User Button */}
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          title="Edit User Account & Role"
                          className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-300 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Status Lock */}
                        <button
                          onClick={() => handleToggleStatus(user)}
                          title={user.status === "ACTIVE" ? "Suspend Account" : "Activate Account"}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            user.status === "ACTIVE"
                              ? "bg-white border-gray-200 text-gray-500 hover:text-amber-600 hover:border-amber-300"
                              : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          {user.status === "ACTIVE" ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowResetPassword(false);
                            setNewPassword("");
                            setResetModalOpen(true);
                          }}
                          title="Reset Password"
                          className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-cyan-600 hover:border-cyan-300 transition cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteUser(user)}
                          title="Delete User Account"
                          className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-500 hover:bg-rose-100 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-cyan-500" />
                Create Portal User Account
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Target System / Portal</label>
                <select
                  value={createForm.system}
                  onChange={(e) => {
                    const sys = e.target.value;
                    let defaultRole = "HR Officer";
                    if (sys === "TEMPSTAFF") defaultRole = "HR Officer";
                    if (sys === "RETIREMENT") defaultRole = "HR_OFFICER";
                    if (sys === "SUPER_ADMIN") defaultRole = "Super Administrator";
                    if (sys === "HR_LETTERS") defaultRole = "HR_OFFICER";
                    setCreateForm({ ...createForm, system: sys, role: defaultRole });
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-cyan-400"
                >
                  <option value="TEMPSTAFF">TempStaff System (/dashboard)</option>
                  <option value="RETIREMENT">Retirement Management System (/retirement)</option>
                  <option value="HR_LETTERS">HR Letters &amp; Documents Portal (/hrletters)</option>
                  <option value="SUPER_ADMIN">Super Admin Command Center (/admin)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Kwame Mensah"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-cyan-400 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Username</label>
                  <input
                    type="text"
                    required
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="e.g. kmensah"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-cyan-400 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="kmensah@dvla.gov.gh"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-cyan-400 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Assigned Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-cyan-400"
                  >
                    {createForm.system === "TEMPSTAFF" && (
                      <>
                        <option value="HR Officer">HR Officer (Creates staff, requests renewals)</option>
                        <option value="Approval Officer">Approval Officer (Approves staff entries)</option>
                        <option value="Validation Officer">Validation Officer (Validates staff &amp; exports)</option>
                        <option value="HR Manager">HR Manager (Full access &amp; per-staff audit logs)</option>
                        <option value="Superadmin / HR Director">Superadmin / HR Director (Full Cross-Platform)</option>
                      </>
                    )}
                    {createForm.system === "RETIREMENT" && (
                      <>
                        <option value="HR_OFFICER">HR Officer</option>
                        <option value="HR_ADMINISTRATOR">HR Administrator</option>
                      </>
                    )}
                    {createForm.system === "HR_LETTERS" && (
                      <>
                        <option value="HR_OFFICER">HR Officer — Draft &amp; Submit letters</option>
                        <option value="HR_DIRECTOR">HR Director — Approve, Sign &amp; Issue letters</option>
                      </>
                    )}
                    {createForm.system === "SUPER_ADMIN" && (
                      <option value="Super Administrator">Super Administrator</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Initial Password with Eye View Password Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Initial Password</label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? "text" : "password"}
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Enter password..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-10 py-2 text-xs text-gray-900 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    title={showCreatePassword ? "Hide password" : "View password typed"}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700"
                  >
                    {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create User Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER ACCOUNT MODAL */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600" />
                Edit User Account: {selectedUser.name}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                {actionError}
              </div>
            )}

            <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-gray-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-cyan-400 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-gray-700">Username (Read-Only)</label>
                  <input
                    type="text"
                    disabled
                    value={editForm.username}
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500 font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-gray-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-gray-700">Assigned Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-cyan-400"
                  >
                    {editForm.system === "TEMPSTAFF" && (
                      <>
                        <option value="HR Officer">HR Officer</option>
                        <option value="Approval Officer">Approval Officer</option>
                        <option value="Validation Officer">Validation Officer</option>
                        <option value="HR Manager">HR Manager</option>
                        <option value="Superadmin / HR Director">Superadmin / HR Director</option>
                      </>
                    )}
                    {editForm.system === "RETIREMENT" && (
                      <>
                        <option value="HR_OFFICER">HR Officer</option>
                        <option value="HR_ADMINISTRATOR">HR Administrator</option>
                      </>
                    )}
                    {editForm.system === "HR_LETTERS" && (
                      <>
                        <option value="HR_OFFICER">HR Officer</option>
                        <option value="HR_DIRECTOR">HR Director</option>
                      </>
                    )}
                    {editForm.system === "SUPER_ADMIN" && (
                      <option value="Super Administrator">Super Administrator</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Password Change Field with Eye View Toggle */}
              <div className="space-y-1.5">
                <label className="font-semibold text-gray-700">
                  Update Password (Leave blank to keep existing password)
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Enter new password to reset..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-10 py-2 text-xs text-gray-900 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    title={showEditPassword ? "Hide password" : "View password typed"}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                Reset Password for {selectedUser.name}
              </h3>
              <button onClick={() => setResetModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <p className="text-xs text-gray-500">
                Enter a new password for account <b className="text-gray-800">@{selectedUser.username}</b> in portal <b className="text-cyan-600">{selectedUser.system}</b>.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">New Password</label>
                <div className="relative">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-10 py-2 text-xs text-gray-900 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    title={showResetPassword ? "Hide password" : "View password typed"}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save New Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
