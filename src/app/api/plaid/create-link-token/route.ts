import { NextResponse } from "next/server";

import { createLinkToken } from "@/lib/plaid";
import { isPlaidConfigured } from "@/lib/env";

export async function POST() {
  if (!isPlaidConfigured) {
    return NextResponse.json(
      { error: "Plaid credentials are not configured." },
      { status: 503 },
    );
  }

  try {
    const response = await createLinkToken();

    return NextResponse.json({
      linkToken: response.link_token,
      expiration: response.expiration,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create Plaid link token.",
      },
      { status: 500 },
    );
  }
}

