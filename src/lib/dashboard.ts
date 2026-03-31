import { cookies } from "next/headers";

import { listBudgets } from "@/lib/budgets";
import { prisma } from "@/lib/db";
import { buildDashboardData, startCase, type DashboardData } from "@/lib/finance";
import { isLiveDatabase } from "@/lib/db-availability";
import { env } from "@/lib/env";
import { listGoals } from "@/lib/goals";
import { listManualTransactions } from "@/lib/manual-transactions";
import { listRecurringItems } from "@/lib/recurring-items";
import { sampleAccounts, sampleTransactions } from "@/lib/sample-data";
import { readWorkspaceState } from "@/lib/workspace-store";

type StoredAccount = {
  id: string;
  name: string;
  subtype: string | null;
  type: string;
  mask: string | null;
  balanceCurrent: number;
  balanceAvailable: number | null;
};

type StoredTransaction = {
  id: string;
  name: string;
  merchantName: string | null;
  amount: number;
  date: Date;
  personalFinancePrimary: string | null;
  personalFinanceDetailed: string | null;
  categoryConfidence: string | null;
  pending: boolean;
};

function manualCashAccount(balance: number) {
  return {
    id: "manual-cash",
    name: "Cash",
    subtype: "Cash",
    mask: "0000",
    balanceCurrent: balance,
    balanceAvailable: balance,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const workspaceSnapshot = await readWorkspaceState();
  const cashBalance = workspaceSnapshot.cashBalance ?? 0;

  const cookieStore = await cookies();
  const cookieDemo = cookieStore.get("astra-demo")?.value === "1";
  const showDemoStories = env.useSampleData ? true : cookieDemo;

  const dbLive = await isLiveDatabase();

  const [manualTransactions, goals, recurringItems, budgets] = await Promise.all([
    listManualTransactions(),
    listGoals(),
    listRecurringItems(),
    listBudgets(),
  ]);

  const ledgerHints = {
    demoMode: showDemoStories,
    openingBalance: cashBalance,
  };

  const useFileLikeDashboard = env.useSampleData || !dbLive;

  if (useFileLikeDashboard) {
    const accounts = showDemoStories ? sampleAccounts : [manualCashAccount(cashBalance)];

    const sampleMapped = sampleTransactions.map((transaction) => ({
      ...transaction,
      source: "sample" as const,
    }));

    const transactions = showDemoStories
      ? [...manualTransactions, ...sampleMapped]
      : manualTransactions;

    return buildDashboardData({
      mode: "sample",
      accounts,
      transactions,
      budgets,
      goals,
      recurringItems,
      manualEntryCount: manualTransactions.length,
      ledgerHints,
    });
  }

  const [accounts, transactions] = await Promise.all([
    prisma.account.findMany({
      orderBy: {
        balanceCurrent: "desc",
      },
    }),
    prisma.transaction.findMany({
      orderBy: {
        date: "desc",
      },
      take: 100,
    }),
  ]);

  let dashboardAccounts = (accounts as StoredAccount[]).map((account) => ({
    id: account.id,
    name: account.name,
    subtype: startCase(account.subtype ?? account.type),
    mask: account.mask ?? "0000",
    balanceCurrent: account.balanceCurrent,
    balanceAvailable: account.balanceAvailable ?? undefined,
  }));

  if (dashboardAccounts.length === 0) {
    dashboardAccounts = [manualCashAccount(cashBalance)];
  }

  return buildDashboardData({
    mode: "live",
    accounts: dashboardAccounts,
    transactions: [
      ...manualTransactions,
      ...(transactions as StoredTransaction[]).map((transaction) => ({
        id: transaction.id,
        name: transaction.name,
        merchantName: transaction.merchantName ?? undefined,
        amount: transaction.amount,
        date: transaction.date.toISOString(),
        primaryCategory: transaction.personalFinancePrimary ?? "OTHER",
        detailedCategory: transaction.personalFinanceDetailed ?? undefined,
        confidence: transaction.categoryConfidence ?? undefined,
        pending: transaction.pending,
        source: "plaid" as const,
      })),
    ],
    budgets,
    goals,
    recurringItems,
    manualEntryCount: manualTransactions.length,
    ledgerHints,
  });
}
