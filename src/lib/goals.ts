import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db";
import { isLiveDatabase } from "@/lib/db-availability";
import { env } from "@/lib/env";
import {
  defaultGoals,
  readWorkspaceState,
  updateWorkspaceState,
  type StoredGoal,
} from "@/lib/workspace-store";

export type GoalInput = {
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
};

export async function listGoals(): Promise<StoredGoal[]> {
  if (await isLiveDatabase()) {
    await ensureGoalsSeededIfEnabled();

    const goals = await prisma.goal.findMany({
      orderBy: {
        targetDate: "asc",
      },
    });

    return goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate.toISOString().slice(0, 10),
      category: goal.category,
    }));
  }

  const state = await readWorkspaceState();
  return state.goals;
}

export async function createGoal(input: GoalInput): Promise<StoredGoal> {
  if (await isLiveDatabase()) {
    const goal = await prisma.goal.create({
      data: {
        name: input.name.trim(),
        targetAmount: input.targetAmount,
        currentAmount: input.currentAmount,
        targetDate: new Date(input.targetDate),
        category: input.category,
      },
    });

    return {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate.toISOString().slice(0, 10),
      category: goal.category,
    };
  }

  const goal: StoredGoal = {
    id: randomUUID(),
    name: input.name.trim(),
    targetAmount: input.targetAmount,
    currentAmount: input.currentAmount,
    targetDate: input.targetDate,
    category: input.category,
  };

  await updateWorkspaceState((current) => ({
    ...current,
    goals: [goal, ...current.goals],
  }));

  return goal;
}

export async function contributeToGoal(id: string, amount: number): Promise<StoredGoal | null> {
  if (await isLiveDatabase()) {
    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing) return null;
    const updated = await prisma.goal.update({
      where: { id },
      data: { currentAmount: Math.max(0, existing.currentAmount + amount) },
    });
    return {
      id: updated.id,
      name: updated.name,
      targetAmount: updated.targetAmount,
      currentAmount: updated.currentAmount,
      targetDate: updated.targetDate.toISOString().slice(0, 10),
      category: updated.category,
    };
  }

  let result: StoredGoal | null = null;
  await updateWorkspaceState((current) => {
    const goals = current.goals.map((g) => {
      if (g.id === id) {
        result = { ...g, currentAmount: Math.max(0, g.currentAmount + amount) };
        return result;
      }
      return g;
    });
    return { ...current, goals };
  });
  return result;
}

async function ensureGoalsSeededIfEnabled() {
  if (!env.seedDemoWorkspace) {
    return;
  }

  const count = await prisma.goal.count();

  if (count > 0) {
    return;
  }

  await prisma.goal.createMany({
    data: defaultGoals.map((goal) => ({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: new Date(goal.targetDate),
      category: goal.category,
    })),
  });
}
