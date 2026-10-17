"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import confetti from "canvas-confetti";
import {
  UploadCloud,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Receipt,
} from "lucide-react";
import {
  currency,
  formatDate,
  startCase,
  type DashboardTransaction,
} from "@/lib/finance";

/* Hand-drawn Doodle SVGs strictly matching Image 2 */

function RocketDoodle({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M18 4 C24 8 28 16 28 24 L20 24 C14 24 10 18 10 14 Z"
        fill="#BEE1E6"
      />
      <circle cx="18" cy="13" r="2.5" fill="var(--surface)" />
      <path d="M10 20 L5 25 L10 25 Z" fill="var(--surface-2)" />
      <path d="M22 22 L27 27 L22 27 Z" fill="var(--surface-2)" />
      <path d="M13 25 L11 29 L14 27 L16 31 L18 25" stroke="#F59E0B" fill="#FDE68A" />
      <circle cx="9" cy="30" r="1.5" stroke="currentColor" fill="none" />
      <circle cx="21" cy="31" r="1.2" stroke="currentColor" fill="none" />
    </svg>
  );
}

function PencilDoodle({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L7.5 19.5 2 21l1.5-5.5L18.5 2.5z"
        fill="#FDE68A"
      />
      <path d="M15 6l3 3" />
      <path d="M4 17l3 3" />
    </svg>
  );
}

function FunnelDoodle({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon
        points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
        fill="var(--surface-2)"
      />
    </svg>
  );
}

function CoffeeCupDoodle({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" fill="#BEE3DB" />
      <line x1="6" y1="2" x2="6" y2="5" />
      <line x1="10" y1="2" x2="10" y2="5" />
      <line x1="14" y1="2" x2="14" y2="5" />
    </svg>
  );
}

function HouseDoodle({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.5L12 3l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9.5z" fill="#FFD6BA" />
      <path d="M9 22V12h6v10" fill="var(--surface)" />
      <path d="M18 6v-1h-2v2.5" />
    </svg>
  );
}

function IncomeRocketDoodle({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2C16 5 19 11 19 16L14 16C10 16 7 12 7 9Z" fill="#BEE1E6" />
      <circle cx="12" cy="8" r="1.5" fill="var(--surface)" />
      <path d="M7 14L4 17L7 17Z" fill="var(--surface-2)" />
      <path d="M15 15L18 18L15 18Z" fill="var(--surface-2)" />
    </svg>
  );
}

function FilmDoodle({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="18" rx="2" fill="#E2D4F0" />
      <line x1="7" y1="3" x2="7" y2="21" />
      <line x1="17" y1="3" x2="17" y2="21" />
      <line x1="2" y1="8" x2="7" y2="8" />
      <line x1="2" y1="13" x2="7" y2="13" />
      <line x1="2" y1="18" x2="7" y2="18" />
      <line x1="17" y1="8" x2="22" y2="8" />
      <line x1="17" y1="13" x2="22" y2="13" />
      <line x1="17" y1="18" x2="22" y2="18" />
    </svg>
  );
}

function BagDoodle({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8h12l-1 12H7L6 8z" fill="#FDE2B8" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function CartDoodle({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M1 2h3l2.6 11.4a1.8 1.8 0 0 0 1.8 1.4h9.8a1.8 1.8 0 0 0 1.8-1.4L22 6H5" fill="#FFCCD5" />
    </svg>
  );
}

function CarDoodle({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M5 11l2-5h10l2 5v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6z"
        fill="#CFE2F3"
      />
      <circle cx="7.5" cy="14.5" r="1.5" fill="var(--foreground)" />
      <circle cx="16.5" cy="14.5" r="1.5" fill="var(--foreground)" />
    </svg>
  );
}

interface CategoryDoodleInfo {
  label: string;
  badgeBg: string;
  badgeText: string;
  icon: (className?: string) => React.ReactNode;
}

