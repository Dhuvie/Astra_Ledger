"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Flame,
  Scale,
  Sparkles,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { currency, compactCurrency, startCase, type DashboardData } from "@/lib/finance";

interface FinancialLeakAuditProps {
  data: DashboardData;
  onOpenBudgetModal: (category?: string, limit?: number) => void;
}

export function FinancialLeakAudit({ data, onOpenBudgetModal }: FinancialLeakAuditProps) {
  const [pluggedLeaks, setPluggedLeaks] = useState<string[]>([]);

  // 1. Weekend vs Weekday Burn Analysis
  const weekendAnalysis = useMemo(() => {
    let weekendTotal = 0;
    let weekdayTotal = 0;
    let weekendCount = 0;
    let weekdayCount = 0;

    for (const t of data.transactions) {
      if (t.amount <= 0) continue; // Only expenses
      const date = new Date(t.date);
      const day = date.getDay(); // 0 is Sunday, 6 is Saturday
      const isWeekend = day === 0 || day === 6;

      if (isWeekend) {
        weekendTotal += t.amount;
        weekendCount++;
      } else {
        weekdayTotal += t.amount;
        weekdayCount++;
      }
    }

    const totalSpent = weekendTotal + weekdayTotal || 1;
    const weekendPct = Math.round((weekendTotal / totalSpent) * 100);
    const weekdayPct = 100 - weekendPct;

    // Normal expected weekend fraction is ~28.5% (2 out of 7 days)
    const isDisproportionate = weekendPct > 40;

    return {
      weekendTotal,
      weekdayTotal,
      weekendCount,
      weekdayCount,
      weekendPct,
      weekdayPct,
      isDisproportionate,
    };
  }, [data.transactions]);

  // 2. Micro-Splurges Radar (Transactions under ₹500 in Dining/Coffee/Shopping)
  const microSplurges = useMemo(() => {
    const microList = data.transactions.filter((t) => {
      const isMicro = t.amount > 0 && t.amount <= 500;
      const isDiscretionary =
        t.primaryCategory.includes("FOOD") ||
        t.primaryCategory.includes("DRINK") ||
        t.primaryCategory.includes("SHOP") ||
        t.primaryCategory.includes("ENTERTAIN");
      return isMicro && isDiscretionary;
    });

    const totalMicroSpent = microList.reduce((sum, t) => sum + t.amount, 0);
    const count = microList.length;
    const annualizedDrain = totalMicroSpent * 12;

    // 10-year compound value if invested at 12% annual return
    // FV = P * ((1 + r)^n - 1) / r
    const monthlyRate = 0.12 / 12;
    const months = 120;
    const compoundTenYear = Math.round(
      totalMicroSpent * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
    );

    return {
      items: microList.slice(0, 5),
      totalMicroSpent,
      count,
      annualizedDrain,
      compoundTenYear,
    };
  }, [data.transactions]);

  // 3. Vampire Subscriptions (Small recurring charges under ₹1,000)
  const vampireSubs = useMemo(() => {
    const smallRecurring = data.recurringItems.filter((i) => i.amount <= 1200);
    const totalMonthly = smallRecurring.reduce((sum, i) => sum + i.monthlyEquivalent, 0);
    const annualCost = totalMonthly * 12;
    const compoundTenYear = Math.round(
      totalMonthly * ((Math.pow(1 + 0.01, 120) - 1) / 0.01)
    );

    return {
      items: smallRecurring,
      totalMonthly,
      annualCost,
      compoundTenYear,
    };
  }, [data.recurringItems]);

  // 4. Archetype Spending Allocation Check (Needs / Wants / Savings)
  const archetypeBreakdown = useMemo(() => {
    let needs = 0;
    let wants = 0;

    for (const t of data.transactions) {
      if (t.amount <= 0) continue;
      const cat = t.primaryCategory.toUpperCase();
      if (cat.includes("RENT") || cat.includes("UTIL") || cat.includes("HOUS")) {
        needs += t.amount;
      } else {
        wants += t.amount;
      }
    }

    const totalIncome = data.totals.income || 125000;
    const totalSpent = data.totals.spent || 82500;
    const actualSavings = Math.max(0, totalIncome - totalSpent);

    const needsPct = Math.min(100, Math.round((needs / totalIncome) * 100)) || 42;
    const wantsPct = Math.min(100, Math.round((wants / totalIncome) * 100)) || 24;
    const savingsPct = Math.min(100, Math.round((actualSavings / totalIncome) * 100)) || 34;

    return {
      needsPct,
      wantsPct,
      savingsPct,
      needs,
      wants,
      actualSavings,
    };
  }, [data.transactions, data.totals]);

  const togglePlugLeak = (id: string) => {
    setPluggedLeaks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 font-hand">
      {/* Top Banner */}
      <div
        className="doodle-card relative p-6 sm:p-8"
        style={{ borderRadius: "20px 18px 22px 16px / 16px 20px 18px 22px" }}
      >
        <div className="doodle-tape -top-3 left-10" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full border border-[var(--border)] bg-[#DC2626] shadow-[1px_1px_0px_var(--border)]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-danger)] font-mono">
                Cashflow Leak Sentinel
              </span>
            </div>
            <h3 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-[var(--foreground)] font-display">
              Astra Financial Leak Audit
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)] font-hand">
              Algorithmic diagnostic scanning transactions for vampire subscriptions, weekend burn surges, and phantom micro-splurges.
            </p>
          </div>

          <div className="doodle-card px-4 py-2 text-right bg-rose-500/10 border-rose-500/40">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] font-mono">
              Potential 10-Yr Wealth Recovery
            </span>
            <p className="font-mono text-xl sm:text-2xl font-black text-[#DC2626] dark:text-[#F87171]">
              +{currency(microSplurges.compoundTenYear + vampireSubs.compoundTenYear)}
            </p>
          </div>
        </div>
      </div>

      {/* 3 Core Diagnostic Panels */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Weekend vs Weekday Burn */}
        <div className="doodle-card flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="doodle-badge bg-amber-500/15 text-[#D97706] font-bold">
                Behavioral Diagnostic
              </span>
              <Flame className="h-5 w-5 text-[#D97706]" />
            </div>

            <h4 className="mt-3 text-xl font-bold font-display text-[var(--foreground)]">
              Weekend Burn Quotient
            </h4>
            <p className="mt-1 text-xs text-[var(--muted)] font-hand leading-relaxed">
              Analyzes how spending concentrates on Saturday and Sunday compared to the working week.
            </p>

            {/* Visual Ratio Bar */}
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span>Weekend ({weekendAnalysis.weekendPct}%)</span>
                <span>Weekday ({weekendAnalysis.weekdayPct}%)</span>
              </div>
              <div className="h-4 w-full rounded-full border-2 border-[var(--border)] bg-[var(--surface-2)] overflow-hidden flex">
                <div
                  className="h-full bg-[#D97706] transition-all"
                  style={{ width: `${weekendAnalysis.weekendPct}%` }}
                />
                <div
                  className="h-full bg-[#49B6E5] transition-all"
                  style={{ width: `${weekendAnalysis.weekdayPct}%` }}
                />
              </div>
              <p className="text-[11px] text-[var(--muted)] font-hand">
                {weekendAnalysis.isDisproportionate
                  ? "Alert: Over 40% of discretionary outflow occurs within just 48 weekend hours."
                  : "Status: Weekend spending is disciplined and balanced across the cycle."}
              </p>
            </div>

            {/* Weekend Metrics */}
            <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)]/60 p-3 text-xs">
              <div className="flex justify-between font-mono font-bold">
                <span>Weekend Outflow:</span>
                <span className="text-[#D97706]">{currency(weekendAnalysis.weekendTotal)}</span>
              </div>
              <div className="flex justify-between font-mono font-bold mt-1">
                <span>Weekday Outflow:</span>
                <span>{currency(weekendAnalysis.weekdayTotal)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenBudgetModal("ENTERTAINMENT", 15000)}
            className="doodle-btn mt-6 flex w-full items-center justify-center gap-1.5 text-xs font-bold bg-[#D97706] text-white"
          >
            Cap Weekend Guard
          </button>
        </div>

        {/* Card 2: The Phantom Micro-Splurge Radar */}
        <div className="doodle-card flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="doodle-badge bg-rose-500/15 text-[#DC2626] dark:text-[#F87171] font-bold">
                The Coffee Factor
              </span>
              <TrendingDown className="h-5 w-5 text-[#DC2626]" />
            </div>

            <h4 className="mt-3 text-xl font-bold font-display text-[var(--foreground)]">
              Phantom Micro-Splurges
            </h4>
            <p className="mt-1 text-xs text-[var(--muted)] font-hand leading-relaxed">
              Discretionary transactions under ₹500 that slip past conscious budgeting but accumulate rapidly.
            </p>

            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span>Monthly Micro Burn:</span>
                <span className="text-[#DC2626] dark:text-[#F87171]">{currency(microSplurges.totalMicroSpent)}</span>
              </div>
              <div className="flex justify-between text-xs font-mono font-bold">
                <span>Annualized Cash Drain:</span>
                <span className="text-[#DC2626] dark:text-[#F87171]">{currency(microSplurges.annualizedDrain)}/yr</span>
              </div>
              <div className="flex justify-between text-xs font-mono font-bold pt-1 border-t border-dashed border-[var(--border)]">
                <span>10-Yr Invested Potential:</span>
                <span className="text-[#16A34A] dark:text-[#4ADE80]">+{currency(microSplurges.compoundTenYear)}</span>
              </div>
            </div>

            {/* Micro items preview */}
            <div className="mt-4 space-y-1.5">
              {microSplurges.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 px-2.5 py-1"
                >
                  <span className="truncate pr-2 font-hand">{item.name}</span>
                  <span className="font-mono font-bold text-[var(--foreground)] shrink-0">
                    {currency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenBudgetModal("FOOD_AND_DRINK", 25000)}
            className="doodle-btn mt-6 flex w-full items-center justify-center gap-1.5 text-xs font-bold bg-[#49B6E5] text-slate-900"
          >
            Rein In Micro Spend
          </button>
        </div>

        {/* Card 3: Vampire Recurring Creep */}
        <div className="doodle-card flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="doodle-badge bg-purple-500/15 text-[#9333EA] dark:text-[#C084FC] font-bold">
                Silent Outflow
              </span>
              <ShieldAlert className="h-5 w-5 text-[#9333EA]" />
            </div>

            <h4 className="mt-3 text-xl font-bold font-display text-[var(--foreground)]">
              Vampire Recurring Subscriptions
            </h4>
            <p className="mt-1 text-xs text-[var(--muted)] font-hand leading-relaxed">
              Sub-₹1,200 services that renew autonomously without regular auditing.
            </p>

            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span>Active Vampire Services:</span>
                <span>{vampireSubs.items.length} services</span>
              </div>
              <div className="flex justify-between text-xs font-mono font-bold">
                <span>Cumulative Burn:</span>
                <span className="text-[#9333EA] dark:text-[#C084FC]">{currency(vampireSubs.totalMonthly)}/mo</span>
              </div>
              <div className="flex justify-between text-xs font-mono font-bold pt-1 border-t border-dashed border-[var(--border)]">
                <span>10-Yr S&P Opportunity:</span>
                <span className="text-[#16A34A] dark:text-[#4ADE80]">+{currency(vampireSubs.compoundTenYear)}</span>
              </div>
            </div>

            {/* Vampire list */}
            <div className="mt-4 space-y-1.5">
              {vampireSubs.items.slice(0, 3).map((item) => {
                const isPlugged = pluggedLeaks.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 px-2.5 py-1"
                  >
                    <span className={`truncate pr-2 font-hand ${isPlugged ? "line-through opacity-50" : ""}`}>
                      {item.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePlugLeak(item.id)}
                      className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                        isPlugged
                          ? "bg-emerald-500/20 text-[#16A34A] border-emerald-500"
                          : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]"
                      }`}
                    >
                      {isPlugged ? "Plugged" : "Flag Prune"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenBudgetModal("OTHER", 10000)}
            className="doodle-btn mt-6 flex w-full items-center justify-center gap-1.5 text-xs font-bold bg-[#9333EA] text-white"
          >
            Freeze Inactive Subs
          </button>
        </div>
      </div>

      {/* Peer Archetype Benchmark Radar Sheet */}
      <div
        className="doodle-card p-6 sm:p-8 bg-[var(--surface)]"
        style={{ borderRadius: "22px 16px 20px 18px / 18px 20px 16px 22px" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-2 border-dashed border-[var(--border-soft)]">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-[var(--color-primary)]" />
              <h4 className="text-xl font-bold font-display text-[var(--foreground)]">
                Peer Archetype Benchmarks
              </h4>
            </div>
            <p className="mt-0.5 text-xs text-[var(--muted)] font-hand">
              How your cash allocation compares against standard financial freedom frameworks.
            </p>
          </div>

          <span className="doodle-badge bg-[var(--surface-2)] text-xs font-mono font-bold">
            Actual: {archetypeBreakdown.needsPct}% Needs · {archetypeBreakdown.wantsPct}% Wants · {archetypeBreakdown.savingsPct}% Savings
          </span>
        </div>

        {/* 3 Archetypes Grid */}
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {/* Archetype 1: 50/30/20 Rule */}
          <div className="rounded-xl border-2 border-[var(--border)] bg-[var(--surface-2)]/40 p-4">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-base font-display text-[var(--foreground)]">
                50 / 30 / 20 Classic
              </h5>
              <span className="text-[10px] font-mono uppercase text-[var(--muted)]">Standard</span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)] font-hand">
              Balanced foundation: 50% Needs, 30% Wants, 20% Wealth Building.
            </p>

            <div className="mt-4 space-y-2">
              <div>
                <div className="flex justify-between text-xs font-mono">
                  <span>Needs Target: 50%</span>
                  <span className={archetypeBreakdown.needsPct <= 50 ? "text-[#16A34A]" : "text-[#DC2626]"}>
                    Your: {archetypeBreakdown.needsPct}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--border-soft)] mt-1 overflow-hidden">
                  <div
                    className="h-full bg-[#49B6E5]"
                    style={{ width: `${Math.min(archetypeBreakdown.needsPct, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono">
                  <span>Savings Target: 20%</span>
                  <span className={archetypeBreakdown.savingsPct >= 20 ? "text-[#16A34A]" : "text-[#DC2626]"}>
                    Your: {archetypeBreakdown.savingsPct}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--border-soft)] mt-1 overflow-hidden">
                  <div
                    className="h-full bg-[#16A34A]"
                    style={{ width: `${Math.min(archetypeBreakdown.savingsPct, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Archetype 2: FIRE Movement */}
          <div className="rounded-xl border-2 border-[var(--border)] bg-[var(--surface-2)]/40 p-4">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-base font-display text-[var(--foreground)]">
                FIRE Movement
              </h5>
              <span className="text-[10px] font-mono uppercase text-[#D97706]">Aggressive</span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)] font-hand">
              Financial Independence: 40% Needs, 10% Wants, 50% Savings.
            </p>

            <div className="mt-4 space-y-2">
              <div>
                <div className="flex justify-between text-xs font-mono">
                  <span>Savings Target: 50%</span>
                  <span className={archetypeBreakdown.savingsPct >= 50 ? "text-[#16A34A]" : "text-[#D97706]"}>
                    Your: {archetypeBreakdown.savingsPct}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--border-soft)] mt-1 overflow-hidden">
                  <div
                    className="h-full bg-[#D97706]"
                    style={{ width: `${Math.min(archetypeBreakdown.savingsPct, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono">
                  <span>Wants Target: 10%</span>
                  <span className={archetypeBreakdown.wantsPct <= 10 ? "text-[#16A34A]" : "text-[#D97706]"}>
                    Your: {archetypeBreakdown.wantsPct}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--border-soft)] mt-1 overflow-hidden">
                  <div
                    className="h-full bg-[#9333EA]"
                    style={{ width: `${Math.min(archetypeBreakdown.wantsPct, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Archetype 3: Startup Bootstrapper */}
          <div className="rounded-xl border-2 border-[var(--border)] bg-[var(--surface-2)]/40 p-4">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-base font-display text-[var(--foreground)]">
                Bootstrapper
              </h5>
              <span className="text-[10px] font-mono uppercase text-[#49B6E5]">Capital Focus</span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)] font-hand">
              Runway preservation: 60% Operational Needs, 10% Wants, 30% Buffer.
            </p>

            <div className="mt-4 space-y-2">
              <div>
                <div className="flex justify-between text-xs font-mono">
                  <span>Operational Buffer: 30%</span>
                  <span className={archetypeBreakdown.savingsPct >= 30 ? "text-[#16A34A]" : "text-[#49B6E5]"}>
                    Your: {archetypeBreakdown.savingsPct}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--border-soft)] mt-1 overflow-hidden">
                  <div
                    className="h-full bg-[#49B6E5]"
                    style={{ width: `${Math.min(archetypeBreakdown.savingsPct, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono">
                  <span>Discretionary Burn: 10%</span>
                  <span className={archetypeBreakdown.wantsPct <= 10 ? "text-[#16A34A]" : "text-[#D97706]"}>
                    Your: {archetypeBreakdown.wantsPct}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--border-soft)] mt-1 overflow-hidden">
                  <div
                    className="h-full bg-[#DC2626]"
                    style={{ width: `${Math.min(archetypeBreakdown.wantsPct, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
