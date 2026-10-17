"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MotionConfig, motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import {
  Sparkles,
  LayoutDashboard,
  LineChart,
  SlidersHorizontal,
  Target,
  RefreshCw,
  BookOpen,
  Plus,
  Wallet,
  Command,
  Download,
  GitBranch,
  ShieldAlert,
  Receipt,
  MoreHorizontal,
  ChevronDown,
  Lock,
  AlertTriangle,
} from "lucide-react";

import { FinanceChatPanel } from "@/components/finance-chat-panel";
import { PlaidConnect } from "@/components/plaid-connect";
import { PlaidLinkProvider } from "@/components/plaid-link-provider";
import { DepthHero } from "@/components/depth-hero";
import { SceneBackdrop } from "@/components/scene-backdrop";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { OverviewTab } from "@/components/overview-tab";
import { AnalyticsTab } from "@/components/analytics-tab";
import { BudgetsTab } from "@/components/budgets-tab";
import { GoalsTab } from "@/components/goals-tab";
import { RecurringTab } from "@/components/recurring-tab";
import { LedgerTab } from "@/components/ledger-tab";
import { WhatIfSimulator } from "@/components/what-if-simulator";
import { FinancialLeakAudit } from "@/components/financial-leak-audit";
import { QuarantineVault } from "@/components/quarantine-vault";
import { StressTestDrawer } from "@/components/stress-test-drawer";
import { QuickAddModal } from "@/components/quick-add-modal";
import { BudgetModal } from "@/components/budget-modal";
import { GoalModal } from "@/components/goal-modal";
import { ReceiptScannerModal } from "@/components/receipt-scanner-modal";
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal";
import { useDoodleToast } from "@/components/doodle-toast";
import {
  currency,
  type DashboardData,
} from "@/lib/finance";

type TabId = "overview" | "analytics" | "budgets" | "goals" | "recurring" | "ledger" | "simulator" | "audit" | "quarantine";

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CORE_TABS: TabItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "analytics", label: "Trends", icon: LineChart },
  { id: "budgets", label: "Budgets", icon: SlidersHorizontal },
  { id: "goals", label: "Goals", icon: Target },
  { id: "recurring", label: "Subscriptions", icon: RefreshCw },
  { id: "ledger", label: "Ledger", icon: BookOpen },
];

const LAB_TABS = [
  { id: "simulator" as const, label: "What-If Multiverse", desc: "Interactive timeline branching", icon: GitBranch, key: "7" },
  { id: "audit" as const, label: "Leak Audit Sentinel", desc: "Weekend burn & phantom creep", icon: ShieldAlert, key: "8" },
  { id: "quarantine" as const, label: "Quarantine Locker", desc: "Anti-impulse & life-energy price", icon: Lock, key: "9" },
];

type DashboardShellProps = {
  data: DashboardData;
  initialTab?: TabId;
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
    if (!name) continue;

    const dateRaw = pickCell(row, ["date", "day", "posted"]);
    const date = cellToIsoDate(dateRaw);
    if (!date) continue;

    let amount = parseAmount(pickCell(row, ["amount", "amt", "value", "sum"]));
    if (amount === null) continue;

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

    const catRaw = String(pickCell(row, ["category", "cat", "group"]) ?? "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_");

    const primaryCategory = [
      "FOOD_AND_DRINK",
      "TRANSPORTATION",
      "RENT_AND_UTILITIES",
      "SHOPPING",
      "ENTERTAINMENT",
      "INCOME",
      "OTHER",
    ].includes(catRaw)
      ? catRaw
      : "OTHER";

    out.push({ name, amount, date, primaryCategory, type });
  }

  return out;
}

