"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, X } from "lucide-react";

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: "success" | "info";
}

interface ToastContextValue {
  showToast: (title: string, description?: string, type?: "success" | "info") => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, description?: string, type: "success" | "info" = "success") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastMessage = { id, title, description, type };

    setToasts((prev) => [...prev.slice(-2), newToast]); // keep max 2 toasts

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Sticky Paper Toast Stack */}
      <div className="fixed bottom-6 left-6 z-[140] flex flex-col gap-2 pointer-events-none max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9, rotate: -3 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="doodle-card pointer-events-auto relative p-3.5 pr-8 bg-amber-50/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 shadow-xl border-2 border-[var(--border)] font-hand"
              style={{ borderRadius: "14px 18px 12px 16px / 16px 12px 18px 14px" }}
            >
              {/* Cute Washi Tape at Top Center */}
              <div
                className="doodle-tape -top-2.5 left-1/2 -translate-x-1/2 w-16 h-4"
                style={{ transform: "translateX(-50%) rotate(-1deg)" }}
              />

              <div className="flex items-start gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[#16A34A]/20 text-[#16A34A] dark:text-[#4ADE80] mt-0.5">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>

                <div>
                  <p className="text-sm font-bold font-display leading-snug">
                    {toast.title}
                  </p>
                  {toast.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-tight">
                      {toast.description}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-800 dark:hover:text-white"
                aria-label="Dismiss note"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useDoodleToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: () => {},
    };
  }
  return ctx;
}
