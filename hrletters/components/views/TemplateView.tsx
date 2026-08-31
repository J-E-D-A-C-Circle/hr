"use client";

import React, { useEffect, useState } from "react";
import { FileCode2, Plus, Edit3, Tag, X } from "lucide-react";
import { Select } from "../ui/Select";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

const TYPE_OPTIONS = [
  { value: "APPOINTMENT",     label: "Appointment Letter" },
  { value: "PROMOTION",       label: "Promotion Letter" },
  { value: "CONFIRMATION",    label: "Confirmation Letter" },
  { value: "TRANSFER",        label: "Transfer Letter" },
  { value: "WARNING",         label: "Warning Letter" },
  { value: "LEAVE_APPROVAL",  label: "Leave Approval" },
  { value: "CONTRACT_RENEWAL",label: "Contract Renewal" },
];

const TAG_LIST = ["staff_name", "staff_id", "job_title", "department", "start_date", "salary_grade", "reporting_officer"];

export const TemplateView: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("APPOINTMENT");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/templates").then((r) => r.json())
      .then((d) => { if (d.success) setTemplates(d.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditingTemplate(null);
    };
    if (editingTemplate !== null) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingTemplate]);

  const handleInsertTag = (tag: string) => setContent((p) => p + ` {{${tag}}}`);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setSaving(true);
    const method = editingTemplate?.id ? "PUT" : "POST";
    const body = editingTemplate?.id
      ? { id: editingTemplate.id, title, description, content }
      : { title, type, description, content };
    const res = await fetch("/api/templates", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json();
    if (d.success) {
      setEditingTemplate(null); setTitle(""); setContent(""); setDescription("");
      load();
    }
    setSaving(false);
  };

  const openEditor = (tmpl?: any) => {
    if (tmpl) {
      setEditingTemplate(tmpl); setTitle(tmpl.title); setType(tmpl.type);
      setDescription(tmpl.description || ""); setContent(tmpl.content);
    } else {
      setEditingTemplate({}); setTitle(""); setType("APPOINTMENT"); setDescription(""); setContent("");
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";
  const inputStyle = { background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text-1)" };

  return (
    <div className="space-y-5 animate-fade-up">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-1)" }}>Letter Templates</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-3)" }}>
            Manage standard templates with auto-fill variable placeholders
          </p>
        </div>
        <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={() => openEditor()}>
          New Template
        </Button>
      </div>

      {/* ── Template Cards Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-4 rounded w-24" />
              <div className="skeleton h-5 rounded w-3/4" />
              <div className="skeleton h-3 rounded w-full" />
              <div className="skeleton h-3 rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <div key={tmpl.id} className="card flex flex-col overflow-hidden">
              <div className="p-5 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="info">{tmpl.type}</Badge>
                  <span className="text-[11px] font-mono" style={{ color: "var(--color-text-4)" }}>v{tmpl.version}</span>
                </div>
                <h3 className="font-semibold text-sm" style={{ color: "var(--color-text-1)" }}>{tmpl.title}</h3>
                {tmpl.description && (
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-3)" }}>{tmpl.description}</p>
                )}
                {/* Body preview */}
                <div
                  className="mt-3 p-3 rounded-lg text-xs font-serif leading-relaxed line-clamp-3"
                  style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-2)" }}
                >
                  {tmpl.content.slice(0, 200)}…
                </div>
              </div>
              <div className="flex items-center justify-end px-5 py-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                <Button variant="secondary" size="sm" icon={<Edit3 className="w-3.5 h-3.5" />} onClick={() => openEditor(tmpl)}>
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Editor Modal ── */}
      {editingTemplate !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingTemplate(null);
          }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] my-auto flex flex-col rounded-xl border shadow-2xl animate-fade-up shrink-0"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--color-text-1)" }}>
                <FileCode2 className="w-4 h-4 text-blue-500" />
                {editingTemplate.id ? "Edit Template" : "New Letter Template"}
              </h3>
              <button
                onClick={() => setEditingTemplate(null)}
                className="p-1.5 rounded-lg hover:opacity-70 cursor-pointer"
                style={{ color: "var(--color-text-3)" }}
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-20">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-2)" }}>
                    Template Title <span className="text-red-500">*</span>
                  </label>
                  <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    className={inputCls} style={inputStyle} />
                </div>
                <div className="relative z-30">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-2)" }}>Letter Type</label>
                  <Select value={type} onChange={setType} options={TYPE_OPTIONS} disabled={!!editingTemplate.id} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-2)" }}>Description</label>
                <input type="text" placeholder="Short description for this template" value={description} onChange={(e) => setDescription(e.target.value)}
                  className={inputCls} style={inputStyle} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold" style={{ color: "var(--color-text-2)" }}>
                    Content <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-4)" }}>
                    <Tag className="w-3 h-3" /> Click to insert:
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {TAG_LIST.map((tag) => (
                    <button
                      key={tag} type="button" onClick={() => handleInsertTag(tag)}
                      className="px-2 py-1 rounded-md text-[11px] font-mono font-semibold border cursor-pointer transition-opacity hover:opacity-75"
                      style={{ background: "var(--color-accent-subtle)", borderColor: "var(--color-border)", color: "var(--color-accent)" }}
                    >
                      {`{${tag}}`}
                    </button>
                  ))}
                </div>
                <textarea required rows={8} value={content} onChange={(e) => setContent(e.target.value)}
                  className={`${inputCls} resize-none font-serif leading-relaxed`} style={inputStyle} />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t shrink-0" style={{ borderColor: "var(--color-border)" }}>
                <Button variant="secondary" size="md" type="button" onClick={() => setEditingTemplate(null)}>Cancel</Button>
                <Button variant="primary" size="md" type="submit" loading={saving}>Save Template</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
