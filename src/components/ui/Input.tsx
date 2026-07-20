/* Input.tsx: Reusable form input and select components. */
import * as React from "react";

export interface InputProps {
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  error?: string;
  type?: string;
  step?: string;
  placeholder?: string;
  value?: string | number;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
}

export function Input({
  className = "",
  label,
  error,
  type = "text",
  step,
  placeholder,
  value,
  disabled,
  onChange,
  name,
  style
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full" style={style}>
      {label && (
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        type={type}
        step={step}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={onChange}
        name={name}
        className={`w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 ${
          error ? "border-rose-500 focus:ring-rose-500/10" : ""
        } ${className}`}
      />
      {error && <span className="text-xs text-rose-600 font-medium">{error}</span>}
    </div>
  );
}

export interface SelectProps {
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  error?: string;
  value?: string | number;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string | number; label: string }[];
  name?: string;
}

export function Select({
  className = "",
  label,
  options,
  error,
  value,
  disabled,
  onChange,
  name,
  style
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full" style={style}>
      {label && (
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={onChange}
          name={name}
          className={`w-full appearance-none px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all ${
            error ? "border-rose-500 focus:ring-rose-500/10" : ""
          } ${className}`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <span className="text-xs text-rose-600 font-medium">{error}</span>}
    </div>
  );
}
