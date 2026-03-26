"use client";

import type { CSSProperties } from "react";
import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { PlaidConnect } from "@/components/plaid-connect";
import { SceneBackdrop } from "@/components/scene-backdrop";
import {
  AlertCard,
  BudgetCard,
  GoalCard,
  HeroMetric,
  InputField,
  InsightTile,
  LedgerRow,
  MetricPill,
  MiniStat,
  RecurringRow,
  ScoreDial,
  SectionHeader,
  SignalBlock,
  ToggleChip,
  UpcomingChargeRow,
  buildSmoothPath,
} from "@/components/workspace-ui";
import { compactCurrency, formatDate, startCase, type DashboardData } from "@/lib/finance";

type DashboardShellProps = { data: DashboardData; canConnectPlaid: boolean };
type QuickPreview = { name: string; amount: number; type: "expense" | "income"; date: string; primaryCategory: string };
type SourceFilter = "all" | "manual" | "plaid" | "sample";

const entryCategories = ["FOOD_AND_DRINK", "TRANSPORTATION", "RENT_AND_UTILITIES", "SHOPPING", "ENTERTAINMENT", "INCOME"] as const;
const budgetCategories = ["FOOD_AND_DRINK", "TRANSPORTATION", "SHOPPING", "ENTERTAINMENT", "TRAVEL", "PERSONAL_CARE"] as const;
const accentChoices = ["mint", "blue", "gold", "rose"] as const;

