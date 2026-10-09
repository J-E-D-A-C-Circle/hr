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
  enableSearch?: boolean;
  searchPlaceholder?: string;
}

export default function ShadcnSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  className = '',
  disabled = false,
  enableSearch = false,
  searchPlaceholder = 'Search...',
}: ShadcnSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = enableSearch
    ? options.filter((opt) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return (
          opt.label.toLowerCase().includes(query) ||
          opt.value.toLowerCase().includes(query)
        );
      })
    : options;

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!enableSearch) return;

    if (event.key === 'Backspace') {
      setOpen(true);
      setSearchQuery((prev) => prev.slice(0, -1));
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      setOpen(true);
      setSearchQuery((prev) => `${prev}${event.key}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onKeyDown={handleTriggerKeyDown}
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
        <div className="absolute z-50 mt-1.5 w-full min-w-[180px] max-h-72 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-xl py-1 text-xs custom-scrollbar animate-in fade-in-50 zoom-in-95">
          {enableSearch && (
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-2 pb-2 pt-2">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                <span className="text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <circle cx="11" cy="11" r="6" />
                    <path d="m16 16 5 5" />
                  </svg>
                </span>
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full border-none bg-transparent text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div className="px-3.5 py-3 text-center text-[11px] text-slate-500">
              No matching option found.
            </div>
          ) : (
            filteredOptions.map((option) => {
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
            })
          )}
        </div>
      )}
    </div>
  );
}
