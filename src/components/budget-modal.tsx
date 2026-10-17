"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import confetti from "canvas-confetti";
import { startCase } from "@/lib/finance";

const BUDGET_CATEGORIES = [
  "FOOD_AND_DRINK",
  "TRANSPORTATION",
  "RENT_AND_UTILITIES",
  "SHOPPING",
  "ENTERTAINMENT",
  "OTHER",
] as const;

const ACCENT_COLORS = [
  { name: "Cyan", val: "mint", bg: "bg-[#49B6E5]" },
  { name: "Gold", val: "gold", bg: "bg-[#D97706]" },
  { name: "Coral", val: "rose", bg: "bg-[#DC2626]" },
  { name: "Slate", val: "blue", bg: "bg-[#263D5B]" },
] as const;

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCategory?: string;
  initialLimit?: number;
}

export function BudgetModal({
  isOpen,
  onClose,
  onSuccess,
  initialCategory,
  initialLimit,
}: BudgetModalProps) {
  const [category, setCategory] = useState<string>(initialCategory ?? BUDGET_CATEGORIES[0]);
  const [limit, setLimit] = useState<string>(initialLimit ? String(initialLimit) : "");
  const [accent, setAccent] = useState<string>("mint");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialCategory) setCategory(initialCategory);
      if (initialLimit !== undefined) setLimit(String(initialLimit));
      setError(null);
    }
  }, [isOpen, initialCategory, initialLimit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(limit);
    if (!Number.isFinite(num) || num <= 0) {
      setError("Please set a positive monthly limit.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          monthlyLimit: num,
          accent,
        }),
      });

      if (!res.ok) {
        setError("Failed to save budget limit.");
        setLoading(false);
        return;
      }

      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
      });

      setLoading(false);
      onSuccess();
      onClose();
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="doodle-card relative z-10 w-full max-w-md p-6 sm:p-8"
          >
            <div className="doodle-tape -top-3 left-8" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[var(--border)] bg-[var(--surface-2)] text-[var(--color-primary)] shadow-[2px_2px_0px_var(--border)]">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-serif text-[var(--foreground)]">
                    ✎ Astra Budget Sentinel
                  </h3>
                  <p className="text-xs font-serif text-[var(--muted)]">Configure monthly spending limits</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="doodle-btn flex h-8 w-8 items-center justify-center p-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 font-serif">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="doodle-input mt-1.5 w-full cursor-pointer font-serif text-sm"
                >
                  {BUDGET_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {startCase(c)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                  Monthly Cap (INR ₹)
                </label>
                <input
                  required
                  type="number"
                  step="100"
                  min="1"
                  placeholder="e.g. 15000"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="doodle-input mt-1.5 w-full font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                  Accent Color
                </label>
                <div className="mt-2 flex gap-2">
                  {ACCENT_COLORS.map((col) => (
                    <button
                      key={col.val}
                      type="button"
                      onClick={() => setAccent(col.val)}
                      className={`flex items-center gap-1.5 rounded-xl border-2 border-[var(--border)] px-3 py-1.5 text-xs font-bold transition shadow-[2px_2px_0px_var(--border)] ${
                        accent === col.val
                          ? "bg-[var(--color-primary)] text-white"
                          : "bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--surface)]"
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full border border-black/20 ${col.bg}`} />
                      {col.name}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-center text-xs font-bold text-[var(--color-danger)]">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="doodle-btn doodle-btn-primary mt-4 w-full disabled:opacity-40"
              >
                {loading ? "Saving Limit..." : "Set Budget Limit ✎"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
