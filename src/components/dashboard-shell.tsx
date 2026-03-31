"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MotionConfig, motion } from "framer-motion";
import * as XLSX from "xlsx";

import { FinanceChatPanel } from "@/components/finance-chat-panel";
import { PlaidConnect } from "@/components/plaid-connect";
import { PlaidLinkProvider } from "@/components/plaid-link-provider";
import { DepthHero, DepthScrollPanel } from "@/components/depth-hero";
import { SceneBackdrop } from "@/components/scene-backdrop";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { buildSmoothPath } from "@/components/workspace-ui";
import {
  compactCurrency,
  currency,
  formatDate,
  startCase,
  type DashboardData,
} from "@/lib/finance";

const pathEase = [0.22, 1, 0.36, 1] as const;

const LEDGER_CATEGORIES = [
  "FOOD_AND_DRINK",
  "TRANSPORTATION",
  "RENT_AND_UTILITIES",
  "SHOPPING",
  "ENTERTAINMENT",
  "INCOME",
  "OTHER",
] as const;

type DashboardShellProps = {
  data: DashboardData;
  canConnectPlaid: boolean;
  allowDemoToggle: boolean;
};

function normalizeHeaderKey(s: string) {
  return String(s).trim().toLowerCase().replace(/\s+/g, "");
}

function pickCell(row: Record<string, unknown>, candidates: string[]) {
  const entries = Object.entries(row);
  for (const want of candidates) {
    const nw = normalizeHeaderKey(want);
    for (const [k, v] of entries) {
      if (normalizeHeaderKey(k) === nw) {
        return v;
      }
    }
  }
  return undefined;
}

function excelSerialToIso(n: number): string | null {
  if (!Number.isFinite(n) || n < 1) {
    return null;
  }
  const utc = Math.round((n - 25569) * 86400 * 1000);
  return new Date(utc).toISOString().slice(0, 10);
}

function cellToIsoDate(val: unknown): string | null {
  if (typeof val === "number") {
    if (val > 30000 && val < 100000) {
      return excelSerialToIso(val);
    }
  }
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  if (typeof val === "string") {
    const t = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
      return t;
    }
  }
  return null;
}