export function DashboardShell({
  data,
  initialTab = "overview",
  canConnectPlaid,
  allowDemoToggle,
}: DashboardShellProps) {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useDoodleToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [monthsAhead, setMonthsAhead] = useState(0);

  // Sync tab with URL search parameter (?tab=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab") as TabId | null;
    if (
      tabParam &&
      [
        "overview",
        "analytics",
        "budgets",
        "goals",
        "recurring",
        "ledger",
        "simulator",
        "audit",
        "quarantine",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
    if (params.get("stress") === "1") {
      setStressTestOpen(true);
    }
    if (params.get("add") === "1") {
      setQuickAddOpen(true);
    }
    if (params.get("scan") === "1") {
      setReceiptScannerOpen(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") !== activeTab) {
      url.searchParams.set("tab", activeTab);
      window.history.replaceState(null, "", url.toString());
    }
  }, [activeTab]);

  // Dropdown and drawer states for streamlined navbar
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [labsMenuOpen, setLabsMenuOpen] = useState(false);
  const [stressTestOpen, setStressTestOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const labsDropdownRef = useRef<HTMLDivElement | null>(null);

  // Modals state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [receiptScannerOpen, setReceiptScannerOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState<string | undefined>();
  const [selectedBudgetLimit, setSelectedBudgetLimit] = useState<number | undefined>();
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<{
    id: string;
    name: string;
    currentAmount: number;
    targetAmount: number;
  } | null>(null);

  const [openingBalanceOpen, setOpeningBalanceOpen] = useState(false);
  const openingInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const totalBalance = useMemo(
    () => data.accounts.reduce((sum, a) => sum + a.balanceCurrent, 0),
    [data.accounts]
  );

  const showOpeningBalanceOption =
    data.mode === "sample" ||
    (data.accounts.length === 1 && data.accounts[0]?.id === "manual-cash");

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
      if (labsDropdownRef.current && !labsDropdownRef.current.contains(e.target as Node)) {
        setLabsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        if (e.key === "Escape") {
          setQuickAddOpen(false);
          setBudgetModalOpen(false);
          setGoalModalOpen(false);
          setOpeningBalanceOpen(false);
          setShortcutsOpen(false);
          setMoreMenuOpen(false);
          setLabsMenuOpen(false);
          setStressTestOpen(false);
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuickAddOpen((prev) => !prev);
        return;
      }

      if (e.key === "1") { setActiveTab("overview"); }
      else if (e.key === "2") { setActiveTab("analytics"); }
      else if (e.key === "3") { setActiveTab("budgets"); }
      else if (e.key === "4") { setActiveTab("goals"); }
      else if (e.key === "5") { setActiveTab("recurring"); }
      else if (e.key === "6") { setActiveTab("ledger"); }
      else if (e.key === "7") { setActiveTab("simulator"); }
      else if (e.key === "8") { setActiveTab("audit"); }
      else if (e.key === "9") { setActiveTab("quarantine"); }
      else if (e.key === "0") { setStressTestOpen((p) => !p); }
      else if (e.key === "n" || e.key === "N") { setQuickAddOpen(true); }
      else if (e.key === "r" || e.key === "R") { setReceiptScannerOpen(true); }
      else if (e.key === "d" || e.key === "D") {
        if (allowDemoToggle) {
          void setDemoMode(!data.ledgerHints.demoMode);
        }
      }
      else if (e.key === "t" || e.key === "T") { toggleTheme(); }
      else if (e.key === "?") { setShortcutsOpen((p) => !p); }
      else if (e.key === "Escape") {
        setQuickAddOpen(false);
        setReceiptScannerOpen(false);
        setBudgetModalOpen(false);
        setGoalModalOpen(false);
        setOpeningBalanceOpen(false);
        setShortcutsOpen(false);
        setMoreMenuOpen(false);
        setLabsMenuOpen(false);
        setStressTestOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleTheme, allowDemoToggle, data.ledgerHints.demoMode]);

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const exportCsv = () => {
    if (data.transactions.length === 0) return;
    const headers = "Date,Name,Category,Amount,Type\n";
    const rows = data.transactions
      .map(
        (t) =>
          `"${t.date}","${t.name.replace(/"/g, '""')}","${t.primaryCategory}",${Math.abs(t.amount)},${
            t.amount < 0 ? "income" : "expense"
          }`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `astra-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Ledger CSV Exported", "All transactions saved to your downloads.");
  };

  const setDemoMode = async (demo: boolean) => {
    setStatusMsg(null);
    const res = await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demo }),
    });
    if (!res.ok) {
      setStatusMsg("Could not update demo mode.");
      showToast("Update Failed", "Could not switch demo mode.", "info");
      return;
    }
    showToast(
      demo ? "Sample Ledger Active" : "Blank Slate Active",
      demo ? "Loaded financial sample sketchbook." : "Switched to clean custom mode."
    );
    refresh();
  };

  const saveOpeningBalance = async () => {
    setStatusMsg(null);
    const raw = openingInputRef.current?.value ?? "";
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      setStatusMsg("Opening balance must be a number.");
      showToast("Invalid Input", "Opening balance must be a valid number.", "info");
      return;
    }
    const res = await fetch("/api/workspace/cash-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cashBalance: n }),
    });
    if (!res.ok) {
      setStatusMsg("Could not save opening balance.");
      showToast("Update Failed", "Could not save opening balance.", "info");
      return;
    }
    setOpeningBalanceOpen(false);
    showToast("Balance Updated", `Opening balance adjusted to ₹${n.toLocaleString("en-IN")}.`);
    refresh();
  };

  const handleExcelImport = async (file: File) => {
    setStatusMsg(null);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) {
      throw new Error("Empty workbook.");
    }
    const rows = parseSheetToRows(sheet);
    if (rows.length === 0) {
      throw new Error("No valid rows found in spreadsheet.");
    }
    const res = await fetch("/api/manual-transactions/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(j?.error ?? "Import failed.");
    }
    showToast("Spreadsheet Imported", `${rows.length} transactions recorded.`);
    refresh();
  };

  return (
    <MotionConfig reducedMotion="user">
      <PlaidLinkProvider canConnect={canConnectPlaid} mode={data.mode}>
        <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--accent)] selection:text-[var(--accent-ink)]">
          {/* Subtle Ambient CSS Lighting */}
          <SceneBackdrop theme={theme} />

          {/* Floating Command Bar / Header */}
          <header className="fixed left-0 right-0 top-0 z-[80] px-4 py-3 sm:px-8">
            <div
              className="doodle-card mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6"
              style={{ borderRadius: "20px 14px 18px 16px / 16px 18px 14px 20px" }}
            >
              {/* Brand Logo & Subtle Sandbox Indicator */}
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-black tracking-tight text-[var(--foreground)]">
                  // DOODLE
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold text-[var(--color-primary)] bg-[var(--surface-2)] px-2.5 py-0.5 rounded-full border border-[var(--border)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
                  {data.mode === "live" ? "Live Account" : "Sandbox"}
                </span>
              </div>

              {/* Navigation Tabs (Desktop) matching Image 1: 6 core tabs + Labs dropdown */}
              <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2">
                {CORE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center justify-center px-3 xl:px-4 py-1.5 rounded-xl border-2 transition-all select-none ${
                        isActive
                          ? "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[2px_2px_0px_var(--border)] font-bold scale-[1.02]"
                          : "border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]/60 hover:-translate-y-0.5"
                      }`}
                    >
                      <Icon className="h-4 w-4 mb-0.5" />
                      <span className="text-xs font-hand font-bold tracking-wide whitespace-nowrap">{tab.label}</span>
                    </button>
                  );
                })}

                {/* Labs Dropdown Tab */}
                <div className="relative" ref={labsDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setLabsMenuOpen((prev) => !prev)}
                    className={`flex flex-col items-center justify-center px-3 xl:px-3.5 py-1.5 rounded-xl border-2 transition-all select-none ${
                      activeTab === "simulator" || activeTab === "audit" || activeTab === "quarantine"
                        ? "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[2px_2px_0px_var(--border)] font-bold scale-[1.02]"
                        : "border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]/60 hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex items-center gap-0.5 mb-0.5">
                      <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
                      <ChevronDown className={`h-3 w-3 transition-transform ${labsMenuOpen ? "rotate-180" : ""}`} />
                    </div>
                    <span className="text-xs font-hand font-bold tracking-wide whitespace-nowrap">
                      {activeTab === "simulator" ? "What-If" : activeTab === "audit" ? "Audit" : activeTab === "quarantine" ? "Quarantine" : "Labs"}
                    </span>
                  </button>

                  <AnimatePresence>
                    {labsMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="doodle-card absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 p-2 bg-[var(--surface)] z-50 shadow-xl border-2 border-[var(--border)] font-hand"
                        style={{ borderRadius: "14px 16px 12px 14px / 16px 12px 14px 16px" }}
                      >
                        <div className="doodle-tape -top-2 left-1/2 -translate-x-1/2 w-12 h-3" />
                        <div className="p-1 space-y-1">
                          {LAB_TABS.map((lab) => {
                            const Icon = lab.icon;
                            const isSelected = activeTab === lab.id;
                            return (
                              <button
                                key={lab.id}
                                type="button"
                                onClick={() => {
                                  setActiveTab(lab.id);
                                  setLabsMenuOpen(false);
                                }}
                                className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors ${
                                  isSelected
                                    ? "bg-[var(--surface-2)] text-[var(--foreground)] font-bold"
                                    : "hover:bg-[var(--surface-2)]/60 text-[var(--muted)] hover:text-[var(--foreground)]"
                                }`}
                              >
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] mt-0.5">
                                  <Icon className="h-4 w-4 text-[var(--color-primary)]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold font-display text-[var(--foreground)]">{lab.label}</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-[var(--border)] text-[var(--muted)]">{lab.key}</span>
                                  </div>
                                  <p className="text-[11px] text-[var(--muted)] leading-tight mt-0.5">{lab.desc}</p>
                                </div>
                              </button>
                            );
                          })}

                          {/* Crisis Stress-Test Drill item */}
                          <button
                            type="button"
                            onClick={() => {
                              setLabsMenuOpen(false);
                              setStressTestOpen(true);
                            }}
                            className="w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors hover:bg-[var(--surface-2)]/60 text-[var(--muted)] hover:text-[var(--foreground)]"
                          >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] mt-0.5">
                              <AlertTriangle className="h-4 w-4 text-[var(--color-danger)]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold font-display text-[var(--foreground)]">Crisis Stress-Test</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-[var(--border)] text-[var(--muted)]">0</span>
                              </div>
                              <p className="text-[11px] text-[var(--muted)] leading-tight mt-0.5">Macro shocks & black swan triage</p>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>

              {/* Right Hub: Minimal, Uncluttered 3-Element Toolbar */}
              <div className="flex items-center gap-2">
                {/* Single Primary Action: Add Transaction */}
                <button
                  type="button"
                  onClick={() => setQuickAddOpen(true)}
                  className="doodle-btn doodle-btn-primary flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold shadow-sm"
                  title="Add Transaction (Ctrl+K or N)"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Add</span>
                </button>

                {/* Consolidated Doodle Action Menu (...) */}
                <div className="relative" ref={moreMenuRef}>
                  <button
                    type="button"
                    onClick={() => setMoreMenuOpen((prev) => !prev)}
                    className="doodle-btn h-9 w-9 flex items-center justify-center bg-[var(--surface-2)] text-[var(--foreground)]"
                    title="Tools and options"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>

                  {/* Hand-Drawn Washi Sticky Note Dropdown */}
                  <AnimatePresence>
                    {moreMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="doodle-card absolute right-0 top-full mt-2 w-64 p-3 bg-[var(--surface)] z-50 shadow-2xl border-2 border-[var(--border)] font-hand"
                        style={{ borderRadius: "16px 14px 18px 12px / 14px 18px 12px 16px" }}
                      >
                        <div className="doodle-tape -top-2.5 right-6 w-14 h-3.5" />
                        <p className="text-[10px] font-mono uppercase font-bold text-[var(--muted)] px-1 pb-1.5 border-b border-dashed border-[var(--border-soft)]">
                          Sketchbook Tools
                        </p>

                        <div className="mt-1.5 space-y-1">
                          {/* Scan Receipt */}
                          <button
                            type="button"
                            onClick={() => {
                              setMoreMenuOpen(false);
                              setReceiptScannerOpen(true);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-[var(--surface-2)] transition-colors text-[var(--foreground)]"
                          >
                            <div className="flex items-center gap-2.5">
                              <Receipt className="h-4 w-4 text-[#49B6E5]" />
                              <span className="text-xs font-bold">Scan & Split Bill</span>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-[var(--border)] text-[var(--muted)]">R</span>
                          </button>

                          {/* Crisis Stress-Test */}
                          <button
                            type="button"
                            onClick={() => {
                              setMoreMenuOpen(false);
                              setStressTestOpen(true);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-[var(--surface-2)] transition-colors text-[var(--foreground)]"
                          >
                            <div className="flex items-center gap-2.5">
                              <AlertTriangle className="h-4 w-4 text-[var(--color-danger)]" />
                              <span className="text-xs font-bold">Crisis Stress-Test</span>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-[var(--border)] text-[var(--muted)]">0</span>
                          </button>

                          {/* Load Sample / Blank Slate */}
                          {allowDemoToggle && (
                            <button
                              type="button"
                              onClick={() => {
                                setMoreMenuOpen(false);
                                void setDemoMode(!data.ledgerHints.demoMode);
                              }}
                              disabled={pending}
                              className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-[var(--surface-2)] transition-colors text-[var(--foreground)] disabled:opacity-40"
                            >
                              <div className="flex items-center gap-2.5">
                                <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
                                <span className="text-xs font-bold">
                                  {data.ledgerHints.demoMode ? "Blank Slate" : "Load Sample"}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-[var(--border)] text-[var(--muted)]">D</span>
                            </button>
                          )}

                          {/* Export CSV */}
                          {data.transactions.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setMoreMenuOpen(false);
                                exportCsv();
                              }}
                              className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-[var(--surface-2)] transition-colors text-[var(--foreground)]"
                            >
                              <div className="flex items-center gap-2.5">
                                <Download className="h-4 w-4 text-[#16A34A]" />
                                <span className="text-xs font-bold">Export Ledger (CSV)</span>
                              </div>
                            </button>
                          )}

                          {/* Keyboard Shortcuts */}
                          <button
                            type="button"
                            onClick={() => {
                              setMoreMenuOpen(false);
                              setShortcutsOpen(true);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-[var(--surface-2)] transition-colors text-[var(--foreground)]"
                          >
                            <div className="flex items-center gap-2.5">
                              <Command className="h-4 w-4 text-[var(--muted)]" />
                              <span className="text-xs font-bold">Shortcuts Reference</span>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-[var(--border)] text-[var(--muted)]">?</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Theme Toggle */}
                <ThemeToggle />
              </div>
            </div>

            {/* Mobile Tab Navigation matching sketchbook aesthetic */}
            <div className="mt-2.5 flex lg:hidden overflow-x-auto gap-2 p-1 no-scrollbar">
              {CORE_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-hand font-bold transition-all ${
                      isActive
                        ? "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[2px_2px_0px_var(--border)]"
                        : "border-[var(--border)]/60 bg-[var(--surface-2)]/50 text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
              {LAB_TABS.map((lab) => {
                const Icon = lab.icon;
                const isActive = activeTab === lab.id;

                return (
                  <button
                    key={lab.id}
                    type="button"
                    onClick={() => setActiveTab(lab.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-hand font-bold transition-all ${
                      isActive
                        ? "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[2px_2px_0px_var(--border)]"
                        : "border-[var(--border)]/60 bg-[var(--surface-2)]/50 text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{lab.id === "simulator" ? "What-If" : "Audit"}</span>
                  </button>
                );
              })}
            </div>
          </header>

          {/* Main Layout Container */}
          <main className="relative z-10 mx-auto max-w-7xl px-4 pb-36 pt-24 sm:px-8 sm:pt-28">
            {/* Executive Wealth Hero Header */}
            <div className="mb-10">
              <DepthHero>
                <div className="flex flex-col items-start justify-center text-left py-2">
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--foreground)] font-display">
                    Net Liquidity
                  </h2>

                  <div className="mt-2 text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[var(--foreground)] font-display tabular-nums">
                    {currency(totalBalance)}
                  </div>

                  {/* Opening Balance Editor Trigger */}
                  {showOpeningBalanceOption && (
                    <button
                      type="button"
                      onClick={() => setOpeningBalanceOpen(true)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] transition hover:underline font-hand"
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      Adjust Base Cash Balance (₹{data.ledgerHints.openingBalance})
                    </button>
                  )}
                </div>
              </DepthHero>
            </div>

            {/* Opening Balance Modal */}
            <AnimatePresence>
              {openingBalanceOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                  <div
                    onClick={() => setOpeningBalanceOpen(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  />
                  <div
                    className="doodle-card relative z-10 w-full max-w-sm p-6"
                    style={{ borderRadius: "20px 14px 18px 16px / 16px 18px 14px 20px" }}
                  >
                    <h4 className="font-bold text-base text-[var(--foreground)]">Opening Cash Balance</h4>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Set your starting balance for manual tracking.
                    </p>
                    <div className="mt-4">
                      <input
                        ref={openingInputRef}
                        type="number"
                        step="100"
                        defaultValue={String(data.ledgerHints.openingBalance)}
                        className="doodle-input w-full px-4 py-2 text-sm text-[var(--foreground)]"
                      />
                    </div>
                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setOpeningBalanceOpen(false)}
                        className="doodle-btn flex-1 bg-[var(--surface-2)] py-2 text-xs font-bold text-[var(--muted)]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void saveOpeningBalance()}
                        disabled={pending}
                        className="doodle-btn flex-1 bg-[#49B6E5] py-2 text-xs font-bold text-white"
                      >
                        Save Balance
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Active Tab View with Smooth Transitions */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "overview" && (
                  <OverviewTab
                    data={data}
                    onOpenQuickAdd={() => setQuickAddOpen(true)}
                    onOpenGoalContribute={(g) => {
                      setContributeGoal(g);
                      setGoalModalOpen(true);
                    }}
                    monthsAhead={monthsAhead}
                    onMonthsAheadChange={setMonthsAhead}
                    onNavigateToLedger={() => setActiveTab("ledger")}
                    onOpenStressTest={() => setStressTestOpen(true)}
                    onNavigateToQuarantine={() => setActiveTab("quarantine")}
                  />
                )}

                {activeTab === "analytics" && <AnalyticsTab data={data} />}

                {activeTab === "budgets" && (
                  <BudgetsTab
                    data={data}
                    onOpenBudgetModal={(cat, limit) => {
                      setSelectedBudgetCategory(cat);
                      setSelectedBudgetLimit(limit);
                      setBudgetModalOpen(true);
                    }}
                    onOpenQuickAdd={() => setQuickAddOpen(true)}
                  />
                )}

                {activeTab === "goals" && (
                  <GoalsTab
                    goals={data.goals}
                    onOpenCreateGoal={() => {
                      setContributeGoal(null);
                      setGoalModalOpen(true);
                    }}
                    onOpenContribute={(g) => {
                      setContributeGoal(g);
                      setGoalModalOpen(true);
                    }}
                  />
                )}

                {activeTab === "recurring" && (
                  <RecurringTab
                    recurringItems={data.recurringItems}
                    upcomingCharges={data.upcomingCharges}
                    planner={data.planner}
                  />
                )}

                {activeTab === "ledger" && (
                  <LedgerTab
                    transactions={data.transactions}
                    onOpenQuickAdd={() => setQuickAddOpen(true)}
                    onRefresh={refresh}
                    onExcelImport={handleExcelImport}
                    onOpenReceiptScanner={() => setReceiptScannerOpen(true)}
                  />
                )}

                {activeTab === "simulator" && <WhatIfSimulator data={data} />}

                {activeTab === "audit" && (
                  <FinancialLeakAudit
                    data={data}
                    onOpenBudgetModal={(cat, limit) => {
                      setSelectedBudgetCategory(cat);
                      setSelectedBudgetLimit(limit);
                      setBudgetModalOpen(true);
                    }}
                  />
                )}

                {activeTab === "quarantine" && (
                  <QuarantineVault data={data} onRefresh={refresh} />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Plaid Connect Action */}
            <div className="mt-14 max-w-xl mx-auto text-center">
              <PlaidConnect />
            </div>
          </main>

          {/* Clean Functional Modals */}
          <QuickAddModal
            isOpen={quickAddOpen}
            onClose={() => setQuickAddOpen(false)}
            onSuccess={() => {
              showToast("Transaction Logged", "Entry recorded to your ledger.");
              refresh();
            }}
            quickExamples={data.quickAddExamples}
          />

          <ReceiptScannerModal
            isOpen={receiptScannerOpen}
            onClose={() => setReceiptScannerOpen(false)}
            onSuccess={() => {
              showToast("Receipt Stamped", "Receipt items recorded to ledger.");
              refresh();
            }}
          />

          <BudgetModal
            isOpen={budgetModalOpen}
            onClose={() => setBudgetModalOpen(false)}
            onSuccess={() => {
              showToast("Budget Updated", "Monthly spending limit adjusted.");
              refresh();
            }}
            initialCategory={selectedBudgetCategory}
            initialLimit={selectedBudgetLimit}
          />

          <GoalModal
            isOpen={goalModalOpen}
            onClose={() => {
              setGoalModalOpen(false);
              setContributeGoal(null);
            }}
            onSuccess={() => {
              showToast("Savings Goal Saved", "Target progress updated.");
              refresh();
            }}
            contributeGoal={contributeGoal}
          />

          <StressTestDrawer
            data={data}
            isOpen={stressTestOpen}
            onClose={() => setStressTestOpen(false)}
          />

          <KeyboardShortcutsModal
            isOpen={shortcutsOpen}
            onClose={() => setShortcutsOpen(false)}
          />

          {/* AI Financial Copilot Chat Drawer */}
          <FinanceChatPanel />
        </div>
      </PlaidLinkProvider>
    </MotionConfig>
  );
}
