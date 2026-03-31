"use client";

import type { CSSProperties, ReactNode } from "react";
import CountUp from "react-countup";
import { motion } from "framer-motion";

import { springSnappy } from "@/components/motion-primitives";
import { compactCurrency, currency, formatDate } from "@/lib/finance";

export function SectionHeader({
  kicker,
  title,
  right,
}: {
  kicker: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <motion.p className="section-kicker" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={springSnappy}>
          {kicker}
        </motion.p>
        <motion.h2
          className="mt-2 text-lg font-medium tracking-[-0.03em] text-white sm:text-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSnappy, delay: 0.04 }}
        >
          {title}
        </motion.h2>
      </div>
      {right}
    </div>
  );
}

export function HeroMetric({
  label,
  value,
  valueString,
}: {
  label: string;
  value?: number;
  valueString?: string;
}) {
  const hydrated = typeof window !== "undefined";

  const abs = Math.abs(value ?? 0);

  return (
    <div data-chip className="hero-metric">
      <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">{label}</div>
      <div className="mt-3 text-[1.65rem] font-medium tracking-[-0.05em] text-white sm:text-[1.85rem]">
        {valueString ?? (
          <div suppressHydrationWarning>
            {hydrated ? (
              <CountUp end={abs} duration={1.2} formattingFn={(current) => currency(current)} />
            ) : (
              <span>{currency(abs)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div data-chip className="meta-chip">
      <span className="text-[10px] uppercase tracking-[0.2em] text-white/38">{label}</span>
      <span className="text-sm font-medium tracking-tight text-white/90">{value}</span>
    </div>
  );
}

export function ScoreDial({
  label,
  score,
  note,
}: {
  label: string;
  score: number;
  note: string;
}) {
  return (
    <div className="score-dial">
      <motion.div
        className="score-ring"
        style={{ "--score": `${Math.max(0, Math.min(score, 100))}` } as CSSProperties}
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <div className="score-core">
          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
          <motion.div
            key={score}
            className="mt-2 text-4xl font-semibold tracking-[-0.08em] text-white"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springSnappy}
          >
            {score}
          </motion.div>
        </div>
      </motion.div>
      <p className="mt-4 text-sm leading-7 text-slate-400">{note}</p>
    </div>
  );
}

export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-3.5">
      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}

export function SignalBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="signal-block">
      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-2 text-base font-medium text-white">{value}</div>
    </div>
  );
}

export function InputField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="rounded-[24px] border border-white/8 bg-black/20 p-4">
      <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="mt-3">{children}</div>
    </label>
  );
}

