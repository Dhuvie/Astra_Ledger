import { NextResponse } from "next/server";

import {
  createManualTransactionsBatch,
  type ManualTransactionInput,
} from "@/lib/manual-transactions";

type Row = {
  name?: string;
  amount?: number;
  date?: string;
  primaryCategory?: string;
  merchantName?: string;
  type?: "expense" | "income";
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { rows?: Row[] };
    const rows = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "rows must be a non-empty array." }, { status: 400 });
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: "Maximum 500 rows per batch." }, { status: 400 });
    }

    const normalized: ManualTransactionInput[] = [];

    for (const row of rows) {
      const name = row.name?.trim();
      const amount = Number(row.amount);
      const date = row.date;
      const primaryCategory = row.primaryCategory?.trim();
      const isValidDate = Boolean(date && /^\d{4}-\d{2}-\d{2}$/.test(date));

      if (!name || !isValidDate || !primaryCategory || !Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json(
          { error: `Invalid row: ${JSON.stringify(row)}` },
          { status: 400 },
        );
      }

      const signedAmount = row.type === "income" ? -amount : amount;

      normalized.push({
        name,
        merchantName: row.merchantName,
        amount: signedAmount,
        date: date as string,
        primaryCategory,
      });
    }

    const transactions = await createManualTransactionsBatch(normalized);

    return NextResponse.json({ transactions, count: transactions.length }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to import transactions.",
      },
      { status: 500 },
    );
  }
}
