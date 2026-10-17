"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  RotateCcw,
  TrendingUp,
  Target,
  Zap,
} from "lucide-react";
import { currency, compactCurrency, type DashboardData } from "@/lib/finance";

interface TemporalWarpProps {
  data: DashboardData;
  monthsAhead: number;
  onMonthsChange: (months: number) => void;
}

const HORIZONS = [
  { months: 0, label: "Current", desc: "Today" },
  { months: 3, label: "+3 Months", desc: "Quarterly" },
  { months: 6, label: "+6 Months", desc: "Mid-year" },
  { months: 12, label: "+1 Year", desc: "12-month" },
  { months: 36, label: "+3 Years", desc: "3-year" },
  { months: 60, label: "+5 Years", desc: "5-year" },
];

export function TemporalWarp({ data, monthsAhead, onMonthsChange }: TemporalWarpProps) {
  const currentBalance = data.accounts.reduce((sum, a) => sum + a.balanceCurrent, 0);
  const monthlyNet = data.totals.income - data.totals.spent;

  // Extrapolate net worth with compound growth (assume conservative 6.5% APY annual yield)
  const monthlyRate = 0.065 / 12;
  let extrapolatedBalance = currentBalance;
  for (let m = 0; m < monthsAhead; m++) {
    extrapolatedBalance = extrapolatedBalance * (1 + monthlyRate) + monthlyNet;
  }
  const deltaGrowth = extrapolatedBalance - currentBalance;

  // Predict Goal Achievements
  const achievedGoals = data.goals.filter((g) => {
    if (monthsAhead === 0) return g.currentAmount >= g.targetAmount;
    const futureAmount = g.currentAmount + g.monthlyNeeded * monthsAhead;
    return futureAmount >= g.targetAmount;
  });

  const isWarped = monthsAhead > 0;

  return (
    <div
      className="doodle-card p-5 sm:p-6"
      style={{
        borderRadius: "22px 16px 20px 18px / 18px 20px 16px 22px",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Header Badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-2)] text-[var(--accent)] shadow-sm">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-2)]">
                Wealth Forecasting Notebook
              </span>
              {isWarped && (
                <span className="doodle-badge bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-ink)]">
                  Future Horizon
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)]">
              {isWarped ? `Forecasted Horizon: +${monthsAhead} Months` : "Portfolio Projection Forecaster"}
            </h3>
          </div>
        </div>

        {/* Reset Button */}
        {isWarped && (
          <button
            type="button"
            onClick={() => onMonthsChange(0)}
            className="doodle-btn flex items-center gap-1.5 bg-[var(--surface-2)] px-3.5 py-1.5 text-xs font-bold text-[var(--foreground)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Today
          </button>
        )}
      </div>

      {/* Scrubber Horizon Pills */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {HORIZONS.map((h) => {
          const isActive = monthsAhead === h.months;

          return (
            <button
              key={h.months}
              type="button"
              onClick={() => onMonthsChange(h.months)}
              className={`doodle-btn flex flex-col items-start p-3 text-left ${
                isActive
                  ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--surface)]"
              }`}
            >
              <span className="font-bold text-sm">
                {h.label}
              </span>
              <span className="mt-0.5 text-xs opacity-80">{h.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Extrapolation Results HUD Banner */}
      <AnimatePresence>
        {isWarped && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5 border-t-2 border-dashed border-[var(--border)] pt-5"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Projected Balance */}
              <div
                className="doodle-card p-4"
                style={{ borderRadius: "14px 10px 12px 14px / 12px 14px 10px 12px" }}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-2)]">
                  Projected Net Worth
                </span>
                <p className="mt-1 font-mono text-2xl font-bold text-[var(--accent)] tabular-nums">
                  {currency(extrapolatedBalance)}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>
                    +{currency(deltaGrowth)} ({deltaGrowth >= 0 ? "+" : ""}
                    {Math.round((deltaGrowth / (currentBalance || 1)) * 100)}%)
                  </span>
                </div>
              </div>

              {/* Goal Completions */}
              <div
                className="doodle-card p-4"
                style={{ borderRadius: "14px 10px 12px 14px / 12px 14px 10px 12px" }}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-2)]">
                  Goals Reached
                </span>
                <p className="mt-1 font-mono text-2xl font-bold text-[var(--foreground)] tabular-nums">
                  {achievedGoals.length} / {data.goals.length} Goals
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <Target className="h-3.5 w-3.5 text-amber-500" />
                  <span>
                    {achievedGoals.length > 0
                      ? `${achievedGoals.map((g) => g.name).join(", ")} on track`
                      : "Pacing toward targets"}
                  </span>
                </div>
              </div>

              {/* Cumulative Inflow Volume */}
              <div
                className="doodle-card p-4"
                style={{ borderRadius: "14px 10px 12px 14px / 12px 14px 10px 12px" }}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-2)]">
                  Projected Inflow Volume
                </span>
                <p className="mt-1 font-mono text-2xl font-bold text-indigo-400 tabular-nums">
                  {compactCurrency(data.totals.income * monthsAhead)}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <Zap className="h-3.5 w-3.5 text-indigo-400" />
                  <span>At current monthly velocity</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
