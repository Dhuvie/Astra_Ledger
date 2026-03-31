import { NextResponse } from "next/server";

import { createFinanceChatResponseStream } from "@/lib/finance-chat-llm";
import { getFinanceCopilotContextJson } from "@/lib/finance-copilot-context";
import { getLlmConfig } from "@/lib/llm-config";

export const runtime = "nodejs";
export const maxDuration = 120;

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM_TEMPLATE = `You are **Astra Copilot** — a Finance-GPT style assistant inside the user's Astra ledger.

## Data you receive
1. **CURRENT_FINANCIAL_CONTEXT** — JSON rebuilt every request: dashboard aggregates, recent rows, workspace file snapshot, and (if configured) MongoDB (Plaid + manual).
2. **Tools** — You can call precise server functions for sums, filters, runway, goals/budgets, and month-vs-month comparisons. **Prefer tools** whenever the user asks for totals, breakdowns, lists, or comparisons so numbers are exact.

## Conventions
- **Amounts:** positive = outflow/expense, negative = inflow/income (Plaid-style). Explain that clearly when helpful.
- **Currency:** Treat displayed figures as the user's ledger currency (typically INR / ₹).
- **Markdown:** Always answer in **GitHub-flavored Markdown**: \`##\` / \`###\` headings, **bold** for key figures, bullet lists, and tables when comparing categories or months. Use \`inline code\` for dates.
- **Honesty:** If data or tools don't cover something, say so and suggest linking Plaid, manual entry, or Excel import.
- **Advice:** Educational only — not tax, legal, or personalized investment advice.

## Tool discipline
- Call **spending_by_category** / **income_by_category** / **period_totals** for date-range questions.
- Call **list_transactions** for "show me…" with filters.
- Call **runway_planner_snapshot** / **goals_and_budgets_snapshot** for runway, health, goals, budgets.
- Call **compare_month_totals** for "this month vs last month" style questions (pass \`YYYY-MM\`).

CURRENT_FINANCIAL_CONTEXT:
`;

function sanitizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const out: ChatMessage[] = [];

  for (const item of raw.slice(-24)) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const role = (item as { role?: string }).role;
    const content = (item as { content?: string }).content;
    if ((role === "user" || role === "assistant") && typeof content === "string") {
      const trimmed = content.trim();
      if (trimmed.length === 0) {
        continue;
      }
      out.push({ role, content: trimmed.slice(0, 12_000) });
    }
  }

  return out;
}

export async function POST(request: Request) {
  const llm = getLlmConfig();
  if (!llm) {
    return NextResponse.json(
      {
        error:
          "No LLM API key. For a free tier, set GROQ_API_KEY (see https://console.groq.com). Or use OPENAI_API_KEY / LLM_BASE_URL + LLM_API_KEY.",
      },
      { status: 503 },
    );
  }

  let body: { messages?: unknown; extraContext?: unknown };
  try {
    body = (await request.json()) as { messages?: unknown; extraContext?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = sanitizeMessages(body.messages);
  if (messages.length === 0) {
    return NextResponse.json({ error: "Send at least one user message." }, { status: 400 });
  }

  const last = messages[messages.length - 1];
  if (last.role !== "user") {
    return NextResponse.json({ error: "Last message must be from the user." }, { status: 400 });
  }

  let extra = "";
  if (typeof body.extraContext === "string" && body.extraContext.trim()) {
    extra = `\n\nUSER_VISIBLE_HINT (user-described UI or question focus):\n${body.extraContext.trim().slice(0, 4000)}`;
  }

  const { json: contextJson } = await getFinanceCopilotContextJson();
  const systemContent = SYSTEM_TEMPLATE + contextJson + extra;

  const userHistory = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const stream = await createFinanceChatResponseStream(systemContent, userHistory);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
