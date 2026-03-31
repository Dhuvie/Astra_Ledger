import { NextResponse } from "next/server";

import { getLlmConfig } from "@/lib/llm-config";

export async function GET() {
  const config = getLlmConfig();
  return NextResponse.json({
    enabled: Boolean(config),
    provider: config?.provider ?? null,
    model: config?.model ?? null,
  });
}
