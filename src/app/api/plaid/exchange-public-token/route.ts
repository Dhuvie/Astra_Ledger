import { NextResponse } from "next/server";

import { exchangePublicTokenAndSync } from "@/lib/plaid";
import { isDatabaseConfigured, isPlaidConfigured } from "@/lib/env";

export async function POST(request: Request) {
  if (!isPlaidConfigured || !isDatabaseConfigured) {
    return NextResponse.json(
      {
        error:
          "Plaid credentials and DATABASE_URL are both required for live synchronization.",
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

