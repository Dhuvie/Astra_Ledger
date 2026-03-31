import { randomUUID } from "node:crypto";

import type { DashboardTransaction } from "@/lib/finance";
import { prisma } from "@/lib/db";
import { isLiveDatabase } from "@/lib/db-availability";
import {
  readWorkspaceState,
  updateWorkspaceState,
  type StoredManualTransaction,
} from "@/lib/workspace-store";

export type ManualTransactionInput = {
  name: string;
  amount: number;
  date: string;
  primaryCategory: string;
  merchantName?: string;
};

export async function listManualTransactions(): Promise<DashboardTransaction[]> {
  if (await isLiveDatabase()) {
    const transactions = await prisma.manualTransaction.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return transactions.map((item) => ({
      id: item.id,
      name: item.name,
      merchantName: item.merchantName ?? undefined,
      amount: item.amount,
      date: item.date.toISOString(),
      primaryCategory: item.primaryCategory,
      detailedCategory: item.detailedCategory ?? undefined,
      confidence: item.confidence,
      pending: item.pending,
      source: "manual",
    }));
  }

  const state = await readWorkspaceState();

  return state.manualTransactions
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(mapStoredTransaction);
}

export async function createManualTransactionsBatch(
  inputs: ManualTransactionInput[],
): Promise<DashboardTransaction[]> {
  const out: DashboardTransaction[] = [];

  for (const input of inputs) {
    out.push(await createManualTransaction(input));
  }

  return out;
}

export async function createManualTransaction(
  input: ManualTransactionInput,
): Promise<DashboardTransaction> {
  const normalizedName = input.name.trim();
  const detailedCategory = `${input.primaryCategory}_${input.amount > 0 ? "MANUAL_EXPENSE" : "MANUAL_INCOME"}`;

  if (await isLiveDatabase()) {
    const transaction = await prisma.manualTransaction.create({
      data: {
        name: normalizedName,
        merchantName: input.merchantName?.trim() || normalizedName,
        amount: input.amount,
        date: new Date(input.date),
        primaryCategory: input.primaryCategory,
        detailedCategory,
      },
    });

    return {
      id: transaction.id,
      name: transaction.name,
      merchantName: transaction.merchantName ?? undefined,
      amount: transaction.amount,
      date: transaction.date.toISOString(),
      primaryCategory: transaction.primaryCategory,
      detailedCategory: transaction.detailedCategory ?? undefined,
      confidence: transaction.confidence,
      pending: transaction.pending,
      source: "manual",
    };
  }

  const transaction: StoredManualTransaction = {
    id: randomUUID(),
    name: normalizedName,
    merchantName: input.merchantName?.trim() || normalizedName,
    amount: input.amount,
    date: input.date,
    primaryCategory: input.primaryCategory,
    detailedCategory,
    confidence: "USER_ENTERED",
    pending: false,
    source: "manual",
    createdAt: new Date().toISOString(),
  };

  await updateWorkspaceState((current) => ({
    ...current,
    manualTransactions: [transaction, ...current.manualTransactions],
  }));

  return mapStoredTransaction(transaction);
}

export async function clearManualTransactions() {
  if (await isLiveDatabase()) {
    await prisma.manualTransaction.deleteMany();
    return;
  }

  await updateWorkspaceState((current) => ({
    ...current,
    manualTransactions: [],
  }));
}

function mapStoredTransaction(item: StoredManualTransaction): DashboardTransaction {
  return {
    id: item.id,
    name: item.name,
    merchantName: item.merchantName,
    amount: item.amount,
    date: item.date,
    primaryCategory: item.primaryCategory,
    detailedCategory: item.detailedCategory,
    confidence: item.confidence,
    pending: item.pending,
    source: "manual",
  };
}
