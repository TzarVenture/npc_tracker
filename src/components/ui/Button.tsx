/* Button.tsx: Reusable core button component. */
import * as React from "react";

export interface ButtonProps {
  className?: string;
  style?: React.CSSProperties;
  variant?: "primary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  disabled?: boolean;
  title?: string;
  type?: "button" | "submit" | "reset";
}

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  children,
  onClick,
  disabled,
  title,
  type = "button",
  style
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm focus:ring-indigo-500 border border-transparent",
    outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm focus:ring-slate-400",
    ghost: "text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:ring-slate-300",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500 border border-transparent",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500 border border-transparent"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base"
  };

  return (
    <button
      type={type}
      disabled={disabled}
      title={title}
      onClick={onClick}
      style={style}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
