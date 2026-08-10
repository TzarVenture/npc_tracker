/* Card.tsx: Reusable layout container components. */
import * as React from "react";

export interface CardProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  key?: React.Key;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function Card({ className = "", ...props }: CardProps) {
  const hasBg = /\bbg-/.test(className);
  const hasBorder = /\bborder-/.test(className);
  return (
    <div
      className={`${hasBg ? "" : "bg-white"} ${hasBorder ? "" : "border border-slate-200"} rounded-2xl shadow-sm ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: CardProps) {
  const hasBorder = /\bborder-/.test(className);
  return (
    <div
      className={`px-6 py-4 ${hasBorder ? "" : "border-b border-slate-100"} flex justify-between items-center ${className}`}
      {...props}
    />
  );
}

export function CardTitle({ className = "", ...props }: { className?: string; style?: React.CSSProperties; children?: React.ReactNode }) {
  return (
    <h3
      className={`font-bold text-slate-800 text-lg ${className}`}
      {...props}
    />
  );
}

export function CardDescription({ className = "", ...props }: { className?: string; style?: React.CSSProperties; children?: React.ReactNode }) {
  return (
    <p
      className={`text-slate-500 text-xs ${className}`}
      {...props}
    />
  );
}

export function CardContent({ className = "", ...props }: CardProps) {
  return (
    <div className={`p-6 ${className}`} {...props} />
  );
}
