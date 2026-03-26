import { createManualTransaction } from "@/lib/manual-transactions";

const categoryKeywords: Array<{ category: string; keywords: string[] }> = [
  { category: "FOOD_AND_DRINK", keywords: ["food", "groceries", "grocery", "restaurant", "coffee", "lunch"] },
  { category: "TRANSPORTATION", keywords: ["uber", "ola", "taxi", "fuel", "metro", "bus"] },
  { category: "RENT_AND_UTILITIES", keywords: ["rent", "electricity", "water", "internet", "utility"] },
  { category: "SHOPPING", keywords: ["amazon", "shopping", "clothes", "purchase"] },
  { category: "ENTERTAINMENT", keywords: ["movie", "netflix", "spotify", "game"] },
  { category: "INCOME", keywords: ["salary", "income", "freelance", "paid", "received", "bonus"] },
];

export type QuickAddParseResult = {
  name: string;
  amount: number;
  type: "expense" | "income";
  date: string;
  primaryCategory: string;
};

export function parseQuickAdd(input: string): QuickAddParseResult | null {
  const normalized = input.trim();

  if (!normalized) {
    return null;
  }

  const lower = normalized.toLowerCase();
  const amountMatch = lower.match(/(\d[\d,]*(?:\.\d+)?)/);

  if (!amountMatch) {
    return null;
  }

  const rawAmount = Number(amountMatch[1].replace(/,/g, ""));

  if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
    return null;
  }

  const type: "expense" | "income" =
    /(salary|income|received|earned|bonus|credited)/.test(lower) ? "income" : "expense";

  const date = resolveDate(lower);
  const primaryCategory = detectCategory(lower, type);
  const cleanedName = normalized
    .replace(amountMatch[1], "")
    .replace(/today|yesterday|tomorrow/gi, "")
    .replace(/\b(spent|paid|received|earned|income|salary|on|for|from)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const name = cleanedName
    ? cleanedName
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : type === "income"
      ? "Manual Income"
      : "Manual Expense";

  return {
    name,
    amount: rawAmount,
    type,
    date,
    primaryCategory,
  };
}

export async function createTransactionFromQuickAdd(input: string) {
  const parsed = parseQuickAdd(input);

  if (!parsed) {
    throw new Error("Could not parse quick add command.");
  }

  const signedAmount = parsed.type === "income" ? -parsed.amount : parsed.amount;

  const transaction = await createManualTransaction({
    name: parsed.name,
    amount: signedAmount,
    date: parsed.date,
    primaryCategory: parsed.primaryCategory,
    merchantName: parsed.name,
  });

  return { parsed, transaction };
}

function detectCategory(input: string, type: "expense" | "income") {
  if (type === "income") {
    return "INCOME";
  }

  for (const entry of categoryKeywords) {
    if (entry.keywords.some((keyword) => input.includes(keyword))) {
      return entry.category;
    }
  }

  return "SHOPPING";
}

function resolveDate(input: string) {
  const now = new Date();

  if (input.includes("yesterday")) {
    now.setDate(now.getDate() - 1);
  } else if (input.includes("tomorrow")) {
    now.setDate(now.getDate() + 1);
  }

  const explicit = input.match(/\b(20\d{2}-\d{2}-\d{2})\b/);

  if (explicit) {
    return explicit[1];
  }

  return now.toISOString().slice(0, 10);
}
