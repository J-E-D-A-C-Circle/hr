'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string | number | null;
}

interface ShadcnSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function ShadcnSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  className = '',
  disabled = false,
}: ShadcnSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border transition-all text-slate-900 shadow-xs focus:outline-none ${
          open
            ? 'border-[#0d5c2e] ring-2 ring-[#0d5c2e]/20'
            : 'border-slate-300 hover:border-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'cursor-pointer'}`}
      >
        <span className="truncate">
          {selectedOption ? (
            <span className="flex items-center gap-2">
              <span>{selectedOption.label}</span>
              {selectedOption.badge !== undefined && selectedOption.badge !== null && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-[#0d5c2e]">
                  {selectedOption.badge}
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-400 font-medium">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ml-2 ${open ? 'rotate-180 text-[#0d5c2e]' : ''}`} />
      </button>

      {/* Popover Menu */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[180px] max-h-60 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-xl py-1 text-xs custom-scrollbar animate-in fade-in-50 zoom-in-95">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer font-medium transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 text-[#0d5c2e] font-extrabold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="truncate pr-2">{option.label}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {option.badge !== undefined && option.badge !== null && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        isSelected ? 'bg-[#0d5c2e] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {option.badge}
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#0d5c2e]" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