function getCategoryDoodle(cat: string): CategoryDoodleInfo {
  const c = cat.toUpperCase();
  if (c.includes("FOOD") || c.includes("DRINK")) {
    return {
      label: "Food & Drink",
      badgeBg: "bg-[#BEE3DB]/80 dark:bg-[#22574A]/40",
      badgeText: "text-[#1C4D41] dark:text-[#A8E6CF]",
      icon: (cls) => <CoffeeCupDoodle className={cls} />,
    };
  }
  if (c.includes("RENT") || c.includes("UTIL") || c.includes("HOUSING")) {
    return {
      label: "Housing",
      badgeBg: "bg-[#FFD6BA]/80 dark:bg-[#7A3E1B]/40",
      badgeText: "text-[#7A3E1B] dark:text-[#FFD6BA]",
      icon: (cls) => <HouseDoodle className={cls} />,
    };
  }
  if (c.includes("INCOME")) {
    return {
      label: "Income",
      badgeBg: "bg-[#BEE1E6]/80 dark:bg-[#1E4E5F]/40",
      badgeText: "text-[#1E4E5F] dark:text-[#BEE1E6]",
      icon: (cls) => <IncomeRocketDoodle className={cls} />,
    };
  }
  if (c.includes("ENTERTAIN")) {
    return {
      label: "Entertainment",
      badgeBg: "bg-[#E2D4F0]/80 dark:bg-[#4A2B68]/40",
      badgeText: "text-[#4A2B68] dark:text-[#E2D4F0]",
      icon: (cls) => <FilmDoodle className={cls} />,
    };
  }
  if (c.includes("SHOP")) {
    return {
      label: "Shopping",
      badgeBg: "bg-[#FDE2B8]/80 dark:bg-[#6D4C13]/40",
      badgeText: "text-[#6D4C13] dark:text-[#FDE2B8]",
      icon: (cls) => <BagDoodle className={cls} />,
    };
  }
  if (c.includes("TRANS")) {
    return {
      label: "Transportation",
      badgeBg: "bg-[#CFE2F3]/80 dark:bg-[#204060]/40",
      badgeText: "text-[#204060] dark:text-[#CFE2F3]",
      icon: (cls) => <CarDoodle className={cls} />,
    };
  }
  return {
    label: startCase(cat),
    badgeBg: "bg-[var(--surface-2)]",
    badgeText: "text-[var(--foreground)]",
    icon: (cls) => <CartDoodle className={cls} />,
  };
}

const FILTER_PILLS = [
  { id: "ALL", label: "All", icon: null },
  { id: "FOOD_AND_DRINK", label: "Food & Drink", emoji: "☕🍎", icon: <CoffeeCupDoodle className="h-4 w-4" /> },
  { id: "RENT_AND_UTILITIES", label: "Housing", emoji: "🏠", icon: <HouseDoodle className="h-4 w-4" /> },
  { id: "ENTERTAINMENT", label: "Entertainment", emoji: "🎬", icon: <FilmDoodle className="h-4 w-4" /> },
  { id: "SHOPPING", label: "Shopping", emoji: "🛍", icon: <BagDoodle className="h-4 w-4" /> },
  { id: "TRANSPORTATION", label: "Transportation", emoji: "🚗", icon: <CarDoodle className="h-4 w-4" /> },
  { id: "INCOME", label: "Income", emoji: "🚀", icon: <IncomeRocketDoodle className="h-4 w-4" /> },
] as const;

interface LedgerTabProps {
  transactions: DashboardTransaction[];
  onOpenQuickAdd: () => void;
  onRefresh: () => void;
  onExcelImport: (file: File) => Promise<void>;
  onOpenReceiptScanner?: () => void;
}

