"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import { compactCurrency, currency, type TrendPoint } from "@/lib/finance";

interface InteractiveChartProps {
  trend: TrendPoint[];
}

export function InteractiveChart({ trend }: InteractiveChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const spendSeries = useMemo(() => trend.map((p) => p.spend), [trend]);
  const incomeSeries = useMemo(() => trend.map((p) => p.income), [trend]);

  const maxVal = useMemo(
    () => Math.max(...spendSeries, ...incomeSeries, 1),
    [spendSeries, incomeSeries]
  );

  const pointsCount = trend.length;

  const points = useMemo(() => {
    return trend.map((t, idx) => {
      const x = (idx / Math.max(pointsCount - 1, 1)) * 100;
      const ySpend = 100 - (t.spend / maxVal) * 85 - 10;
      const yIncome = 100 - (t.income / maxVal) * 85 - 10;
      return { ...t, x, ySpend, yIncome, idx };
    });
  }, [trend, maxVal, pointsCount]);

  const spendPath = useMemo(() => {
    return points.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M ${pt.x},${pt.ySpend}`;
      const prev = arr[i - 1];
      const cx = (prev.x + pt.x) / 2;
      return `${acc} C ${cx},${prev.ySpend} ${cx},${pt.ySpend} ${pt.x},${pt.ySpend}`;
    }, "");
  }, [points]);

  const spendArea = useMemo(() => {
    if (points.length === 0) return "";
    return `${spendPath} L 100,100 L 0,100 Z`;
  }, [spendPath, points]);

  const incomePath = useMemo(() => {
    return points.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M ${pt.x},${pt.yIncome}`;
      const prev = arr[i - 1];
      const cx = (prev.x + pt.x) / 2;
      return `${acc} C ${cx},${prev.yIncome} ${cx},${pt.yIncome} ${pt.x},${pt.yIncome}`;
    }, "");
  }, [points]);

  const incomeArea = useMemo(() => {
    if (points.length === 0) return "";
    return `${incomePath} L 100,100 L 0,100 Z`;
  }, [incomePath, points]);

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;

  // Key stats
  const totalSpend = useMemo(() => spendSeries.reduce((a, b) => a + b, 0), [spendSeries]);
  const totalIncome = useMemo(() => incomeSeries.reduce((a, b) => a + b, 0), [incomeSeries]);
  const totalNet = totalIncome - totalSpend;
  const overallSavingsRate = totalIncome > 0 ? Math.round((totalNet / totalIncome) * 100) : 0;

  return (
    <div
      className="relative doodle-card p-6 sm:p-8"
      style={{ borderRadius: "22px 18px 24px 16px / 16px 24px 18px 22px" }}
    >
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#49B6E5]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-2)]">
              Cashflow Dynamics
            </span>
          </div>
          <h3 className="mt-1 text-xl font-bold text-[var(--foreground)]">
            Inflow vs. Outflow Trajectory
          </h3>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#16A34A] border border-[var(--border)]" />
            <span className="text-[var(--foreground)]">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#DC2626] border border-[var(--border)]" />
            <span className="text-[var(--foreground)]">Spending</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas & Tooltip Container */}
      <div
        className="relative mt-8 h-64 w-full select-none cursor-crosshair sm:h-72"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relativeX = (e.clientX - rect.left) / rect.width;
          const index = Math.round(relativeX * (pointsCount - 1));
          const clamped = Math.max(0, Math.min(pointsCount - 1, index));
          setHoverIndex(clamped);
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* Subtle Horizontal Gridlines */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-15">
          <div className="w-full border-b border-dashed border-[var(--foreground)]" />
          <div className="w-full border-b border-dashed border-[var(--foreground)]" />
          <div className="w-full border-b border-dashed border-[var(--foreground)]" />
          <div className="w-full border-b border-[var(--foreground)] opacity-40" />
        </div>

        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          <defs>
            {/* Income Gradient Fill */}
            <linearGradient id="incomeAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Spend Gradient Fill */}
            <linearGradient id="spendAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>

            {/* Income Stroke Gradient */}
            <linearGradient id="incomeStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Spend Stroke Gradient */}
            <linearGradient id="spendStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>

          {/* Area Fills */}
          <motion.path
            d={incomeArea}
            fill="url(#incomeAreaGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          />
          <motion.path
            d={spendArea}
            fill="url(#spendAreaGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.15 }}
          />

          {/* Line Curves */}
          <motion.path
            d={incomePath}
            fill="none"
            stroke="url(#incomeStroke)"
            strokeWidth="2.2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.path
            d={spendPath}
            fill="none"
            stroke="url(#spendStroke)"
            strokeWidth="2.2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          />

          {/* Hover Crosshair & Indicators */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1="0"
                x2={activePoint.x}
                y2="100"
                stroke="var(--foreground)"
                strokeOpacity="0.25"
                strokeWidth="0.8"
                strokeDasharray="2,2"
              />
              {/* Income Point Marker */}
              <circle
                cx={activePoint.x}
                cy={activePoint.yIncome}
                r="3"
                className="fill-emerald-400 stroke-[var(--surface)] stroke-[1.5]"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.yIncome}
                r="5"
                className="animate-ping fill-emerald-400 opacity-40"
              />
              {/* Spend Point Marker */}
              <circle
                cx={activePoint.x}
                cy={activePoint.ySpend}
                r="3"
                className="fill-rose-400 stroke-[var(--surface)] stroke-[1.5]"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.ySpend}
                r="5"
                className="animate-ping fill-rose-400 opacity-40"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip Card */}
        <AnimatePresence>
          {activePoint && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none absolute z-30 min-w-[200px] doodle-card p-3.5"
              style={{
                borderRadius: "14px 10px 12px 14px / 12px 14px 10px 12px",
                left: `${Math.min(Math.max(activePoint.x, 15), 85)}%`,
                top: "10%",
                transform: "translateX(-50%)",
              }}
            >
              <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--border-soft)] pb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-2)]">
                <span>{activePoint.label}</span>
                <span
                  className={
                    activePoint.income - activePoint.spend >= 0
                      ? "text-[#16A34A]"
                      : "text-[#DC2626]"
                  }
                >
                  {activePoint.income - activePoint.spend >= 0 ? "+ Surplus" : "- Deficit"}
                </span>
              </div>

              <div className="mt-2.5 space-y-2 text-xs font-bold">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[var(--muted)]">
                    <ArrowDownRight className="h-3.5 w-3.5 text-[#16A34A]" />
                    Income
                  </span>
                  <span className="font-mono text-[#16A34A] tabular-nums">
                    {currency(activePoint.income)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[var(--muted)]">
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#DC2626]" />
                    Spend
                  </span>
                  <span className="font-mono text-[#DC2626] tabular-nums">
                    {currency(activePoint.spend)}
                  </span>
                </div>

                <div className="border-t-2 border-dashed border-[var(--border-soft)] pt-2 flex items-center justify-between text-xs">
                  <span className="text-[var(--muted-2)]">Net</span>
                  <span className="font-mono font-bold text-[var(--foreground)] tabular-nums">
                    {currency(activePoint.income - activePoint.spend)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* X-Axis Month Labels */}
      <div className="mt-4 flex justify-between px-1 text-xs font-bold uppercase tracking-wider text-[var(--muted-2)]">
        {trend.map((p, idx) => (
          <span
            key={p.label}
            className={`transition-colors ${
              hoverIndex === idx ? "font-bold text-[#49B6E5]" : ""
            }`}
          >
            {p.label}
          </span>
        ))}
      </div>

      {/* Summary KPI Strip */}
      <div className="mt-8 grid grid-cols-2 gap-3 border-t-2 border-dashed border-[var(--border-soft)] pt-6 sm:grid-cols-4">
        <div
          className="doodle-card p-3.5"
          style={{ borderRadius: "12px 14px 10px 12px / 14px 10px 12px 14px" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-2)]">6M Inflow</p>
          <p className="mt-1 font-mono text-base font-bold text-[#16A34A] tabular-nums">
            {compactCurrency(totalIncome)}
          </p>
        </div>

        <div
          className="doodle-card p-3.5"
          style={{ borderRadius: "14px 10px 12px 14px / 10px 14px 12px 10px" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-2)]">6M Outflow</p>
          <p className="mt-1 font-mono text-base font-bold text-[#DC2626] tabular-nums">
            {compactCurrency(totalSpend)}
          </p>
        </div>

        <div
          className="doodle-card p-3.5"
          style={{ borderRadius: "10px 14px 12px 10px / 12px 10px 14px 12px" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-2)]">Net Momentum</p>
          <p
            className={`mt-1 font-mono text-base font-bold tabular-nums ${
              totalNet >= 0 ? "text-[#49B6E5]" : "text-[#DC2626]"
            }`}
          >
            {compactCurrency(totalNet)}
          </p>
        </div>

        <div
          className="doodle-card p-3.5"
          style={{ borderRadius: "12px 10px 14px 12px / 14px 12px 10px 14px" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-2)]">Savings Rate</p>
          <p className="mt-1 flex items-center gap-1 font-mono text-base font-bold text-[var(--foreground)] tabular-nums">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            {overallSavingsRate}%
          </p>
        </div>
      </div>
    </div>
  );
}
