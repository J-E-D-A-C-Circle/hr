"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  FileText,
  Plus,
  CheckCircle2,
  RefreshCw,
  X,
  FileEdit,
  Trash2,
  Eye,
  Search,
  Tag,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/hrletters/ui/Badge";
import { Button } from "@/components/hrletters/ui/Button";
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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

const inputCls =
  "w-full px-3 py-2 rounded-lg border text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";
const inputStyle = { background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text-1)" };

const TAG_LIST = [
  "staff_name",
  "staff_id",
  "job_title",
  "department",
  "start_date",
  "salary_grade",
  "reporting_officer",
];

const typeColorMap: Record<string, string> = {
  APPOINTMENT: "success",
  PROMOTION: "green",
  CONFIRMATION: "info",
  TRANSFER: "warning",
  WARNING: "error",
  LEAVE_APPROVAL: "muted",
  CONTRACT_RENEWAL: "draft",
} as any;

export default function HrLettersTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("APPOINTMENT");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");

  // Search & Filter
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Modals
  const [deleteModalTemplate, setDeleteModalTemplate] = useState<any | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

  // Feedback Messages
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 5000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hrletters/templates");
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data);
      } else {
        showError(data.error || "Failed to load templates.");
      }
    } catch {
      showError("Network error while loading templates.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setType("APPOINTMENT");
    setDescription("");
    setContent("");
    setShowForm(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowForm(true);
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  const handleOpenEdit = (tmpl: any) => {
    setEditingId(tmpl.id);
    setTitle(tmpl.title);
    setType(tmpl.type);
    setDescription(tmpl.description || "");
    setContent(tmpl.content);
    setShowForm(true);
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !type || !content.trim()) {
      showError("Title, Letter Type, and Template Body are required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        // Edit existing template
        const res = await fetch(`/api/hrletters/templates/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            type,
            description: description.trim(),
            content: content.trim(),
          }),
        });
        const data = await res.json();
        if (data.success) {
          showSuccess(`Template '${title}' updated successfully.`);
          resetForm();
          loadTemplates();
        } else {
          showError(data.error || "Failed to update template.");
        }
      } else {
        // Create new template
        const res = await fetch("/api/hrletters/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            type,
            description: description.trim(),
            content: content.trim(),
          }),
        });
        const data = await res.json();
        if (data.success) {
          showSuccess(`Template '${title}' created successfully.`);
          resetForm();
          loadTemplates();
        } else {
          showError(data.error || "Failed to create template.");
        }
      }
    } catch {
      showError("A network error occurred while saving the template.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalTemplate) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/hrletters/templates/${deleteModalTemplate.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(`Template '${deleteModalTemplate.title}' deleted successfully.`);
        setDeleteModalTemplate(null);
        if (editingId === deleteModalTemplate.id) {
          resetForm();
        }
        loadTemplates();
      } else {
        showError(data.error || "Failed to delete template.");
      }
    } catch {
      showError("A network error occurred while deleting the template.");
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/hrletters/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showSuccess(data.message || "Standard DVLA templates loaded.");
        loadTemplates();
      } else {
        showError(data.error || "Failed to seed default templates.");
      }
    } catch {
      showError("Network error while seeding templates.");
    } finally {
      setSaving(false);
    }
  };

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    let result = templates;
    if (typeFilter) {
      result = result.filter((t) => t.type === typeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.type.toLowerCase().includes(q) ||
          t.content.toLowerCase().includes(q)
      );
    }
    return result;
  }, [templates, search, typeFilter]);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold" style={{ color: "var(--color-text-1)" }}>
              Letter Templates Engine
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
              {templates.length} templates
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-3)" }}>
            Create, modify, and delete standardized templates with dynamic placeholder variables
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={loadTemplates}
          >
            Refresh
          </Button>
          {templates.length === 0 && (
            <Button variant="secondary" size="sm" onClick={handleSeed} loading={saving}>
              Load Default Templates
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            icon={showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            onClick={() => (showForm ? resetForm() : handleOpenCreate())}
          >
            {showForm ? "Cancel Editor" : "New Template"}
          </Button>
        </div>
      </div>

      {/* Feedback Messages */}
      {success && (
        <div className="px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2 animate-fade-up shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center justify-between gap-2 animate-fade-up shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Create / Edit Template Form */}
      {showForm && (
        <div className="card p-6 space-y-4 animate-fade-up border-emerald-500/30 ring-1 ring-emerald-500/20">
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <FileEdit className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: "var(--color-text-1)" }}>
                  {editingId ? `Edit Template: ${title}` : "Create New Letter Template"}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingId
                    ? "Updating this template will save modifications to the database and increment the version."
                    : "New templates will immediately appear in the Letter Generator dropdown."}
                </p>
              </div>
            </div>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveTemplate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-2)" }}>
                  Template Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={inputCls}
                  style={inputStyle}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Offer of Appointment (Senior Officer)"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-2)" }}>
                  Letter Classification <span className="text-red-500">*</span>
                </label>
                <Select value={type} onValueChange={(val) => setType(val)}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-2)" }}>
                Internal Description / Usage Purpose
              </label>
              <input
                type="text"
                className={inputCls}
                style={inputStyle}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Standard offer of full-time appointment for permanent staff."
              />
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="text-xs font-semibold" style={{ color: "var(--color-text-2)" }}>
                  Template Body Content <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Click placeholder:
                  </span>
                  {TAG_LIST.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setContent((p) => p + ` {{${tag}}}`)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold border cursor-pointer hover:border-emerald-500 transition-colors"
                      style={{
                        background: "var(--color-accent-subtle)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-accent)",
                      }}
                    >
                      {`{${tag}}`}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                placeholder="Type the official letter body here. Insert dynamic placeholders such as {{staff_name}}, {{job_title}}, {{salary_grade}}, etc."
                className={`${inputCls} resize-none font-serif leading-relaxed text-sm`}
                style={inputStyle}
              />
            </div>

            <div className="flex items-center gap-3 justify-end pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
              <Button type="button" variant="secondary" size="sm" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={saving}>
                {editingId ? "Save Changes to Database" : "Create Template"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates by title, description, or content..."
            className="input-base pl-9 w-full"
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Select value={typeFilter || "ALL"} onValueChange={(val) => setTypeFilter(val === "ALL" ? "" : val)}>
            <SelectTrigger className="w-[190px] h-10">
              <SelectValue placeholder="All Classifications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classifications</SelectItem>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="skeleton h-56 rounded-2xl" />
            ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText size={42} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-bold" style={{ color: "var(--color-text-2)" }}>
            {search || typeFilter ? "No templates match your filters." : "No letter templates found."}
          </p>
          <p className="text-xs mt-1 mb-4" style={{ color: "var(--color-text-4)" }}>
            Click &ldquo;New Template&rdquo; above to compose one, or restore standard DVLA templates.
          </p>
          {templates.length === 0 && (
            <Button variant="primary" size="sm" onClick={handleSeed} loading={saving}>
              Load Default DVLA Templates
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="card p-5 flex flex-col justify-between gap-4 hover:shadow-md transition border hover:border-emerald-500/40 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 rounded-xl" style={{ background: "var(--color-accent-subtle)" }}>
                    <FileText className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                      v{tmpl.version || 1}
                    </span>
                    <Badge variant={(typeColorMap[tmpl.type] as any) || "info"}>
                      {tmpl.type.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold line-clamp-1" style={{ color: "var(--color-text-1)" }}>
                    {tmpl.title}
                  </h4>
                  {tmpl.description ? (
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--color-text-3)" }}>
                      {tmpl.description}
                    </p>
                  ) : (
                    <p className="text-xs mt-0.5 italic text-slate-400">Standard document template</p>
                  )}
                </div>

                <div
                  className="text-xs p-3 rounded-lg border font-serif leading-relaxed max-h-24 overflow-hidden relative cursor-pointer"
                  style={{
                    background: "var(--color-bg)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-3)",
                  }}
                  onClick={() => setPreviewTemplate(tmpl)}
                  title="Click to view full template text"
                >
                  {tmpl.content.slice(0, 180)}...
                  <div
                    className="absolute bottom-0 left-0 right-0 h-8"
                    style={{ background: "linear-gradient(to bottom, transparent, var(--color-bg))" }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: "var(--color-border)" }}>
                <span className="text-[11px] text-slate-400">
                  {format(new Date(tmpl.createdAt), "dd MMM yyyy")}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => setPreviewTemplate(tmpl)}
                  >
                    View
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<FileEdit className="w-3.5 h-3.5 text-emerald-600" />}
                    onClick={() => handleOpenEdit(tmpl)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={() => setDeleteModalTemplate(tmpl)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Template Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewTemplate(null);
          }}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] flex flex-col p-6 rounded-2xl border shadow-2xl space-y-4 animate-fade-up overflow-hidden"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-start justify-between pb-3 border-b" style={{ borderColor: "var(--color-border)" }}>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold" style={{ color: "var(--color-text-1)" }}>
                    {previewTemplate.title}
                  </h3>
                  <Badge variant={(typeColorMap[previewTemplate.type] as any) || "info"}>
                    {previewTemplate.type.replace("_", " ")}
                  </Badge>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    v{previewTemplate.version || 1}
                  </span>
                </div>
                {previewTemplate.description && (
                  <p className="text-xs text-slate-500 mt-1">{previewTemplate.description}</p>
                )}
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4 rounded-xl border text-sm font-serif leading-relaxed whitespace-pre-wrap select-text"
              style={{ background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text-1)" }}
            >
              {previewTemplate.content}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
              <Button
                variant="secondary"
                size="sm"
                icon={<FileEdit className="w-3.5 h-3.5" />}
                onClick={() => {
                  const t = previewTemplate;
                  setPreviewTemplate(null);
                  handleOpenEdit(t);
                }}
              >
                Edit Template
              </Button>
              <Button variant="primary" size="sm" onClick={() => setPreviewTemplate(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 animate-fade-up"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-600">Delete Letter Template</h3>
                <p className="text-xs text-slate-500">{deleteModalTemplate.title}</p>
              </div>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-2)" }}>
              Are you sure you want to permanently delete this template? Any letter documents previously created with
              this template will preserve their complete text content and records.
            </p>

            <div className="p-3 rounded-lg border text-xs font-mono space-y-1" style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}>
              <p>
                <strong>Title:</strong> {deleteModalTemplate.title}
              </p>
              <p>
                <strong>Classification:</strong> {deleteModalTemplate.type}
              </p>
              <p>
                <strong>Version:</strong> v{deleteModalTemplate.version || 1}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setDeleteModalTemplate(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={handleConfirmDelete}
                loading={saving}
              >
                Permanently Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
