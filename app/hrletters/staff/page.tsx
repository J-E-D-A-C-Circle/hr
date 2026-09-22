"use client";

import React, { useEffect, useState } from "react";
import { Users, Plus, Search, RefreshCw, CheckCircle2, X } from "lucide-react";
import { Badge } from "@/components/hrletters/ui/Badge";
import { Button } from "@/components/hrletters/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/hrletters/ui/table";
import { Pagination } from "@/components/hrletters/ui/Pagination";
import { format } from "date-fns";

const inputCls = "w-full px-3 py-2 rounded-lg border text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";
const inputStyle = { background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text-1)" };

export default function HrLettersStaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [form, setForm] = useState({
    staffId: "", fullName: "", department: "", jobTitle: "",
    email: "", phone: "", appointmentDate: "", salaryGrade: "", reportingOfficer: "",
  });

  useEffect(() => { loadStaff(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? staff.filter(s =>
      s.fullName.toLowerCase().includes(q) || s.staffId.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    ) : staff);
    setCurrentPage(1);
  }, [staff, search]);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hrletters/staff");
      const data = await res.json();
      if (data.success) setStaff(data.data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/hrletters/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Staff record created."); setShowForm(false);
        setForm({ staffId: "", fullName: "", department: "", jobTitle: "", email: "", phone: "", appointmentDate: "", salaryGrade: "", reportingOfficer: "" });
        loadStaff();
      } else setError(data.error);
    } finally {
      setSaving(false);
    }
  };

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-1)" }}>HR Staff Registry</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-3)" }}>Manage staff records used as recipients in HR Letters</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={loadStaff}>Refresh</Button>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "Add Staff"}</Button>
        </div>
      </div>

      {success && (
        <div className="px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{success}<button onClick={() => setSuccess(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
          {error}<button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {showForm && (
        <div className="card p-6 animate-fade-up">
          <h3 className="text-sm font-bold mb-4" style={{ color: "var(--color-text-1)" }}>Add Staff Record</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: "staffId", label: "Staff ID", required: true, placeholder: "e.g. DVLA-712986" },
              { key: "fullName", label: "Full Name", required: true, placeholder: "e.g. Kofi Mensah" },
              { key: "department", label: "Department", required: true, placeholder: "e.g. Driver Licensing" },
              { key: "jobTitle", label: "Job Title / Position", required: true, placeholder: "e.g. Licensing Officer" },
              { key: "email", label: "Email Address", required: true, placeholder: "kofi@dvla.gov.gh", type: "email" },
              { key: "phone", label: "Phone Number", required: true, placeholder: "+233 24 000 0000" },
              { key: "appointmentDate", label: "Appointment / Start Date", required: true, placeholder: "e.g. 1 September 2026" },
              { key: "salaryGrade", label: "Salary Grade (Optional)", required: false, placeholder: "e.g. Grade 12 Step 1" },
              { key: "reportingOfficer", label: "Reporting Officer (Optional)", required: false, placeholder: "e.g. Director HR" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-2)" }}>{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                <input
                  type={f.type || "text"} className={inputCls} style={inputStyle}
                  value={(form as any)[f.key]} placeholder={f.placeholder} required={f.required}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="col-span-2 lg:col-span-3 flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm" loading={saving} icon={<Users className="w-4 h-4" />}>Save Staff Record</Button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b flex items-center gap-3" style={{ borderColor: "var(--color-border)" }}>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-4)" }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff..." className="input-base pl-9" style={{ paddingLeft: "2.25rem" }} />
          </div>
          <span className="text-xs ml-auto" style={{ color: "var(--color-text-4)" }}>{filtered.length} staff</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {["Staff ID", "Full Name", "Department", "Job Title", "Email", "Status", "Letters", "Joined"].map(h => <TableHead key={h}>{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>{Array(8).fill(0).map((_, j) => <TableCell key={j}><div className="skeleton h-4 rounded" style={{ width: "70%" }} /></TableCell>)}</TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-sm" style={{ color: "var(--color-text-4)" }}>
                  {search ? "No staff match your search." : "No staff records yet. Add your first one above."}
                </TableCell>
              </TableRow>
            ) : paginated.map(s => (
              <TableRow key={s.id}>
                <TableCell><code className="text-xs font-mono font-semibold" style={{ color: "var(--color-accent)" }}>{s.staffId}</code></TableCell>
                <TableCell className="font-semibold text-sm" style={{ color: "var(--color-text-1)" }}>{s.fullName}</TableCell>
                <TableCell className="text-sm" style={{ color: "var(--color-text-2)" }}>{s.department}</TableCell>
                <TableCell className="text-xs" style={{ color: "var(--color-text-3)" }}>{s.jobTitle}</TableCell>
                <TableCell className="text-xs" style={{ color: "var(--color-text-3)" }}>{s.email}</TableCell>
                <TableCell>
                  <Badge variant={s.status === "ACTIVE" ? "success" : s.status === "PROBATION" ? "warning" : "muted"}>{s.status}</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}>{s._count?.letters ?? 0} letters</span>
                </TableCell>
                <TableCell className="text-xs" style={{ color: "var(--color-text-4)" }}>{format(new Date(s.createdAt), "dd MMM yyyy")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination currentPage={currentPage} totalPages={Math.ceil(filtered.length / pageSize)} totalItems={filtered.length} pageSize={pageSize} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
