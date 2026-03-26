import type {
  StoredBudget,
  StoredGoal,
  StoredRecurringItem,
} from "@/lib/workspace-store";

export type DashboardAccount = {
  id: string;
  name: string;
  subtype: string;
  mask: string;
  balanceCurrent: number;
  balanceAvailable?: number;
};

export type DashboardTransaction = {
  id: string;
  name: string;
  merchantName?: string;
  amount: number;
  date: string;
  primaryCategory: string;
  detailedCategory?: string;
  confidence?: string;
  pending: boolean;
  source?: "plaid" | "manual" | "sample";
};

export type CategoryBreakdown = {
  category: string;
  amount: number;
  share: number;
  tone: string;
};

export type TrendPoint = {
  label: string;
  spend: number;
  income: number;
};

export type DashboardInsight = {
  label: string;
  value: string;
  note: string;
};

export type DashboardGoal = {
  id: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  progress: number;
  remainingAmount: number;
  monthlyNeeded: number;
};

export type RecurringCommitment = {
  id: string;
  name: string;
  category: string;
  essential: boolean;
  cadence: "monthly" | "quarterly" | "yearly";
  nextDate: string;
  amount: number;
  monthlyEquivalent: number;
};

export type PlannerSnapshot = {
  averageMonthlySpend: number;
  averageMonthlyIncome: number;
  recurringMonthlyTotal: number;
  monthlyBurn: number;
  runwayMonths: number;
  emergencyFundTarget: number;
  opportunityAmount: number;
  dailySpendTarget: number;
  budgetedSpendCap: number;
};

export type DashboardBudget = {
  id: string;
  categoryKey: string;
  category: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  utilization: number;
  status: "healthy" | "watch" | "over";
  accent: string;
};

export type DashboardAlert = {
  id: string;
  level: "critical" | "warning" | "positive";
  title: string;
  detail: string;
};

export type UpcomingCharge = {
  id: string;
  name: string;
  category: string;
  dueDate: string;
  amount: number;
  daysAway: number;
  essential: boolean;
};

export type DashboardData = {
  mode: "sample" | "live";
  updatedAt: string;
  manualEntryCount: number;
  healthScore: number;
  totals: {
    spent: number;
    income: number;
    net: number;
    savingsRate: number;
  };
  topCategory: CategoryBreakdown | null;
  breakdown: CategoryBreakdown[];
  trend: TrendPoint[];
  accounts: DashboardAccount[];
  transactions: DashboardTransaction[];
  insights: DashboardInsight[];
  goals: DashboardGoal[];
  recurringItems: RecurringCommitment[];
  budgets: DashboardBudget[];
  alerts: DashboardAlert[];
  upcomingCharges: UpcomingCharge[];
  planner: PlannerSnapshot;
  quickAddExamples: string[];
};

const CATEGORY_TONES = [
  "from-[#7dd4c2] to-[#dffcf6]",
  "from-[#d7c6ff] to-[#f1f5f9]",
  "from-[#a5f3fc] to-[#f8fafc]",
  "from-[#fde68a] to-[#fef3c7]",
  "from-[#fbcfe8] to-[#f5f3ff]",
];

const monthLabel = new Intl.DateTimeFormat("en-IN", {
  month: "short",
});

