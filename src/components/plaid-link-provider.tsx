"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink, type PlaidLinkOnSuccessMetadata } from "react-plaid-link";

type PlaidLinkContextValue = {
  open: () => void;
  ready: boolean;
  isPending: boolean;
  status: string;
  canConnect: boolean;
  mode: "sample" | "live";
};

const PlaidLinkContext = createContext<PlaidLinkContextValue | null>(null);

export function usePlaidLinkContext() {
  const ctx = useContext(PlaidLinkContext);
  if (!ctx) {
    throw new Error("usePlaidLinkContext must be used within PlaidLinkProvider");
  }
  return ctx;
}

/**
 * Single `usePlaidLink` instance for the tree so Plaid's script is not embedded twice
 * (e.g. React Strict Mode remounts or future duplicate panels).
 */
export function PlaidLinkProvider({
  children,
  canConnect,
  mode,
}: {
  children: ReactNode;
  canConnect: boolean;
  mode: "sample" | "live";
}) {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(
    canConnect
      ? "Ready to open Plaid sandbox and sync transactions."
      : "Add Plaid credentials and a MongoDB URL to enable live sync.",
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

  const onSuccess = useCallback((publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
      setStatus("Syncing balances and categorized transactions...");

      startTransition(async () => {
        const response = await fetch("/api/plaid/exchange-public-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            publicToken,
            institutionName: metadata.institution?.name ?? undefined,
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
  }, [router]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  const value = useMemo<PlaidLinkContextValue>(
    () => ({
      open: open as () => void,
      ready,
      isPending,
      status,
      canConnect,
      mode,
    }),
    [open, ready, isPending, status, canConnect, mode],
  );

  return <PlaidLinkContext.Provider value={value}>{children}</PlaidLinkContext.Provider>;
}
