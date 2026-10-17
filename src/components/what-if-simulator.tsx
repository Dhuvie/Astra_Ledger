"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  TrendingUp,
  Sparkles,
  Plus,
  Trash2,
  RotateCcw,
  Scale,
  Percent,
  Flame,
  ArrowRight,
  Check,
} from "lucide-react";
import { currency, compactCurrency, type DashboardData } from "@/lib/finance";

export interface ScenarioNode {
  id: string;
  name: string;
  type: "income" | "expense" | "lump_sum";
  amount: number;
  startMonth: number; // 1-indexed (e.g. Month 1, Month 6)
  cadence: "monthly" | "one_time";
  description: string;
}

const PRESET_SCENARIOS = [
  {
    name: "Career Leap",
    desc: "+₹45,000/mo salary increase starting Month 3, with +₹10,000/mo lifestyle allowance",
    nodes: [
      {
        id: "p1",
        name: "Salary Increment / New Contract",
        type: "income" as const,
        amount: 45000,
        startMonth: 3,
        cadence: "monthly" as const,
        description: "Promotion or new remote client engagement",
      },
      {
        id: "p2",
        name: "Lifestyle Allowance Adjustment",
        type: "expense" as const,
        amount: 10000,
        startMonth: 3,
        cadence: "monthly" as const,
        description: "Minor comfortable upgrade in living or dining",
      },
    ],
  },
  {
    name: "Lean Bootstrapper",
    desc: "Cut discretionary burn by 25% (save ₹22,000/mo) and invest surplus at 12% return",
    nodes: [
      {
        id: "p3",
        name: "Discretionary Austerity Shield",
        type: "expense" as const,
        amount: -22000, // negative expense = savings
        startMonth: 1,
        cadence: "monthly" as const,
        description: "Slash dining out and trim entertainment",
      },
    ],
  },
  {
    name: "Major Asset Purchase",
    desc: "Lump sum capital outflow of ₹3,50,000 in Month 8 (Vehicle or Down Payment)",
    nodes: [
      {
        id: "p4",
        name: "Capital Asset Down Payment",
        type: "lump_sum" as const,
        amount: 350000,
        startMonth: 8,
        cadence: "one_time" as const,
        description: "One-off vehicle or security deposit payment",
      },
    ],
  },
  {
    name: "Sabbatical / Gap Year",
    desc: "Zero income for 4 months (Month 6 to 9) living purely on cash reserve",
    nodes: [
      {
        id: "p5",
        name: "Sabbatical Income Pause",
        type: "income" as const,
        amount: -125000, // pause income
        startMonth: 6,
        cadence: "monthly" as const,
        description: "No active income during creative exploration",
      },
    ],
  },
];

interface WhatIfSimulatorProps {
  data: DashboardData;
}