export function LedgerTab({
  transactions,
  onOpenQuickAdd,
  onRefresh,
  onExcelImport,
  onOpenReceiptScanner,
}: LedgerTabProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">(
    "date-desc"
  );
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8; // Fits neatly on screen like Image 2

  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  // Filter & Sort
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesMerchant = t.merchantName?.toLowerCase().includes(q);
        const matchesCategory = t.primaryCategory.toLowerCase().includes(q);
        if (!matchesName && !matchesMerchant && !matchesCategory) return false;
      }

      // Category
      if (selectedCategory !== "ALL") {
        if (selectedCategory === "RENT_AND_UTILITIES") {
          if (!t.primaryCategory.includes("RENT") && !t.primaryCategory.includes("UTIL") && !t.primaryCategory.includes("HOUS")) {
            return false;
          }
        } else if (t.primaryCategory !== selectedCategory) {
          return false;
        }
      }

      // Type
      if (typeFilter === "expense" && t.amount <= 0) return false;
      if (typeFilter === "income" && t.amount > 0) return false;

      return true;
    });
  }, [transactions, search, selectedCategory, typeFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === "date-asc") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === "amount-desc") {
        return Math.abs(b.amount) - Math.abs(a.amount);
      }
      if (sortBy === "amount-asc") {
        return Math.abs(a.amount) - Math.abs(b.amount);
      }
      return 0;
    });
  }, [filtered, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentItems = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    try {
      await onExcelImport(file);
      setImportMsg("Excel batch processed successfully!");
      confetti({ particleCount: 50, spread: 60 });
    } catch {
      setImportMsg("Import failed. Check file columns.");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar strictly matching Image 2 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Title: Astra Ledger with Rocket Doodle */}
        <div className="flex items-center gap-2">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--foreground)] font-display">
            Astra Ledger
          </h2>
          <RocketDoodle className="h-8 w-8 text-[var(--color-primary)] inline-block transform -rotate-12 transition hover:rotate-6" />
        </div>

        {/* Right Search Input and Filter Funnel Button */}
        <div className="flex items-center gap-3">
          {/* Hand-drawn Search Box */}
          <div className="relative flex-1 sm:w-72 lg:w-80">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
              <PencilDoodle className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="doodle-input w-full py-2 pl-9 pr-4 text-sm font-hand text-[var(--foreground)] placeholder:text-[var(--muted)]"
            />
          </div>

          {/* Hand-drawn Funnel Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`doodle-btn flex h-10 w-10 items-center justify-center p-0 transition ${
              showFilters ? "bg-[var(--surface-2)] shadow-[1px_1px_0px_var(--border)]" : ""
            }`}
            title="Filter options"
            aria-label="Filter options"
          >
            <FunnelDoodle className="h-4 w-4 text-[var(--foreground)]" />
          </button>

          {/* Scan Bill Button */}
          {onOpenReceiptScanner && (
            <button
              type="button"
              onClick={onOpenReceiptScanner}
              className="doodle-btn hidden sm:inline-flex items-center gap-1.5 bg-[var(--surface-2)] px-3 py-2 text-xs font-bold text-[var(--foreground)]"
            >
              <Receipt className="h-4 w-4 text-[#49B6E5]" />
              <span>Scan Bill</span>
            </button>
          )}

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="doodle-btn doodle-btn-primary hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New</span>
          </button>

          {/* Import Excel */}
          <label className="doodle-btn hidden sm:inline-flex cursor-pointer items-center gap-1.5 bg-[var(--surface-2)] px-3 py-2 text-xs font-bold text-[var(--foreground)]">
            <UploadCloud className="h-4 w-4" />
            <span>{importing ? "..." : "Import"}</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={(e) => void handleFileChange(e)}
              disabled={importing}
            />
          </label>
        </div>
      </div>

      {/* Expanded Filter Panel when Funnel is toggled */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="doodle-card overflow-hidden p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Type Filter Buttons */}
              <div className="flex gap-2 items-center">
                <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider font-hand">
                  Type:
                </span>
                <div className="flex gap-1.5">
                  {(["all", "expense", "income"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTypeFilter(t);
                        setPage(1);
                      }}
                      className={`doodle-btn px-3 py-1 text-xs font-bold capitalize ${
                        typeFilter === t
                          ? "bg-[var(--color-primary)] text-[var(--color-primary-ink)]"
                          : "bg-[var(--surface)] text-[var(--muted)]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider font-hand">
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="doodle-input py-1 px-3 text-xs font-bold text-[var(--foreground)]"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-desc">Highest Value</option>
                  <option value="amount-asc">Lowest Value</option>
                </select>
              </div>

              {/* Mobile Actions */}
              <div className="flex sm:hidden gap-2 w-full pt-2 border-t border-dashed border-[var(--border)]">
                <button
                  type="button"
                  onClick={onOpenQuickAdd}
                  className="doodle-btn doodle-btn-primary flex-1 py-1.5 text-xs font-bold"
                >
                  <Plus className="h-3.5 w-3.5 inline mr-1" /> New Entry
                </button>
                <label className="doodle-btn flex-1 py-1.5 text-xs font-bold cursor-pointer text-center">
                  <UploadCloud className="h-3.5 w-3.5 inline mr-1" /> Import .xlsx
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="sr-only"
                    onChange={(e) => void handleFileChange(e)}
                    disabled={importing}
                  />
                </label>
              </div>
            </div>
            {importMsg && (
              <p className="mt-2 text-xs font-bold text-[var(--color-primary)] font-hand">{importMsg}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Filter Pills strictly matching Image 2 */}
      <div className="flex flex-wrap items-center gap-2.5">
        {FILTER_PILLS.map((pill) => {
          const isActive = selectedCategory === pill.id;

          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => {
                setSelectedCategory(pill.id);
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 rounded-2xl border-2 px-4 py-1.5 text-sm font-bold transition ${
                isActive
                  ? "border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] shadow-[2px_2px_0px_var(--border)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] shadow-[1px_1px_0px_var(--border)]"
              }`}
            >
              {pill.icon ? (
                <span className="shrink-0">{pill.icon}</span>
              ) : null}
              <span className="font-hand">{pill.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Transactions Table strictly matching Image 2 */}
      <div
        className="doodle-card overflow-hidden bg-[var(--surface)]"
        style={{ borderRadius: "20px 16px 22px 18px / 18px 22px 16px 20px" }}
      >
        {/* Table Header Row */}
        <div className="grid grid-cols-12 items-center border-b-2 border-[var(--border)] px-6 py-3.5 font-display text-base font-black text-[var(--foreground)]">
          <div className="col-span-3 sm:col-span-2">Date</div>
          <div className="col-span-5 sm:col-span-5">Description</div>
          <div className="col-span-4 sm:col-span-3">Category</div>
          <div className="hidden sm:block sm:col-span-2 text-right">Amount</div>
        </div>

        {/* Rows with Dashed Dividers */}
        <div className="divide-y-2 divide-dashed divide-[var(--border-soft)]">
          {currentItems.length > 0 ? (
            currentItems.map((t) => {
              const isIncome = t.amount < 0;
              const catInfo = getCategoryDoodle(t.primaryCategory);

              return (
                <div
                  key={t.id}
                  className="grid grid-cols-12 items-center px-6 py-3.5 transition hover:bg-[var(--surface-2)]/40 font-hand text-base"
                >
                  {/* Date Column (e.g. Oct 14) */}
                  <div className="col-span-3 sm:col-span-2 font-hand text-sm sm:text-base font-semibold text-[var(--foreground)]">
                    {formatDate(t.date)}
                  </div>

                  {/* Description Column */}
                  <div className="col-span-5 sm:col-span-5 min-w-0 pr-2">
                    <p className="truncate font-hand text-base font-bold text-[var(--foreground)]">
                      {t.name}
                    </p>
                    {t.merchantName && t.merchantName !== t.name && (
                      <p className="truncate text-xs text-[var(--muted)]">
                        {t.merchantName}
                      </p>
                    )}
                  </div>

                  {/* Category Column: Rounded Square Badge + Label */}
                  <div className="col-span-4 sm:col-span-3 flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--border)] shadow-[1.5px_1.5px_0px_var(--border)] ${catInfo.badgeBg} ${catInfo.badgeText}`}
                    >
                      {catInfo.icon("h-4 w-4")}
                    </div>
                    <span className="truncate font-hand text-sm sm:text-base font-bold text-[var(--foreground)]">
                      {catInfo.label}
                    </span>
                  </div>

                  {/* Amount Column: Green (+) for Income, Red (-) for Expense */}
                  <div className="col-span-12 sm:col-span-2 mt-2 sm:mt-0 text-right">
                    <span
                      className={`font-mono text-base font-black tabular-nums ${
                        isIncome
                          ? "text-[#16A34A] dark:text-[#4ADE80]"
                          : "text-[#DC2626] dark:text-[#F87171]"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {currency(Math.abs(t.amount))}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-sm font-hand text-[var(--muted)]">
              No transactions match your search criteria.
            </div>
          )}
        </div>
      </div>

      {/* Centered Boxed Pagination matching Image 2 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="doodle-btn flex h-9 w-9 items-center justify-center p-0 rounded-xl disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Numbered Page Buttons */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<Array<number | string>>((acc, p, idx, arr) => {
              if (idx > 0 && typeof arr[idx - 1] === "number" && p - (arr[idx - 1] as number) > 1) {
                acc.push("...");
              }
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) => {
              if (item === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex h-9 w-6 items-center justify-center text-sm font-bold text-[var(--muted)] select-none"
                  >
                    ...
                  </span>
                );
              }

              const pNum = item as number;
              const isActive = pNum === page;

              return (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => setPage(pNum)}
                  className={`doodle-btn flex h-9 w-9 items-center justify-center p-0 rounded-xl font-hand text-sm font-bold ${
                    isActive
                      ? "bg-[var(--surface-2)] text-[var(--foreground)] shadow-[2px_2px_0px_var(--border)] border-2 border-[var(--border)]"
                      : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] border-2 border-[var(--border)]"
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

          {/* Next Button */}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="doodle-btn flex h-9 w-9 items-center justify-center p-0 rounded-xl disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
