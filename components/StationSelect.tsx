"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, MapPin, X, Check } from "lucide-react";
import { OFFICIAL_STATIONS, isOfficialStation, normalizeStation } from "@/lib/stations";

interface StationSelectProps {
  value: string;
  onChange: (station: string) => void;
  required?: boolean;
  placeholder?: string;
  allowAll?: boolean;
  allLabel?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export default function StationSelect({
  value,
  onChange,
  required = false,
  placeholder = "Type or select a station...",
  allowAll = false,
  allLabel = "All Stations",
  disabled = false,
  id,
  className = "",
}: StationSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync display text when external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Snap back to valid value if user typed a partial string without selecting
        if (!allowAll) {
          const normalized = normalizeStation(query);
          if (isOfficialStation(normalized)) {
            if (normalized !== value) onChange(normalized);
            setQuery(normalized);
          } else {
            setQuery(value);
          }
        } else if (!query.trim()) {
          if (value !== "") onChange("");
          setQuery("");
        } else {
          setQuery(value);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query, value, allowAll, onChange]);

  const filteredStations = useMemo(() => {
    const q = query.trim().toUpperCase();
    // If input exactly matches the currently selected value and dropdown was just opened via chevron,
    // show all stations so user can easily switch.
    if (!q || (open && q === value.toUpperCase())) {
      return [...OFFICIAL_STATIONS];
    }
    const prefixMatches: string[] = [];
    const substringMatches: string[] = [];
    for (const st of OFFICIAL_STATIONS) {
      if (st.startsWith(q)) {
        prefixMatches.push(st);
      } else if (st.includes(q)) {
        substringMatches.push(st);
      }
    }
    return [...prefixMatches, ...substringMatches];
  }, [query, open, value]);

  const options = useMemo(() => {
    if (allowAll) {
      return ["", ...filteredStations];
    }
    return filteredStations;
  }, [allowAll, filteredStations]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, open]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const item = listRef.current.children[highlightIndex] as HTMLElement | undefined;
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex, open]);

  const selectStation = (station: string) => {
    onChange(station);
    setQuery(station);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1 < options.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 >= 0 ? prev - 1 : options.length - 1));
    } else if (e.key === "Enter") {
      if (options.length > 0) {
        e.preventDefault();
        selectStation(options[highlightIndex] ?? options[0]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery(value);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 pointer-events-none" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          value={open ? query : value || (allowAll ? "" : "")}
          placeholder={allowAll && !value ? allLabel : placeholder}
          onFocus={() => {
            if (!disabled) {
              setOpen(true);
            }
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-14 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50"
        />
        {/* Hidden required input ensures native form validation enforces an official selection */}
        {required && (
          <input
            type="text"
            tabIndex={-1}
            aria-hidden="true"
            required
            value={isOfficialStation(value) ? value : ""}
            onChange={() => {}}
            onInvalid={(e) => {
              (e.target as HTMLInputElement).setCustomValidity(
                "Please select a valid station from the list."
              );
            }}
            onInput={(e) => {
              (e.target as HTMLInputElement).setCustomValidity("");
            }}
            className="sr-only"
          />
        )}

        <div className="absolute right-2 flex items-center gap-1">
          {(value || query) && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Clear station"
              onClick={() => {
                onChange("");
                setQuery("");
                setOpen(true);
                inputRef.current?.focus();
              }}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label="Toggle station list"
            onClick={() => {
              if (disabled) return;
              setOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {open && !disabled && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1.5 w-full max-h-60 overflow-y-auto rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl py-1 text-sm"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2.5 text-slate-500 dark:text-slate-400 text-xs text-center">
              No matching official station found.
            </li>
          ) : (
            options.map((station, idx) => {
              const isAllOption = allowAll && station === "";
              const label = isAllOption ? allLabel : station;
              const isSelected = value === station;
              const isHighlighted = idx === highlightIndex;

              return (
                <li
                  key={station || "__ALL__"}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectStation(station);
                  }}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
                    isHighlighted
                      ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-medium"
                      : isSelected
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                      : "hover:bg-slate-200/70 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className={isAllOption ? "italic text-slate-500 dark:text-slate-400" : ""}>
                    {label}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
