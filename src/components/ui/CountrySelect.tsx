/* CountrySelect.tsx: Accessible, searchable multi-select country dropdown with ISO 3166-1 alpha-2 standard and tier shortcuts. */
import React, { useState, useRef, useEffect, useMemo } from "react";
import { COUNTRIES, Country, normalizeCountryCode, TIER_1_COUNTRIES, TIER_2_COUNTRIES } from "../../utils/countries";
import { Search, X, Globe, Check, Plus } from "lucide-react";

interface CountrySelectProps {
  label?: string;
  description?: string;
  value?: string[];
  selected?: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  label = "Targeted Countries",
  description,
  value,
  selected,
  onChange,
  placeholder = "Search country name or code (e.g. Singapore, SG, US)...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Active value resolving either value or selected prop
  const activeValue = useMemo(() => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(selected)) return selected;
    return [];
  }, [value, selected]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Filtered countries based on search term
  const filteredCountries = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return COUNTRIES;
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term)
    );
  }, [search]);

  // Selected country lookup set
  const selectedSet = useMemo(() => new Set(activeValue.map(v => v.toUpperCase())), [activeValue]);

  const toggleCountry = (code: string) => {
    const upper = code.toUpperCase();
    if (selectedSet.has(upper)) {
      onChange(activeValue.filter(c => c.toUpperCase() !== upper));
    } else {
      onChange([...activeValue, upper]);
    }
  };

  const removeCountry = (code: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(activeValue.filter(c => c.toUpperCase() !== code.toUpperCase()));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const handleSelectTier1 = (e: React.MouseEvent) => {
    e.stopPropagation();
    const merged = Array.from(new Set([...activeValue, ...TIER_1_COUNTRIES]));
    onChange(merged);
  };

  const handleSelectTier2 = (e: React.MouseEvent) => {
    e.stopPropagation();
    const merged = Array.from(new Set([...activeValue, ...TIER_2_COUNTRIES]));
    onChange(merged);
  };

  // Allow pasting or typing comma-separated codes directly
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const term = search.trim().replace(/,/g, "");
      if (term) {
        const normalized = normalizeCountryCode(term);
        if (normalized && !selectedSet.has(normalized)) {
          onChange([...activeValue, normalized]);
          setSearch("");
        }
      }
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-semibold text-slate-700 block">{label}</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectTier1}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline cursor-pointer"
              title="Add US, GB, CA, AU, NZ"
            >
              + Add Tier 1
            </button>
            <button
              type="button"
              onClick={handleSelectTier2}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline cursor-pointer"
              title="Add Western Europe & Developed Markets"
            >
              + Add Tier 2
            </button>
            {activeValue.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline cursor-pointer ml-1"
              >
                Clear all (Global)
              </button>
            )}
          </div>
        </div>
      )}

      {description && <p className="text-xs text-slate-500 leading-relaxed">{description}</p>}

      {/* Main trigger box & selected badges */}
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className="min-h-[42px] w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm transition-all cursor-text focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-800/10"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {activeValue.length === 0 ? (
            <div className="flex items-center gap-2 text-slate-600 text-xs py-1 px-1">
              <Globe size={14} className="text-emerald-600 shrink-0" />
              <span className="font-medium text-slate-800">All Countries Allowed (Global Traffic)</span>
              <span className="text-slate-400 text-xs hidden sm:inline">— Click to restrict specific countries</span>
            </div>
          ) : (
            activeValue.map((code) => {
              const country = COUNTRIES.find(c => c.code === code.toUpperCase());
              return (
                <span
                  key={code}
                  className="inline-flex items-center gap-1.5 bg-white border border-slate-300 text-slate-800 rounded-md px-2 py-0.5 text-xs font-medium shadow-2xs"
                >
                  <span>{country?.flag || "🌐"}</span>
                  <span className="font-semibold">{country?.code || code}</span>
                  <span className="text-slate-500 text-[11px] hidden sm:inline">{country?.name}</span>
                  <button
                    type="button"
                    onClick={(e) => removeCountry(code, e)}
                    className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                    aria-label={`Remove ${code}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })
          )}

          {/* Inline search input */}
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={activeValue.length === 0 ? "" : "Add more countries..."}
            className="flex-1 min-w-[140px] bg-transparent border-0 outline-none text-xs text-slate-900 placeholder:text-slate-400 py-1 px-1 font-medium"
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="relative z-50">
          <div className="absolute top-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto p-1.5 animate-scaleIn text-xs">
            <div className="sticky top-0 bg-white pb-1.5 mb-1 border-b border-slate-100 flex items-center px-2 pt-1 gap-1.5 text-slate-500">
              <Search size={13} className="text-slate-400 shrink-0" />
              <span className="text-xs text-slate-600">
                {filteredCountries.length} countries found — click to select
              </span>
            </div>

            {filteredCountries.length === 0 ? (
              <div className="py-4 text-center text-slate-500 text-xs">
                No matching countries found for "{search}".
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = selectedSet.has(c.code);
                return (
                  <div
                    key={c.code}
                    onClick={() => toggleCountry(c.code)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base leading-none">{c.flag || "🌐"}</span>
                      <span className="text-slate-800">{c.name}</span>
                      <span className="font-mono text-xs text-slate-500 font-semibold uppercase">
                        [{c.code}]
                      </span>
                    </div>
                    {isSelected ? (
                      <Check size={14} className="text-slate-900 shrink-0" />
                    ) : (
                      <Plus size={13} className="text-slate-400 hover:text-slate-700 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
