import { getLlmConfig, type LlmConfig } from "@/lib/llm-config";
import { executeFinanceToolCall, FINANCE_TOOLS } from "@/lib/finance-copilot-tools";

type ToolCall = {
  id: string;
  type: string;
  function: { name: string; arguments: string };
};

type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

async function callChatNonStream(
  config: LlmConfig,
  messages: ChatMessage[],
  tools: boolean,
): Promise<{
  message: ChatMessage;
  finishReason: string;
  rawError?: string;
}> {
  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature: 0.25,
    max_tokens: 4096,
  };
  if (tools) {
    body.tools = FINANCE_TOOLS;
    body.tool_choice = "auto";
  }

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    return {
      message: { role: "assistant", content: `Model error (${res.status}): ${text.slice(0, 400)}` },
      finishReason: "error",
      rawError: text,
    };
  }

  let data: {
    choices?: Array<{
      finish_reason?: string;
      message?: {
        role?: string;
        content?: string | null;
        tool_calls?: ToolCall[];
      };
    }>;
  };
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    return {
      message: { role: "assistant", content: "Invalid JSON from model provider." },
      finishReason: "error",
    };
  }

  const choice = data.choices?.[0];
  const msg = choice?.message;
  const finishReason = choice?.finish_reason ?? "stop";

  if (!msg) {
    return {
      message: { role: "assistant", content: "Empty model response." },
      finishReason: "error",
    };
  }

  return {
    message: {
      role: "assistant",
      content: msg.content ?? null,
      tool_calls: msg.tool_calls,
    },
    finishReason,
  };
}

function streamTextAsSse(fullText: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunkSize = 36;

  return new ReadableStream({
    async start(controller) {
      try {
        for (let i = 0; i < fullText.length; i += chunkSize) {
          const piece = fullText.slice(i, i + chunkSize);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: piece } }] })}\n\n`),
          );
          await new Promise((r) => setTimeout(r, 5));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });
}

/**
 * Tool rounds (non-stream) then stream the final assistant tokens from the provider when possible.
 */
export async function createFinanceChatResponseStream(
  systemContent: string,
  userHistory: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<ReadableStream<Uint8Array>> {
  const config = getLlmConfig();
  if (!config) {
    const err = "No LLM configured. Set GROQ_API_KEY (free tier) or OPENAI_API_KEY.";
    return streamTextAsSse(err);
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemContent },
    ...userHistory.map((m) => ({ role: m.role, content: m.content })),
  ];

  const encoder = new TextEncoder();

  for (let round = 0; round < 10; round++) {
    const { message, finishReason, rawError } = await callChatNonStream(config, messages, true);

    const assistantMsg = message as ChatMessage & { tool_calls?: ToolCall[] };
    if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
      messages.push({
        role: "assistant",
        content: assistantMsg.content ?? null,
        tool_calls: assistantMsg.tool_calls,
      });

      for (const tc of assistantMsg.tool_calls) {
        const name = tc.function?.name ?? "";
        let args: Record<string, unknown> = {};
        const rawArgs = tc.function?.arguments;
        try {
          if (typeof rawArgs === "string") {
            args = JSON.parse(rawArgs || "{}") as Record<string, unknown>;
          } else if (rawArgs && typeof rawArgs === "object") {
            args = rawArgs as Record<string, unknown>;
          }
        } catch {
          args = {};
        }
        const result = await executeFinanceToolCall(name, args);
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result,
        });
      }
      continue;
    }

    if (assistantMsg.content?.trim()) {
      return streamTextAsSse(assistantMsg.content);
    }

    if (finishReason === "error" && rawError) {
      return streamTextAsSse(`**Error**\n\n\`\`\`\n${rawError.slice(0, 600)}\n\`\`\``);
    }

    break;
  }

  const nudge: ChatMessage = {
    role: "user",
    content:
      "Using the tool results above, write a clear Markdown answer for the user with ## headings, tables where useful, and bold key numbers. If tools returned errors, explain briefly.",
  };
  messages.push(nudge);

  const finalRes = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.3,
      max_tokens: 4096,
      stream: true,
    }),
  });

  if (!finalRes.ok) {
    const t = await finalRes.text();
    return streamTextAsSse(`**Model error**\n\n${t.slice(0, 500)}`);
  }

  if (!finalRes.body) {
    return streamTextAsSse("Empty stream from model.");
  }

  return new ReadableStream({
    async start(controller) {
      const reader = finalRes.body!.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          sseBuffer += decoder.decode(value, { stream: true });
          for (;;) {
            const ix = sseBuffer.indexOf("\n\n");
            if (ix === -1) {
              break;
            }
            const block = sseBuffer.slice(0, ix);
            sseBuffer = sseBuffer.slice(ix + 2);
            for (const line of block.split("\n")) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) {
                continue;
              }
              const data = trimmed.slice(5).trim();
              if (data === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }
              try {
                const json = JSON.parse(data) as {
                  choices?: Array<{ delta?: { content?: string } }>;
                };
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ choices: [{ delta: { content: delta } }] })}\n\n`,
                    ),
                  );
                }
              } catch {
                /* skip partial */
              }
            }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });
}