function parseAmount(val: unknown): number | null {
  if (typeof val === "number" && Number.isFinite(val)) {
    return val;
  }
  if (typeof val === "string") {
    const n = Number(val.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseSheetToRows(sheet: XLSX.WorkSheet): Array<{
  name: string;
  amount: number;
  date: string;
  primaryCategory: string;
  type: "expense" | "income";
}> {
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const out: Array<{
    name: string;
    amount: number;
    date: string;
    primaryCategory: string;
    type: "expense" | "income";
  }> = [];

  for (const row of json) {
    const nameRaw = pickCell(row, ["name", "description", "merchant", "memo", "title"]);
    const name = String(nameRaw ?? "").trim();
    if (!name) {
      continue;
    }

    const dateRaw = pickCell(row, ["date", "day", "posted"]);
    const date = cellToIsoDate(dateRaw);
    if (!date) {
      continue;
    }

    let amount = parseAmount(pickCell(row, ["amount", "amt", "value", "sum"]));
    if (amount === null) {
      continue;
    }

    const typeCell = String(pickCell(row, ["type", "direction", "dr/cr"]) ?? "")
      .trim()
      .toLowerCase();
    let type: "expense" | "income" = "expense";
    if (amount < 0) {
      type = "income";
      amount = Math.abs(amount);
    }
    if (typeCell.includes("income") || typeCell === "in" || typeCell === "cr") {
      type = "income";
    }
    if (typeCell.includes("expense") || typeCell === "out" || typeCell === "dr") {
      type = "expense";
    }

    if (amount <= 0) {
      continue;
    }

    const catRaw = String(pickCell(row, ["category", "primarycategory", "cat"]) ?? "").trim();
    const primaryCategory = LEDGER_CATEGORIES.includes(catRaw as (typeof LEDGER_CATEGORIES)[number])
      ? catRaw
      : "OTHER";

    out.push({ name, amount, date, primaryCategory, type });
  }

  return out;
}

export function DashboardShell({ data, canConnectPlaid, allowDemoToggle }: DashboardShellProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [ledgerMsg, setLedgerMsg] = useState<string | null>(null);
  const openingInputRef = useRef<HTMLInputElement | null>(null);
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formCategory, setFormCategory] = useState<string>(LEDGER_CATEGORIES[0]);
  const [formType, setFormType] = useState<"expense" | "income">("expense");

  const totalBalance = data.accounts.reduce((sum, a) => sum + a.balanceCurrent, 0);
  const spendSeries = data.trend.map((p) => p.spend);
  const incomeSeries = data.trend.map((p) => p.income);
  const chartMax = Math.max(...spendSeries, ...incomeSeries, 1);
  const spendPath = useMemo(() => buildSmoothPath(spendSeries, chartMax), [spendSeries, chartMax]);
  const incomePath = useMemo(() => buildSmoothPath(incomeSeries, chartMax), [incomeSeries, chartMax]);
  const recent = data.transactions.slice(0, 8);

  const showOpeningBalance =
    data.mode === "sample" ||
    (data.accounts.length === 1 && data.accounts[0]?.id === "manual-cash");

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const setDemoMode = async (demo: boolean) => {
    setLedgerMsg(null);
    const res = await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demo }),
    });
    if (!res.ok) {
      setLedgerMsg("Could not update demo mode.");
      return;
    }
    refresh();
  };

  const saveOpeningBalance = async () => {
    setLedgerMsg(null);
    const raw = openingInputRef.current?.value ?? "";
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      setLedgerMsg("Opening balance must be a number.");
      return;
    }
    const res = await fetch("/api/workspace/cash-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cashBalance: n }),
    });
    if (!res.ok) {
      setLedgerMsg("Could not save opening balance.");
      return;
    }
    refresh();
  };

  const submitManualRow = async (e: React.FormEvent) => {
    e.preventDefault();
    setLedgerMsg(null);
    const amount = Number(formAmount);
    if (!formName.trim() || !Number.isFinite(amount) || amount <= 0) {
      setLedgerMsg("Add a name and a positive amount.");
      return;
    }
    const res = await fetch("/api/manual-transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formName.trim(),
        amount,
        date: formDate,
        primaryCategory: formCategory,
        type: formType,
      }),
    });
    if (!res.ok) {
      setLedgerMsg("Could not add transaction.");
      return;
    }
    setFormName("");
    setFormAmount("");
    refresh();
  };

  const onExcel = async (file: File | null) => {
    if (!file) {
      return;
    }
    setLedgerMsg(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) {
        setLedgerMsg("Empty workbook.");
        return;
      }
      const rows = parseSheetToRows(sheet);
      if (rows.length === 0) {
        setLedgerMsg(
          "No valid rows. Use columns: Date, Name (or Description), Amount, optional Category, optional Type (income/expense).",
        );
        return;
      }
      const res = await fetch("/api/manual-transactions/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setLedgerMsg(j?.error ?? "Import failed.");
        return;
      }
      setLedgerMsg(`Imported ${rows.length} rows.`);
      refresh();
    } catch {
      setLedgerMsg("Could not read that file.");
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <PlaidLinkProvider canConnect={canConnectPlaid} mode={data.mode}>
        <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
          <div className="pointer-events-none fixed inset-0 z-0">
            <div
              className="absolute inset-0 transition-opacity duration-500"
              style={{
                background: `radial-gradient(ellipse 90% 60% at calc(50% + var(--ptr-nx, 0) * 8%) calc(12% + var(--ptr-ny, 0) * 6%), color-mix(in srgb, var(--accent) 18%, var(--background)), var(--background) 58%)`,
              }}
            />
            <div className="absolute inset-x-0 top-0 min-h-[100vh]">
              <SceneBackdrop theme={theme} />
            </div>
          </div>

          <header
            className="fixed left-0 right-0 top-0 z-[80] border-b border-[var(--glass-border)]"
            style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))" }}
          >
            <div className="astra-glass-strong mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 rounded-b-2xl px-5 py-3 sm:px-10">
              <p className="text-[10px] font-medium uppercase tracking-[0.55em] text-[var(--accent)]">
                / Ledger
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <ThemeToggle />
                {allowDemoToggle ? (
                  <button
                    type="button"
                    data-cursor="active"
                    onClick={() => void setDemoMode(!data.ledgerHints.demoMode)}
                    disabled={pending}
                    className="astra-glass-chip rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-40"
                  >
                    {data.ledgerHints.demoMode ? "Blank ledger" : "Load demo data"}
                  </button>
                ) : null}
                <label
                  data-cursor="active"
                  className="astra-glass-chip cursor-pointer rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                >
                  Import .xlsx
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="sr-only"
                    onChange={(e) => void onExcel(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
          </header>

          <div
            className="relative z-10 mx-auto max-w-4xl px-5 pb-36 pt-[calc(5.75rem+env(safe-area-inset-top,0px))] sm:px-10"
          >
            <div className="relative -mx-5 mb-2 overflow-hidden border-b border-[var(--border)] sm:-mx-8">
              <motion.div
                className="flex w-max gap-24 py-3.5 pl-5 text-[10px] uppercase tracking-[0.45em] text-[var(--muted-2)]"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
              >
                <span>
                  Opening balance · Manual rows · Excel import · INR · 3D depth · Your data starts at
                  zero
                </span>
                <span aria-hidden>
                  Opening balance · Manual rows · Excel import · INR · 3D depth · Your data starts at
                  zero
                </span>
              </motion.div>
            </div>

            <DepthHero>
              <h1 className="mt-6 select-none font-semibold leading-[0.88] tracking-[-0.07em] text-[var(--foreground)]">
                <span className="block text-[clamp(2.75rem,14vw,5.25rem)]">ASTRA</span>
                <span className="block text-[clamp(2.1rem,10vw,3.85rem)] text-[var(--muted)]">LEDGER</span>
              </h1>
              <p className="mt-8 max-w-md text-sm leading-relaxed text-[var(--muted)]">
                Start at ₹0: set opening cash, add rows, or drop a spreadsheet. Demo stories are
                optional.
              </p>
              <p className="mt-10 text-[clamp(2.25rem,10vw,4rem)] font-semibold leading-none tracking-[-0.045em] text-[var(--foreground)] tabular-nums">
                {currency(totalBalance)}
              </p>
              <div className="mt-8 grid gap-1 border-t border-[var(--border)] pt-8 text-sm text-[var(--muted)] sm:grid-cols-3">
                <p>
                  <span className="text-[var(--muted-2)]">Out </span>
                  {currency(data.totals.spent)}
                </p>
                <p>
                  <span className="text-[var(--muted-2)]">In </span>
                  {currency(data.totals.income)}
                </p>
                <p>
                  <span className="text-[var(--muted-2)]">Net </span>
                  {currency(data.totals.net)}
                </p>
                <p className="sm:col-span-3">
                  <span className="text-[var(--muted-2)]">Runway </span>
                  {data.planner.runwayMonths.toFixed(1)} mo
                  <span className="mx-2 text-[var(--border)]">·</span>
                  <span className="text-[var(--muted-2)]">Health </span>
                  <span className="text-[var(--accent)]">{data.healthScore}</span>
                  <span className="text-[var(--muted-2)]"> / 100</span>
                </p>
              </div>
            </DepthHero>

            <motion.section
              className="mt-14 space-y-8 border-t border-[var(--border)] pt-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65, ease: [0.19, 1, 0.22, 1] }}
            >
              <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--muted-2)]">/ Your data</p>

              {showOpeningBalance ? (
                <div className="astra-glass rounded-2xl p-5">
                  <p className="text-xs font-medium text-[var(--foreground)]">Opening cash balance (INR)</p>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">
                    Used when you are not on demo data and have no linked bank rows yet.
                  </p>
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <input
                      type="number"
                      key={String(data.ledgerHints.openingBalance)}
                      step="0.01"
                      defaultValue={String(data.ledgerHints.openingBalance)}
                      ref={openingInputRef}
                      className="w-40 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => void saveOpeningBalance()}
                      disabled={pending}
                      className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-[var(--accent-ink)] disabled:opacity-40"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : null}

              <form
                onSubmit={(e) => void submitManualRow(e)}
                className="astra-glass rounded-2xl p-5"
              >
                <p className="text-xs font-medium text-[var(--foreground)]">Add one transaction</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input
                    required
                    placeholder="Name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] sm:col-span-2"
                  />
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Amount (positive)"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  />
                  <input
                    required
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  />
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  >
                    {LEDGER_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {startCase(c)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as "expense" | "income")}
                    className="rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  >
                    <option value="expense">Expense (money out)</option>
                    <option value="income">Income (money in)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={pending}
                  className="mt-4 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--foreground)] hover:border-[var(--accent)] disabled:opacity-40"
                >
                  Add row
                </button>
              </form>

              {ledgerMsg ? (
                <p className="text-center text-xs text-[var(--accent)]">{ledgerMsg}</p>
              ) : null}
            </motion.section>

            <DepthScrollPanel>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--muted-2)]">/ Flow · 6 months</p>
              <div className="mt-6">
                <svg viewBox="0 0 100 100" className="h-44 w-full overflow-visible sm:h-52">
                  <defs>
                    <linearGradient id="s" x1="0%" x2="100%" y1="0%" y2="0%">
                      <stop offset="0%" stopColor="#fb7185" />
                      <stop offset="100%" stopColor="var(--chart-spend-end)" />
                    </linearGradient>
                    <linearGradient id="i" x1="0%" x2="100%" y1="0%" y2="0%">
                      <stop offset="0%" stopColor="var(--accent)" />
                      <stop offset="100%" stopColor="var(--chart-income-end)" />
                    </linearGradient>
                  </defs>
                  <motion.path
                    key={`sp-${data.updatedAt}`}
                    d={spendPath}
                    fill="none"
                    stroke="url(#s)"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ amount: 0.45 }}
                    transition={{ duration: 1.5, ease: pathEase }}
                  />
                  <motion.path
                    key={`in-${data.updatedAt}`}
                    d={incomePath}
                    fill="none"
                    stroke="url(#i)"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ amount: 0.45 }}
                    transition={{ duration: 1.5, ease: pathEase, delay: 0.1 }}
                  />
                </svg>
                <div className="mt-3 flex justify-between text-[9px] uppercase tracking-[0.2em] text-[var(--muted-2)]">
                  {data.trend.map((p) => (
                    <span key={p.label}>{p.label}</span>
                  ))}
                </div>
              </div>
            </DepthScrollPanel>

            <motion.section
              className="mx-auto max-w-xl py-12"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
            >
              <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--muted-2)]">/ Recent</p>
              <ul className="mt-6 border-t border-[var(--border)]">
                {recent.map((t, i) => (
                  <motion.li
                    key={t.id}
                    className="flex items-baseline justify-between gap-4 border-b border-[var(--border)] py-4"
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ delay: i * 0.05, duration: 0.45, ease: [0.19, 1, 0.22, 1] }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-[var(--foreground)]">{t.name}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-[var(--muted-2)]">
                        {startCase(t.primaryCategory)} · {formatDate(t.date)}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-medium tabular-nums ${t.amount > 0 ? "text-[var(--muted)]" : "text-[var(--accent)]"}`}
                    >
                      {t.amount > 0 ? "−" : "+"}
                      {compactCurrency(Math.abs(t.amount))}
                    </p>
                  </motion.li>
                ))}
              </ul>
            </motion.section>

            <motion.div
              className="mx-auto max-w-xl pt-8"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
            >
              <PlaidConnect />
            </motion.div>
          </div>

          <FinanceChatPanel />
        </div>
      </PlaidLinkProvider>
    </MotionConfig>
  );
}
