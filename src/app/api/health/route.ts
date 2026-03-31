import { NextResponse } from "next/server";

import { isLiveDatabase } from "@/lib/db-availability";
import { env, isDatabaseConfigured, isPlaidConfigured } from "@/lib/env";

export async function GET() {
  let database: string = "not_configured";

  if (isDatabaseConfigured) {
    database = (await isLiveDatabase()) ? "ok" : "unreachable";
  }

  const ok = database !== "unreachable";

  return NextResponse.json(
    {
      ok,
      timestamp: new Date().toISOString(),
      mode: env.useSampleData ? "sample" : "live",
      services: {
        database,
        plaid: isPlaidConfigured ? "configured" : "not_configured",
      },
    },
    { status: ok ? 200 : 503 },
  );
}
