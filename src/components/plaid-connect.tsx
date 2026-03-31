"use client";

import { motion } from "framer-motion";

import { usePlaidLinkContext } from "@/components/plaid-link-provider";

export function PlaidConnect() {
  const { open, ready, isPending, status, canConnect, mode } = usePlaidLinkContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="astra-glass rounded-[30px] p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Plaid</p>
          <h3 className="mt-2 text-lg font-medium tracking-tight text-[var(--foreground)]">
            {mode === "live" ? "Live sync" : "Sandbox institution"}
          </h3>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
          {mode === "live" ? "Live" : "Demo"}
        </span>
      </div>

      <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">{status}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <motion.button
          type="button"
          onClick={() => open()}
          disabled={!canConnect || !ready || isPending}
          className="primary-button disabled:cursor-not-allowed disabled:opacity-40"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          {isPending ? "Syncing…" : ready ? "Open Link" : "Preparing…"}
        </motion.button>
      </div>
    </motion.div>
  );
}
