/* Badge.tsx: Standard status indicator component. */
import * as React from "react";

export interface BadgeProps {
  className?: string;
  style?: React.CSSProperties;
  variant?: "default" | "success" | "warning" | "danger" | "primary";
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
}

export function Badge({ className = "", variant = "default", children, ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border transition-colors";
  
  const variants = {
    default: "bg-slate-100 text-slate-700 border-slate-200/80",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    warning: "bg-amber-50 text-amber-700 border-amber-200/80",
    danger: "bg-rose-50 text-rose-700 border-rose-200/80",
    primary: "bg-indigo-50 text-indigo-700 border-indigo-200/80"
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
