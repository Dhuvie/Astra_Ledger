import { prisma } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/env";
import {
  defaultRecurringItems,
  readWorkspaceState,
  type StoredRecurringItem,
} from "@/lib/workspace-store";

export async function listRecurringItems(): Promise<StoredRecurringItem[]> {
  if (isDatabaseConfigured) {
    await ensureRecurringItemsSeeded();

    const items = await prisma.recurringItem.findMany({
      orderBy: {
        nextDate: "asc",
      },
    });

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      cadence: item.cadence as StoredRecurringItem["cadence"],
      nextDate: item.nextDate.toISOString().slice(0, 10),
      category: item.category,
      essential: item.essential,
    }));
  }

  const state = await readWorkspaceState();
  return state.recurringItems;
}

async function ensureRecurringItemsSeeded() {
  const count = await prisma.recurringItem.count();

  if (count > 0) {
    return;
  }

  await prisma.recurringItem.createMany({
    data: defaultRecurringItems.map((item) => ({
      name: item.name,
      amount: item.amount,
      cadence: item.cadence,
      nextDate: new Date(item.nextDate),
      category: item.category,
      essential: item.essential,
    })),
  });
}
