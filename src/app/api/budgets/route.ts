import { NextResponse } from "next/server";

import { createBudget, listBudgets } from "@/lib/budgets";

export async function GET() {
  const budgets = await listBudgets();

  return NextResponse.json({ budgets });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      category?: string;
      monthlyLimit?: number;
      accent?: string;
    };

    const category = body.category?.trim();
    const monthlyLimit = Number(body.monthlyLimit);

    if (!category || !Number.isFinite(monthlyLimit) || monthlyLimit <= 0) {
      return NextResponse.json({ error: "Invalid budget payload." }, { status: 400 });
    }

    const budget = await createBudget({
      category,
      monthlyLimit,
      accent: body.accent,
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create budget.",
      },
      { status: 500 },
    );
  }
}
