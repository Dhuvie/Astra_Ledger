"use client";

import { useMemo } from "react";
import CountUp from "react-countup";
import {
  Wallet,
  ArrowUp,
  ArrowDown,
  ChevronDown,
} from "lucide-react";
import {
  currency,
  compactCurrency,
  formatDate,
  startCase,
  type DashboardData,
} from "@/lib/finance";
import { InteractiveChart } from "@/components/interactive-chart";
import { TemporalWarp } from "@/components/temporal-warp";

interface OverviewTabProps {
  data: DashboardData;
  onOpenQuickAdd: () => void;
  onOpenGoalContribute: (goal: { id: string; name: string; currentAmount: number; targetAmount: number }) => void;
  monthsAhead?: number;
  onMonthsAheadChange?: (months: number) => void;
  onNavigateToLedger?: () => void;
  onOpenStressTest?: () => void;
  onNavigateToQuarantine?: () => void;
}

export function OverviewTab({
  data,
  onOpenQuickAdd,
  onOpenGoalContribute,
  monthsAhead = 0,
  onMonthsAheadChange,
  onNavigateToLedger,
  onOpenStressTest,
  onNavigateToQuarantine,
}: OverviewTabProps) {
  const topRecent = data.transactions.slice(0, 6);

  // Top goal for emergency fund card
  const primaryGoal = data.goals[0] ?? {
    name: "Emergency Fund",
    currentAmount: 300000,
    targetAmount: 300000,
  };

  return (
    <div className="space-y-8 font-hand">
      {/* Top Header: Astra Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
        <div className="flex items-center gap-2.5">
          <Wallet className="h-7 w-7 text-[var(--color-primary)]" />
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--foreground)] font-display">
            Astra Overview
          </h2>
        </div>
        <p className="text-xs text-[var(--muted)] font-mono">
          Interactive Cashflow Trajectory & Runway Pulse
        </p>
      </div>

      {/* 4 Doodle Metric Cards strictly matching Image 1 */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Monthly Inflow */}
        <div
          className="doodle-card flex flex-col justify-between p-6"
          style={{ borderRadius: "20px 14px 18px 16px / 16px 18px 14px 20px" }}
        >
          <div>
            <h3 className="text-lg font-bold font-display text-[var(--foreground)]">
              Monthly Inflow
            </h3>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tabular-nums">
                <CountUp end={data.totals.income} duration={1} formattingFn={(val) => currency(val)} />
              </span>
              <ArrowUp className="h-5 w-5 text-[var(--color-success)] stroke-[3]" />
            </div>
          </div>

          {/* Mini Hand-Drawn Bar Chart Sketch */}
          <div className="mt-6 pt-2">
            <svg className="w-full h-14 overflow-visible" viewBox="0 0 100 40">
              <rect x="4" y="20" width="13" height="20" rx="2" fill="none" stroke="var(--border)" strokeWidth="2" />
              <rect x="23" y="10" width="13" height="30" rx="2" fill="none" stroke="var(--border)" strokeWidth="2" />
              <rect x="42" y="24" width="13" height="16" rx="2" fill="none" stroke="var(--border)" strokeWidth="2" />
              <rect x="61" y="6" width="13" height="34" rx="2" fill="none" stroke="var(--border)" strokeWidth="2" />
              <rect x="80" y="14" width="13" height="26" rx="2" fill="none" stroke="var(--border)" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 2: Monthly Burn */}
        <div
          className="doodle-card flex flex-col justify-between p-6"
          style={{ borderRadius: "16px 20px 14px 18px / 18px 14px 20px 16px" }}
        >
          <div>
            <h3 className="text-lg font-bold font-display text-[var(--foreground)]">
              Monthly Burn
            </h3>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tabular-nums">
                <CountUp end={data.totals.spent} duration={1} formattingFn={(val) => currency(val)} />
              </span>
              <ArrowDown className="h-5 w-5 text-[var(--color-danger)] stroke-[3]" />
            </div>
          </div>

          {/* Mini Hand-Drawn Shaded Wave Sketch */}
          <div className="mt-6 pt-2">
            <svg className="w-full h-14 overflow-visible" viewBox="0 0 100 40">
              <path
                d="M 0,30 Q 20,36 38,22 T 75,25 T 100,18 L 100,40 L 0,40 Z"
                fill="var(--surface-2)"
                stroke="var(--border)"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Runway Speedometer Arc Gauge */}
        <div
          className="doodle-card flex flex-col justify-between p-6"
          style={{ borderRadius: "18px 14px 20px 16px / 16px 20px 14px 18px" }}
        >
          <div>
            <h3 className="text-lg font-bold font-display text-[var(--foreground)]">
              Runway
            </h3>
          </div>

          {/* Speedometer Gauge Sketch */}
          <div className="my-2 flex flex-col items-center">
            <svg className="w-36 h-20 overflow-visible" viewBox="0 0 100 55">
              {/* Outer dashed arc */}
              <path
                d="M 12,50 A 38,38 0 0,1 88,50"
                fill="none"
                stroke="var(--border)"
                strokeWidth="3.5"
                strokeDasharray="4 3"
              />
              {/* Inner smooth arc */}
              <path
                d="M 20,50 A 30,30 0 0,1 80,50"
                fill="none"
                stroke="var(--border)"
                strokeWidth="2"
              />
              {/* Pointer Needle */}
              <line
                x1="50"
                y1="50"
                x2="74"
                y2="22"
                stroke="var(--border)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="50" cy="50" r="4.5" fill="var(--border)" />
              {/* Max Marker */}
              <text x="88" y="24" fontSize="9" fontWeight="bold" fill="var(--foreground)" fontFamily="JetBrains Mono">
                8
              </text>
            </svg>
            <div className="mt-1 flex items-center justify-center gap-2">
              <p className="font-mono text-base font-bold text-[var(--foreground)] text-center">
                {data.planner.runwayMonths.toFixed(1)} Months
              </p>
              {onOpenStressTest && (
                <button
                  type="button"
                  onClick={onOpenStressTest}
                  className="px-2 py-0.5 rounded-md border border-[var(--color-danger)]/60 bg-[var(--color-danger)]/10 text-[10px] font-mono uppercase font-bold text-[var(--color-danger)] hover:bg-[var(--color-danger)]/20 transition-colors"
                  title="Launch Crisis Stress-Test Drill (0)"
                >
                  Drill ⚡
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Emergency Fund / Goal Progress */}
        <div
          className="doodle-card flex flex-col justify-between p-6"
          style={{ borderRadius: "14px 18px 16px 20px / 20px 16px 18px 14px" }}
        >
          <div>
            <h3 className="text-lg font-bold font-display text-[var(--foreground)]">
              {primaryGoal.name}
            </h3>
            <div className="mt-2">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tabular-nums">
                {currency(primaryGoal.currentAmount || 300000)}
              </span>
            </div>
          </div>

          {/* Hand-Drawn Capsule Progress Bar with Crosshatch Fill */}
          <div className="mt-6 space-y-1.5">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 120 24">
              <defs>
                <pattern
                  id="goal-hatch-pattern"
                  width="6"
                  height="6"
                  patternTransform="rotate(45 0 0)"
                  patternUnits="userSpaceOnUse"
                >
                  <line x1="0" y1="0" x2="0" y2="6" stroke="var(--border)" strokeWidth="1.5" />
                </pattern>
              </defs>
              <rect
                x="2"
                y="4"
                width="116"
                height="16"
                rx="8"
                fill="var(--surface-2)"
                stroke="var(--border)"
                strokeWidth="2"
              />
              <rect
                x="4"
                y="6"
                width="78"
                height="12"
                rx="6"
                fill="url(#goal-hatch-pattern)"
                stroke="var(--border)"
                strokeWidth="1.5"
              />
            </svg>
            <p className="text-xs font-bold text-[var(--muted-2)] font-hand">
              Goal Progress
            </p>
          </div>
        </div>
      </div>

      {/* Lower Section strictly matching Image 1: Recent Activity + Cash Flow Trend */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity Card */}
        <div
          className="doodle-card flex flex-col justify-between p-6 sm:p-8"
          style={{ borderRadius: "22px 16px 20px 18px / 18px 20px 16px 22px" }}
        >
          <div>
            <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--border-soft)] pb-4">
              <h4 className="text-xl font-bold font-display text-[var(--foreground)]">
                Recent Activity
              </h4>
              <button
                type="button"
                onClick={onNavigateToLedger ?? onOpenQuickAdd}
                className="flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline font-hand"
              >
                <span>Full Ledger →</span>
              </button>
            </div>

            <div className="mt-4 divide-y-2 divide-dashed divide-[var(--border-soft)]">
              {topRecent.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3.5 first:pt-1 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--surface-2)] shadow-[1px_1px_0px_var(--border)]">
                      <Wallet className="h-5 w-5 text-[var(--foreground)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-[var(--foreground)] font-display">
                        {t.name}
                      </p>
                      <p className="text-xs text-[var(--muted)] font-mono">
                        {formatDate(t.date)}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={`font-mono text-base font-black tabular-nums ${
                        t.amount < 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                      }`}
                    >
                      {t.amount < 0 ? "+" : "-"}
                      {currency(Math.abs(t.amount))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cash Flow Trend Card with Coordinate Axes */}
        <div
          className="doodle-card p-6 sm:p-8"
          style={{ borderRadius: "18px 22px 16px 20px / 20px 16px 22px 18px" }}
        >
          <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--border-soft)] pb-4">
            <h4 className="text-xl font-bold font-display text-[var(--foreground)]">
              Cash Flow Trend
            </h4>
            <span className="text-xs font-mono font-bold text-[var(--muted-2)]">
              Last 6 Months
            </span>
          </div>

          <div className="mt-6">
            <InteractiveChart trend={data.trend} />
          </div>
        </div>
      </div>

      {/* Wealth Forecasting Engine */}
      {onMonthsAheadChange && (
        <TemporalWarp
          data={data}
          monthsAhead={monthsAhead}
          onMonthsChange={onMonthsAheadChange}
        />
      )}
    </div>
  );
}
