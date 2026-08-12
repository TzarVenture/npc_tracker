/* Toast.tsx: Global toast notification system with context provider and useToast hook. */
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />,
  error:   <XCircle     size={18} className="text-rose-500 shrink-0 mt-0.5" />,
  warning: <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />,
  info:    <Info        size={18} className="text-blue-500 shrink-0 mt-0.5" />,
};

const TOAST_BORDER: Record<ToastType, string> = {
  success: "border-l-emerald-500",
  error:   "border-l-rose-500",
  warning: "border-l-amber-500",
  info:    "border-l-blue-500",
};

const AUTO_DISMISS_MS = 5000;

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 20);
    timerRef.current = setTimeout(() => handleClose(), AUTO_DISMISS_MS);
    return () => {
      clearTimeout(enterTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(toast.id), 300);
  };

  return (
    <div
      className={`flex items-start gap-3 w-full max-w-sm bg-white border border-slate-200 border-l-4 ${TOAST_BORDER[toast.type]} rounded-xl shadow-lg px-4 py-3.5 transition-all duration-300 ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
      }`}
    >
      {TOAST_ICONS[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={handleClose}
        className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors shrink-0 -mt-0.5 -mr-1"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = "toast-" + Date.now() + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, type, title, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onClose={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