export function WhatIfSimulator({ data }: WhatIfSimulatorProps) {
  // Current financial foundations
  const baseLiquidity = useMemo(
    () => data.accounts.reduce((sum, a) => sum + a.balanceCurrent, 0) || 842500,
    [data.accounts]
  );
  const baseMonthlyIncome = data.totals.income || 125000;
  const baseMonthlyBurn = data.totals.spent || 82500;
  const baseMonthlyNet = baseMonthlyIncome - baseMonthlyBurn;

  // Simulation Controls
  const [horizonMonths, setHorizonMonths] = useState<12 | 24 | 36>(24);
  const [annualReturnPct, setAnnualReturnPct] = useState<number>(8); // Expected compound return on surplus
  const [nodes, setNodes] = useState<ScenarioNode[]>([
    {
      id: "init-1",
      name: "Side Hustle / Retainer",
      type: "income",
      amount: 35000,
      startMonth: 3,
      cadence: "monthly",
      description: "Additional monthly freelance retainer",
    },
    {
      id: "init-2",
      name: "Tech Hardware Upgrade",
      type: "lump_sum",
      amount: 140000,
      startMonth: 6,
      cadence: "one_time",
      description: "Workstation and display investment",
    },
  ]);

  // Form for custom node
  const [newNodeName, setNewNodeName] = useState("");
  const [newNodeType, setNewNodeType] = useState<"income" | "expense" | "lump_sum">("income");
  const [newNodeAmount, setNewNodeAmount] = useState<string>("");
  const [newNodeStartMonth, setNewNodeStartMonth] = useState<number>(1);
  const [newNodeCadence, setNewNodeCadence] = useState<"monthly" | "one_time">("monthly");
  const [showAddForm, setShowAddForm] = useState(false);

  // Month hover inspection
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Calculate monthly timeline points
  const timeline = useMemo(() => {
    const monthlyReturnRate = Math.pow(1 + annualReturnPct / 100, 1 / 12) - 1;
    const points: Array<{
      month: number;
      label: string;
      baselineBalance: number;
      simulatedBalance: number;
      delta: number;
      appliedEvents: string[];
    }> = [];

    let curBaseline = baseLiquidity;
    let curSimulated = baseLiquidity;

    const startDate = new Date();

    for (let m = 1; m <= horizonMonths; m++) {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1);
      const label = new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" }).format(monthDate);

      // Baseline progression
      curBaseline += baseMonthlyNet;
      if (curBaseline > 0 && annualReturnPct > 0) {
        curBaseline += curBaseline * monthlyReturnRate * 0.5; // partial surplus investment
      }

      // Simulated progression: start with base income and burn
      let simNet = baseMonthlyNet;
      const applied: string[] = [];

      // Apply active scenario nodes
      for (const node of nodes) {
        if (node.cadence === "monthly") {
          if (m >= node.startMonth) {
            if (node.type === "income") {
              simNet += node.amount;
              applied.push(`+${currency(node.amount)} ${node.name}`);
            } else if (node.type === "expense") {
              simNet -= node.amount;
              applied.push(`-${currency(node.amount)} ${node.name}`);
            }
          }
        } else if (node.cadence === "one_time") {
          if (m === node.startMonth) {
            if (node.type === "income") {
              simNet += node.amount;
              applied.push(`+${currency(node.amount)} ${node.name}`);
            } else {
              simNet -= node.amount;
              applied.push(`-${currency(node.amount)} ${node.name}`);
            }
          }
        }
      }

      curSimulated += simNet;
      if (curSimulated > 0 && annualReturnPct > 0) {
        curSimulated += curSimulated * monthlyReturnRate * 0.7; // surplus invested
      }

      points.push({
        month: m,
        label,
        baselineBalance: Math.round(curBaseline),
        simulatedBalance: Math.round(curSimulated),
        delta: Math.round(curSimulated - curBaseline),
        appliedEvents: applied,
      });
    }

    return points;
  }, [baseLiquidity, baseMonthlyNet, nodes, horizonMonths, annualReturnPct]);

  // Terminal metrics
  const terminalPoint = timeline[timeline.length - 1];
  const netWorthDelta = terminalPoint.simulatedBalance - terminalPoint.baselineBalance;
  const isPositiveDelta = netWorthDelta >= 0;

  // Chart bounds
  const minVal = Math.min(...timeline.map((p) => Math.min(p.baselineBalance, p.simulatedBalance)));
  const maxVal = Math.max(...timeline.map((p) => Math.max(p.baselineBalance, p.simulatedBalance)));
  const range = maxVal - minVal || 1;

  // SVG coordinate mapper
  const chartWidth = 720;
  const chartHeight = 260;
  const paddingX = 40;
  const paddingY = 30;

  const getX = (m: number) => paddingX + ((m - 1) / (horizonMonths - 1)) * (chartWidth - paddingX * 2);
  const getY = (val: number) =>
    chartHeight - paddingY - ((val - minVal) / range) * (chartHeight - paddingY * 2);

  // Generate SVG paths
  const baselinePath = timeline.reduce((acc, p, i) => {
    const x = getX(p.month);
    const y = getY(p.baselineBalance);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, "");

  const simulatedPath = timeline.reduce((acc, p, i) => {
    const x = getX(p.month);
    const y = getY(p.simulatedBalance);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, "");

  // Area between curves for visual punch
  const areaPath = `${simulatedPath} L ${getX(horizonMonths)} ${getY(
    terminalPoint.baselineBalance
  )} ` + timeline
    .slice()
    .reverse()
    .map((p) => `L ${getX(p.month)} ${getY(p.baselineBalance)}`)
    .join(" ") + " Z";

  const handleAddCustomNode = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(newNodeAmount);
    if (!newNodeName.trim() || !Number.isFinite(amt) || amt === 0) return;

    const node: ScenarioNode = {
      id: `custom-${Date.now()}`,
      name: newNodeName.trim(),
      type: newNodeType,
      amount: Math.abs(amt),
      startMonth: Math.max(1, Math.min(horizonMonths, Number(newNodeStartMonth))),
      cadence: newNodeCadence,
      description: `Custom ${newNodeType} branch starting Month ${newNodeStartMonth}`,
    };

    setNodes((prev) => [...prev, node]);
    setNewNodeName("");
    setNewNodeAmount("");
    setShowAddForm(false);
  };

  const activeHoverPoint = hoveredMonth ? timeline.find((p) => p.month === hoveredMonth) : terminalPoint;

  return (
    <div className="space-y-8 font-hand">
      {/* Top Banner Notebook Header */}
      <div
        className="doodle-card relative p-6 sm:p-8"
        style={{ borderRadius: "22px 18px 20px 16px / 16px 20px 18px 22px" }}
      >
        <div className="doodle-tape -top-3 left-10" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full border border-[var(--border)] bg-[#49B6E5] shadow-[1px_1px_0px_var(--border)]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-secondary)] font-mono">
                Multiverse Scenario Engine
              </span>
            </div>
            <h3 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-[var(--foreground)] font-display">
              Astra Multiverse Time-Machine
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)] font-hand">
              Model branching lifepaths, career pivots, and major capital investments against your active baseline liquidity.
            </p>
          </div>

          {/* Horizon Period Stepper */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--muted)] font-mono uppercase">Horizon:</span>
            {([12, 24, 36] as const).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizonMonths(h)}
                className={`doodle-btn px-3 py-1 text-xs font-mono font-bold ${
                  horizonMonths === h
                    ? "bg-[#49B6E5] text-slate-900 shadow-[2px_2px_0px_var(--border)]"
                    : "bg-[var(--surface-2)] text-[var(--foreground)]"
                }`}
              >
                {h} Mo
              </button>
            ))}
          </div>
        </div>

        {/* 3 Metric Cards Highlight */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="doodle-card p-4 bg-[var(--surface)]">
            <span className="text-xs font-bold text-[var(--muted)] uppercase font-mono">
              Terminal Baseline
            </span>
            <p className="mt-1 text-2xl font-black text-[var(--foreground)] font-display tabular-nums">
              {currency(terminalPoint.baselineBalance)}
            </p>
            <p className="text-xs text-[var(--muted)] font-hand">
              Status quo at Month {horizonMonths}
            </p>
          </div>

          <div className="doodle-card p-4 bg-[var(--surface)]">
            <span className="text-xs font-bold text-[var(--muted)] uppercase font-mono">
              Simulated Multiverse
            </span>
            <p className="mt-1 text-2xl font-black text-[#49B6E5] font-display tabular-nums">
              {currency(terminalPoint.simulatedBalance)}
            </p>
            <p className="text-xs text-[var(--muted)] font-hand">
              With {nodes.length} active branches applied
            </p>
          </div>

          <div
            className={`doodle-card p-4 ${
              isPositiveDelta ? "bg-emerald-500/10 border-emerald-600/40" : "bg-rose-500/10 border-rose-600/40"
            }`}
          >
            <span className="text-xs font-bold uppercase font-mono text-[var(--muted)]">
              Wealth Divergence Delta
            </span>
            <p
              className={`mt-1 text-2xl font-black font-display tabular-nums ${
                isPositiveDelta ? "text-[#16A34A] dark:text-[#4ADE80]" : "text-[#DC2626] dark:text-[#F87171]"
              }`}
            >
              {isPositiveDelta ? "+" : ""}
              {currency(netWorthDelta)}
            </p>
            <p className="text-xs font-hand text-[var(--foreground)]">
              {isPositiveDelta ? "Surplus capital generated" : "Capital deficit incurred"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Spline Projection Canvas */}
      <div
        className="doodle-card relative p-6 sm:p-8 bg-[var(--surface)] overflow-hidden"
        style={{ borderRadius: "20px 22px 18px 20px / 18px 20px 22px 18px" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-2 border-dashed border-[var(--border-soft)]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-[var(--border)] bg-[var(--foreground)]" />
              <span className="text-xs font-bold text-[var(--foreground)] font-hand">
                Baseline Trajectory
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-[var(--border)] bg-[#49B6E5]" />
              <span className="text-xs font-bold text-[#49B6E5] font-hand">
                Simulated Branch Path
              </span>
            </div>
          </div>

          {/* Compounding Return Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[var(--muted)] font-mono">
              Surplus Growth Yield: {annualReturnPct}%/yr
            </span>
            <input
              type="range"
              min="0"
              max="16"
              step="2"
              value={annualReturnPct}
              onChange={(e) => setAnnualReturnPct(Number(e.target.value))}
              className="accent-[#49B6E5] cursor-pointer"
            />
          </div>
        </div>

        {/* SVG Curve Graphic */}
        <div className="relative mt-6 w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full min-w-[600px] h-auto overflow-visible"
          >
            {/* Grid coordinate lines */}
            <line
              x1={paddingX}
              y1={paddingY}
              x2={chartWidth - paddingX}
              y2={paddingY}
              stroke="var(--border)"
              strokeDasharray="4 4"
              strokeOpacity="0.25"
            />
            <line
              x1={paddingX}
              y1={chartHeight / 2}
              x2={chartWidth - paddingX}
              y2={chartHeight / 2}
              stroke="var(--border)"
              strokeDasharray="4 4"
              strokeOpacity="0.25"
            />
            <line
              x1={paddingX}
              y1={chartHeight - paddingY}
              x2={chartWidth - paddingX}
              y2={chartHeight - paddingY}
              stroke="var(--border)"
              strokeWidth="1.5"
            />

            {/* Shaded Area between trajectories */}
            <path
              d={areaPath}
              fill={isPositiveDelta ? "rgba(73, 182, 229, 0.15)" : "rgba(220, 38, 38, 0.12)"}
            />

            {/* Baseline Path */}
            <path
              d={baselinePath}
              fill="none"
              stroke="var(--border)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Simulated Multiverse Path */}
            <path
              d={simulatedPath}
              fill="none"
              stroke="#49B6E5"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="8 4"
            />

            {/* Month Data Points and Interactive Scrubbing */}
            {timeline.map((p) => {
              const x = getX(p.month);
              const yBase = getY(p.baselineBalance);
              const ySim = getY(p.simulatedBalance);
              const isHovered = hoveredMonth === p.month;

              return (
                <g
                  key={p.month}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={() => setHoveredMonth(p.month)}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  {/* Invisible hit column */}
                  <rect
                    x={x - (chartWidth / horizonMonths) / 2}
                    y={0}
                    width={chartWidth / horizonMonths}
                    height={chartHeight}
                    fill="transparent"
                  />

                  {/* Month Label */}
                  {(p.month === 1 || p.month % 3 === 0 || p.month === horizonMonths) && (
                    <text
                      x={x}
                      y={chartHeight - 8}
                      fontSize="11"
                      textAnchor="middle"
                      fill="var(--muted)"
                      fontFamily="var(--font-mono)"
                      fontWeight="bold"
                    >
                      {p.label}
                    </text>
                  )}

                  {/* Baseline Node Dot */}
                  <circle
                    cx={x}
                    cy={yBase}
                    r={isHovered ? 5 : 3}
                    fill="var(--surface)"
                    stroke="var(--border)"
                    strokeWidth="2"
                  />

                  {/* Simulated Node Dot */}
                  <circle
                    cx={x}
                    cy={ySim}
                    r={isHovered ? 6 : 4}
                    fill="#49B6E5"
                    stroke="var(--border)"
                    strokeWidth="2"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hover Inspector Card */}
        {activeHoverPoint && (
          <div className="mt-4 rounded-xl border-2 border-dashed border-[var(--border-soft)] bg-[var(--surface-2)]/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div>
                <span className="text-xs font-bold uppercase font-mono text-[var(--color-secondary)]">
                  Month {activeHoverPoint.month} Snapshot ({activeHoverPoint.label})
                </span>
                <div className="mt-1 flex items-center gap-4 text-sm font-bold font-hand">
                  <span>
                    Baseline: <span className="font-mono text-base">{currency(activeHoverPoint.baselineBalance)}</span>
                  </span>
                  <span>→</span>
                  <span>
                    Multiverse: <span className="font-mono text-base text-[#49B6E5]">{currency(activeHoverPoint.simulatedBalance)}</span>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold uppercase font-mono text-[var(--muted)]">
                  Net Divergence
                </span>
                <p
                  className={`font-mono text-base font-black ${
                    activeHoverPoint.delta >= 0 ? "text-[#16A34A] dark:text-[#4ADE80]" : "text-[#DC2626] dark:text-[#F87171]"
                  }`}
                >
                  {activeHoverPoint.delta >= 0 ? "+" : ""}
                  {currency(activeHoverPoint.delta)}
                </p>
              </div>
            </div>

            {activeHoverPoint.appliedEvents.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[var(--border)]/40 flex flex-wrap gap-2 text-xs">
                <span className="text-[var(--muted)] font-mono font-bold">Events in effect:</span>
                {activeHoverPoint.appliedEvents.map((evt, idx) => (
                  <span
                    key={idx}
                    className="doodle-badge bg-[var(--surface)] text-[var(--foreground)]"
                  >
                    {evt}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preset Scenarios & Active Decision Nodes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Preset Templates */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-bold font-display text-[var(--foreground)]">
              Instant Scenario Presets
            </h4>
            <span className="text-xs font-bold text-[var(--muted)] font-mono">1 Click Apply</span>
          </div>

          <div className="space-y-3">
            {PRESET_SCENARIOS.map((preset) => (
              <div
                key={preset.name}
                className="doodle-card p-4 transition-all hover:translate-x-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-base font-display text-[var(--foreground)]">
                      {preset.name}
                    </h5>
                    <p className="mt-0.5 text-xs text-[var(--muted)] font-hand leading-relaxed">
                      {preset.desc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNodes(
                        preset.nodes.map((n, i) => ({
                          ...n,
                          id: `preset-${Date.now()}-${i}`,
                        }))
                      );
                    }}
                    className="doodle-btn px-3 py-1 text-xs font-bold bg-[#49B6E5] text-slate-900 shrink-0"
                  >
                    Load
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active Decision Branches */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-bold font-display text-[var(--foreground)]">
              Active Decision Branches ({nodes.length})
            </h4>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNodes([])}
                className="doodle-btn px-2.5 py-1 text-xs text-[var(--muted)] font-bold"
                title="Clear all branches"
              >
                <RotateCcw className="h-3.5 w-3.5 inline mr-1" /> Clear
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="doodle-btn doodle-btn-primary px-3 py-1 text-xs font-bold"
              >
                <Plus className="h-3.5 w-3.5 inline mr-1" /> Add Branch
              </button>
            </div>
          </div>

          {/* Form to add custom node */}
          <AnimatePresence>
            {showAddForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddCustomNode}
                className="doodle-card p-5 bg-[var(--surface-2)] space-y-3"
              >
                <h5 className="text-sm font-bold font-display text-[var(--foreground)]">
                  Draft New Lifepath Branch
                </h5>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-[var(--muted)] font-mono">Branch Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rent Apartment Shift"
                      value={newNodeName}
                      onChange={(e) => setNewNodeName(e.target.value)}
                      className="doodle-input w-full text-xs mt-1"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--muted)] font-mono">Cash Impact (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 25000"
                      value={newNodeAmount}
                      onChange={(e) => setNewNodeAmount(e.target.value)}
                      className="doodle-input w-full text-xs mt-1"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--muted)] font-mono">Type</label>
                    <select
                      value={newNodeType}
                      onChange={(e) => setNewNodeType(e.target.value as any)}
                      className="doodle-input w-full text-xs mt-1"
                    >
                      <option value="income">Income (+ Cash Inflow)</option>
                      <option value="expense">Expense (- Cash Outflow)</option>
                      <option value="lump_sum">Lump Sum Capital Event</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--muted)] font-mono">Cadence & Timing</label>
                    <div className="flex gap-2 mt-1">
                      <select
                        value={newNodeCadence}
                        onChange={(e) => setNewNodeCadence(e.target.value as any)}
                        className="doodle-input flex-1 text-xs"
                      >
                        <option value="monthly">Monthly Recurring</option>
                        <option value="one_time">One-Time Event</option>
                      </select>
                      <input
                        type="number"
                        min="1"
                        max={horizonMonths}
                        value={newNodeStartMonth}
                        onChange={(e) => setNewNodeStartMonth(Number(e.target.value))}
                        title="Start Month"
                        className="doodle-input w-20 text-xs text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="doodle-btn px-3 py-1 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="doodle-btn doodle-btn-primary px-4 py-1 text-xs font-bold"
                  >
                    Inject Branch
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* List of active nodes */}
          <div className="space-y-2.5">
            {nodes.length === 0 ? (
              <div className="doodle-card p-8 text-center text-sm text-[var(--muted)]">
                No active decision branches. Select a preset on the left or add a custom branch.
              </div>
            ) : (
              nodes.map((node) => {
                const isIncome = node.type === "income";

                return (
                  <div
                    key={node.id}
                    className="doodle-card p-4 flex items-center justify-between gap-3 bg-[var(--surface)]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--border)] shadow-[1.5px_1.5px_0px_var(--border)] ${
                          isIncome
                            ? "bg-emerald-500/20 text-[#16A34A] dark:text-[#4ADE80]"
                            : "bg-rose-500/20 text-[#DC2626] dark:text-[#F87171]"
                        }`}
                      >
                        <GitBranch className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-base font-display text-[var(--foreground)] truncate">
                          {node.name}
                        </p>
                        <p className="text-xs text-[var(--muted)] font-hand">
                          Starts Month {node.startMonth} · {node.cadence === "monthly" ? "Every Month" : "One-Time"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`font-mono text-base font-black tabular-nums ${
                          isIncome ? "text-[#16A34A] dark:text-[#4ADE80]" : "text-[#DC2626] dark:text-[#F87171]"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {currency(Math.abs(node.amount))}
                      </span>

                      <button
                        type="button"
                        onClick={() => setNodes((prev) => prev.filter((n) => n.id !== node.id))}
                        className="doodle-btn h-8 w-8 p-0 flex items-center justify-center text-[var(--muted)] hover:text-[var(--color-danger)]"
                        title="Remove branch"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
