"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Clock,
  ShieldCheck,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Hourglass,
  DollarSign,
  Zap,
} from "lucide-react";
import { currency, compactCurrency, type DashboardData } from "@/lib/finance";
import { useDoodleToast } from "@/components/doodle-toast";

export interface QuarantineItem {
  id: string;
  name: string;
  amount: number;
  category: string;
  trigger: string;
  createdAt: string;
  coolingDays: number;
  hoursRemaining: number;
  status: "quarantined" | "saved" | "approved";
}

const INITIAL_QUARANTINE_ITEMS: QuarantineItem[] = [
  {
    id: "q-1",
    name: "Sony WH-1000XM5 Headphones",
    amount: 29990,
    category: "SHOPPING",
    trigger: "Saw on tech YouTube review, late-night cart temptation",
    createdAt: "2026-10-15T18:00:00Z",
    coolingDays: 7,
    hoursRemaining: 48,
    status: "quarantined",
  },
  {
    id: "q-2",
    name: "Keychron Q1 Mechanical Keyboard",
    amount: 14500,
    category: "SHOPPING",
    trigger: "Desk setup inspiration on Reddit",
    createdAt: "2026-10-16T12:00:00Z",
    coolingDays: 3,
    hoursRemaining: 18,
    status: "quarantined",
  },
  {
    id: "q-3",
    name: "Retro High-Top Sneakers",
    amount: 11999,
    category: "SHOPPING",
    trigger: "Flash sale countdown timer FOMO",
    createdAt: "2026-10-10T09:00:00Z",
    coolingDays: 5,
    hoursRemaining: 0,
    status: "saved",
  },
  {
    id: "q-4",
    name: "Smart Espresso Tamper",
    amount: 6800,
    category: "FOOD_AND_DRINK",
    trigger: "Morning coffee rabbit hole",
    createdAt: "2026-10-08T07:30:00Z",
    coolingDays: 3,
    hoursRemaining: 0,
    status: "saved",
  },
];

interface QuarantineVaultProps {
  data: DashboardData;
  onRefresh?: () => void;
}

