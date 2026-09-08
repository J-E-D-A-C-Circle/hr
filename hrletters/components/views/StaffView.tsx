'use client';

import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, UserCheck, Mail, Building2, Briefcase, Calendar, Phone, FileText, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';

interface StaffViewProps {
  onSelectStaffForLetter?: (staff: any) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({ onSelectStaffForLetter }) => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [department, setDepartment] = useState('Driver Licensing & Administration');
  const [jobTitle, setJobTitle] = useState('Senior Licensing Officer');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+233 24 123 4567');
  const [appointmentDate, setAppointmentDate] = useState('01/09/2026');
  const [salaryGrade, setSalaryGrade] = useState('DVLA Grade 8 Step 1');
  const [reportingOfficer, setReportingOfficer] = useState('Director HR');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      if (data.success) {
        setStaffList(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !department || !jobTitle) {
      setErrorMsg('Please fill in required fields (Full Name, Department, Job Title).');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const generatedId = staffId || `DVLA-${Math.floor(100000 + Math.random() * 900000)}`;
    const formattedEmail = email || `${generatedId.toLowerCase().replace(/[^a-z0-9]/g, '')}@dvla.gov.gh`;

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: generatedId,
          fullName,
          department,
          jobTitle,
          email: formattedEmail,
          phone,
          appointmentDate,
          salaryGrade,
          reportingOfficer,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        resetForm();
        loadStaff();
      } else {
        setErrorMsg(data.error || 'Failed to create staff record.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server error creating staff record.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setStaffId('');
    setDepartment('Driver Licensing & Administration');
    setJobTitle('Senior Licensing Officer');
    setEmail('');
    setPhone('+233 24 123 4567');
    setAppointmentDate('01/09/2026');
    setSalaryGrade('DVLA Grade 8 Step 1');
    setReportingOfficer('Director HR');
    setErrorMsg(null);
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.staffId.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase()) ||
      s.jobTitle.toLowerCase().includes(search.toLowerCase())
  );

  const inputCls =
    'w-full px-3 py-2 rounded-lg border text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500';
  const inputStyle = { background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-1)' };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-1)' }}>
            Staff Record Directory & Pre-Registration
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-3)' }}>
            Step 1: Capture employee profiles and link official letters to DVLA staff records
          </p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
          Register New Staff
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-4)' }} />
        <input
          type="text"
          placeholder="Search staff by Name, Staff ID, Department, or Position..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} pl-9`}
          style={inputStyle}
        />
      </div>

      {/* Staff Table */}
      <div className="card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member & ID</TableHead>
              <TableHead>Department & Role</TableHead>
              <TableHead>DVLA Webmail</TableHead>
              <TableHead>Date & Grade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--color-text-3)' }}>
                  Loading staff records from system database...
                </TableCell>
              </TableRow>
            ) : filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--color-text-3)' }}>
                  No staff records found. Click "Register New Staff" to create an employee record.
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                        {staff.fullName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm" style={{ color: 'var(--color-text-1)' }}>
                          {staff.fullName}
                        </div>
                        <code className="text-[11px] font-mono" style={{ color: 'var(--color-accent)' }}>
                          {staff.staffId}
                        </code>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-semibold" style={{ color: 'var(--color-text-1)' }}>
                      {staff.jobTitle}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--color-text-3)' }}>
                      {staff.department}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--color-text-2)' }}>
                      <Mail className="w-3 h-3 text-amber-500" />
                      {staff.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs" style={{ color: 'var(--color-text-2)' }}>
                      {staff.appointmentDate}
                    </div>
                    <div className="text-[11px] font-mono text-gray-500">
                      {staff.salaryGrade || 'Grade 8'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <UserCheck className="w-3 h-3" /> ACTIVE
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {onSelectStaffForLetter && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<FileText className="w-3.5 h-3.5" />}
                        onClick={() => onSelectStaffForLetter(staff)}
                      >
                        Generate Letter
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 h-full w-full z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div
            className="w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col my-auto"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            {/* Modal Header */}
            <div className="bg-[#0F5132] text-white px-8 py-6 border-b-4 border-[#D97706] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center font-bold text-xl shadow-inner">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg tracking-wide text-white">Register Staff Profile</h3>
                  <p className="text-xs text-emerald-100 font-medium">Step 1: DVLA HR Master Registry Employee Pre-Registration</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleCreateStaff} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-8 space-y-6 overflow-y-auto max-h-[68vh]">
                {errorMsg && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-semibold flex items-center gap-2">
                    {errorMsg}
                  </div>
                )}

                {/* Section 1: Basic Information */}
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3 pb-1 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    1. Basic Identification
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-2)' }}>
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kwabena Mensah"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={`${inputCls} h-11 px-4 text-sm`}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-2)' }}>
                        Staff ID Number
                      </label>
                      <input
                        type="text"
                        placeholder="Auto-generated if left blank (e.g. DVLA-712986)"
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value)}
                        className={`${inputCls} h-11 px-4 text-sm font-mono`}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Department & Designation */}
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3 pb-1 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    2. Department & Position Placement
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-2)' }}>
                        Department <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Driver Licensing & Administration"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className={`${inputCls} h-11 px-4 text-sm`}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-2)' }}>
                        Job Title / Position <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Senior Licensing Officer"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className={`${inputCls} h-11 px-4 text-sm`}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Contact & DVLA Webmail */}
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3 pb-1 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    3. Official Contact & Webmail Dispatch
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-2)' }}>
                        DVLA Webmail Address (@dvla.gov.gh)
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. kwabena.mensah@dvla.gov.gh"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`${inputCls} h-11 px-4 text-sm font-mono`}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-2)' }}>
                        Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +233 24 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`${inputCls} h-11 px-4 text-sm`}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Terms & Reporting Line */}
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3 pb-1 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    4. Appointment Terms & Reporting
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-2)' }}>
                        Appointment Date
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 01/09/2026"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className={`${inputCls} h-11 px-4 text-sm`}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-2)' }}>
                        Salary Grade
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. DVLA Grade 8 Step 1"
                        value={salaryGrade}
                        onChange={(e) => setSalaryGrade(e.target.value)}
                        className={`${inputCls} h-11 px-4 text-sm`}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-2)' }}>
                        Reporting Officer
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Director HR"
                        value={reportingOfficer}
                        onChange={(e) => setReportingOfficer(e.target.value)}
                        className={`${inputCls} h-11 px-4 text-sm`}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Fixed Action Footer */}
              <div
                className="px-8 py-4 border-t flex flex-wrap items-center justify-between gap-4 shrink-0"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--color-text-3)' }}>
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Record will sync automatically with official DVLA HR database.</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" size="md" type="button" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="md" type="submit" disabled={saving}>
                    {saving ? 'Creating Record...' : 'Save Staff Profile'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
