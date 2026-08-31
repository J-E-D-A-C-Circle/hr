"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  icon,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      {/* ── Trigger button ── */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer outline-none transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-1)",
          boxShadow: open ? "0 0 0 2px rgba(59,130,246,0.18)" : "none",
          borderColor: open ? "var(--color-accent)" : "var(--color-border)",
        }}
      >
        <span className="flex items-center gap-2 min-w-0 overflow-hidden">
          {icon && (
            <span className="shrink-0 w-4 h-4 flex items-center" style={{ color: "var(--color-text-3)" }}>
              {icon}
            </span>
          )}
          <span className="truncate text-sm">
            {selected
              ? selected.label
              : <span style={{ color: "var(--color-text-4)", fontWeight: 400 }}>{placeholder}</span>}
          </span>
        </span>
        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform duration-150"
          style={{
            color: "var(--color-text-3)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* ── Dropdown panel — solid, no glass ── */}
      {open && (
        <div
          className="absolute z-50 left-0 right-0 mt-1 rounded-lg overflow-hidden animate-fade-up"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer transition-colors duration-75 text-left"
                  style={
                    isSelected
                      ? { background: "var(--color-accent)", color: "#fff", fontWeight: 600 }
                      : { color: "var(--color-text-1)", fontWeight: 400 }
                  }
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "var(--color-border-subtle)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 opacity-90" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
