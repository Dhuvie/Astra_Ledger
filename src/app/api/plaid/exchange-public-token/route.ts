import { NextResponse } from "next/server";

import { exchangePublicTokenAndSync } from "@/lib/plaid";
import { isLiveDatabase } from "@/lib/db-availability";
import { isPlaidConfigured } from "@/lib/env";

export async function POST(request: Request) {
  const dbLive = await isLiveDatabase();
  if (!isPlaidConfigured || !dbLive) {
    return NextResponse.json(
      {
        error:
          "Plaid credentials and a reachable MongoDB database are required for sync. Start MongoDB or clear DATABASE_URL for file-only mode.",
      },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      publicToken?: string;
      institutionName?: string;
    };

    if (!body.publicToken) {
      return NextResponse.json(
        { error: "Missing publicToken in request body." },
        { status: 400 },
      );
    }

    const result = await exchangePublicTokenAndSync({
      publicToken: body.publicToken,
      institutionName: body.institutionName,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to exchange public token.",
      },
      { status: 500 },
    );
  }
}

