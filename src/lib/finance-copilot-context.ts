import { getDashboardData } from "@/lib/dashboard";
import type { DashboardData } from "@/lib/finance";
import { isLiveDatabase } from "@/lib/db-availability";
import { prisma } from "@/lib/db";
import { readWorkspaceState } from "@/lib/workspace-store";

function slimDashboard(data: DashboardData) {
  return {
    mode: data.mode,
    updatedAt: data.updatedAt,
    totals: data.totals,
    healthScore: data.healthScore,
    accounts: data.accounts.map((a) => ({
      id: a.id,
      name: a.name,
      subtype: a.subtype,
      balanceCurrent: a.balanceCurrent,
      balanceAvailable: a.balanceAvailable,
    })),
    sixMonthTrend: data.trend,
    categoryBreakdown: data.breakdown,
    topCategory: data.topCategory,
    goals: data.goals.map((g) => ({
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      targetDate: g.targetDate,
      progress: g.progress,
    })),
    budgets: data.budgets.map((b) => ({
      category: b.category,
      monthlyLimit: b.monthlyLimit,
      spent: b.spent,
      remaining: b.remaining,
      utilization: b.utilization,
      status: b.status,
    })),
    recurring: data.recurringItems.map((r) => ({
      name: r.name,
      amount: r.amount,
      cadence: r.cadence,
      nextDate: r.nextDate,
      essential: r.essential,
      monthlyEquivalent: r.monthlyEquivalent,
    })),
    upcomingCharges: data.upcomingCharges,
    alerts: data.alerts,
    insights: data.insights,
    planner: data.planner,
    ledgerHints: data.ledgerHints,
    manualEntryCount: data.manualEntryCount,
    transactionsShownOnDashboard: data.transactions.map((t) => ({
      date: t.date,
      name: t.name,
      amount: t.amount,
      category: t.primaryCategory,
      pending: t.pending,
      source: t.source ?? "unknown",
    })),
  };
}

/**
 * Aggregates live dashboard + workspace file + (optional) MongoDB so the copilot
 * can reason over the same figures the UI uses. Refreshed on every chat request.
 */
export async function getFinanceCopilotContextJson(): Promise<{
  json: string;
  byteLength: number;
}> {
  const [data, workspace] = await Promise.all([getDashboardData(), readWorkspaceState()]);

  const base = {
    generatedAt: new Date().toISOString(),
    convention:
      "Transaction amounts follow this app: amount > 0 = outflow/expense, amount < 0 = inflow/income. Balances on accounts are signed (e.g. credit cards may be negative). Display currency is typically INR (₹).",
    dashboard: slimDashboard(data),
    workspaceFile: {
      cashBalance: workspace.cashBalance,
      storedManualTransactionCount: workspace.manualTransactions.length,
      storedGoals: workspace.goals.length,
      storedBudgets: workspace.budgets.length,
      storedRecurring: workspace.recurringItems.length,
      recentManualFromFile: workspace.manualTransactions.slice(0, 40).map((t) => ({
        date: t.date,
        name: t.name,
        amount: t.amount,
        category: t.primaryCategory,
      })),
    },
  };

  let database: Record<string, unknown> | undefined;

  if (await isLiveDatabase()) {
    try {
      const [txCount, acctCount, manualCount, recentPlaid] = await Promise.all([
        prisma.transaction.count(),
        prisma.account.count(),
        prisma.manualTransaction.count(),
        prisma.transaction.findMany({
          orderBy: { date: "desc" },
          take: 120,
          select: {
            date: true,
            name: true,
            merchantName: true,
            amount: true,
            personalFinancePrimary: true,
            personalFinanceDetailed: true,
            pending: true,
          },
        }),
      ]);

      const recentManualDb = await prisma.manualTransaction.findMany({
        orderBy: { date: "desc" },
        take: 80,
        select: {
          date: true,
          name: true,
          amount: true,
          primaryCategory: true,
        },
      });

      database = {
        plaidTransactionRowCount: txCount,
        accountRowCount: acctCount,
        manualTransactionRowCount: manualCount,
        recentPlaidTransactions: recentPlaid.map((t) => ({
          date: t.date.toISOString().slice(0, 10),
          name: t.name,
          merchantName: t.merchantName,
          amount: t.amount,
          category: t.personalFinancePrimary,
          detailedCategory: t.personalFinanceDetailed,
          pending: t.pending,
        })),
        recentManualDbTransactions: recentManualDb.map((t) => ({
          date: t.date.toISOString().slice(0, 10),
          name: t.name,
          amount: t.amount,
          category: t.primaryCategory,
        })),
      };
    } catch (err) {
      database = {
        readError: true,
        message: err instanceof Error ? err.message : "Unknown database error",
      };
    }
  }

  const payload = database ? { ...base, database } : base;
  let json = JSON.stringify(payload, null, 2);
  const max = 48_000;
  if (json.length > max) {
    json = json.slice(0, max) + "\n…[truncated for size]";
  }

  return { json, byteLength: json.length };
}
