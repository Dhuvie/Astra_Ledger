import { getDashboardData } from "@/lib/dashboard";
import { isLiveDatabase } from "@/lib/db-availability";
import { prisma } from "@/lib/db";
import { readWorkspaceState } from "@/lib/workspace-store";

export type NormalizedTxn = {
  date: string;
  name: string;
  amount: number;
  category: string;
  source: "manual_db" | "plaid" | "file";
};

function inDateRange(isoDate: string, from: string, to: string): boolean {
  return isoDate >= from && isoDate <= to;
}

/** Collect manual + Plaid rows in [from, to] (YYYY-MM-DD). No double-count: DB mode uses Prisma only; file mode uses workspace file only. */
export async function collectTransactionsInRange(from: string, to: string): Promise<NormalizedTxn[]> {
  const out: NormalizedTxn[] = [];

  if (await isLiveDatabase()) {
    const fromD = new Date(`${from}T00:00:00.000Z`);
    const toD = new Date(`${to}T23:59:59.999Z`);

    const [manualRows, plaidRows] = await Promise.all([
      prisma.manualTransaction.findMany({
        where: { date: { gte: fromD, lte: toD } },
        select: {
          date: true,
          name: true,
          amount: true,
          primaryCategory: true,
        },
      }),
      prisma.transaction.findMany({
        where: { date: { gte: fromD, lte: toD } },
        select: {
          date: true,
          name: true,
          amount: true,
          personalFinancePrimary: true,
        },
      }),
    ]);

    for (const t of manualRows) {
      out.push({
        date: t.date.toISOString().slice(0, 10),
        name: t.name,
        amount: t.amount,
        category: t.primaryCategory,
        source: "manual_db",
      });
    }
    for (const t of plaidRows) {
      out.push({
        date: t.date.toISOString().slice(0, 10),
        name: t.name,
        amount: t.amount,
        category: t.personalFinancePrimary ?? "OTHER",
        source: "plaid",
      });
    }
  } else {
    const ws = await readWorkspaceState();
    for (const t of ws.manualTransactions) {
      if (inDateRange(t.date, from, to)) {
        out.push({
          date: t.date,
          name: t.name,
          amount: t.amount,
          category: t.primaryCategory,
          source: "file",
        });
      }
    }
  }

  return out.sort((a, b) => b.date.localeCompare(a.date) || b.name.localeCompare(a.name));
}

function sumByCategory(rows: NormalizedTxn[], expenseOnly: boolean): Record<string, number> {
  const map: Record<string, number> = {};
  for (const t of rows) {
    if (expenseOnly && t.amount <= 0) {
      continue;
    }
    if (!expenseOnly && t.amount >= 0) {
      continue;
    }
    const key = t.category || "OTHER";
    const add = expenseOnly ? t.amount : Math.abs(t.amount);
    map[key] = (map[key] ?? 0) + add;
  }
  return map;
}

export const FINANCE_TOOLS: unknown[] = [
  {
    type: "function",
    function: {
      name: "spending_by_category",
      description:
        "Sum expenses (money out) by category between two dates. Uses positive amounts as outflows per app convention.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "Start date YYYY-MM-DD (inclusive)" },
          to: { type: "string", description: "End date YYYY-MM-DD (inclusive)" },
        },
        required: ["from", "to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "income_by_category",
      description: "Sum income (money in) by category between two dates. Uses negative amounts as inflows; returns positive totals per category.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string" },
          to: { type: "string" },
        },
        required: ["from", "to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "period_totals",
      description: "Total outflows, total inflows, and net for a date range.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string" },
          to: { type: "string" },
        },
        required: ["from", "to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_transactions",
      description:
        "List transactions with optional filters. direction=expense means amount>0 (outflow); income means amount<0 (inflow). Without dates, uses last 90 days.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "Optional YYYY-MM-DD" },
          to: { type: "string" },
          category: { type: "string", description: "Primary category key e.g. FOOD_AND_DRINK" },
          direction: {
            type: "string",
            enum: ["expense", "income", "all"],
            description: "expense => amount>0, income => amount<0",
          },
          search: { type: "string", description: "Substring match on merchant/name (case-insensitive)" },
          limit: { type: "integer", description: "Max rows, default 40, max 80" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "runway_planner_snapshot",
      description: "Current dashboard runway, burn, health score, totals, and top alerts (live snapshot).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "goals_and_budgets_snapshot",
      description: "Goals progress and budget utilization from the live dashboard.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_month_totals",
      description: "Compare total spend, income, and net for two calendar months (YYYY-MM).",
      parameters: {
        type: "object",
        properties: {
          month_a: { type: "string", description: "e.g. 2026-02" },
          month_b: { type: "string", description: "e.g. 2026-03" },
        },
        required: ["month_a", "month_b"],
      },
    },
  },
];

function monthBounds(ym: string): { from: string; to: string } {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return {
    from: `${ym}-01`,
    to: `${ym}-${String(last).padStart(2, "0")}`,
  };
}

