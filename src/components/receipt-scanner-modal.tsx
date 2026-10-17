"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt,
  X,
  UploadCloud,
  Check,
  Copy,
  Plus,
  Sparkles,
  FileText,
} from "lucide-react";
import confetti from "canvas-confetti";
import { currency } from "@/lib/finance";

interface ReceiptItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  scratchedOut: boolean; // if true, scratched out by user (not paying for it)
}

const SAMPLE_RECEIPTS = [
  {
    merchant: "The Daily Grind & Bakery",
    date: "2026-10-16",
    category: "FOOD_AND_DRINK",
    taxRate: 0.05,
    items: [
      { id: "i1", name: "Artisan Cappuccino x2", qty: 2, price: 380, scratchedOut: false },
      { id: "i2", name: "Avocado Sourdough Toast", qty: 1, price: 420, scratchedOut: false },
      { id: "i3", name: "Truffle Fries (Shared with Friends)", qty: 1, price: 350, scratchedOut: true },
      { id: "i4", name: "Blueberry Cheesecake Slice", qty: 1, price: 290, scratchedOut: false },
    ],
  },
  {
    merchant: "CloudTech Coworking & Travel",
    date: "2026-10-15",
    category: "OTHER",
    taxRate: 0.18,
    items: [
      { id: "i5", name: "Day Pass Desk Pass", qty: 1, price: 800, scratchedOut: false },
      { id: "i6", name: "High-Speed Conference Room 2hr", qty: 1, price: 1500, scratchedOut: true }, // company reimbursable
      { id: "i7", name: "Espresso Shots x3", qty: 3, price: 300, scratchedOut: false },
    ],
  },
  {
    merchant: "Metro Supermarket & Organics",
    date: "2026-10-14",
    category: "SHOPPING",
    taxRate: 0.05,
    items: [
      { id: "i8", name: "Organic Rolled Oats 1kg", qty: 1, price: 280, scratchedOut: false },
      { id: "i9", name: "Almond Butter 500g", qty: 1, price: 650, scratchedOut: false },
      { id: "i10", name: "Roommate Laundry Pods", qty: 1, price: 540, scratchedOut: true }, // roommate will pay
      { id: "i11", name: "Greek Yogurt Tub x2", qty: 2, price: 320, scratchedOut: false },
    ],
  },
];

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReceiptScannerModal({
  isOpen,
  onClose,
  onSuccess,
}: ReceiptScannerModalProps) {
  const [selectedReceiptIndex, setSelectedReceiptIndex] = useState(0);
  const currentSample = SAMPLE_RECEIPTS[selectedReceiptIndex];

  const [merchant, setMerchant] = useState(currentSample.merchant);
  const [items, setItems] = useState<ReceiptItem[]>(currentSample.items);
  const [taxRate, setTaxRate] = useState(currentSample.taxRate);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Switch sample receipt
  const loadReceipt = (idx: number) => {
    setSelectedReceiptIndex(idx);
    const rec = SAMPLE_RECEIPTS[idx];
    setMerchant(rec.merchant);
    setItems(rec.items.map((it) => ({ ...it })));
    setTaxRate(rec.taxRate);
  };

  // Toggle scratch-out on an item
  const toggleScratch = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, scratchedOut: !it.scratchedOut } : it))
    );
  };

  // Calculate totals
  const totalBillSubtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.price, 0),
    [items]
  );

  const totalBillTax = Math.round(totalBillSubtotal * taxRate);
  const grandTotal = totalBillSubtotal + totalBillTax;

  // Active user's personal share (items that are NOT scratched out)
  const mySubtotal = useMemo(
    () => items.filter((it) => !it.scratchedOut).reduce((sum, it) => sum + it.price, 0),
    [items]
  );
  const myTax = Math.round(mySubtotal * taxRate);
  const myFinalShare = mySubtotal + myTax;

  // Amount excluded / to collect from others
  const othersShare = grandTotal - myFinalShare;

  // Copy split breakdown text
  const copyBreakdown = () => {
    const text = [
      `Astra Bill Split: ${merchant}`,
      `Total Bill: ${currency(grandTotal)}`,
      `---------------------------------`,
      ...items.map(
        (it) =>
          `${it.scratchedOut ? "[Excluded/Other]" : "[My Share]"} ${it.name}: ${currency(it.price)}`
      ),
      `---------------------------------`,
      `My Outflow: ${currency(myFinalShare)}`,
      `Others / Split Collect: ${currency(othersShare)}`,
    ].join("\n");

    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Log my share to ledger
  const logToLedger = async () => {
    if (myFinalShare <= 0 || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: `${merchant} ${myFinalShare} ${currentSample.category.toLowerCase().replace(/_/g, " ")}`,
        }),
      });

      if (res.ok) {
        confetti({ particleCount: 50, spread: 60 });
        onSuccess();
        onClose();
      }
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="doodle-card relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-[var(--surface)] shadow-2xl"
          style={{ borderRadius: "20px 16px 22px 18px / 18px 22px 16px 20px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-dashed border-[var(--border-soft)]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[var(--border)] bg-[#49B6E5]/20 text-[#49B6E5] shadow-[2px_2px_0px_var(--border)]">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-[var(--foreground)]">
                  Receipt Scratchpad & Splitter
                </h3>
                <p className="text-xs text-[var(--muted)] font-hand">
                  Scratch out items you are splitting or reimbursing with a doodle strike-through.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="doodle-btn h-8 w-8 p-0 flex items-center justify-center rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Preset Receipt Picker */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[var(--muted)] font-mono">Sample Receipts:</span>
            {SAMPLE_RECEIPTS.map((r, idx) => (
              <button
                key={r.merchant}
                type="button"
                onClick={() => loadReceipt(idx)}
                className={`doodle-btn px-2.5 py-1 text-xs font-hand font-bold ${
                  selectedReceiptIndex === idx
                    ? "bg-[#49B6E5] text-slate-900 shadow-[2px_2px_0px_var(--border)]"
                    : "bg-[var(--surface-2)] text-[var(--foreground)]"
                }`}
              >
                {r.merchant.split("&")[0]}
              </button>
            ))}
          </div>

          {/* The Physical Receipt Sheet Representation */}
          <div className="mt-5 relative border-2 border-[var(--border)] bg-amber-50/90 dark:bg-slate-900/90 p-5 rounded-lg shadow-inner font-mono text-xs">
            {/* Washi tape at top */}
            <div className="doodle-tape doodle-tape-green -top-3 left-1/2 -translate-x-1/2" />

            <div className="text-center pb-3 border-b border-dashed border-slate-400/50 dark:border-slate-600/50">
              <h4 className="font-bold text-sm tracking-widest uppercase text-slate-900 dark:text-slate-100 font-display">
                {merchant}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Date: {currentSample.date} · Click items to scratch out
              </p>
            </div>

            {/* Itemized Line Items */}
            <div className="py-3 space-y-2.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleScratch(item.id)}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition select-none ${
                    item.scratchedOut
                      ? "bg-rose-500/10 opacity-60 text-slate-500 line-through decoration-rose-500 decoration-2"
                      : "hover:bg-black/5 dark:hover:bg-white/5 text-slate-900 dark:text-slate-100 font-bold"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-4 w-4 rounded border flex items-center justify-center text-[10px] ${
                        !item.scratchedOut
                          ? "bg-[#16A34A] text-white border-transparent"
                          : "border-slate-400 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span>{item.name}</span>
                  </div>

                  <span className="font-mono tabular-nums">{currency(item.price)}</span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-3 border-t border-dashed border-slate-400/50 dark:border-slate-600/50 space-y-1.5 text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal (Full Bill):</span>
                <span>{currency(totalBillSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax ({Math.round(taxRate * 100)}%):</span>
                <span>{currency(totalBillTax)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                <span>Grand Total:</span>
                <span>{currency(grandTotal)}</span>
              </div>

              {/* User Personal Share Callout */}
              <div className="mt-3 p-2.5 rounded bg-[#49B6E5]/15 border border-[#49B6E5]/40 text-slate-900 dark:text-slate-100">
                <div className="flex justify-between font-black text-sm">
                  <span>My Active Share to Pay:</span>
                  <span className="text-[#16A34A] dark:text-[#4ADE80] font-mono">{currency(myFinalShare)}</span>
                </div>
                {othersShare > 0 && (
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    <span>Amount Scratched Out / Collect from Others:</span>
                    <span className="font-mono">{currency(othersShare)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={copyBreakdown}
              className="doodle-btn px-3 py-2 text-xs font-bold font-hand flex items-center gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copied ? "Copied Breakdown!" : "Copy Split Summary"}</span>
            </button>

            <button
              type="button"
              onClick={() => void logToLedger()}
              disabled={submitting || myFinalShare <= 0}
              className="doodle-btn doodle-btn-primary px-5 py-2 text-sm font-bold font-hand flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              <span>{submitting ? "Logging..." : `Log ${currency(myFinalShare)} to Ledger`}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
