/* Badge.tsx: Reusable status indicator component. */
import * as React from "react";

export interface BadgeProps {
  className?: string;
  style?: React.CSSProperties;
  variant?: "default" | "success" | "warning" | "danger" | "primary";
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
}

export function Badge({ className = "", variant = "default", children, ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-colors";
  
  const variants = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    danger: "bg-rose-100 text-rose-700 border-rose-200",
    primary: "bg-indigo-100 text-indigo-700 border-indigo-200"
  };

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
