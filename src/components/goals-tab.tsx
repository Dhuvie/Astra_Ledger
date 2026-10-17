"use client";

import { motion } from "framer-motion";
import { Target, Plus, Sparkles, Calendar } from "lucide-react";
import { currency, compactCurrency, formatDate, type DashboardGoal } from "@/lib/finance";

interface GoalsTabProps {
  goals: DashboardGoal[];
  onOpenCreateGoal: () => void;
  onOpenContribute: (goal: { id: string; name: string; currentAmount: number; targetAmount: number }) => void;
}

export function GoalsTab({ goals, onOpenCreateGoal, onOpenContribute }: GoalsTabProps) {
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="doodle-card relative overflow-hidden p-6 sm:p-8">
        <div className="doodle-tape -top-3 left-10" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full border border-[var(--border)] bg-[var(--color-primary)] shadow-[1px_1px_0px_var(--border)]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-secondary)]">
                ✎ Wealth Milestones
              </span>
            </div>
            <h3 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-[var(--foreground)] font-serif">
              Sketch Savings Goals
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)] font-sans">
              Accumulated {currency(totalSaved)} across {goals.length} target sketch trajectories
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCreateGoal}
            className="doodle-btn doodle-btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Set New Target</span>
          </button>
        </div>

        {/* Aggregate Progress */}
        <div className="mt-8 space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold font-serif">
            <span className="text-[var(--foreground)]">
              Total Portfolio Goal: <span className="font-mono text-sm">{currency(totalSaved)}</span> / <span className="font-mono text-sm">{currency(totalTarget)}</span>
            </span>
            <span className="text-[var(--color-primary)] font-black">{overallProgress}% Achieved</span>
          </div>

          <div className="h-4 w-full rounded-full border-2 border-[var(--border)] bg-[var(--surface-2)] p-0.5 shadow-[2px_2px_0px_var(--border)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--color-primary)]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(overallProgress, 100)}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>

      {/* Goal Cards Grid */}
      {goals.length === 0 ? (
        <div className="doodle-card p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[var(--border)] bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-[3px_3px_0px_var(--border)]">
            <Target className="h-7 w-7" />
          </div>
          <h4 className="mt-4 text-xl font-bold font-serif text-[var(--foreground)]">No Milestone Targets Initialized</h4>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--muted)] font-sans">
            Define savings trajectories for emergencies, tech gear, dream voyages, or investment nest eggs. Track your monthly pacing and celebrate completion.
          </p>
          <button
            type="button"
            onClick={onOpenCreateGoal}
            className="doodle-btn doodle-btn-primary mt-6 inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Initialize First Target
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const pct = Math.round(goal.progress * 100);
            const isDone = pct >= 100;

            return (
              <motion.div
                key={goal.id}
                whileHover={{ y: -3 }}
                className="doodle-card flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[var(--border)] bg-[var(--surface-2)] text-[var(--color-primary)] shadow-[2px_2px_0px_var(--border)]">
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base font-serif text-[var(--foreground)]">{goal.name}</h4>
                        <p className="text-xs uppercase font-bold tracking-wider text-[var(--color-secondary)]">
                          {goal.category}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full border-2 border-[var(--border)] px-2.5 py-0.5 text-xs font-bold uppercase shadow-[2px_2px_0px_var(--border)] ${
                        isDone
                          ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                          : "bg-[var(--surface-2)] text-[var(--color-primary)]"
                      }`}
                    >
                      {isDone ? "Completed ✎" : `${pct}%`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-xs font-serif text-[var(--muted)]">
                      <span>Saved {currency(goal.currentAmount)}</span>
                      <span className="font-mono font-bold text-[var(--foreground)]">
                        Target {compactCurrency(goal.targetAmount)}
                      </span>
                    </div>

                    <div className="h-3 w-full rounded-full border-2 border-[var(--border)] bg-[var(--surface-2)] p-0.5 shadow-[2px_2px_0px_var(--border)] overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          isDone
                            ? "bg-[var(--color-success)]"
                            : "bg-[var(--color-primary)]"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>

                  {/* Milestones Info */}
                  <div className="mt-6 space-y-2 rounded-xl border-2 border-dashed border-[var(--border-soft)] bg-[var(--surface-2)]/50 p-3.5 text-xs">
                    <div className="flex items-center justify-between text-[var(--muted)] font-serif">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[var(--color-secondary)]" />
                        Target Date
                      </span>
                      <span className="font-mono font-bold text-[var(--foreground)]">
                        {formatDate(goal.targetDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[var(--muted)] font-serif">
                      <span>Monthly Pace</span>
                      <span className="font-mono font-bold text-[var(--foreground)] tabular-nums">
                        {isDone ? "-" : `${currency(goal.monthlyNeeded)} / mo`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[var(--muted)] font-serif">
                      <span>Remaining</span>
                      <span className="font-mono font-bold text-[var(--color-primary)] tabular-nums">
                        {isDone ? "Goal reached!" : currency(goal.remainingAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenContribute({
                        id: goal.id,
                        name: goal.name,
                        currentAmount: goal.currentAmount,
                        targetAmount: goal.targetAmount,
                      })
                    }
                    className="doodle-btn doodle-btn-primary w-full flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Deposit Funds</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