export function DashboardShell({ data, canConnectPlaid }: DashboardShellProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const spendPathRef = useRef<SVGPathElement | null>(null);
  const incomePathRef = useRef<SVGPathElement | null>(null);
  const [quickCommand, setQuickCommand] = useState("");
  const [quickPreview, setQuickPreview] = useState<QuickPreview | null>(null);
  const [quickStatus, setQuickStatus] = useState("");
  const [entryType, setEntryType] = useState<"expense" | "income">("expense");
  const [entryName, setEntryName] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryCategory, setEntryCategory] = useState<string>("FOOD_AND_DRINK");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrent, setGoalCurrent] = useState("");
  const [goalCategory, setGoalCategory] = useState("CASH_RESERVE");
  const [goalDate, setGoalDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [budgetCategory, setBudgetCategory] = useState<string>("FOOD_AND_DRINK");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [budgetAccent, setBudgetAccent] = useState<string>("mint");
  const [manualStatus, setManualStatus] = useState("");
  const [goalStatus, setGoalStatus] = useState("");
  const [budgetStatus, setBudgetStatus] = useState("");
  const [scenarioCut, setScenarioCut] = useState(12);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  const deferredQuickCommand = useDeferredValue(quickCommand);

  useEffect(() => {
    let active = true;
    const command = deferredQuickCommand.trim();
    if (!command) {
      setQuickPreview(null);
      return;
    }
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/quick-add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command, previewOnly: true }),
        });
        const payload = await response.json();
        if (active) {
          setQuickPreview(response.ok ? (payload.parsed as QuickPreview) : null);
        }
      } catch {
        if (active) {
          setQuickPreview(null);
        }
      }
    }, 220);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [deferredQuickCommand]);

  useEffect(() => {
    let mounted = true;
    let cleanup = () => {};
    async function runMotion() {
      const anime = await import("animejs");
      if (!mounted || !rootRef.current) {
        return;
      }
      const { animate, createTimeline, stagger } = anime;
      const reveal = rootRef.current.querySelectorAll("[data-reveal]");
      const chips = rootRef.current.querySelectorAll("[data-chip]");
      const meters = rootRef.current.querySelectorAll("[data-meter]");
      const tilts = rootRef.current.querySelectorAll<HTMLElement>("[data-tilt]");
      createTimeline({ defaults: { duration: 920, ease: "out(4)" } })
        .add(reveal, { opacity: [0, 1], y: [28, 0], filter: ["blur(14px)", "blur(0px)"], delay: stagger(52) })
        .add(chips, { opacity: [0, 1], scale: [0.94, 1], delay: stagger(20), duration: 520 }, 90)
        .add(meters, { scaleX: [0, 1], transformOrigin: ["0% 50%", "0% 50%"], delay: stagger(24), duration: 680 }, 130);
      for (const path of [spendPathRef.current, incomePathRef.current]) {
        if (!path) continue;
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;
        animate(path, { strokeDashoffset: [length, 0], duration: 1500, ease: "inOut(3)" });
      }
      const cleanups: Array<() => void> = [];
      tilts.forEach((node) => {
        const onMove = (event: PointerEvent) => {
          const rect = node.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          animate(node, { rotateX: -py * 5, rotateY: px * 7, translateY: -4, duration: 240, ease: "out(3)" });
        };
        const onLeave = () => animate(node, { rotateX: 0, rotateY: 0, translateY: 0, duration: 420, ease: "out(4)" });
        node.addEventListener("pointermove", onMove);
        node.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          node.removeEventListener("pointermove", onMove);
          node.removeEventListener("pointerleave", onLeave);
        });
      });
      cleanup = () => cleanups.forEach((run) => run());
    }
    void runMotion();
    return () => {
      mounted = false;
      cleanup();
    };
  }, [data.updatedAt]);

  useEffect(() => {
    if (!rootRef.current) return;
    const node = rootRef.current;
    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      node.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
      node.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    };
    node.addEventListener("pointermove", onMove);
    return () => node.removeEventListener("pointermove", onMove);
  }, []);

  const totalBalance = data.accounts.reduce((sum, account) => sum + account.balanceCurrent, 0);
  const variableSpend = Math.max(0, data.planner.averageMonthlySpend - data.planner.recurringMonthlyTotal);
  const projectedVariableSpend = variableSpend * (1 - scenarioCut / 100);
  const projectedMonthlyBurn = data.planner.recurringMonthlyTotal + projectedVariableSpend;
  const projectedNet = data.planner.averageMonthlyIncome - projectedMonthlyBurn;
  const projectedRunway = projectedMonthlyBurn <= 0 ? totalBalance : totalBalance / projectedMonthlyBurn;
  const spendSeries = data.trend.map((point) => point.spend);
  const incomeSeries = data.trend.map((point) => point.income);
  const chartMax = Math.max(...spendSeries, ...incomeSeries, 1);
  const spendPath = useMemo(() => buildSmoothPath(spendSeries, chartMax), [spendSeries, chartMax]);
  const incomePath = useMemo(() => buildSmoothPath(incomeSeries, chartMax), [incomeSeries, chartMax]);
  const sourceMix = useMemo(() => {
    const totals = data.transactions.reduce((acc, transaction) => {
      const key = transaction.source ?? "sample";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return [
      { label: "Manual", key: "manual", value: totals.manual ?? 0 },
      { label: "Plaid", key: "plaid", value: totals.plaid ?? 0 },
      { label: "Sample", key: "sample", value: totals.sample ?? 0 },
    ] as const;
  }, [data.transactions]);
  const ledgerCategories = useMemo(() => ["ALL", ...new Set(data.transactions.map((item) => item.primaryCategory))], [data.transactions]);
  const filteredTransactions = useMemo(
    () => data.transactions.filter((transaction) => {
      const matchesSource = sourceFilter === "all" ? true : (transaction.source ?? "sample") === sourceFilter;
      const matchesCategory = categoryFilter === "ALL" ? true : transaction.primaryCategory === categoryFilter;
      return matchesSource && matchesCategory;
    }),
    [categoryFilter, data.transactions, sourceFilter],
  );
  const budgetSummary = useMemo(() => ({
    healthy: data.budgets.filter((item) => item.status === "healthy").length,
    risk: data.budgets.filter((item) => item.status !== "healthy").length,
  }), [data.budgets]);
  const healthNote = data.healthScore >= 80
    ? "Healthy posture across liquidity, budgets, and goals."
    : data.healthScore >= 60
      ? "Mostly stable, with some pressure points worth tightening."
      : "This workspace needs better reserve strength or spend control.";

  const refreshAfter = () => router.refresh();
  const postJson = async (url: string, body?: unknown, method = "POST") => {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    return { response, payload: await response.json().catch(() => ({})) };
  };

  const handleManualEntry = () => {
    const amount = Number(entryAmount);
    if (!entryName.trim() || !Number.isFinite(amount) || amount <= 0) {
      setManualStatus("Enter a valid label and amount first.");
      return;
    }
    startTransition(async () => {
      try {
        const { response, payload } = await postJson("/api/manual-transactions", { name: entryName.trim(), amount, date: entryDate, primaryCategory: entryCategory, type: entryType });
        if (!response.ok) {
          setManualStatus((payload as { error?: string }).error ?? "Unable to save manual transaction.");
          return;
        }
        setEntryName("");
        setEntryAmount("");
        setManualStatus("Manual transaction saved.");
        refreshAfter();
      } catch {
        setManualStatus("Unable to save manual transaction.");
      }
    });
  };

  const handleQuickAdd = () => {
    if (!quickCommand.trim()) {
      setQuickStatus("Enter a quick add command first.");
      return;
    }
    startTransition(async () => {
      try {
        const { response, payload } = await postJson("/api/quick-add", { command: quickCommand.trim() });
        if (!response.ok) {
          setQuickStatus((payload as { error?: string }).error ?? "Unable to process quick add command.");
          return;
        }
        setQuickCommand("");
        setQuickPreview(null);
        setQuickStatus("Quick add captured and written to the ledger.");
        refreshAfter();
      } catch {
        setQuickStatus("Unable to process quick add command.");
      }
    });
  };

  const handleCreateGoal = () => {
    const targetAmount = Number(goalTarget);
    const currentAmount = Number(goalCurrent || "0");
    if (!goalName.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0 || !goalDate) {
      setGoalStatus("Goal needs a name, target, and date.");
      return;
    }
    startTransition(async () => {
      try {
        const { response, payload } = await postJson("/api/goals", { name: goalName.trim(), targetAmount, currentAmount, targetDate: goalDate, category: goalCategory });
        if (!response.ok) {
          setGoalStatus((payload as { error?: string }).error ?? "Unable to create goal.");
          return;
        }
        setGoalName("");
        setGoalTarget("");
        setGoalCurrent("");
        setGoalStatus("Goal created.");
        refreshAfter();
      } catch {
        setGoalStatus("Unable to create goal.");
      }
    });
  };

  const handleCreateBudget = () => {
    const monthlyLimit = Number(budgetLimit);
    if (!budgetCategory || !Number.isFinite(monthlyLimit) || monthlyLimit <= 0) {
      setBudgetStatus("Budget needs a category and monthly limit.");
      return;
    }
    startTransition(async () => {
      try {
        const { response, payload } = await postJson("/api/budgets", { category: budgetCategory, monthlyLimit, accent: budgetAccent });
        if (!response.ok) {
          setBudgetStatus((payload as { error?: string }).error ?? "Unable to save budget.");
          return;
        }
        setBudgetLimit("");
        setBudgetStatus("Budget saved.");
        refreshAfter();
      } catch {
        setBudgetStatus("Unable to save budget.");
      }
    });
  };

  const handleClearManual = () => {
    startTransition(async () => {
      try {
        const { response } = await postJson("/api/manual-transactions", undefined, "DELETE");
        if (!response.ok) {
          setManualStatus("Unable to clear manual transactions.");
          return;
        }
        setManualStatus("Manual transactions cleared.");
        refreshAfter();
      } catch {
        setManualStatus("Unable to clear manual transactions.");
      }
    });
  };

  return (
    <div ref={rootRef} className="relative overflow-hidden" style={{ "--mx": "50%", "--my": "16%" } as CSSProperties}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_var(--mx)_var(--my),rgba(93,211,190,0.11),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(9,13,18,0.24),transparent_26%,rgba(113,194,255,0.06)_60%,transparent_84%)]" />
      <div className="absolute inset-x-0 top-0 h-[760px] opacity-80"><SceneBackdrop /></div>
      <main className="relative mx-auto flex w-full max-w-[1580px] flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <div data-reveal className="panel-frame relative overflow-hidden rounded-[36px] px-6 py-8 sm:px-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(93,211,190,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_24%)]" />
            <div className="relative">
              <div data-chip className="eyebrow-chip w-fit">Astra Treasury Workspace</div>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.055em] text-white sm:text-5xl xl:text-[4.2rem] xl:leading-[1.02]">A finance operating system with budgets, alerts, planning logic, live rails, and a more serious interaction model.</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300/78 sm:text-lg">This pass shows more of the stack at once: server routes, persistent workspace data, budget logic, alert generation, quick-command parsing, scenario planning, and a premium UI system with fluid motion.</p>
              <div className="mt-8 grid gap-4 md:grid-cols-4">
                <HeroMetric label="Outflow" value={data.totals.spent} />
                <HeroMetric label="Inflow" value={data.totals.income} />
                <HeroMetric label="Net" value={data.totals.net} />
                <HeroMetric label="Runway" valueString={`${data.planner.runwayMonths.toFixed(1)} mo`} />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <MetricPill label="Liquidity" value={compactCurrency(totalBalance)} />
                <MetricPill label="Spend Cap" value={compactCurrency(data.planner.budgetedSpendCap)} />
                <MetricPill label="Daily Target" value={compactCurrency(data.planner.dailySpendTarget)} />
                <MetricPill label="Manual Entries" value={String(data.manualEntryCount)} />
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {sourceMix.map((item) => (
                  <div key={item.key} data-chip className="signal-block">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{item.label} Feed</div>
                    <div className="mt-2 text-xl font-medium text-white">{item.value}</div>
                    <div className="mt-2 text-sm text-slate-400">{item.value === 0 ? "Idle" : "Active"} pipeline in the current ledger sample.</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-6">
            <div data-reveal data-tilt className="panel-frame rounded-[36px] p-6 will-change-transform">
              <SectionHeader kicker="System Health" title="Treasury score" right={<div className="mini-badge">{formatDate(data.updatedAt)}</div>} />
              <div className="mt-6 grid gap-6 md:grid-cols-[0.72fr_1fr] xl:grid-cols-[0.78fr_1fr]">
                <ScoreDial label="Health Score" score={data.healthScore} note={healthNote} />
                <div className="grid gap-3">
                  <MiniStat label="Savings Rate" value={`${data.totals.savingsRate.toFixed(1)}%`} />
                  <MiniStat label="Emergency Target" value={compactCurrency(data.planner.emergencyFundTarget)} />
                  <MiniStat label="Recurring Load" value={compactCurrency(data.planner.recurringMonthlyTotal)} />
                  <MiniStat label="Goal Count" value={String(data.goals.length)} />
                </div>
              </div>
            </div>
            <div data-reveal data-tilt className="panel-frame rounded-[36px] p-6 will-change-transform">
              <SectionHeader kicker="Action Layer" title="Watchlist" right={<div className="mini-badge">{data.alerts.length} alerts</div>} />
              <div className="mt-5 grid gap-3">
                {data.alerts.map((alert) => <AlertCard key={alert.id} level={alert.level} title={alert.title} detail={alert.detail} />)}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
          <div data-reveal data-tilt className="panel-frame rounded-[36px] p-6 will-change-transform">
            <SectionHeader kicker="Cashflow Map" title="Trend and spending pressure" right={<div className="mini-badge">6 months</div>} />
            <div className="mt-6 rounded-[28px] border border-white/8 bg-black/20 p-4">
              <svg viewBox="0 0 100 100" className="h-60 w-full overflow-visible">
                <defs>
                  <linearGradient id="spend-line" x1="0%" x2="100%" y1="0%" y2="0%"><stop offset="0%" stopColor="#f7a8ab" /><stop offset="100%" stopColor="#f8fafc" /></linearGradient>
                  <linearGradient id="income-line" x1="0%" x2="100%" y1="0%" y2="0%"><stop offset="0%" stopColor="#7dd4c2" /><stop offset="100%" stopColor="#dffcf6" /></linearGradient>
                </defs>
                <path ref={spendPathRef} d={spendPath} fill="none" stroke="url(#spend-line)" strokeWidth="2" strokeLinecap="round" />
                <path ref={incomePathRef} d={incomePath} fill="none" stroke="url(#income-line)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="mt-4 grid grid-cols-6 gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">{data.trend.map((point) => <div key={point.label}>{point.label}</div>)}</div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <SignalBlock label="Top Category" value={data.topCategory?.category ?? "Waiting"} />
              <SignalBlock label="Opportunity" value={compactCurrency(data.planner.opportunityAmount)} />
              <SignalBlock label="Monthly Burn" value={compactCurrency(data.planner.monthlyBurn)} />
            </div>
            <div className="mt-6 grid gap-3">
              {data.breakdown.map((item) => (
                <div key={item.category}>
                  <div className="mb-2 flex items-center justify-between text-sm"><span className="text-slate-200">{item.category}</span><span className="text-slate-400">{Math.round(item.share * 100)}%</span></div>
                  <div className="h-2 rounded-full bg-white/6"><div data-meter className={`h-2 rounded-full bg-gradient-to-r ${item.tone}`} style={{ width: `${Math.max(item.share * 100, 8)}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-6">
            <div data-reveal data-tilt className="panel-frame rounded-[36px] p-6 will-change-transform">
              <SectionHeader kicker="Budget Grid" title="Category limits" right={<div className="mini-badge">{budgetSummary.healthy} healthy / {budgetSummary.risk} at risk</div>} />
              <div className="mt-5 grid gap-3">{data.budgets.map((budget) => <BudgetCard key={budget.id} category={budget.category} monthlyLimit={budget.monthlyLimit} spent={budget.spent} remaining={budget.remaining} utilization={budget.utilization} status={budget.status} accent={budget.accent} onFocus={() => setCategoryFilter(budget.categoryKey)} />)}</div>
            </div>
            <div data-reveal data-tilt className="panel-frame rounded-[36px] p-6 will-change-transform">
              <SectionHeader kicker="Upcoming" title="Charge runway" right={<div className="mini-badge">{data.upcomingCharges.length} queued</div>} />
              <div className="mt-5 space-y-3">{data.upcomingCharges.map((charge) => <UpcomingChargeRow key={charge.id} name={charge.name} category={charge.category} dueDate={charge.dueDate} amount={charge.amount} daysAway={charge.daysAway} essential={charge.essential} />)}</div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_0.95fr_0.85fr]">
          <div data-reveal data-tilt className="panel-frame rounded-[36px] p-6 will-change-transform">
            <SectionHeader kicker="Command Deck" title="Quick Add parser" right={<div className="mini-badge">{quickPreview ? "Parsed" : "Waiting"}</div>} />
            <div className="mt-5">
              <textarea value={quickCommand} onChange={(event) => setQuickCommand(event.target.value)} placeholder="spent 4200 on groceries today" className="command-area" rows={4} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.quickAddExamples.map((example) => (
                <button key={example} type="button" data-chip onClick={() => setQuickCommand(example)} className="soft-chip">
                  {example}
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Parse Preview</div>
              {quickPreview ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <MiniStat label="Name" value={quickPreview.name} />
                  <MiniStat label="Category" value={startCase(quickPreview.primaryCategory)} />
                  <MiniStat label="Type" value={quickPreview.type === "income" ? "Income" : "Expense"} />
                  <MiniStat label="Amount" value={compactCurrency(quickPreview.amount)} />
                </div>
              ) : (
                <p className="mt-3 text-sm leading-7 text-slate-400">Natural-language parsing previews the entry first, then writes it into the shared workspace ledger.</p>
              )}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="button" onClick={handleQuickAdd} className="primary-button">Run Quick Add</button>
              <span className="text-sm text-slate-400">{quickStatus}</span>
            </div>
          </div>

          <div data-reveal data-tilt className="panel-frame rounded-[36px] p-6 will-change-transform">
            <SectionHeader kicker="Transaction Desk" title="Manual composer" right={<div className="mini-badge">{isPending ? "Saving" : "Ready"}</div>} />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InputField label="Label"><input value={entryName} onChange={(event) => setEntryName(event.target.value)} placeholder="Rent, freelance payment, groceries..." className="input-core" /></InputField>
              <InputField label="Amount"><input value={entryAmount} onChange={(event) => setEntryAmount(event.target.value)} placeholder="12500" inputMode="decimal" className="input-core" /></InputField>
              <InputField label="Date"><input type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} className="input-core" /></InputField>
              <InputField label="Type">
                <div className="flex gap-2">
                  <ToggleChip active={entryType === "expense"} onClick={() => setEntryType("expense")}>Expense</ToggleChip>
                  <ToggleChip active={entryType === "income"} onClick={() => setEntryType("income")}>Income</ToggleChip>
                </div>
              </InputField>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {entryCategories.map((category) => (
                <button key={category} type="button" data-chip onClick={() => setEntryCategory(category)} className={`category-chip ${entryCategory === category ? "category-chip-active" : ""}`}>
                  {startCase(category)}
                </button>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="button" onClick={handleManualEntry} className="primary-button">Save Entry</button>
              <button type="button" onClick={handleClearManual} className="secondary-button">Clear Manual</button>
              <span className="text-sm text-slate-400">{manualStatus}</span>
            </div>
          </div>

          <div data-reveal data-tilt className="panel-frame rounded-[36px] p-6 will-change-transform">
            <SectionHeader kicker="Budget Builder" title="Set category limits" right={<div className="mini-badge">{data.budgets.length} active</div>} />
            <div className="mt-6 grid gap-4">
              <InputField label="Category">
                <div className="flex flex-wrap gap-2">
                  {budgetCategories.map((category) => (
                    <button key={category} type="button" data-chip onClick={() => setBudgetCategory(category)} className={`category-chip ${budgetCategory === category ? "category-chip-active" : ""}`}>
                      {startCase(category)}
                    </button>
                  ))}
                </div>
              </InputField>
              <InputField label="Monthly Limit"><input value={budgetLimit} onChange={(event) => setBudgetLimit(event.target.value)} inputMode="decimal" placeholder="22000" className="input-core" /></InputField>
              <InputField label="Accent">
                <div className="flex flex-wrap gap-2">
                  {accentChoices.map((accent) => (
                    <button key={accent} type="button" data-chip onClick={() => setBudgetAccent(accent)} className={`soft-chip ${budgetAccent === accent ? "ring-1 ring-white/30" : ""}`}>
                      {startCase(accent)}
                    </button>
                  ))}
                </div>
              </InputField>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="button" onClick={handleCreateBudget} className="primary-button">Save Budget</button>
              <span className="text-sm text-slate-400">{budgetStatus}</span>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.82fr_0.86fr_0.82fr]">
          <div data-reveal data-tilt className="panel-frame rounded-[36px] p-6 will-change-transform">
            <SectionHeader kicker="Goal Engine" title="Savings goals" right={<div className="mini-badge">{data.goals.length} active</div>} />
            <div className="mt-5 space-y-3">
              {data.goals.slice(0, 3).map((goal) => (
                <GoalCard key={goal.id} name={goal.name} category={goal.category} progress={goal.progress} current={goal.currentAmount} target={goal.targetAmount} monthlyNeeded={goal.monthlyNeeded} targetDate={goal.targetDate} />
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InputField label="Goal"><input value={goalName} onChange={(event) => setGoalName(event.target.value)} placeholder="Laptop fund" className="input-core" /></InputField>
              <InputField label="Target"><input value={goalTarget} onChange={(event) => setGoalTarget(event.target.value)} inputMode="decimal" placeholder="120000" className="input-core" /></InputField>
              <InputField label="Current"><input value={goalCurrent} onChange={(event) => setGoalCurrent(event.target.value)} inputMode="decimal" placeholder="15000" className="input-core" /></InputField>
              <InputField label="Target Date"><input type="date" value={goalDate} onChange={(event) => setGoalDate(event.target.value)} className="input-core" /></InputField>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["CASH_RESERVE", "TRAVEL", "INVESTING", "LIFESTYLE"].map((category) => (
                <button key={category} type="button" data-chip onClick={() => setGoalCategory(category)} className={`category-chip ${goalCategory === category ? "category-chip-active" : ""}`}>
                  {startCase(category)}
                </button>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-3">
              <button type="button" onClick={handleCreateGoal} className="primary-button">Create Goal</button>
              <span className="text-sm text-slate-400">{goalStatus}</span>
            </div>
          </div>

          <div data-reveal data-tilt className="panel-frame rounded-[36px] p-6 will-change-transform">
            <SectionHeader kicker="Scenario Lab" title="Cashflow simulator" right={<div className="mini-badge">{scenarioCut}% cut</div>} />
            <div className="mt-6"><input type="range" min="0" max="40" step="1" value={scenarioCut} onChange={(event) => setScenarioCut(Number(event.target.value))} className="w-full accent-[var(--mint)]" /></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <MiniStat label="Projected Burn" value={compactCurrency(projectedMonthlyBurn)} />
              <MiniStat label="Projected Net" value={compactCurrency(projectedNet)} />
              <MiniStat label="Projected Runway" value={`${projectedRunway.toFixed(1)} months`} />
              <MiniStat label="Freed Capacity" value={compactCurrency(variableSpend - projectedVariableSpend)} />
            </div>
            <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300/78">Reduce discretionary spend and the planner recalculates burn, net position, and runway immediately.</div>
            <div className="mt-6 grid gap-3">{data.insights.map((insight) => <InsightTile key={insight.label} label={insight.label} value={insight.value} note={insight.note} />)}</div>
          </div>

          <div data-reveal data-tilt className="panel-frame rounded-[36px] p-6 will-change-transform">
            <SectionHeader kicker="Recurring Stack" title="Commitments" right={<div className="mini-badge">{data.recurringItems.length} items</div>} />
            <div className="mt-5 space-y-3">{data.recurringItems.map((item) => <RecurringRow key={item.id} name={item.name} cadence={item.cadence} category={item.category} essential={item.essential} nextDate={item.nextDate} amount={item.amount} monthlyEquivalent={item.monthlyEquivalent} />)}</div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
          <div data-reveal data-tilt className="panel-frame rounded-[36px] p-6 will-change-transform">
            <SectionHeader kicker="Ledger Explorer" title="Recent transactions" right={<div className="mini-badge">{filteredTransactions.length} visible</div>} />
            <div className="mt-5 flex flex-wrap gap-2">
              {(["all", "manual", "plaid", "sample"] as const).map((item) => (
                <button key={item} type="button" data-chip onClick={() => setSourceFilter(item)} className={`soft-chip ${sourceFilter === item ? "ring-1 ring-white/30" : ""}`}>
                  {item === "all" ? "All Sources" : startCase(item)}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {ledgerCategories.map((item) => (
                <button key={item} type="button" data-chip onClick={() => setCategoryFilter(item)} className={`soft-chip ${categoryFilter === item ? "ring-1 ring-white/30" : ""}`}>
                  {item === "ALL" ? "All Categories" : startCase(item)}
                </button>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              {filteredTransactions.length > 0 ? filteredTransactions.map((transaction) => (
                <LedgerRow key={transaction.id} title={transaction.name} subtitle={`${startCase(transaction.primaryCategory)} / ${formatDate(transaction.date)} / ${transaction.source ?? "sample"}`} value={`${transaction.amount > 0 ? "-" : "+"}${compactCurrency(Math.abs(transaction.amount))}`} tone={transaction.amount > 0 ? "text-slate-100" : "text-[#8ce7d4]"} />
              )) : <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-sm leading-7 text-slate-400">No transactions match the current source and category filters.</div>}
            </div>
          </div>
          <div className="grid gap-6">
            <div data-reveal data-tilt className="panel-frame rounded-[36px] p-6 will-change-transform">
              <SectionHeader kicker="Balance Grid" title="Accounts" right={<div className="mini-badge">{data.accounts.length} linked</div>} />
              <div className="mt-5 space-y-3">{data.accounts.map((account) => <LedgerRow key={account.id} title={account.name} subtitle={`${account.subtype} / **** ${account.mask}`} value={compactCurrency(account.balanceCurrent)} />)}</div>
            </div>
            <div data-reveal data-tilt className="panel-frame rounded-[36px] p-6 will-change-transform">
              <SectionHeader kicker="Live Rails" title="Plaid + sandbox" right={<div className="mini-badge">{canConnectPlaid ? "Enabled" : "Config needed"}</div>} />
              <div className="mt-5"><PlaidConnect canConnect={canConnectPlaid} mode={data.mode} /></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
