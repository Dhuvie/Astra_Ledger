"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, X, PlusCircle, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { currency } from "@/lib/finance";

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contributeGoal?: {
    id: string;
    name: string;
    currentAmount: number;
    targetAmount: number;
  } | null;
}

export function GoalModal({
  isOpen,
  onClose,
  onSuccess,
  contributeGoal,
}: GoalModalProps) {
  // New Goal Fields
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [category, setCategory] = useState("SAVINGS");

  // Contribute Fields
  const [depositAmount, setDepositAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDepositAmount("");
      setError(null);
    }
  }, [isOpen, contributeGoal]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(targetAmount);
    const curr = Number(currentAmount || 0);

    if (!name.trim() || !Number.isFinite(target) || target <= 0) {
      setError("Please specify a goal name and positive target.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          targetAmount: target,
          currentAmount: curr,
          targetDate,
          category,
        }),
      });

      if (!res.ok) {
        setError("Failed to create goal.");
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
      setTargetAmount("");
      setCurrentAmount("");
      setLoading(false);
      onSuccess();
      onClose();
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoal) return;
    const add = Number(depositAmount);
    if (!Number.isFinite(add) || add <= 0) {
      setError("Please enter a positive contribution amount.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contributeGoal.id,
          amount: add,
        }),
      });

      if (!res.ok) {
        setError("Failed to contribute to goal.");
        setLoading(false);
        return;
      }

      // Doodle celebration confetti
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#49B6E5", "#16A34A", "#D97706", "#263D5B"],
      });

      setDepositAmount("");
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
                  {contributeGoal ? <PlusCircle className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold font-serif text-[var(--foreground)]">
                    {contributeGoal ? "✎ Contribute to Goal" : "✎ Create Savings Goal"}
                  </h3>
                  <p className="text-xs font-serif text-[var(--muted)]">
                    {contributeGoal ? contributeGoal.name : "Track milestone targets and celebrate progress"}
                  </p>
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

            {contributeGoal ? (
              <form onSubmit={handleContribute} className="mt-6 space-y-4 font-serif">
                <div className="rounded-xl border-2 border-dashed border-[var(--border-soft)] bg-[var(--surface-2)]/60 p-4">
                  <div className="flex justify-between text-xs text-[var(--muted)]">
                    <span className="font-bold">Progress</span>
                    <span className="font-mono font-bold text-[var(--foreground)]">
                      {Math.round((contributeGoal.currentAmount / contributeGoal.targetAmount) * 100)}%
                    </span>
                  </div>
                  <div className="mt-2 h-3 w-full rounded-full border-2 border-[var(--border)] bg-[var(--surface)] p-0.5 shadow-[1px_1px_0px_var(--border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                      style={{
                        width: `${Math.min(
                          (contributeGoal.currentAmount / contributeGoal.targetAmount) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="mt-3 flex justify-between text-xs font-mono">
                    <span className="text-[var(--muted)]">Current: {currency(contributeGoal.currentAmount)}</span>
                    <span className="text-[var(--muted)]">Target: {currency(contributeGoal.targetAmount)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                    Contribution Amount (INR ₹)
                  </label>
                  <input
                    autoFocus
                    required
                    type="number"
                    step="100"
                    min="1"
                    placeholder="e.g. 5000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="doodle-input mt-1.5 w-full font-mono text-base font-bold"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex gap-2">
                  {[1000, 2500, 5000, 10000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDepositAmount(String(val))}
                      className="doodle-btn flex-1 py-1 text-xs font-mono font-bold"
                    >
                      +₹{val}
                    </button>
                  ))}
                </div>

                {error && <p className="text-center text-xs font-bold text-[var(--color-danger)]">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !depositAmount}
                  className="doodle-btn doodle-btn-primary mt-4 flex w-full items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{loading ? "Allocating..." : "Deposit & Celebrate ✎"}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreate} className="mt-6 space-y-4 font-serif">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                    Goal Name
                  </label>
                  <input
                    required
                    placeholder="e.g. Dream Sketchbook / M4 Max"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="doodle-input mt-1.5 w-full text-sm font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                      Target (INR ₹)
                    </label>
                    <input
                      required
                      type="number"
                      step="500"
                      min="1"
                      placeholder="e.g. 150000"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="doodle-input mt-1.5 w-full font-mono text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                      Initial Saved
                    </label>
                    <input
                      type="number"
                      step="500"
                      min="0"
                      placeholder="e.g. 25000"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      className="doodle-input mt-1.5 w-full font-mono text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                      Target Date
                    </label>
                    <input
                      required
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
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
                      <option value="SAVINGS">Emergency & Savings</option>
                      <option value="PURCHASE">Tech & Purchase</option>
                      <option value="TRAVEL">Travel & Adventure</option>
                      <option value="INVESTMENT">Investment Nest Egg</option>
                    </select>
                  </div>
                </div>

                {error && <p className="text-center text-xs font-bold text-[var(--color-danger)]">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="doodle-btn doodle-btn-primary mt-4 w-full disabled:opacity-40"
                >
                  {loading ? "Creating Goal..." : "Initialize Savings Goal ✎"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
