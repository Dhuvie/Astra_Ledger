import { NextResponse } from "next/server";

import { updateCashBalance } from "@/lib/workspace-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { cashBalance?: number };
    const raw = body.cashBalance;

    if (typeof raw !== "number" || !Number.isFinite(raw)) {
      return NextResponse.json({ error: "cashBalance must be a finite number." }, { status: 400 });
    }

    await updateCashBalance(raw);

    return NextResponse.json({ ok: true, cashBalance: raw });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update balance.",
      },
      { status: 500 },
    );
  }
}
