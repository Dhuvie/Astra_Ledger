"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { FinanceAssistantMarkdown } from "@/components/finance-assistant-markdown";

type Role = "user" | "assistant";

type Msg = { id: string; role: Role; content: string };

function parseSseDeltas(chunk: string, onDelta: (t: string) => void) {
  const lines = chunk.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) {
      continue;
    }
    const data = trimmed.slice(5).trim();
    if (data === "[DONE]") {
      continue;
    }
    try {
      const json = JSON.parse(data) as {
        choices?: Array<{ delta?: { content?: string } }>;
      };
      const delta = json.choices?.[0]?.delta?.content;
      if (delta) {
        onDelta(delta);
      }
    } catch {
      /* ignore partial JSON */
    }
  }
}

export function FinanceChatPanel() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [providerLabel, setProviderLabel] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [hint, setHint] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch("/api/finance-chat/status")
      .then((r) => r.json() as Promise<{ enabled?: boolean; provider?: string | null; model?: string | null }>)
      .then((j) => {
        setEnabled(Boolean(j.enabled));
        if (j.provider && j.model) {
          setProviderLabel(`${j.provider} · ${j.model}`);
        } else {
          setProviderLabel(null);
        }
      })
      .catch(() => {
        setEnabled(false);
        setProviderLabel(null);
      });
  }, []);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) {
      return;
    }
    if (enabled === false) {
      setError("Add GROQ_API_KEY (free) or OPENAI_API_KEY on the server to enable chat.");
      return;
    }

    setError(null);
    setSending(true);
    setInput("");

    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", content: text };
    const assistantId = `a-${Date.now()}`;
    setMessages((m) => [...m, userMsg, { id: assistantId, role: "assistant", content: "" }]);

    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/finance-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          extraContext: hint.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(j?.error ?? `Request failed (${res.status})`);
        setMessages((m) => m.filter((x) => x.id !== assistantId));
        setSending(false);
        return;
      }

      if (!res.body) {
        setError("No response body.");
        setSending(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const append = (delta: string) => {
        setMessages((m) =>
          m.map((x) => (x.id === assistantId ? { ...x, content: x.content + delta } : x)),
        );
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        for (;;) {
          const ix = buffer.indexOf("\n\n");
          if (ix === -1) {
            break;
          }
          const block = buffer.slice(0, ix);
          buffer = buffer.slice(ix + 2);
          parseSseDeltas(block, append);
        }
      }
      if (buffer.trim()) {
        parseSseDeltas(buffer, append);
      }
    } catch {
      setError("Network error.");
      setMessages((m) => m.filter((x) => x.id !== assistantId));
    } finally {
      setSending(false);
    }
  }, [enabled, hint, input, messages, sending]);

  return (
    <>
      <motion.button
        type="button"
        aria-label="Open finance copilot"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-[90] flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[var(--accent)] bg-[var(--surface)] text-xl text-[var(--accent)] shadow-[var(--shadow-lg)] transition hover:bg-[var(--surface-2)]"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
      >
        <span className="select-none">✦</span>
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed bottom-24 right-6 z-[90] flex w-[min(100vw-2rem,420px)] flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-lg)]"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            <div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[var(--accent)]">
                Astra copilot
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Tools + live ledger context every send. Markdown answers. Free tier: Groq.
              </p>
              {providerLabel ? (
                <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[var(--muted-2)]">
                  {providerLabel}
                </p>
              ) : null}
              {enabled === false ? (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                  Set <code className="rounded border border-[var(--border)] bg-[var(--surface)] px-1">GROQ_API_KEY</code>{" "}
                  (free at console.groq.com) or{" "}
                  <code className="rounded border border-[var(--border)] bg-[var(--surface)] px-1">OPENAI_API_KEY</code>.
                </p>
              ) : null}
            </div>

            <div ref={listRef} className="max-h-[min(52vh,420px)] space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  Ask about runway, categories, budgets, what changed this month, or how to improve
                  savings rate. Optional: describe what section you are looking at below.
                </p>
              ) : null}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "ms-6 border-2 border-[var(--accent)] bg-[var(--surface-2)] text-[var(--foreground)]"
                      : "me-4 border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)]"
                  }`}
                >
                  <p className="mb-1 text-[9px] uppercase tracking-[0.2em] text-[var(--muted-2)]">
                    {m.role === "user" ? "You" : "Copilot"}
                  </p>
                  {m.role === "assistant" ? (
                    <FinanceAssistantMarkdown content={m.content} />
                  ) : (
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  )}
                </div>
              ))}
            </div>

            {error ? <p className="px-4 pb-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}

            <div className="space-y-2 border-t border-[var(--border)] bg-[var(--surface-2)] p-4">
              <input
                type="text"
                placeholder="Optional: what you see on screen (section name…)"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-xs text-[var(--foreground)] outline-none placeholder:text-[var(--muted-2)] focus:border-[var(--accent)]"
              />
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  placeholder="Ask anything about your finances…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  className="min-h-[44px] flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-2)] focus:border-[var(--accent)]"
                />
                <button
                  type="button"
                  disabled={sending || !input.trim()}
                  onClick={() => void send()}
                  className="shrink-0 self-end rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent-ink)] disabled:opacity-35"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
