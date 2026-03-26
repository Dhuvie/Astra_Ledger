import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { env, isDatabaseConfigured, isPlaidConfigured } from "@/lib/env";

export async function GET() {
  let database = "not_configured";

  if (isDatabaseConfigured) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = "ok";
    } catch {
      database = "error";
    }
  }

  const ok = database !== "error";

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
