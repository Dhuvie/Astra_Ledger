"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Layers,
} from "lucide-react";
import { currency, startCase, type DashboardData } from "@/lib/finance";
import { InteractiveChart } from "@/components/interactive-chart";

interface AnalyticsTabProps {
  data: DashboardData;
}

export function AnalyticsTab({ data }: AnalyticsTabProps) {
  // Aggregate merchants
  const merchantTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of data.transactions) {
      if (t.amount > 0) {
        // Expense
        const m = t.merchantName || t.name;
        map.set(m, (map.get(m) || 0) + t.amount);
      }
    }
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [data.transactions]);

  return (
    <div className="space-y-8">
      {/* Interactive Main Chart */}
      <InteractiveChart trend={data.trend} />

      {/* Analytics Matrix Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Breakdown Matrix */}
        <div className="doodle-card p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-secondary)]">
              ✎ Proportional Allocation
            </span>
            <PieChart className="h-4 w-4 text-[var(--muted)]" />
          </div>
          <h3 className="mt-1 text-2xl font-black tracking-tight text-[var(--foreground)] font-serif">
            Category Share Breakdown
          </h3>

          <div className="mt-6 space-y-4">
            {data.breakdown.length === 0 ? (
              <div className="py-12 text-center text-sm font-serif text-[var(--muted)]">
                ✎ No categorized expenses recorded yet.
              </div>
            ) : (
              data.breakdown.map((cat, idx) => {
                const pct = Math.round(cat.share * 100);

                return (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-serif">
                      <span className="font-bold text-[var(--foreground)]">
                        {startCase(cat.category)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[var(--foreground)]">
                          {currency(cat.amount)}
                        </span>
                        <span className="text-xs text-[var(--muted)] font-mono font-bold">{pct}%</span>
                      </div>
                    </div>

                    <div className="h-3 w-full rounded-full border-2 border-[var(--border)] bg-[var(--surface-2)] p-0.5 shadow-[2px_2px_0px_var(--border)] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-[var(--color-primary)]"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.max(pct, 4)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: idx * 0.05 }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Merchants Leaderboard */}
        <div className="doodle-card p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-secondary)]">
              ✎ Recipient Leaderboard
            </span>
            <Layers className="h-4 w-4 text-[var(--muted)]" />
          </div>
          <h3 className="mt-1 text-2xl font-black tracking-tight text-[var(--foreground)] font-serif">
            Top Outflow Entities
          </h3>

          <div className="mt-6 divide-y-2 divide-dashed divide-[var(--border-soft)]">
            {merchantTotals.length === 0 ? (
              <div className="py-12 text-center text-sm font-serif text-[var(--muted)]">
                ✎ No merchant activity recorded yet.
              </div>
            ) : (
              merchantTotals.map((m, idx) => (
                <div key={m.name} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[var(--border)] bg-[var(--surface-2)] text-xs font-mono font-black text-[var(--foreground)] shadow-[2px_2px_0px_var(--border)]">
                      0{idx + 1}
                    </span>
                    <div>
                      <p className="text-base font-bold text-[var(--foreground)] font-serif">{m.name}</p>
                      <p className="text-xs font-serif text-[var(--muted)]">
                        Direct Merchant
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-base font-black text-[var(--color-danger)] tabular-nums">
                      {currency(m.total)}
                    </p>
                    <p className="text-xs font-serif text-[var(--muted)]">
                      {Math.round((m.total / (data.totals.spent || 1)) * 100)}% of total spend
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
