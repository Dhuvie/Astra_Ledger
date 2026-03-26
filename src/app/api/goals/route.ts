import { NextResponse } from "next/server";

import { createGoal, listGoals } from "@/lib/goals";

export async function GET() {
  const goals = await listGoals();

  return NextResponse.json({ goals });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      targetAmount?: number;
      currentAmount?: number;
      targetDate?: string;
      category?: string;
    };

    const name = body.name?.trim();
    const targetAmount = Number(body.targetAmount);
    const currentAmount = Number(body.currentAmount ?? 0);
    const targetDate = body.targetDate;
    const category = body.category?.trim();
    const validDate = Boolean(targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate));

    if (
      !name ||
      !category ||
      !validDate ||
      !Number.isFinite(targetAmount) ||
      targetAmount <= 0 ||
      !Number.isFinite(currentAmount) ||
      currentAmount < 0
    ) {
      return NextResponse.json({ error: "Invalid goal payload." }, { status: 400 });
    }

    const goal = await createGoal({
      name,
      targetAmount,
      currentAmount,
      targetDate: targetDate as string,
      category,
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create goal.",
      },
      { status: 500 },
    );
  }
}