export async function executeFinanceToolCall(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    switch (name) {
      case "spending_by_category": {
        const from = String(args.from ?? "");
        const to = String(args.to ?? "");
        const rows = await collectTransactionsInRange(from, to);
        const sums = sumByCategory(rows, true);
        const sorted = Object.entries(sums).sort((a, b) => b[1] - a[1]);
        return JSON.stringify({
          from,
          to,
          currencyNote: "INR-style amounts as stored in the app",
          byCategory: Object.fromEntries(sorted),
          transactionCount: rows.filter((r) => r.amount > 0).length,
        });
      }
      case "income_by_category": {
        const from = String(args.from ?? "");
        const to = String(args.to ?? "");
        const rows = await collectTransactionsInRange(from, to);
        const sums = sumByCategory(rows, false);
        const sorted = Object.entries(sums).sort((a, b) => b[1] - a[1]);
        return JSON.stringify({
          from,
          to,
          byCategory: Object.fromEntries(sorted),
          transactionCount: rows.filter((r) => r.amount < 0).length,
        });
      }
      case "period_totals": {
        const from = String(args.from ?? "");
        const to = String(args.to ?? "");
        const rows = await collectTransactionsInRange(from, to);
        let spend = 0;
        let income = 0;
        for (const r of rows) {
          if (r.amount > 0) {
            spend += r.amount;
          } else if (r.amount < 0) {
            income += Math.abs(r.amount);
          }
        }
        return JSON.stringify({
          from,
          to,
          totalSpend: spend,
          totalIncome: income,
          net: income - spend,
          rowCount: rows.length,
        });
      }
      case "list_transactions": {
        const from = args.from ? String(args.from) : null;
        const to = args.to ? String(args.to) : null;
        const category = args.category ? String(args.category) : null;
        const direction = (args.direction as string) || "all";
        const search = args.search ? String(args.search).toLowerCase() : null;
        const limit = Math.min(80, Math.max(1, Number(args.limit) || 40));

        let rows: NormalizedTxn[];
        if (from && to) {
          rows = await collectTransactionsInRange(from, to);
        } else {
          const now = new Date();
          const toStr = now.toISOString().slice(0, 10);
          const start = new Date(now);
          start.setUTCDate(start.getUTCDate() - 90);
          const fromStr = start.toISOString().slice(0, 10);
          rows = await collectTransactionsInRange(fromStr, toStr);
        }

        let filtered = rows;
        if (category) {
          filtered = filtered.filter((r) => r.category === category);
        }
        if (direction === "expense") {
          filtered = filtered.filter((r) => r.amount > 0);
        } else if (direction === "income") {
          filtered = filtered.filter((r) => r.amount < 0);
        }
        if (search) {
          filtered = filtered.filter((r) => r.name.toLowerCase().includes(search));
        }

        const slice = filtered.slice(0, limit);
        return JSON.stringify({
          count: slice.length,
          transactions: slice.map((t) => ({
            date: t.date,
            name: t.name,
            amount: t.amount,
            category: t.category,
            source: t.source,
          })),
        });
      }
      case "runway_planner_snapshot": {
        const d = await getDashboardData();
        return JSON.stringify({
          totals: d.totals,
          healthScore: d.healthScore,
          planner: d.planner,
          alerts: d.alerts.slice(0, 8),
          accounts: d.accounts.map((a) => ({
            name: a.name,
            balanceCurrent: a.balanceCurrent,
          })),
          ledgerHints: d.ledgerHints,
        });
      }
      case "goals_and_budgets_snapshot": {
        const d = await getDashboardData();
        return JSON.stringify({
          goals: d.goals.map((g) => ({
            name: g.name,
            currentAmount: g.currentAmount,
            targetAmount: g.targetAmount,
            targetDate: g.targetDate,
            progress: g.progress,
          })),
          budgets: d.budgets.map((b) => ({
            category: b.category,
            monthlyLimit: b.monthlyLimit,
            spent: b.spent,
            utilization: b.utilization,
            status: b.status,
          })),
          recurring: d.recurringItems.slice(0, 12),
        });
      }
      case "compare_month_totals": {
        const ma = String(args.month_a ?? "");
        const mb = String(args.month_b ?? "");
        const ba = monthBounds(ma);
        const bb = monthBounds(mb);
        const [ra, rb] = await Promise.all([
          collectTransactionsInRange(ba.from, ba.to),
          collectTransactionsInRange(bb.from, bb.to),
        ]);
        const fold = (rows: NormalizedTxn[]) => {
          let spend = 0;
          let income = 0;
          for (const r of rows) {
            if (r.amount > 0) {
              spend += r.amount;
            } else if (r.amount < 0) {
              income += Math.abs(r.amount);
            }
          }
          return { spend, income, net: income - spend, txCount: rows.length };
        };
        return JSON.stringify({
          month_a: { label: ma, ...fold(ra) },
          month_b: { label: mb, ...fold(rb) },
        });
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    return JSON.stringify({
      error: true,
      message: err instanceof Error ? err.message : "Tool execution failed",
    });
  }
}
