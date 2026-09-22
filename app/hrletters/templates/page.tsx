"use client";

import React, { useEffect, useState } from "react";
import { FileText, Plus, CheckCircle2, RefreshCw, Loader2, X } from "lucide-react";
import { Badge } from "@/components/hrletters/ui/Badge";
import { Button } from "@/components/hrletters/ui/Button";
import { format } from "date-fns";

const TYPE_OPTIONS = [
  { value: "APPOINTMENT", label: "Appointment" },
  { value: "PROMOTION", label: "Promotion" },
  { value: "CONFIRMATION", label: "Confirmation" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "WARNING", label: "Warning" },
  { value: "LEAVE_APPROVAL", label: "Leave Approval" },
  { value: "CONTRACT_RENEWAL", label: "Contract Renewal" },
];

const inputCls = "w-full px-3 py-2 rounded-lg border text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";
const inputStyle = { background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text-1)" };

export default function HrLettersTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("APPOINTMENT");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hrletters/templates");
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/hrletters/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        loadTemplates();
      } else setError(data.error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !type || !content) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/hrletters/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, description, content }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Template created successfully.");
        setShowForm(false);
        setTitle(""); setType("APPOINTMENT"); setDescription(""); setContent("");
        loadTemplates();
      } else setError(data.error);
    } finally {
      setSaving(false);
    }
  };

  const TAG_LIST = ["staff_name", "staff_id", "job_title", "department", "start_date", "salary_grade", "reporting_officer"];

  const typeColorMap: Record<string, string> = {
    APPOINTMENT: "success", PROMOTION: "green", CONFIRMATION: "info",
    TRANSFER: "warning", WARNING: "error", LEAVE_APPROVAL: "muted", CONTRACT_RENEWAL: "draft",
  } as any;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-1)" }}>Letter Templates</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-3)" }}>Manage reusable letter templates for the HR Letters Generator</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={loadTemplates}>Refresh</Button>
          {templates.length === 0 && (
            <Button variant="secondary" size="sm" onClick={handleSeed} loading={saving}>Load Default Templates</Button>
          )}
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "New Template"}
          </Button>
        </div>
      </div>

      {/* Feedback */}
      {success && (
        <div className="px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
          <button onClick={() => setSuccess(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="card p-6 space-y-4 animate-fade-up">
          <h3 className="text-sm font-bold" style={{ color: "var(--color-text-1)" }}>Create New Template</h3>
          <form onSubmit={handleCreateTemplate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-2)" }}>Template Title <span className="text-red-500">*</span></label>
                <input type="text" className={inputCls} style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Offer of Appointment" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-2)" }}>Letter Type <span className="text-red-500">*</span></label>
                <select className={inputCls} style={inputStyle} value={type} onChange={e => setType(e.target.value)}>
                  {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-2)" }}>Description</label>
              <input type="text" className={inputCls} style={inputStyle} value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description of this template" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold" style={{ color: "var(--color-text-2)" }}>Template Body <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {TAG_LIST.map(tag => (
                    <button key={tag} type="button" onClick={() => setContent(p => p + ` {{${tag}}}`)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold border cursor-pointer"
                      style={{ background: "var(--color-accent-subtle)", borderColor: "var(--color-border)", color: "var(--color-accent)" }}>
                      {`{${tag}}`}
                    </button>
                  ))}
                </div>
              </div>
              <textarea rows={8} value={content} onChange={e => setContent(e.target.value)} required placeholder="Type the template body here. Use {{placeholders}} for dynamic fields." className={`${inputCls} resize-none font-serif leading-relaxed`} style={inputStyle} />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm" loading={saving}>Save Template</Button>
            </div>
          </form>
        </div>
      )}

      {/* Templates Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-3)" }}>No templates found</p>
          <p className="text-xs mt-1 mb-4" style={{ color: "var(--color-text-4)" }}>Click &ldquo;Load Default Templates&rdquo; to add 6 standard DVLA templates, or create your own.</p>
          <Button variant="primary" size="sm" onClick={handleSeed} loading={saving}>Load Default DVLA Templates</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map(tmpl => (
            <div key={tmpl.id} className="card p-5 flex flex-col gap-3 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-2">
                <div className="p-2 rounded-xl" style={{ background: "var(--color-accent-subtle)" }}>
                  <FileText className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
                </div>
                <Badge variant={(typeColorMap[tmpl.type] as any) || "info"}>{tmpl.type.replace("_", " ")}</Badge>
              </div>
              <div>
                <h4 className="text-sm font-bold" style={{ color: "var(--color-text-1)" }}>{tmpl.title}</h4>
                {tmpl.description && <p className="text-xs mt-1" style={{ color: "var(--color-text-3)" }}>{tmpl.description}</p>}
              </div>
              <div className="text-xs p-3 rounded-lg border font-serif leading-relaxed max-h-24 overflow-hidden relative" style={{ background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text-3)" }}>
                {tmpl.content.slice(0, 180)}...
                <div className="absolute bottom-0 left-0 right-0 h-8" style={{ background: "linear-gradient(to bottom, transparent, var(--color-bg))" }} />
              </div>
              <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--color-text-4)" }}>
                <span>v{tmpl.version}</span>
                <span>{format(new Date(tmpl.createdAt), "dd MMM yyyy")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
