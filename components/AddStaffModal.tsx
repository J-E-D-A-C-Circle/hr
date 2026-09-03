"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, Calendar, Building, CreditCard, ShieldCheck, CheckCircle2, AlertCircle, Save, X, Hash } from "lucide-react";
import { calculateEndDate, formatDateForInput, parseFlexibleDate } from "@/lib/status";
import DateInput from "@/components/DateInput";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newStaff?: any) => void;
}

export default function AddStaffModal({ isOpen, onClose, onSuccess }: AddStaffModalProps) {
  const [formData, setFormData] = useState({
    staff_code: "",
    full_name: "",
    date_of_birth: "",
    gender: "",
    email: "",
    ssnit_no: "",
    nia_number: "",
    role: "",
    department: "",
    phone: "",
    bank_name: "",
    bank_branch: "",
    bank_account: "",
    salary: "",
    start_date: formatDateForInput(new Date()),
    end_date: formatDateForInput(calculateEndDate(new Date())),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateCodeError, setDuplicateCodeError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        staff_code: "",
        full_name: "",
        date_of_birth: "",
        gender: "",
        email: "",
        ssnit_no: "",
        nia_number: "",
        role: "",
        department: "",
        phone: "",
        bank_name: "",
        bank_branch: "",
        bank_account: "",
        salary: "",
        start_date: formatDateForInput(new Date()),
        end_date: formatDateForInput(calculateEndDate(new Date())),
      });
      setError(null);
      setDuplicateCodeError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.start_date) {
      const startObj = parseFlexibleDate(formData.start_date);
      if (startObj && !isNaN(startObj.getTime())) {
        const endObj = calculateEndDate(startObj);
        setFormData((prev) => ({ ...prev, end_date: formatDateForInput(endObj) }));
      }
    }
  }, [formData.start_date]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      setError("Full Name is required.");
      return;
    }
    if (!formData.start_date) {
      setError("Contract Start Date is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create staff member record.");
      }

      // Reset form fields on success
      setFormData({
        staff_code: "",
        full_name: "",
        date_of_birth: "",
        gender: "",
        email: "",
        ssnit_no: "",
        nia_number: "",
        role: "",
        department: "",
        phone: "",
        bank_name: "",
        bank_branch: "",
        bank_account: "",
        salary: "",
        start_date: formatDateForInput(new Date()),
        end_date: formatDateForInput(calculateEndDate(new Date())),
      });

      if (onSuccess) {
        onSuccess(json.data);
      }
      onClose();
    } catch (err: any) {
      const msg = err.message || "An unexpected error occurred.";
      setError(msg);
      if (msg.toLowerCase().includes("already exists") || msg.toLowerCase().includes("taken")) {
        setDuplicateCodeError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Add Temporary Staff Member
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enroll staff with rolling contract window (capped at Dec 31 year-end) & SSNIT statutory record
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Initial Contract Window */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>1. Contract Window (Auto 6-Month Calculation - Editable)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contract Start Date (DD/MM/YYYY) <span className="text-rose-500">*</span>
                </label>
                <DateInput
                  required
                  name="start_date"
                  value={formData.start_date}
                  onChange={(val) => setFormData((prev) => ({ ...prev, start_date: val }))}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contract End Date (DD/MM/YYYY) (Editable)
                </label>
                <DateInput
                  name="end_date"
                  value={formData.end_date || ""}
                  onChange={(val) => setFormData((prev) => ({ ...prev, end_date: val }))}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Personal & Role Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Building className="h-4 w-4 text-emerald-500" />
              <span>2. Employee & SSNIT Details</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="full_name"
                  placeholder="e.g. Kwame Mensah"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Date of Birth (DD/MM/YYYY)</span>
                </label>
                <DateInput
                  name="date_of_birth"
                  value={formData.date_of_birth || ""}
                  onChange={(val) => setFormData((prev) => ({ ...prev, date_of_birth: val }))}
                  placeholder="DD/MM/YYYY (e.g. 25/08/1995)"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Gender
                </label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) => setFormData({ ...formData, gender: val })}
                >
                  <SelectTrigger className="w-full h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select Gender..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. employee@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Staff Code / Employee ID
                </label>
                <input
                  type="text"
                  name="staff_code"
                  placeholder="e.g. TEMP-905"
                  value={formData.staff_code}
                  onChange={(e) => {
                    setDuplicateCodeError(null);
                    handleChange(e);
                  }}
                  className={`w-full p-2.5 rounded-xl border ${
                    duplicateCodeError
                      ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  } font-mono`}
                />
                {duplicateCodeError && (
                  <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{duplicateCodeError}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5 text-emerald-600" />
                  <span>SSNIT Number</span>
                </label>
                <input
                  type="text"
                  name="ssnit_no"
                  placeholder="e.g. C123456789012"
                  value={formData.ssnit_no}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5 text-emerald-600" />
                  <span>NIA Number (Ghana Card)</span>
                </label>
                <input
                  type="text"
                  name="nia_number"
                  placeholder="e.g. GHA-712345678-9"
                  value={formData.nia_number}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Station / Location
                </label>
                <input
                  type="text"
                  name="department"
                  placeholder="e.g. TEMA HARBOUR, WEIJA OFFICE"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role / Designation
                </label>
                <input
                  type="text"
                  name="role"
                  placeholder="e.g. Temporary Staff"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  placeholder="e.g. +233 (55) 123-4567"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payroll & Bank Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              <span>3. Payroll & Bank Details</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Salary (GH₵)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="salary"
                  placeholder="1400.00"
                  value={formData.salary}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bank_name"
                  placeholder="e.g. GCB Bank / Stanbic"
                  value={formData.bank_name}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Branch
                </label>
                <input
                  type="text"
                  name="bank_branch"
                  placeholder="e.g. High Street / Airport"
                  value={formData.bank_branch}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Account No.
                </label>
                <input
                  type="text"
                  name="bank_account"
                  placeholder="e.g. 1029384756"
                  value={formData.bank_account}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? "Enrolling Staff..." : "Save Staff & Contract"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
