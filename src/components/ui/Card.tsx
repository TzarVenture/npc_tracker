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
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center ${className}`}
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
