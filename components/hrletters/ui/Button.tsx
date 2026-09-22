"use client";
import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary:   "bg-[#0F5132] hover:bg-[#0B3D26] text-white shadow-sm shadow-emerald-950/20 font-bold",
  secondary: "bg-[--color-surface] hover:bg-[--color-border-subtle] text-[--color-text-1] border border-[--color-border]",
  ghost:     "hover:bg-[--color-border-subtle] text-[--color-text-2]",
  danger:    "bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-600/20",
  success:   "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm:  "px-3 py-1.5 text-xs gap-1.5",
  md:  "px-4 py-2 text-sm gap-2",
  lg:  "px-5 py-2.5 text-sm gap-2",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  loading,
  children,
  className = "",
  disabled,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(" ")}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0 w-4 h-4 flex items-center">{icon}</span>
      ) : null}
      {children}
      {iconRight && <span className="shrink-0 w-4 h-4 flex items-center">{iconRight}</span>}
    </button>
  );
};
