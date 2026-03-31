export type LlmConfig = {
  apiKey: string;
  /** OpenAI-compatible base, e.g. https://api.groq.com/openai/v1 */
  baseUrl: string;
  model: string;
  provider: "groq" | "openai" | "custom";
};

/**
 * Prefer **Groq** (generous free tier, OpenAI-compatible API).
 * Fallback: OpenAI, then any OpenAI-compatible endpoint (Ollama, LM Studio, etc.).
 */
export function getLlmConfig(): LlmConfig | null {
  const groq = process.env.GROQ_API_KEY?.trim();
  if (groq) {
    return {
      apiKey: groq,
      baseUrl: "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
      provider: "groq",
    };
  }

  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) {
    return {
      apiKey: openai,
      baseUrl: "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      provider: "openai",
    };
  }

  const customUrl = process.env.LLM_BASE_URL?.trim();
  const customKey = process.env.LLM_API_KEY?.trim();
  if (customUrl && customKey) {
    return {
      apiKey: customKey,
      baseUrl: customUrl.replace(/\/$/, ""),
      model: process.env.LLM_MODEL?.trim() || "gpt-4o-mini",
      provider: "custom",
    };
  }

  return null;
}
