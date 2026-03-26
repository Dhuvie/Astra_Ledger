import { NextResponse } from "next/server";

import {
  clearManualTransactions,
  createManualTransaction,
  listManualTransactions,
} from "@/lib/manual-transactions";

export async function GET() {
  const transactions = await listManualTransactions();

  return NextResponse.json({
    transactions,
    count: transactions.length,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      amount?: number;
      date?: string;
      primaryCategory?: string;
      merchantName?: string;
      type?: "expense" | "income";
    };

    const name = body.name?.trim();
    const amount = Number(body.amount);
    const date = body.date;
    const primaryCategory = body.primaryCategory?.trim();
    const isValidDate = Boolean(date && /^\d{4}-\d{2}-\d{2}$/.test(date));

    if (!name || !isValidDate || !primaryCategory || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid manual transaction payload." },
        { status: 400 },
      );
    }

    const signedAmount = body.type === "income" ? -amount : amount;
    const normalizedDate = date as string;
    const transaction = await createManualTransaction({
      name,
      merchantName: body.merchantName,
      amount: signedAmount,
      date: normalizedDate,
      primaryCategory,
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create manual transaction.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  await clearManualTransactions();

  return NextResponse.json({ ok: true });
}
