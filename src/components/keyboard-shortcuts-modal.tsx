"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Command, X } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "1-8", desc: "Switch views (Overview, Trends, Budgets, Goals, Subscriptions, Ledger, What-If, Leak Audit)" },
  { key: "9", desc: "Open Impulse Quarantine Vault & Life-Energy calculator" },
  { key: "0", desc: "Launch Crisis Stress-Test Catastrophe Drill" },
  { key: "Ctrl + K / N", desc: "Open Quick-Add transaction modal" },
  { key: "R", desc: "Open Receipt & Bill Scratchpad" },
  { key: "T", desc: "Toggle dark / light sketchpad theme" },
  { key: "D", desc: "Toggle between sample data and blank slate" },
  { key: "?", desc: "Open this keyboard shortcuts HUD" },
  { key: "Esc", desc: "Close any active dialog or modal" },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            className="doodle-card relative z-10 w-full max-w-md p-6 sm:p-8"
            style={{ borderRadius: "20px 16px 22px 18px / 18px 22px 16px 20px" }}
          >
            <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--border-soft)] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[var(--border)] bg-[#49B6E5]/20 text-[#49B6E5]">
                  <Command className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
                    Keyboard Shortcuts
                  </h3>
                  <p className="text-xs text-[var(--muted-2)]">Doodle fast navigation</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="doodle-btn flex h-8 w-8 items-center justify-center bg-[var(--surface-2)] text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {SHORTCUTS.map((item) => (
                <div
                  key={item.key}
                  className="doodle-card flex items-center justify-between bg-[var(--surface-2)]/60 p-2.5 px-3.5 text-xs font-bold"
                  style={{ borderRadius: "12px 10px 14px 10px / 10px 14px 10px 12px" }}
                >
                  <span className="text-[var(--foreground)]">{item.desc}</span>
                  <kbd className="doodle-badge border-2 border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 font-mono text-xs font-bold text-[#49B6E5]">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>

            <p className="mt-5 text-center text-xs font-bold uppercase tracking-wider text-[var(--muted-2)]">
              Press <kbd className="doodle-badge border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 font-mono">Esc</kbd> anytime to dismiss
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