export function buildDashboardData(input: {
  mode: "sample" | "live";
  accounts: DashboardAccount[];
  transactions: DashboardTransaction[];
  budgets?: StoredBudget[];
  goals?: StoredGoal[];
  recurringItems?: StoredRecurringItem[];
  manualEntryCount?: number;
}): DashboardData {
  const now = new Date();
  const orderedTransactions = [...input.transactions].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  const spendingTransactions = orderedTransactions.filter((item) => item.amount > 0);
  const incomeTransactions = orderedTransactions.filter((item) => item.amount < 0);

  const spent = spendingTransactions.reduce((sum, item) => sum + item.amount, 0);
  const income = incomeTransactions.reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const net = income - spent;
  const savingsRate = income === 0 ? 0 : Math.max(0, (net / income) * 100);

  const breakdownMap = new Map<string, number>();

  for (const transaction of spendingTransactions) {
    const current = breakdownMap.get(transaction.primaryCategory) ?? 0;
    breakdownMap.set(transaction.primaryCategory, current + transaction.amount);
  }

  const breakdown = [...breakdownMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount], index) => ({
      category: startCase(category),
      amount,
      share: spent === 0 ? 0 : amount / spent,
      tone: CATEGORY_TONES[index % CATEGORY_TONES.length],
    }));

  const trend = Array.from({ length: 6 }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - offset), 1);
    const label = monthLabel.format(date);
    const monthlySpend = spendingTransactions
      .filter((item) => isSameMonth(item.date, date))
      .reduce((sum, item) => sum + item.amount, 0);
    const monthlyIncome = incomeTransactions
      .filter((item) => isSameMonth(item.date, date))
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);

    return { label, spend: monthlySpend, income: monthlyIncome };
  });

  const accountBalance = input.accounts.reduce(
    (sum, account) => sum + account.balanceCurrent,
    0,
  );

  const recurringItems = (input.recurringItems ?? []).map(mapRecurringItem);
  const budgets = (input.budgets ?? []).map((budget) =>
    mapBudget({
      budget,
      transactions: spendingTransactions,
      now,
    }),
  );
  const recurringMonthlyTotal = recurringItems.reduce(
    (sum, item) => sum + item.monthlyEquivalent,
    0,
  );
  const budgetedSpendCap = budgets.reduce((sum, item) => sum + item.monthlyLimit, 0);
  const averageMonthlySpend =
    trend.reduce((sum, point) => sum + point.spend, 0) / Math.max(trend.length, 1);
  const averageMonthlyIncome =
    trend.reduce((sum, point) => sum + point.income, 0) / Math.max(trend.length, 1);
  const monthlyBurn = Math.max(averageMonthlySpend, recurringMonthlyTotal, 1);
  const runwayMonths = accountBalance <= 0 ? 0 : accountBalance / monthlyBurn;
  const emergencyFundTarget = monthlyBurn * 6;
  const opportunityAmount = Math.max(0, averageMonthlyIncome * 0.2 - recurringMonthlyTotal);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(1, daysInMonth - now.getDate() + 1);
  const currentMonthSpend = spendingTransactions
    .filter((item) => isSameMonth(item.date, now))
    .reduce((sum, item) => sum + item.amount, 0);
  const dailySpendTarget = Math.max(
    0,
    (Math.max(budgetedSpendCap, averageMonthlySpend) - currentMonthSpend) / remainingDays,
  );

  const goals = (input.goals ?? []).map((goal) => mapGoal(goal, now));
  const largestPurchase = spendingTransactions[0]
    ? [...spendingTransactions].sort((a, b) => b.amount - a.amount)[0]
    : null;
  const upcomingCharges = recurringItems
    .map((item) => {
      const dueDate = new Date(item.nextDate);
      const daysAway = Math.max(
        0,
        Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      );

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        dueDate: item.nextDate,
        amount: item.amount,
        daysAway,
        essential: item.essential,
      } satisfies UpcomingCharge;
    })
    .sort((a, b) => a.daysAway - b.daysAway)
    .slice(0, 4);
  const alerts = buildAlerts({
    savingsRate,
    runwayMonths,
    budgets,
    goals,
    upcomingCharges,
  });
  const healthScore = calculateHealthScore({
    savingsRate,
    runwayMonths,
    budgets,
    goals,
  });

  const insights: DashboardInsight[] = [
    {
      label: "Liquidity",
      value: currency(accountBalance),
      note: "Combined current balance across linked cash and credit accounts.",
    },
    {
      label: "Commitments",
      value: currency(recurringMonthlyTotal),
      note: "Monthly equivalent of recurring commitments and subscriptions.",
    },
    {
      label: "Runway",
      value: `${runwayMonths.toFixed(1)} months`,
      note: "Based on current balance versus estimated monthly burn.",
    },
    {
      label: "Daily Target",
      value: currency(dailySpendTarget),
      note: "Suggested daily discretionary ceiling for the rest of this month.",
    },
    {
      label: "Top Outflow",
      value: largestPurchase ? largestPurchase.name : "No spend yet",
      note: largestPurchase
        ? `${currency(largestPurchase.amount)} on ${formatDate(largestPurchase.date)}`
        : "Add transactions to surface the biggest discretionary outflow.",
    },
  ];

  return {
    mode: input.mode,
    updatedAt: now.toISOString(),
    manualEntryCount: input.manualEntryCount ?? 0,
    healthScore,
    totals: {
      spent,
      income,
      net,
      savingsRate,
    },
    topCategory: breakdown[0] ?? null,
    breakdown,
    trend,
    accounts: input.accounts,
    transactions: orderedTransactions.slice(0, 10),
    insights,
    goals,
    recurringItems,
    budgets,
    alerts,
    upcomingCharges,
    planner: {
      averageMonthlySpend,
      averageMonthlyIncome,
      recurringMonthlyTotal,
      monthlyBurn,
      runwayMonths,
      emergencyFundTarget,
      opportunityAmount,
      dailySpendTarget,
      budgetedSpendCap,
    },
    quickAddExamples: [
      "spent 4200 on groceries today",
      "paid 1800 for fuel yesterday",
      "received 85000 salary today",
      "spent 12000 on rent 2026-03-28",
    ],
  };
}

function mapGoal(goal: StoredGoal, now: Date): DashboardGoal {
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
  const monthsLeft = Math.max(1, monthDiff(now, new Date(goal.targetDate)));

  return {
    id: goal.id,
    name: goal.name,
    category: startCase(goal.category),
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    targetDate: goal.targetDate,
    progress: goal.targetAmount === 0 ? 0 : goal.currentAmount / goal.targetAmount,
    remainingAmount,
    monthlyNeeded: remainingAmount / monthsLeft,
  };
}

