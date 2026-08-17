"use client";

import React, { useRef } from "react";
import { Calendar } from "lucide-react";
import { parseFlexibleDate, formatDateToISO } from "@/lib/status";

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  id?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  iconColor?: string;
}

/**
 * Format string as DD/MM/YYYY while typing
 */
export function formatAsDDMMYYYY(raw: string): string {
  if (!raw) return "";

  // Remove non-digit characters
  const digits = raw.replace(/\D/g, "");

  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

export default function DateInput({
  value,
  onChange,
  name,
  id,
  required = false,
  placeholder = "DD/MM/YYYY",
  className = "",
  disabled = false,
  iconColor = "text-slate-400",
}: DateInputProps) {
  const hiddenDateRef = useRef<HTMLInputElement>(null);

  // Handle typing in text input with DD/MM/YYYY auto-slash masking
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // If user is deleting slash, allow deletion
    if (inputValue.length < value.length) {
      onChange(inputValue);
      return;
    }

    const formatted = formatAsDDMMYYYY(inputValue);
    onChange(formatted);
  };

  // Convert hidden date picker selection (YYYY-MM-DD) to DD/MM/YYYY format
  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoVal = e.target.value;
    if (!isoVal) return;
    const parsed = parseFlexibleDate(isoVal);
    if (parsed) {
      const day = String(parsed.getDate()).padStart(2, "0");
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const year = parsed.getFullYear();
      onChange(`${day}/${month}/${year}`);
    }
  };

  // Get current ISO string for hidden date picker
  const currentIsoDate = () => {
    const parsed = parseFlexibleDate(value);
    return parsed ? formatDateToISO(parsed) : "";
  };

  const openPicker = () => {
    if (disabled) return;
    if (hiddenDateRef.current) {
      if (typeof hiddenDateRef.current.showPicker === "function") {
        hiddenDateRef.current.showPicker();
      } else {
        hiddenDateRef.current.click();
      }
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={value || ""}
        onChange={handleInputChange}
        maxLength={10}
        className={className}
      />

      {/* Invisible HTML5 datepicker triggered via calendar button */}
      <input
        ref={hiddenDateRef}
        type="date"
        value={currentIsoDate()}
        onChange={handlePickerChange}
        className="sr-only pointer-events-none absolute opacity-0 w-0 h-0"
        tabIndex={-1}
      />

      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
        title="Open calendar date picker"
      >
        <Calendar className={`h-4 w-4 ${iconColor}`} />
      </button>
    </div>
  );
}
