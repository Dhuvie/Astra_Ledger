import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type StoredManualTransaction = {
  id: string;
  name: string;
  merchantName?: string;
  amount: number;
  date: string;
  primaryCategory: string;
  detailedCategory?: string;
  confidence: "USER_ENTERED";
  pending: false;
  source: "manual";
  createdAt: string;
};

export type StoredGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
};

export type StoredRecurringItem = {
  id: string;
  name: string;
  amount: number;
  cadence: "monthly" | "quarterly" | "yearly";
  nextDate: string;
  category: string;
  essential: boolean;
};

export type StoredBudget = {
  id: string;
  category: string;
  monthlyLimit: number;
  accent: string;
};

export type WorkspaceState = {
  version: 2;
  manualTransactions: StoredManualTransaction[];
  goals: StoredGoal[];
  recurringItems: StoredRecurringItem[];
  budgets: StoredBudget[];
  /** Opening / manual cash balance (INR) when not using Plaid accounts. */
  cashBalance: number;
};

const STORE_DIR = join(process.cwd(), "data");
const STORE_PATH = join(STORE_DIR, "workspace-state.json");

/** Optional packaged demo rows for “Load demo” stories — not loaded by default. */
export const defaultGoals: StoredGoal[] = [
  {
    id: "goal_emergency",
    name: "Emergency Buffer",
    targetAmount: 300000,
    currentAmount: 120000,
    targetDate: "2026-12-31",
    category: "CASH_RESERVE",
  },
  {
    id: "goal_trip",
    name: "Goa Trip Fund",
    targetAmount: 90000,
    currentAmount: 24000,
    targetDate: "2026-09-01",
    category: "TRAVEL",
  },
];

export const defaultRecurringItems: StoredRecurringItem[] = [
  {
    id: "rec_rent",
    name: "Rent",
    amount: 42000,
    cadence: "monthly",
    nextDate: "2026-04-01",
    category: "HOUSING",
    essential: true,
  },
];

export const defaultBudgets: StoredBudget[] = [
  {
    id: "budget_food",
    category: "FOOD_AND_DRINK",
    monthlyLimit: 22000,
    accent: "mint",
  },
];

export const defaultWorkspaceState: WorkspaceState = {
  version: 2,
  manualTransactions: [],
  goals: [],
  recurringItems: [],
  budgets: [],
  cashBalance: 0,
};

function normalizeState(parsed: Partial<WorkspaceState> & { version?: number }): WorkspaceState {
  return {
    version: 2,
    manualTransactions: Array.isArray(parsed.manualTransactions)
      ? parsed.manualTransactions
      : [],
    goals: Array.isArray(parsed.goals) ? parsed.goals : [],
    recurringItems: Array.isArray(parsed.recurringItems) ? parsed.recurringItems : [],
    budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
    cashBalance:
      typeof parsed.cashBalance === "number" && Number.isFinite(parsed.cashBalance)
        ? parsed.cashBalance
        : 0,
  };
}

export async function readWorkspaceState(): Promise<WorkspaceState> {
  try {
    const content = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(content) as Partial<WorkspaceState> & { version?: number };
    return normalizeState(parsed);
  } catch {
    return { ...defaultWorkspaceState };
  }
}

export async function updateWorkspaceState(
  updater: (current: WorkspaceState) => WorkspaceState,
) {
  const current = await readWorkspaceState();
  const next = updater(current);

  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(next, null, 2), "utf8");

  return next;
}

export async function updateCashBalance(cashBalance: number) {
  const next = Math.round(Number(cashBalance) * 100) / 100;
  if (!Number.isFinite(next)) {
    throw new Error("Invalid cash balance.");
  }

  return updateWorkspaceState((current) => ({
    ...current,
    cashBalance: next,
  }));
}
