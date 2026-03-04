"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: Toast["type"], message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  const colors = {
    success: "bg-emerald-600 text-white dark:bg-emerald-600 dark:border dark:border-emerald-500/40 dark:shadow-lg dark:shadow-emerald-500/10",
    error: "bg-red-600 text-white dark:bg-red-600 dark:border dark:border-red-500/40 dark:shadow-lg dark:shadow-red-500/10",
    warning: "bg-amber-500 text-white dark:bg-amber-600 dark:border dark:border-amber-500/40 dark:shadow-lg dark:shadow-amber-500/10",
    info: "bg-cyan-600 text-white dark:bg-cyan-600 dark:border dark:border-cyan-500/40 dark:shadow-lg dark:shadow-cyan-500/10",
  };

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${colors[toast.type]} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] animate-slide-in backdrop-blur-sm`}
        >
          <span className="text-lg font-bold">{icons[toast.type]}</span>
          <span className="flex-1 text-sm">{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            className="opacity-70 hover:opacity-100 text-lg"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
