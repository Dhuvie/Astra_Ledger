"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";

type PlaidConnectProps = {
  canConnect: boolean;
  mode: "sample" | "live";
};

export function PlaidConnect({ canConnect, mode }: PlaidConnectProps) {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(
    canConnect
      ? "Ready to open Plaid sandbox and sync transactions."
      : "Add Plaid credentials and a PostgreSQL URL to enable live sync.",
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!canConnect) {
      return;
    }

    let cancelled = false;

    fetch("/api/plaid/create-link-token", { method: "POST" })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to create Plaid link token.");
        }

        if (!cancelled) {
          setLinkToken(data.linkToken);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setStatus(error.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canConnect]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken, metadata) => {
      setStatus("Syncing balances and categorized transactions...");

      startTransition(async () => {
        const response = await fetch("/api/plaid/exchange-public-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            publicToken,
            institutionName: metadata.institution?.name,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus(data.error ?? "Plaid sync failed.");
          return;
        }

        setStatus(
          `Synced ${data.accountsSynced} accounts and ${data.transactionsSynced} transactions.`,
        );
        router.refresh();
      });
    },
  });

  return (
    <div data-reveal className="rounded-[30px] border border-white/8 bg-black/20 p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-100/60">Plaid Sandbox</p>
          <h3 className="mt-2 text-xl font-semibold text-white">
            {mode === "live" ? "Live sync connected" : "Connect a sandbox institution"}
          </h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-cyan-50/80">
          {mode === "live" ? "Database-backed" : "Demo fallback active"}
        </span>
      </div>

      <p className="max-w-xl text-sm leading-7 text-slate-200/70">{status}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => open()}
          disabled={!canConnect || !ready || isPending}
          className="primary-button disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isPending ? "Syncing..." : ready ? "Launch Plaid Link" : "Preparing Link"}
        </button>
        <div className="rounded-full border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-200/70">
          Uses `/api/plaid/create-link-token` and `/api/plaid/exchange-public-token`
        </div>
      </div>
    </div>
  );
}

