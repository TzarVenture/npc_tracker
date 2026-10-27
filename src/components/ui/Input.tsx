/* Input.tsx: Accessible, standard form input and select components. */
import * as React from "react";

export interface InputProps {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  error?: string;
  type?: string;
  step?: string;
  min?: string | number;
  max?: string | number;
  placeholder?: string;
  value?: string | number;
  disabled?: boolean;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  name?: string;
  autoFocus?: boolean;
}

export function Input({
  id,
  className = "",
  label,
  error,
  type = "text",
  step,
  min,
  max,
  placeholder,
  value,
  disabled,
  required,
  onChange,
  onKeyDown,
  name,
  autoFocus,
  style
}: InputProps) {
  const generatedId = React.useId();
  const inputId = id || (name ? `input-${name}` : generatedId);

  return (
    <div className="flex flex-col gap-1.5 w-full" style={style}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-700 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        required={required}
        onChange={onChange}
        onKeyDown={onKeyDown}
        name={name}
        autoFocus={autoFocus}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-lg outline-none focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 transition-all placeholder:text-slate-400 ${
          error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10" : "border-slate-200"
        } ${className}`}
      />
      {error && (
        <span id={`${inputId}-error`} className="text-xs text-rose-600 font-medium">
          {error}
        </span>
      )}
    </div>
  );
}

export interface SelectProps {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  error?: string;
  value?: string | number;
  disabled?: boolean;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string | number; label: string }[];
  name?: string;
}

export function Select({
  id,
  className = "",
  label,
  options,
  error,
  value,
  disabled,
  required,
  onChange,
  name,
  style
}: SelectProps) {
  const generatedId = React.useId();
  const selectId = id || (name ? `select-${name}` : generatedId);

  return (
    <div className="flex flex-col gap-1.5 w-full" style={style}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-slate-700 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          disabled={disabled}
          onChange={onChange}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${selectId}-error` : undefined}
          className={`w-full appearance-none px-3.5 py-2 text-sm bg-slate-50 border rounded-lg outline-none focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 transition-all ${
            error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10" : "border-slate-200"
          } ${className}`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <span id={`${selectId}-error`} className="text-xs text-rose-600 font-medium">
          {error}
        </span>
      )}
    </div>
  );
}
