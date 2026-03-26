import { listBudgets } from "@/lib/budgets";
import { prisma } from "@/lib/db";
import { buildDashboardData, startCase, type DashboardData } from "@/lib/finance";
import { env, isDatabaseConfigured } from "@/lib/env";
import { listGoals } from "@/lib/goals";
import { listManualTransactions } from "@/lib/manual-transactions";
import { listRecurringItems } from "@/lib/recurring-items";
import { sampleAccounts, sampleTransactions } from "@/lib/sample-data";

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

export async function getDashboardData(): Promise<DashboardData> {
  const [manualTransactions, goals, recurringItems, budgets] = await Promise.all([
    listManualTransactions(),
    listGoals(),
    listRecurringItems(),
    listBudgets(),
  ]);

  if (env.useSampleData || !isDatabaseConfigured) {
    return buildDashboardData({
      mode: "sample",
      accounts: sampleAccounts,
      transactions: [
        ...manualTransactions,
        ...sampleTransactions.map((transaction) => ({
          ...transaction,
          source: "sample" as const,
        })),
      ],
      budgets,
      goals,
      recurringItems,
      manualEntryCount: manualTransactions.length,
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

  return buildDashboardData({
    mode: "live",
    accounts: (accounts as StoredAccount[]).map((account) => ({
      id: account.id,
      name: account.name,
      subtype: startCase(account.subtype ?? account.type),
      mask: account.mask ?? "0000",
      balanceCurrent: account.balanceCurrent,
      balanceAvailable: account.balanceAvailable ?? undefined,
    })),
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
  });
}
