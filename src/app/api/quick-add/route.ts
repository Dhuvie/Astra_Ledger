import { NextResponse } from "next/server";

import { createTransactionFromQuickAdd, parseQuickAdd } from "@/lib/quick-add";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { command?: string; previewOnly?: boolean };
    const command = body.command?.trim();

    if (!command) {
      return NextResponse.json({ error: "Missing quick add command." }, { status: 400 });
    }

    if (body.previewOnly) {
      const parsed = parseQuickAdd(command);

      if (!parsed) {
        return NextResponse.json({ error: "Unable to parse command." }, { status: 400 });
      }

      return NextResponse.json({ parsed });
    }

    const result = await createTransactionFromQuickAdd(command);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to process quick add command.",
      },
      { status: 500 },
    );
  }
}
