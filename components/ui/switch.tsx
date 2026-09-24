"use client";

import * as React from "react";

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, disabled = false, className = "", size = "md", ...props }, ref) => {
    const handleToggle = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    const config = {
      sm: { container: "w-8 h-4.5 p-0.5", thumb: "w-3.5 h-3.5", translate: "translate-x-3.5" },
      md: { container: "w-11 h-6 p-1", thumb: "w-4 h-4", translate: "translate-x-5" },
      lg: { container: "w-14 h-7 p-1", thumb: "w-5 h-5", translate: "translate-x-7" },
    }[size];

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        ref={ref}
        onClick={handleToggle}
        className={`relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer ${
          checked ? "bg-emerald-600 dark:bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${config.container} ${className}`}
        {...props}
      >
        <span
          className={`pointer-events-none inline-block transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            config.thumb
          } ${checked ? config.translate : "translate-x-0"}`}
        />
      </button>
    );
  }
);

Switch.displayName = "Switch";
