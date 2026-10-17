"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, X, Check, ArrowDownRight, ArrowUpRight, Wand2 } from "lucide-react";
import confetti from "canvas-confetti";
import { startCase } from "@/lib/finance";

const CATEGORIES = [
  "FOOD_AND_DRINK",
  "TRANSPORTATION",
  "RENT_AND_UTILITIES",
  "SHOPPING",
  "ENTERTAINMENT",
  "INCOME",
  "OTHER",
] as const;

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  quickExamples?: string[];
}

export function QuickAddModal({ isOpen, onClose, onSuccess, quickExamples = [] }: QuickAddModalProps) {
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [nlpInput, setNlpInput] = useState("");
  const [parsedPreview, setParsedPreview] = useState<{
    name: string;
    amount: number;
    type: "expense" | "income";
    date: string;
    primaryCategory: string;
  } | null>(null);

  // Manual fields
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [type, setType] = useState<"expense" | "income">("expense");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse NLP on the fly
  const handleNlpChange = async (val: string) => {
    setNlpInput(val);
    setError(null);
    if (!val.trim()) {
      setParsedPreview(null);
      return;
    }
    try {
      const res = await fetch("/api/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: val, previewOnly: true }),
      });
      if (res.ok) {
        const j = await res.json();
        if (j.parsed) {
          setParsedPreview(j.parsed);
        }
      } else {
        setParsedPreview(null);
      }
    } catch {
      setParsedPreview(null);
    }
  };

  const handleNlpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpInput.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: nlpInput }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setError(j?.error ?? "Unable to process command.");
        setLoading(false);
        return;
      }

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#49B6E5", "#16A34A", "#D97706", "#263D5B"],
      });

      setNlpInput("");
      setParsedPreview(null);
      setLoading(false);
      onSuccess();
      onClose();
    } catch {
      setError("Failed to record entry. Try again.");
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!name.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Please specify a valid description and positive amount.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          amount: parsedAmount,
          date,
          primaryCategory: category,
          type,
        }),
      });

      if (!res.ok) {
        setError("Failed to record entry.");
        setLoading(false);
        return;
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#49B6E5", "#16A34A", "#D97706"],
      });

      setName("");
      setAmount("");
      setLoading(false);
      onSuccess();
      onClose();
    } catch {
      setError("Connection error. Try again.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="doodle-card relative z-10 w-full max-w-lg p-6 sm:p-8"
          >
            <div className="doodle-tape -top-3 left-8" />

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[var(--border)] bg-[var(--surface-2)] text-[var(--color-primary)] shadow-[2px_2px_0px_var(--border)]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-serif text-[var(--foreground)]">
                    ✎ Astra Quick-Add
                  </h3>
                  <p className="text-xs font-serif text-[var(--muted)]">Add instant sketch cashflow entries to your Astra Ledger</p>
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

            {/* Mode Switcher */}
            <div className="mt-6 flex rounded-xl border-2 border-[var(--border)] bg-[var(--surface-2)] p-1 shadow-[2px_2px_0px_var(--border)]">
              <button
                type="button"
                onClick={() => setMode("ai")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition font-serif ${
                  mode === "ai"
                    ? "bg-[var(--surface)] text-[var(--foreground)] border-2 border-[var(--border)] shadow-[1px_1px_0px_var(--border)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Wand2 className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                Smart Quick-Add (NLP)
              </button>
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition font-serif ${
                  mode === "manual"
                    ? "bg-[var(--surface)] text-[var(--foreground)] border-2 border-[var(--border)] shadow-[1px_1px_0px_var(--border)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                Structured Form
              </button>
            </div>

            {/* NLP Mode */}
            {mode === "ai" ? (
              <form onSubmit={handleNlpSubmit} className="mt-5 space-y-4 font-serif">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                    Describe in Plain English
                  </label>
                  <div className="relative mt-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="e.g. Spent 420 on Coffee today or Salary 85000"
                      value={nlpInput}
                      onChange={(e) => void handleNlpChange(e.target.value)}
                      className="doodle-input w-full pr-28 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!nlpInput.trim() || loading}
                      className="doodle-btn doodle-btn-primary absolute right-1.5 top-1.5 h-9 px-3 text-xs font-bold uppercase disabled:opacity-40"
                    >
                      {loading ? "Adding..." : "Execute ✎"}
                    </button>
                  </div>
                </div>

                {/* Live Parsed Preview */}
                {parsedPreview && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-primary)]/10 p-3.5 text-xs font-serif"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                      <Check className="h-3.5 w-3.5" />
                      Detected Attributes:
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[var(--foreground)]">
                      <span className="font-bold">{parsedPreview.name}</span>
                      <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 font-mono font-bold">
                        ₹{parsedPreview.amount}
                      </span>
                      <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5">
                        {startCase(parsedPreview.primaryCategory)}
                      </span>
                      <span
                        className={`rounded-full border border-[var(--border)] px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                          parsedPreview.type === "income"
                            ? "bg-[var(--color-success)]/20 text-[var(--color-success)]"
                            : "bg-[var(--color-danger)]/20 text-[var(--color-danger)]"
                        }`}
                      >
                        {parsedPreview.type}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Quick Examples */}
                {quickExamples.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs uppercase font-bold tracking-wider text-[var(--muted)] font-serif">Try Examples:</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {quickExamples.map((ex) => (
                        <button
                          key={ex}
                          type="button"
                          onClick={() => void handleNlpChange(ex)}
                          className="doodle-badge cursor-pointer hover:border-[var(--color-primary)] text-xs"
                        >
                          ✎ {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            ) : (
              /* Structured Manual Form */
              <form onSubmit={handleManualSubmit} className="mt-5 space-y-4 font-serif">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                      Title / Description
                    </label>
                    <input
                      required
                      placeholder="e.g. Grocery Run at Zepto"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="doodle-input mt-1.5 w-full text-sm font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                      Amount (INR ₹)
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="e.g. 1250"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="doodle-input mt-1.5 w-full font-mono text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                      Date
                    </label>
                    <input
                      required
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="doodle-input mt-1.5 w-full font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="doodle-input mt-1.5 w-full text-xs font-serif"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {startCase(c)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                      Direction
                    </label>
                    <div className="mt-1.5 flex rounded-xl border-2 border-[var(--border)] bg-[var(--surface-2)] p-1 shadow-[2px_2px_0px_var(--border)]">
                      <button
                        type="button"
                        onClick={() => setType("expense")}
                        className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition font-serif ${
                          type === "expense"
                            ? "bg-[var(--color-danger)]/20 text-[var(--color-danger)] border-2 border-[var(--border)]"
                            : "text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        <ArrowUpRight className="h-3 w-3" />
                        Expense
                      </button>
                      <button
                        type="button"
                        onClick={() => setType("income")}
                        className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition font-serif ${
                          type === "income"
                            ? "bg-[var(--color-success)]/20 text-[var(--color-success)] border-2 border-[var(--border)]"
                            : "text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        <ArrowDownRight className="h-3 w-3" />
                        Income
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="doodle-btn doodle-btn-primary mt-4 w-full disabled:opacity-40"
                >
                  {loading ? "Writing Ledger Entry..." : "Confirm & Save Entry ✎"}
                </button>
              </form>
            )}

            {error && (
              <p className="mt-3 text-center text-xs font-bold text-[var(--color-danger)] font-serif">{error}</p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