export function QuarantineVault({ data, onRefresh }: QuarantineVaultProps) {
  const { showToast } = useDoodleToast();
  const [items, setItems] = useState<QuarantineItem[]>(INITIAL_QUARANTINE_ITEMS);
  const [filter, setFilter] = useState<"all" | "active" | "saved">("all");
  const [showAddForm, setShowAddForm] = useState(false);

  // Hourly wage derivation: Monthly Inflow / 160 hours (standard working month)
  const defaultHourlyRate = Math.max(250, Math.round((data.totals.income || 125000) / 160));
  const [customHourlyWage, setCustomHourlyWage] = useState(defaultHourlyRate);
  const [editWage, setEditWage] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("SHOPPING");
  const [formCoolingDays, setFormCoolingDays] = useState(3);
  const [formTrigger, setFormTrigger] = useState("");

  // Calculations
  const activeQuarantined = useMemo(
    () => items.filter((i) => i.status === "quarantined"),
    [items]
  );
  const savedItems = useMemo(
    () => items.filter((i) => i.status === "saved"),
    [items]
  );

  const totalShieldedAmount = useMemo(
    () => savedItems.reduce((sum, i) => sum + i.amount, 0),
    [savedItems]
  );

  const totalLifeHoursSaved = useMemo(
    () => Math.round((totalShieldedAmount / customHourlyWage) * 10) / 10,
    [totalShieldedAmount, customHourlyWage]
  );

  const filteredItems = useMemo(() => {
    if (filter === "active") return items.filter((i) => i.status === "quarantined");
    if (filter === "saved") return items.filter((i) => i.status === "saved");
    return items;
  }, [items, filter]);

  // Convert amount to Life-Energy string
  const toLifeHours = (amount: number) => {
    const hours = amount / customHourlyWage;
    if (hours < 1) {
      return `${Math.round(hours * 60)} mins of work`;
    }
    const wholeHours = Math.floor(hours);
    const mins = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${mins > 0 ? `${mins}m` : ""} of work`;
  };

  // Stamp: Dodged Bullet (Saved)
  const handleMarkSaved = (id: string) => {
    const target = items.find((i) => i.id === id);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "saved", hoursRemaining: 0 } : i))
    );
    showToast(
      "Bullet Dodged!",
      `Saved ${currency(target?.amount ?? 0)}! Stamped into your impulse trophy vault.`
    );
  };

  // Stamp: Still Need It (Log to Ledger)
  const handleApprovePurchase = async (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;

    try {
      await fetch("/api/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: `${target.name} ${target.amount}`,
        }),
      });

      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "approved", hoursRemaining: 0 } : i))
      );

      showToast(
        "Purchase Approved",
        `Cooling period concluded. Recorded ${currency(target.amount)} to your ledger.`
      );
      if (onRefresh) onRefresh();
    } catch {
      showToast("Notice", "Recorded approval in quarantine vault.", "info");
    }
  };

  // Delete item
  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast("Discarded", "Removed item from quarantine.");
  };

  // Add new quarantine item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(formAmount);
    if (!formName.trim() || !Number.isFinite(amount) || amount <= 0) {
      showToast("Invalid Input", "Please enter a valid item name and price.", "info");
      return;
    }

    const newItem: QuarantineItem = {
      id: `q-${Date.now()}`,
      name: formName.trim(),
      amount,
      category: formCategory,
      trigger: formTrigger.trim() || "Spur-of-the-moment desire",
      createdAt: new Date().toISOString(),
      coolingDays: formCoolingDays,
      hoursRemaining: formCoolingDays * 24,
      status: "quarantined",
    };

    setItems((prev) => [newItem, ...prev]);
    setFormName("");
    setFormAmount("");
    setFormTrigger("");
    setShowAddForm(false);
    showToast(
      "Quarantined for Cooling Off",
      `${newItem.name} locked for ${formCoolingDays} days. Life cost: ${toLifeHours(amount)}.`
    );
  };

  return (
    <div className="space-y-8 font-hand">
      {/* Top Banner: The Impulse Quarantine Philosophy */}
      <div
        className="doodle-card relative overflow-hidden p-6 sm:p-8"
        style={{ borderRadius: "22px 18px 24px 16px / 16px 22px 18px 24px" }}
      >
        <div className="doodle-tape -top-3 left-10 w-24 h-5" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[#F59E0B]/20 text-[#D97706] dark:text-[#FBBF24]">
                <Lock className="h-3.5 w-3.5" />
              </span>
              <span className="font-mono text-xs uppercase font-bold text-[#D97706] dark:text-[#FBBF24] tracking-wider">
                Anti-Impulse Quarantine Locker
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black font-display text-[var(--foreground)] tracking-tight">
              The 72-Hour Cooling-Off Vault
            </h3>

            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Before buying non-essential gadgets, fashion, or spontaneous wants, lock them here first.
              We translate every purchase into the finite hours of your life required to pay for it.
              If you still want it when the timer rings, buy it guilt-free.
            </p>
          </div>

          {/* Life-Hour Wage Rate Dial */}
          <div
            className="doodle-card flex flex-col items-center justify-center p-4 bg-[var(--surface-2)]/60 border-2 border-[var(--border)] min-w-[210px] text-center"
            style={{ borderRadius: "16px 14px 18px 12px / 14px 18px 12px 16px" }}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--muted)]">
              <Hourglass className="h-4 w-4 text-[var(--color-primary)]" />
              <span>Your Life-Energy Rate</span>
            </div>

            <div className="mt-1 text-2xl font-black font-display text-[var(--foreground)]">
              {currency(customHourlyWage)}
              <span className="text-xs font-normal text-[var(--muted)]"> / hr</span>
            </div>

            {editWage ? (
              <div className="mt-2 flex items-center gap-1">
                <input
                  type="number"
                  step="50"
                  defaultValue={customHourlyWage}
                  onBlur={(e) => {
                    const val = Number(e.target.value);
                    if (Number.isFinite(val) && val > 50) setCustomHourlyWage(val);
                    setEditWage(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = Number((e.target as HTMLInputElement).value);
                      if (Number.isFinite(val) && val > 50) setCustomHourlyWage(val);
                      setEditWage(false);
                    }
                  }}
                  autoFocus
                  className="doodle-input w-24 px-2 py-0.5 text-xs text-center"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditWage(true)}
                className="mt-1.5 text-[11px] font-bold text-[var(--color-primary)] hover:underline"
              >
                Adjust Hourly Wage
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3 Metric Cards: Shielded Money, Life Hours Recovered, Active Locks */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Card 1: Shielded from Impulse */}
        <div
          className="doodle-card p-6 flex flex-col justify-between"
          style={{ borderRadius: "18px 22px 16px 20px / 20px 16px 22px 18px" }}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-[var(--muted)] font-mono">
                Impulse Money Shielded
              </span>
              <ShieldCheck className="h-5 w-5 text-[#16A34A]" />
            </div>
            <div className="mt-3 text-3xl sm:text-4xl font-black font-display text-[#16A34A] dark:text-[#4ADE80]">
              {currency(totalShieldedAmount)}
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--muted)] border-t border-dashed border-[var(--border-soft)] pt-2.5">
            Real cash saved by waiting out the dopamine rush.
          </p>
        </div>

        {/* Card 2: Life Hours Reclaimed */}
        <div
          className="doodle-card p-6 flex flex-col justify-between"
          style={{ borderRadius: "20px 16px 22px 18px / 18px 22px 16px 20px" }}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-[var(--muted)] font-mono">
                Life-Hours Reclaimed
              </span>
              <Sparkles className="h-5 w-5 text-[#49B6E5]" />
            </div>
            <div className="mt-3 text-3xl sm:text-4xl font-black font-display text-[var(--foreground)]">
              {totalLifeHoursSaved}
              <span className="text-lg font-bold text-[var(--muted)]"> hrs</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--muted)] border-t border-dashed border-[var(--border-soft)] pt-2.5">
            Hours of finite life you do not have to work to repay.
          </p>
        </div>

        {/* Card 3: Items Currently Quarantined */}
        <div
          className="doodle-card p-6 flex flex-col justify-between"
          style={{ borderRadius: "16px 20px 18px 22px / 22px 18px 20px 16px" }}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-[var(--muted)] font-mono">
                Cooling In Vault
              </span>
              <Clock className="h-5 w-5 text-[#D97706]" />
            </div>
            <div className="mt-3 text-3xl sm:text-4xl font-black font-display text-[var(--foreground)]">
              {activeQuarantined.length}
              <span className="text-lg font-bold text-[var(--muted)]"> items</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--muted)] border-t border-dashed border-[var(--border-soft)] pt-2.5">
            {currency(activeQuarantined.reduce((s, i) => s + i.amount, 0))} currently in holding.
          </p>
        </div>
      </div>

      {/* Control Bar: Filter Tabs & Lock New Item Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {(["all", "active", "saved"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
                filter === f
                  ? "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[2px_2px_0px_var(--border)]"
                  : "border-[var(--border)]/60 bg-[var(--surface-2)]/40 text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {f === "all" ? `All (${items.length})` : f === "active" ? `Cooling Off (${activeQuarantined.length})` : `Saved Trophies (${savedItems.length})`}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((p) => !p)}
          className="doodle-btn doodle-btn-primary flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{showAddForm ? "Close Form" : "Quarantine an Impulse Want"}</span>
        </button>
      </div>

      {/* Add New Item Form Drawer */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddItem}
            className="doodle-card relative overflow-hidden p-6 bg-[var(--surface-2)]/40 border-2 border-[var(--border)] space-y-4"
            style={{ borderRadius: "18px 16px 20px 14px / 14px 20px 16px 18px" }}
          >
            <div className="doodle-tape -top-2.5 left-1/2 -translate-x-1/2 w-20 h-4" />

            <h4 className="text-base font-bold font-display text-[var(--foreground)]">
              Lock an Impulse Buy into Cooling Off
            </h4>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-bold text-[var(--muted)] mb-1">
                  What do you want to buy?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mechanical Keyboard"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="doodle-input w-full px-3 py-2 text-xs text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--muted)] mb-1">
                  Price Tag (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 12000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  required
                  min="1"
                  className="doodle-input w-full px-3 py-2 text-xs text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--muted)] mb-1">
                  Cooling-off Period
                </label>
                <select
                  value={formCoolingDays}
                  onChange={(e) => setFormCoolingDays(Number(e.target.value))}
                  className="doodle-input w-full px-3 py-2 text-xs text-[var(--foreground)]"
                >
                  <option value={1}>24 Hours (Quick pause)</option>
                  <option value={3}>72 Hours (Standard impulse rule)</option>
                  <option value={7}>7 Days (Recommended for items &gt; ₹10k)</option>
                  <option value={14}>14 Days (High-ticket items)</option>
                  <option value={30}>30 Days (Major splurges)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--muted)] mb-1">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="doodle-input w-full px-3 py-2 text-xs text-[var(--foreground)]"
                >
                  <option value="SHOPPING">Shopping / Gear</option>
                  <option value="ENTERTAINMENT">Entertainment</option>
                  <option value="FOOD_AND_DRINK">Food / Dining</option>
                  <option value="TRAVEL">Travel / Experiences</option>
                  <option value="OTHER">Other Discretionary</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--muted)] mb-1">
                Why do you want this right now? (The temptation trigger)
              </label>
              <input
                type="text"
                placeholder="e.g. Saw it on Instagram reels, felt stressed after work"
                value={formTrigger}
                onChange={(e) => setFormTrigger(e.target.value)}
                className="doodle-input w-full px-3 py-2 text-xs text-[var(--foreground)]"
              />
            </div>

            {formAmount && Number(formAmount) > 0 && (
              <div className="p-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] flex items-center gap-3">
                <Hourglass className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
                <p className="text-xs text-[var(--muted)]">
                  Life-Energy Price Tag: This purchase equals{" "}
                  <strong className="text-[var(--foreground)]">
                    {toLifeHours(Number(formAmount))}
                  </strong>{" "}
                  at your hourly wage of {currency(customHourlyWage)}/hr.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="doodle-btn px-4 py-2 text-xs font-bold bg-[var(--surface)] text-[var(--muted)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="doodle-btn doodle-btn-primary px-5 py-2 text-xs font-bold"
              >
                Put in Quarantine
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Grid of Quarantined Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredItems.map((item) => {
          const isQuarantined = item.status === "quarantined";
          const isSaved = item.status === "saved";
          const isApproved = item.status === "approved";

          return (
            <div
              key={item.id}
              className={`doodle-card relative p-6 flex flex-col justify-between transition-all ${
                isSaved
                  ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-[#16A34A]/60"
                  : isApproved
                  ? "bg-slate-50/40 dark:bg-slate-900/40 opacity-80"
                  : "bg-[var(--surface)]"
              }`}
              style={{ borderRadius: "20px 16px 18px 22px / 18px 22px 16px 20px" }}
            >
              {/* Caution Washi Tape for Quarantined Items */}
              {isQuarantined && (
                <div
                  className="doodle-tape -top-2.5 right-6 w-16 h-3.5"
                  style={{ background: "#FDE047" }}
                />
              )}

              {/* Status Stamp Watermark */}
              {isSaved && (
                <div className="absolute top-4 right-4 rotate-[-12deg] pointer-events-none select-none border-2 border-[#16A34A] text-[#16A34A] px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest font-mono shadow-sm">
                  STAMP: SAVED
                </div>
              )}
              {isApproved && (
                <div className="absolute top-4 right-4 rotate-[8deg] pointer-events-none select-none border-2 border-[#49B6E5] text-[#49B6E5] px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest font-mono shadow-sm">
                  STAMP: CLAIMED
                </div>
              )}

              <div>
                <div className="flex items-start justify-between pr-24">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-[var(--muted)]">
                      {item.category}
                    </span>
                    <h4 className="text-xl font-bold font-display text-[var(--foreground)] mt-0.5">
                      {item.name}
                    </h4>
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black font-display text-[var(--foreground)]">
                    {currency(item.amount)}
                  </span>
                  <span className="text-xs font-bold text-[var(--color-primary)] font-mono">
                    ({toLifeHours(item.amount)})
                  </span>
                </div>

                {/* Temptation Context */}
                <p className="mt-2 text-xs text-[var(--muted)] italic">
                  "{item.trigger}"
                </p>

                {/* Progress Timer Bar */}
                {isQuarantined && (
                  <div className="mt-4 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-[#D97706] dark:text-[#FBBF24]">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{item.hoursRemaining} hours left in quarantine</span>
                      </span>
                      <span className="text-[10px] text-[var(--muted)] font-mono">
                        Rule: {item.coolingDays} Days
                      </span>
                    </div>

                    <div className="mt-2 h-2 w-full rounded-full border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                      <div
                        className="h-full bg-[#D97706] transition-all"
                        style={{
                          width: `${Math.max(
                            10,
                            Math.min(100, (1 - item.hoursRemaining / (item.coolingDays * 24)) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t-2 border-dashed border-[var(--border-soft)] flex items-center justify-between gap-2">
                {isQuarantined ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleMarkSaved(item.id)}
                      className="doodle-btn flex-1 bg-[#16A34A]/15 text-[#16A34A] dark:text-[#4ADE80] border-[#16A34A] py-1.5 text-xs font-bold hover:bg-[#16A34A]/25"
                    >
                      Dodged Bullet (Save)
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleApprovePurchase(item.id)}
                      className="doodle-btn flex-1 bg-[var(--surface-2)] text-[var(--foreground)] py-1.5 text-xs font-bold"
                    >
                      Still Want It
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="text-[var(--muted)] hover:text-[var(--foreground)] p-1.5"
                      title="Discard"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-[var(--muted)]">
                      {isSaved ? "Saved into your trophy pool" : "Logged as transaction"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-[var(--muted)] hover:underline"
                    >
                      Remove from archive
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