function mapRecurringItem(item: StoredRecurringItem): RecurringCommitment {
  const divisor =
    item.cadence === "monthly" ? 1 : item.cadence === "quarterly" ? 3 : 12;

  return {
    id: item.id,
    name: item.name,
    category: startCase(item.category),
    essential: item.essential,
    cadence: item.cadence,
    nextDate: item.nextDate,
    amount: item.amount,
    monthlyEquivalent: item.amount / divisor,
  };
}

function mapBudget(input: {
  budget: StoredBudget;
  transactions: DashboardTransaction[];
  now: Date;
}): DashboardBudget {
  const spent = input.transactions
    .filter(
      (transaction) =>
        transaction.primaryCategory === input.budget.category &&
        isSameMonth(transaction.date, input.now),
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const utilization =
    input.budget.monthlyLimit <= 0 ? 0 : spent / input.budget.monthlyLimit;

  return {
    id: input.budget.id,
    categoryKey: input.budget.category,
    category: startCase(input.budget.category),
    monthlyLimit: input.budget.monthlyLimit,
    spent,
    remaining: Math.max(0, input.budget.monthlyLimit - spent),
    utilization,
    status: utilization > 1 ? "over" : utilization > 0.8 ? "watch" : "healthy",
    accent: input.budget.accent,
  };
}

function buildAlerts(input: {
  savingsRate: number;
  runwayMonths: number;
  budgets: DashboardBudget[];
  goals: DashboardGoal[];
  upcomingCharges: UpcomingCharge[];
}): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  const overBudget = input.budgets.filter((budget) => budget.status === "over");
  const watchBudget = input.budgets.filter((budget) => budget.status === "watch");
  const urgentGoals = input.goals.filter(
    (goal) => goal.progress < 0.45 && goal.monthlyNeeded > 15000,
  );
  const upcomingEssentials = input.upcomingCharges.filter(
    (charge) => charge.essential && charge.daysAway <= 10,
  );

  if (input.runwayMonths < 3) {
    alerts.push({
      id: "runway",
      level: "critical",
      title: "Runway is below three months",
      detail: "Reduce variable spend or move more cash into reserve to stabilize liquidity.",
    });
  }

  if (input.savingsRate < 10) {
    alerts.push({
      id: "savings",
      level: "warning",
      title: "Savings rate is thin",
      detail: "Income is not converting into retained cash fast enough this cycle.",
    });
  }

  if (overBudget[0]) {
    alerts.push({
      id: "budget-over",
      level: "critical",
      title: `${overBudget[0].category} is over budget`,
      detail: `Monthly cap exceeded by ${currency(overBudget[0].spent - overBudget[0].monthlyLimit)}.`,
    });
  } else if (watchBudget[0]) {
    alerts.push({
      id: "budget-watch",
      level: "warning",
      title: `${watchBudget[0].category} is approaching the limit`,
      detail: `You have ${currency(watchBudget[0].remaining)} left in that category.`,
    });
  }

  if (urgentGoals[0]) {
    alerts.push({
      id: "goal-pressure",
      level: "warning",
      title: `${urgentGoals[0].name} needs heavier funding`,
      detail: `It currently needs ${currency(urgentGoals[0].monthlyNeeded)} per month to stay on track.`,
    });
  }

  if (upcomingEssentials[0]) {
    alerts.push({
      id: "upcoming",
      level: "positive",
      title: `${upcomingEssentials.length} essential bills coming up`,
      detail: `Next is ${upcomingEssentials[0].name} in ${upcomingEssentials[0].daysAway} days.`,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "healthy",
      level: "positive",
      title: "System looks healthy",
      detail: "Budgets, runway, and current goals are all within a stable operating range.",
    });
  }

  return alerts.slice(0, 4);
}

function calculateHealthScore(input: {
  savingsRate: number;
  runwayMonths: number;
  budgets: DashboardBudget[];
  goals: DashboardGoal[];
}) {
  const savingsComponent = Math.min(Math.max(input.savingsRate, 0), 30);
  const runwayComponent = Math.min(input.runwayMonths, 9) * 4;
  const budgetComponent =
    input.budgets.length === 0
      ? 15
      : input.budgets.reduce((sum, budget) => {
          if (budget.status === "healthy") {
            return sum + 8;
          }

          if (budget.status === "watch") {
            return sum + 4;
          }

          return sum;
        }, 0) / input.budgets.length;
  const goalsComponent =
    input.goals.length === 0
      ? 15
      : input.goals.reduce((sum, goal) => sum + Math.min(goal.progress, 1) * 20, 0) /
        input.goals.length;

  return Math.round(
    Math.min(100, savingsComponent + runwayComponent + budgetComponent + goalsComponent),
  );
}

function monthDiff(start: Date, end: Date) {
  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();
  return years * 12 + months;
}

function isSameMonth(dateLike: string, date: Date) {
  const target = new Date(dateLike);

  return (
    target.getFullYear() === date.getFullYear() &&
    target.getMonth() === date.getMonth()
  );
}

export function startCase(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function compactCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
