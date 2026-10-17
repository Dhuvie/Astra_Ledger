"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  currency,
  compactCurrency,
  formatDate,
  startCase,
  type RecurringCommitment,
  type UpcomingCharge,
  type PlannerSnapshot,
} from "@/lib/finance";

interface RecurringTabProps {
  recurringItems: RecurringCommitment[];
  upcomingCharges: UpcomingCharge[];
  planner: PlannerSnapshot;
}

export function RecurringTab({
  recurringItems,
  upcomingCharges,
  planner,
}: RecurringTabProps) {
  const [prunedIds, setPrunedIds] = useState<string[]>([]);

  const monthlyTotal = recurringItems.reduce((sum, item) => sum + item.monthlyEquivalent, 0);
  const annualTotal = monthlyTotal * 12;

  const essentialItems = recurringItems.filter((i) => i.essential);
  const flexibleItems = recurringItems.filter((i) => !i.essential);

  const essentialMonthly = essentialItems.reduce((sum, item) => sum + item.monthlyEquivalent, 0);
  const flexibleMonthly = flexibleItems.reduce((sum, item) => sum + item.monthlyEquivalent, 0);

  // Simulation calculations
  const simulatedSavings = recurringItems
    .filter((i) => prunedIds.includes(i.id))
    .reduce((sum, item) => sum + item.monthlyEquivalent, 0);

  const simulatedMonthlyBurn = Math.max(1, planner.monthlyBurn - simulatedSavings);
  const simulatedRunwayBoost =
    simulatedSavings > 0
      ? (planner.averageMonthlySpend / simulatedMonthlyBurn) * planner.runwayMonths - planner.runwayMonths
      : 0;

  const togglePrune = (id: string) => {
    setPrunedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

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
                ✎ Commitment Radar
              </span>
            </div>
            <h3 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-[var(--foreground)] font-serif">
              Subscriptions & Fixed Obligations
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)] font-sans">
              Tracking {recurringItems.length} active recurring commitments · {currency(monthlyTotal)}/mo run rate
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="doodle-card px-4 py-2 text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] font-serif">
                Annual Run Rate
              </span>
              <p className="font-mono text-lg font-black text-[var(--color-primary)]">
                {compactCurrency(annualTotal)}/yr
              </p>
            </div>
          </div>
        </div>

        {/* Essential vs Flexible Meter */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border-2 border-dashed border-[var(--border-soft)] bg-[var(--surface-2)]/60 p-4">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="flex items-center gap-1.5 font-bold text-[var(--foreground)] font-serif">
                <Shield className="h-4 w-4 text-[var(--color-success)]" />
                Essential (Rent, Utilities)
              </span>
              <span className="font-mono font-bold text-[var(--color-success)]">{currency(essentialMonthly)}/mo</span>
            </div>
            <p className="mt-1 font-serif text-xs text-[var(--muted)]">
              {Math.round((essentialMonthly / (monthlyTotal || 1)) * 100)}% of recurring spend
            </p>
          </div>

          <div className="rounded-xl border-2 border-dashed border-[var(--border-soft)] bg-[var(--surface-2)]/60 p-4">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="flex items-center gap-1.5 font-bold text-[var(--foreground)] font-serif">
                <Zap className="h-4 w-4 text-[var(--color-warning)]" />
                Flexible (SaaS, Gym, Media)
              </span>
              <span className="font-mono font-bold text-[var(--color-warning)]">{currency(flexibleMonthly)}/mo</span>
            </div>
            <p className="mt-1 font-serif text-xs text-[var(--muted)]">
              {Math.round((flexibleMonthly / (monthlyTotal || 1)) * 100)}% of recurring spend
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Recurring Items + Upcoming Due Timeline */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Subscriptions List with Simulation Toggle */}
        <div className="lg:col-span-2 doodle-card p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-secondary)]">
              ✎ Subscription Inventory
            </span>
            <span className="text-xs font-serif text-[var(--muted)]">Click item to test pruning scenario</span>
          </div>

          <div className="mt-6 divide-y-2 divide-dashed divide-[var(--border-soft)]">
            {recurringItems.length === 0 ? (
              <div className="py-12 text-center text-sm font-serif text-[var(--muted)]">
                ✎ No active recurring commitments detected yet.
              </div>
            ) : (
              recurringItems.map((item) => {
                const isPruned = prunedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => togglePrune(item.id)}
                    className={`flex cursor-pointer items-center justify-between py-3.5 transition-all ${
                      isPruned ? "opacity-35 line-through" : "hover:bg-[var(--surface-2)]/60 px-3 rounded-xl"
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-base text-[var(--foreground)] font-serif">{item.name}</p>
                        <span
                          className={`rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            item.essential
                              ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                              : "bg-[var(--color-warning)]/15 text-[var(--color-warning)]"
                          }`}
                        >
                          {item.essential ? "Essential" : "Flexible"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--muted)] font-sans">
                        <span className="uppercase font-bold text-[var(--color-secondary)]">{startCase(item.category)}</span>
                        <span> · Next renewal: </span>
                        <span className="font-mono">{formatDate(item.nextDate)}</span>
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-mono text-base font-black text-[var(--foreground)] tabular-nums">
                        {currency(item.amount)}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-[var(--muted)]">
                        {item.cadence}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Simulation Output Banner */}
          {prunedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-xl border-2 border-[var(--border)] bg-[var(--surface-2)] p-4 shadow-[2px_2px_0px_var(--border)]"
            >
              <div className="flex items-center justify-between text-xs font-bold font-serif">
                <span className="flex items-center gap-1.5 text-[var(--color-primary)]">
                  <Sparkles className="h-4 w-4" />
                  Pruning Simulation ({prunedIds.length} items paused)
                </span>
                <button
                  type="button"
                  onClick={() => setPrunedIds([])}
                  className="doodle-btn px-2.5 py-0.5 text-xs"
                >
                  Reset
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[var(--muted)] font-serif">Monthly Savings:</span>
                  <p className="font-mono text-base font-black text-[var(--color-success)]">
                    +{currency(simulatedSavings)}/mo
                  </p>
                </div>
                <div>
                  <span className="text-[var(--muted)] font-serif">Runway Boost:</span>
                  <p className="font-mono text-base font-black text-[var(--color-primary)]">
                    +{simulatedRunwayBoost.toFixed(1)} Months
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Upcoming Charges Calendar / Due Radar */}
        <div className="doodle-card p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-secondary)]">
              ✎ Due Horizon
            </span>
            <Clock className="h-4 w-4 text-[var(--muted)]" />
          </div>
          <h4 className="mt-1 text-lg font-bold font-serif text-[var(--foreground)]">Upcoming Invoices</h4>

          <div className="mt-6 space-y-3">
            {upcomingCharges.length === 0 ? (
              <div className="py-8 text-center text-sm font-serif text-[var(--muted)]">
                ✎ No invoices due in the next 30 days.
              </div>
            ) : (
              upcomingCharges.map((charge) => {
                const isToday = charge.daysAway === 0;
                const isUrgent = charge.daysAway <= 3;

                return (
                  <div
                    key={charge.id}
                    className="rounded-xl border-2 border-[var(--border)] bg-[var(--surface-2)] p-3.5 shadow-[2px_2px_0px_var(--border)] transition hover:border-[var(--color-primary)]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold font-serif text-[var(--foreground)]">{charge.name}</p>
                        <p className="mt-0.5 text-xs text-[var(--muted)]">
                          <span className="font-bold uppercase text-[var(--color-secondary)]">{startCase(charge.category)}</span>
                          <span> · </span>
                          <span className="font-mono">{formatDate(charge.dueDate)}</span>
                        </p>
                      </div>

                      <span
                        className={`rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isToday
                            ? "bg-[var(--color-danger)]/20 text-[var(--color-danger)] animate-pulse"
                            : isUrgent
                            ? "bg-[var(--color-warning)]/20 text-[var(--color-warning)]"
                            : "bg-[var(--surface)] text-[var(--muted)]"
                        }`}
                      >
                        {isToday ? "Due Today" : `In ${charge.daysAway}d`}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t-2 border-dashed border-[var(--border-soft)] pt-2 text-xs">
                      <span className="text-[var(--muted)] font-serif">Invoice Amount</span>
                      <span className="font-mono font-bold text-sm text-[var(--foreground)]">
                        {currency(charge.amount)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
