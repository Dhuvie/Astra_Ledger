import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/env";
import {
  defaultBudgets,
  readWorkspaceState,
  updateWorkspaceState,
  type StoredBudget,
} from "@/lib/workspace-store";

export type BudgetInput = {
  category: string;
  monthlyLimit: number;
  accent?: string;
};

export async function listBudgets(): Promise<StoredBudget[]> {
  if (isDatabaseConfigured) {
    await ensureBudgetsSeeded();

    const budgets = await prisma.budgetConfig.findMany({
      orderBy: {
        category: "asc",
      },
    });

    return budgets.map((budget) => ({
      id: budget.id,
      category: budget.category,
      monthlyLimit: budget.monthlyLimit,
      accent: budget.accent,
    }));
  }

  const state = await readWorkspaceState();
  return state.budgets;
}

export async function createBudget(input: BudgetInput): Promise<StoredBudget> {
  if (isDatabaseConfigured) {
    const budget = await prisma.budgetConfig.upsert({
      where: {
        category: input.category.trim(),
      },
      update: {
        monthlyLimit: input.monthlyLimit,
        accent: input.accent?.trim() || "mint",
      },
      create: {
        category: input.category.trim(),
        monthlyLimit: input.monthlyLimit,
        accent: input.accent?.trim() || "mint",
      },
    });

    return {
      id: budget.id,
      category: budget.category,
      monthlyLimit: budget.monthlyLimit,
      accent: budget.accent,
    };
  }

  const budget: StoredBudget = {
    id: randomUUID(),
    category: input.category.trim(),
    monthlyLimit: input.monthlyLimit,
    accent: input.accent?.trim() || "mint",
  };

  await updateWorkspaceState((current) => ({
    ...current,
    budgets: [
      budget,
      ...current.budgets.filter((item) => item.category !== budget.category),
    ],
  }));

  return budget;
}

async function ensureBudgetsSeeded() {
  const count = await prisma.budgetConfig.count();

  if (count > 0) {
    return;
  }

  await prisma.budgetConfig.createMany({
    data: defaultBudgets.map((budget) => ({
      category: budget.category,
      monthlyLimit: budget.monthlyLimit,
      accent: budget.accent,
    })),
  });
}