export function ToggleChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm transition ${
        active
          ? "bg-[#dffcf6] text-slate-950 shadow-[0_0_24px_rgba(125,212,194,0.25)]"
          : "border border-white/10 bg-white/5 text-slate-200"
      }`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      layout
    >
      {children}
    </motion.button>
  );
}

export function AlertCard({
  level,
  title,
  detail,
}: {
  level: "critical" | "warning" | "positive";
  title: string;
  detail: string;
}) {
  return (
    <div className={`alert-card alert-card-${level}`}>
      <div className="alert-pulse" />
      <div className="min-w-0">
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="mt-2 text-sm leading-6 text-slate-300/78">{detail}</div>
      </div>
    </div>
  );
}

export function BudgetCard({
  category,
  monthlyLimit,
  spent,
  remaining,
  utilization,
  status,
  accent,
  onFocus,
}: {
  category: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  utilization: number;
  status: "healthy" | "watch" | "over";
  accent: string;
  onFocus?: () => void;
}) {
  return (
    <button
      type="button"
      data-chip
      onClick={onFocus}
      className="budget-card text-left"
      style={
        {
          "--budget-color": budgetAccent(accent),
          "--budget-fill": `${Math.min(Math.max(utilization * 100, 6), 100)}%`,
        } as CSSProperties
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-white">{category}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
            {status === "healthy"
              ? "On plan"
              : status === "watch"
                ? "Watch closely"
                : "Limit breached"}
          </div>
        </div>
        <div className="text-right text-sm text-slate-300">{Math.round(utilization * 100)}%</div>
      </div>
      <div className="budget-track mt-4">
        <motion.div
          className="budget-fill"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          style={{ transformOrigin: "0% 50%" }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MiniStat label="Spent" value={compactCurrency(spent)} />
        <MiniStat
          label={status === "over" ? "Overshoot" : "Left"}
          value={compactCurrency(status === "over" ? spent - monthlyLimit : remaining)}
        />
      </div>
      <div className="mt-4 text-sm text-slate-400">Cap {compactCurrency(monthlyLimit)} this month.</div>
    </button>
  );
}

export function GoalCard({
  name,
  category,
  progress,
  current,
  target,
  monthlyNeeded,
  targetDate,
}: {
  name: string;
  category: string;
  progress: number;
  current: number;
  target: number;
  monthlyNeeded: number;
  targetDate: string;
}) {
  return (
    <div className="goal-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">{name}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
            {category} / {formatDate(targetDate)}
          </div>
        </div>
        <div className="text-sm text-slate-300">{Math.round(progress * 100)}%</div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white/6">
        <motion.div
          className="h-2 rounded-full bg-[linear-gradient(90deg,#7dd4c2,#f8fafc)]"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          style={{ width: `${Math.max(progress * 100, 6)}%`, transformOrigin: "0% 50%" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <MiniStat label="Current" value={currency(current)} />
        <MiniStat label="Target" value={currency(target)} />
      </div>
      <div className="mt-3 text-sm text-slate-400">
        Need {currency(monthlyNeeded)} per month to stay on track.
      </div>
    </div>
  );
}

export function RecurringRow({
  name,
  category,
  cadence,
  essential,
  nextDate,
  amount,
  monthlyEquivalent,
}: {
  name: string;
  category: string;
  cadence: string;
  essential: boolean;
  nextDate: string;
  amount: number;
  monthlyEquivalent: number;
}) {
  return (
    <div className="ledger-row">
      <div className="min-w-0">
        <div className="text-sm font-medium text-white">{name}</div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
          {category} / {cadence} / {essential ? "essential" : "flexible"} / {formatDate(nextDate)}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-slate-100">{currency(amount)}</div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
          {compactCurrency(monthlyEquivalent)}/mo
        </div>
      </div>
    </div>
  );
}

export function UpcomingChargeRow({
  name,
  category,
  dueDate,
  amount,
  daysAway,
  essential,
}: {
  name: string;
  category: string;
  dueDate: string;
  amount: number;
  daysAway: number;
  essential: boolean;
}) {
  return (
    <div className="upcoming-row">
      <div>
        <div className="text-sm font-medium text-white">{name}</div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
          {category} / {formatDate(dueDate)} / {essential ? "Essential" : "Flexible"}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-white">{currency(amount)}</div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
          {daysAway === 0 ? "Due today" : `${daysAway} days`}
        </div>
      </div>
    </div>
  );
}

export function InsightTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-medium text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-slate-400">{note}</div>
    </div>
  );
}

export function LedgerRow({
  title,
  subtitle,
  value,
  tone = "text-slate-100",
}: {
  title: string;
  subtitle: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="ledger-row">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-white">{title}</div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">{subtitle}</div>
      </div>
      <div className={`text-right text-sm font-medium ${tone}`}>{value}</div>
    </div>
  );
}

export function buildSmoothPath(values: number[], max: number) {
  const points = values.map((value, index) => ({
    x: (index / Math.max(values.length - 1, 1)) * 100,
    y: 100 - (value / max) * 100,
  }));

  return points.reduce((path, point, index, list) => {
    if (index === 0) {
      return `M ${point.x},${point.y}`;
    }

    const previous = list[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX},${previous.y} ${controlX},${point.y} ${point.x},${point.y}`;
  }, "");
}

function budgetAccent(accent: string) {
  switch (accent) {
    case "blue":
      return "#8dc3ff";
    case "gold":
      return "#f3ce71";
    case "rose":
      return "#f0a3b8";
    default:
      return "#7dd4c2";
  }
}
