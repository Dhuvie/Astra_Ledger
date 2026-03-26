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
  version: 1;
  manualTransactions: StoredManualTransaction[];
  goals: StoredGoal[];
  recurringItems: StoredRecurringItem[];
  budgets: StoredBudget[];
};

const STORE_DIR = join(process.cwd(), "data");
const STORE_PATH = join(STORE_DIR, "workspace-state.json");

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
  {
    id: "goal_investing",
    name: "Annual Investing Base",
    targetAmount: 240000,
    currentAmount: 68000,
    targetDate: "2026-12-01",
    category: "INVESTING",
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
  {
    id: "rec_sip",
    name: "SIP Transfer",
    amount: 15000,
    cadence: "monthly",
    nextDate: "2026-04-05",
    category: "INVESTING",
    essential: false,
  },
  {
    id: "rec_internet",
    name: "Phone + Internet",
    amount: 2400,
    cadence: "monthly",
    nextDate: "2026-04-07",
    category: "UTILITIES",
    essential: true,
  },
  {
    id: "rec_insurance",
    name: "Health Insurance",
    amount: 18000,
    cadence: "yearly",
    nextDate: "2026-11-14",
    category: "INSURANCE",
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
  {
    id: "budget_transport",
    category: "TRANSPORTATION",
    monthlyLimit: 12000,
    accent: "blue",
  },
  {
    id: "budget_shopping",
    category: "SHOPPING",
    monthlyLimit: 18000,
    accent: "gold",
  },
  {
    id: "budget_entertainment",
    category: "ENTERTAINMENT",
    monthlyLimit: 9000,
    accent: "rose",
  },
];

export const defaultWorkspaceState: WorkspaceState = {
  version: 1,
  manualTransactions: [],
  goals: defaultGoals,
  recurringItems: defaultRecurringItems,
  budgets: defaultBudgets,
};

export async function readWorkspaceState(): Promise<WorkspaceState> {
  try {
    const content = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(content) as Partial<WorkspaceState>;

    return {
      version: 1,
      manualTransactions: Array.isArray(parsed.manualTransactions)
        ? parsed.manualTransactions
        : defaultWorkspaceState.manualTransactions,
      goals: Array.isArray(parsed.goals) ? parsed.goals : defaultWorkspaceState.goals,
      recurringItems: Array.isArray(parsed.recurringItems)
        ? parsed.recurringItems
        : defaultWorkspaceState.recurringItems,
      budgets: Array.isArray(parsed.budgets)
        ? parsed.budgets
        : defaultWorkspaceState.budgets,
    };
  } catch {
    return defaultWorkspaceState;
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
