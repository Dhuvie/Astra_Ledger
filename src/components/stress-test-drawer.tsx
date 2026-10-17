"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  X,
  RotateCcw,
  Flame,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { currency, compactCurrency, type DashboardData } from "@/lib/finance";

interface StressTestDrawerProps {
  data: DashboardData;
  isOpen: boolean;
  onClose: () => void;
}

export function StressTestDrawer({ data, isOpen, onClose }: StressTestDrawerProps) {
  // Shock Sliders
  const [incomeShockPct, setIncomeShockPct] = useState(0); // -50% to +50%
  const [inflationSurgePct, setInflationSurgePct] = useState(0); // 0% to +30%
  const [emergencyExpense, setEmergencyExpense] = useState(0); // 0 to $25,000
  const [austerityMode, setAusterityMode] = useState(false); // cuts recurring subs & 25% spend

  // Baseline Metrics
  const baseLiquidity = data.accounts.reduce((sum, a) => sum + a.balanceCurrent, 0);
  const baseMonthlyIncome = data.totals.income;
  const baseMonthlySpent = data.totals.spent;

  // Recurring Subscriptions total
  const recurringTotal = data.recurringItems.reduce((sum, r) => sum + r.amount, 0);

  // Recalculate Shocked Financial Orbit
  const shockedMetrics = useMemo(() => {
    // Income adjusted by shock
    const shockedIncome = Math.max(0, baseMonthlyIncome * (1 + incomeShockPct / 100));

    // Spend adjusted by inflation and optional austerity
    let austerityCut = 0;
    if (austerityMode) {
      // Cut subscriptions + 20% discretionary
      austerityCut = recurringTotal + (baseMonthlySpent - recurringTotal) * 0.2;
    }
    const shockedSpent = Math.max(
      0,
      (baseMonthlySpent - austerityCut) * (1 + inflationSurgePct / 100)
    );

    // Immediate balance after black swan emergency
    const shockedBalance = Math.max(0, baseLiquidity - emergencyExpense);

    // Shocked Monthly Net
    const shockedNet = shockedIncome - shockedSpent;

    // Shocked Runway in months
    const shockedRunway =
      shockedSpent > 0 ? shockedBalance / shockedSpent : shockedBalance > 0 ? 99 : 0;

    // Safe Daily Target
    const shockedDaily = shockedSpent > 0 ? (shockedIncome / 30) * 0.8 : 0;

    // Defcon Assessment
    let defcon = 5;
    let defconLabel = "DEFCON 5 · Optimal Orbit";
    let defconColor = "text-[var(--color-success)]";
    let defconBg = "bg-[var(--color-success)]/15 border-[var(--color-success)]";

    if (shockedRunway < 2 || shockedBalance < 1000) {
      defcon = 1;
      defconLabel = "DEFCON 1 · Severe Critical Breach";
      defconColor = "text-[var(--color-danger)]";
      defconBg = "bg-[var(--color-danger)]/20 border-[var(--color-danger)]";
    } else if (shockedRunway < 4) {
      defcon = 2;
      defconLabel = "DEFCON 2 · High Vulnerability";
      defconColor = "text-[var(--color-warning)]";
      defconBg = "bg-[var(--color-warning)]/20 border-[var(--color-warning)]";
    } else if (shockedRunway < 6 || shockedNet < 0) {
      defcon = 3;
      defconLabel = "DEFCON 3 · Elevated Friction";
      defconColor = "text-[var(--color-warning)]";
      defconBg = "bg-[var(--color-warning)]/15 border-[var(--color-warning)]";
    } else if (shockedRunway < 10) {
      defcon = 4;
      defconLabel = "DEFCON 4 · Guarded Orbit";
      defconColor = "text-[var(--color-primary)]";
      defconBg = "bg-[var(--color-primary)]/15 border-[var(--color-primary)]";
    }

    // 12-Month Trajectory Curves
    const months = Array.from({ length: 13 }, (_, i) => i);
    const baselineTrajectory = months.map((m) =>
      Math.max(0, baseLiquidity + (baseMonthlyIncome - baseMonthlySpent) * m)
    );
    const shockedTrajectory = months.map((m) =>
      Math.max(0, shockedBalance + shockedNet * m)
    );

    return {
      shockedIncome,
      shockedSpent,
      shockedBalance,
      shockedNet,
      shockedRunway,
      shockedDaily,
      defcon,
      defconLabel,
      defconColor,
      defconBg,
      baselineTrajectory,
      shockedTrajectory,
      austerityCut,
    };
  }, [
    baseLiquidity,
    baseMonthlyIncome,
    baseMonthlySpent,
    recurringTotal,
    incomeShockPct,
    inflationSurgePct,
    emergencyExpense,
    austerityMode,
  ]);

  const resetShocks = () => {
    setIncomeShockPct(0);
    setInflationSurgePct(0);
    setEmergencyExpense(0);
    setAusterityMode(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Doodle Stress Drawer */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l-2 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-2xl overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--border-soft)] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[var(--border)] bg-[var(--surface-2)] text-[var(--color-danger)] shadow-[2px_2px_0px_var(--border)]">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-danger)] font-serif">
                    ✎ Macro Stress Engine
                  </span>
                  <span className="doodle-badge text-[9px] uppercase">
                    Shock Simulator
                  </span>
                </div>
                <h3 className="text-xl font-bold font-serif text-[var(--foreground)]">
                  Macro Crisis & Windfall Sandbox
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetShocks}
                className="doodle-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button
                type="button"
                onClick={onClose}
                className="doodle-btn flex h-8 w-8 items-center justify-center p-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="space-y-6 p-6">
            {/* DEFCON Banner */}
            <div
              className={`rounded-xl border-2 p-4 transition-all duration-300 shadow-[2px_2px_0px_var(--border)] ${shockedMetrics.defconBg}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Flame className={`h-5 w-5 ${shockedMetrics.defconColor}`} />
                  <span className={`text-base font-bold font-serif ${shockedMetrics.defconColor}`}>
                    {shockedMetrics.defconLabel}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-[var(--foreground)]">
                  Survival Runway: {shockedMetrics.shockedRunway.toFixed(1)} Months
                </span>
              </div>
            </div>

            {/* Shock Sliders Matrix */}
            <div className="doodle-card space-y-5 p-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)] font-serif">
                ✎ Inject Macro Shockwaves
              </h4>

              {/* Slider 1: Income Shock */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-serif">
                  <span className="font-bold text-[var(--foreground)]">Income Shockwave</span>
                  <span
                    className={`font-mono font-bold ${
                      incomeShockPct < 0
                        ? "text-[var(--color-danger)]"
                        : incomeShockPct > 0
                        ? "text-[var(--color-success)]"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    {incomeShockPct > 0 ? "+" : ""}
                    {incomeShockPct}% ({currency(shockedMetrics.shockedIncome)}/mo)
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="5"
                  value={incomeShockPct}
                  onChange={(e) => setIncomeShockPct(Number(e.target.value))}
                  className="w-full accent-[var(--color-primary)] cursor-pointer"
                />
                <div className="flex justify-between text-xs text-[var(--muted)] font-serif">
                  <span>-50% (Job Loss)</span>
                  <span>Baseline</span>
                  <span>+50% (Raise)</span>
                </div>
              </div>

              {/* Slider 2: Inflation Surge */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-serif">
                  <span className="font-bold text-[var(--foreground)]">Inflation Surge</span>
                  <span className="font-mono font-bold text-[var(--color-warning)]">
                    +{inflationSurgePct}% Cost Increase
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="2"
                  value={inflationSurgePct}
                  onChange={(e) => setInflationSurgePct(Number(e.target.value))}
                  className="w-full accent-[var(--color-warning)] cursor-pointer"
                />
                <div className="flex justify-between text-xs text-[var(--muted)] font-serif">
                  <span>0% (Stable)</span>
                  <span>+15% (High)</span>
                  <span>+30% (Hyperinflation)</span>
                </div>
              </div>

              {/* Slider 3: Black Swan Liability */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-serif">
                  <span className="font-bold text-[var(--foreground)]">
                    Black Swan Emergency Bill
                  </span>
                  <span className="font-mono font-bold text-[var(--color-danger)]">
                    -{currency(emergencyExpense)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25000"
                  step="500"
                  value={emergencyExpense}
                  onChange={(e) => setEmergencyExpense(Number(e.target.value))}
                  className="w-full accent-[var(--color-danger)] cursor-pointer"
                />
                <div className="flex justify-between text-xs text-[var(--muted)] font-serif">
                  <span>$0</span>
                  <span>$10,000 (Medical/Car)</span>
                  <span>$25,000 (Catastrophic)</span>
                </div>
              </div>

              {/* Toggle 4: Austerity Kill Switch */}
              <div className="flex items-center justify-between rounded-xl border-2 border-dashed border-[var(--border-soft)] bg-[var(--surface-2)]/60 p-3.5">
                <div>
                  <p className="text-sm font-bold font-serif text-[var(--foreground)]">
                    Activate Austerity Protocol
                  </p>
                  <p className="text-xs text-[var(--muted)] font-sans">
                    Instantly freeze {currency(recurringTotal)}/mo subscriptions & cut 20% discretionary
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAusterityMode((prev) => !prev)}
                  className={`doodle-btn text-xs font-bold ${
                    austerityMode
                      ? "bg-[var(--color-success)] text-white"
                      : "bg-[var(--surface)] text-[var(--foreground)]"
                  }`}
                >
                  {austerityMode ? "ACTIVE (+Defense)" : "DISARMED"}
                </button>
              </div>
            </div>

            {/* Trajectory Divergence Visualization */}
            <div className="doodle-card p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)] font-serif">
                  ✎ 12-Month Runway Trajectory
                </span>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1 text-[var(--muted)]">
                    <span className="h-2.5 w-2.5 rounded-full border border-[var(--border)] bg-slate-400" />
                    Baseline
                  </span>
                  <span className="flex items-center gap-1 text-[var(--color-danger)] font-bold">
                    <span className="h-2.5 w-2.5 rounded-full border border-[var(--border)] bg-[var(--color-danger)]" />
                    Shock Orbit
                  </span>
                </div>
              </div>

              {/* SVG Comparison Chart */}
              <div className="mt-5 h-44 w-full">
                <svg className="h-full w-full overflow-visible" viewBox="0 0 400 120">
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="400" y2="30" stroke="var(--border)" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="400" y2="60" stroke="var(--border)" strokeDasharray="3 3" />
                  <line x1="0" y1="90" x2="400" y2="90" stroke="var(--border)" strokeDasharray="3 3" />

                  {/* Compute Path Points */}
                  {(() => {
                    const maxVal = Math.max(
                      ...shockedMetrics.baselineTrajectory,
                      ...shockedMetrics.shockedTrajectory,
                      baseLiquidity * 1.3
                    );

                    const getY = (val: number) => 110 - (val / (maxVal || 1)) * 95;
                    const getX = (idx: number) => (idx / 12) * 390 + 5;

                    const basePoints = shockedMetrics.baselineTrajectory
                      .map((val, i) => `${getX(i)},${getY(val)}`)
                      .join(" ");

                    const shockPoints = shockedMetrics.shockedTrajectory
                      .map((val, i) => `${getX(i)},${getY(val)}`)
                      .join(" ");

                    return (
                      <>
                        {/* Baseline Curve */}
                        <polyline
                          fill="none"
                          stroke="rgba(148, 163, 184, 0.4)"
                          strokeWidth="2"
                          points={basePoints}
                        />
                        {/* Shocked Curve */}
                        <polyline
                          fill="none"
                          stroke={shockedMetrics.shockedNet >= 0 ? "#16A34A" : "#DC2626"}
                          strokeWidth="2.5"
                          points={shockPoints}
                        />
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Shock Metric Counters */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t-2 border-dashed border-[var(--border-soft)] pt-4 text-center">
                <div>
                  <span className="text-xs text-[var(--muted)] font-serif">Shock Net / Mo</span>
                  <p
                    className={`mt-0.5 font-mono text-sm font-bold ${
                      shockedMetrics.shockedNet >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                    }`}
                  >
                    {shockedMetrics.shockedNet >= 0 ? "+" : ""}
                    {compactCurrency(shockedMetrics.shockedNet)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted)] font-serif">Adjusted Spend</span>
                  <p className="mt-0.5 font-mono text-sm font-bold text-[var(--foreground)]">
                    {compactCurrency(shockedMetrics.shockedSpent)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted)] font-serif">Safe Daily Pace</span>
                  <p className="mt-0.5 font-mono text-sm font-bold text-[var(--color-primary)]">
                    {currency(shockedMetrics.shockedDaily)}
                  </p>
                </div>
              </div>
            </div>

            {/* Tactical Survival Directives */}
            <div className="doodle-card p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
                <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)] font-serif">
                  ✎ Autonomous Tactical Directives
                </h5>
              </div>

              <div className="mt-3 space-y-2 text-xs font-serif">
                {shockedMetrics.shockedNet < 0 && (
                  <div className="flex items-start gap-2 text-[var(--color-danger)]">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Deficit outflow detected. Immediate reduction of discretionary dining and entertainment required to forestall depletion.
                    </span>
                  </div>
                )}
                {austerityMode && (
                  <div className="flex items-start gap-2 text-[var(--color-success)]">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Austerity shield active: Saved {currency(shockedMetrics.austerityCut)}/mo, extending runway by +
                      {(
                        shockedMetrics.shockedRunway -
                        (baseLiquidity / (baseMonthlySpent || 1))
                      ).toFixed(1)}{" "}
                      months.
                    </span>
                  </div>
                )}
                {shockedMetrics.shockedRunway >= 6 && (
                  <div className="flex items-start gap-2 text-[var(--color-primary)]">
                    <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Orbital stability holds resilient under simulated stress. Retained emergency cushion exceeds critical thresholds.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
