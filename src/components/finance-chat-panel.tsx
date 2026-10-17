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
      setError("Network error. Try again.");
      setMessages((m) => m.filter((x) => x.id !== assistantId));
    } finally {
      setSending(false);
    }
  }, [enabled, hint, input, messages, sending]);

  return (
    <>
      {/* Floating launcher trigger - only shown when chat panel is closed */}
      {!open && (
        <button
          type="button"
          aria-label="Open finance copilot"
          onClick={() => setOpen(true)}
          className="doodle-btn doodle-btn-primary fixed bottom-6 right-6 z-[90] flex h-14 w-14 items-center justify-center p-0 text-2xl shadow-[3px_3px_0px_var(--border)]"
        >
          <span className="select-none font-display text-2xl">✎</span>
        </button>
      )}

      <AnimatePresence>
        {open ? (
          <motion.div
            className="doodle-card fixed bottom-6 right-6 z-[95] flex w-[min(100vw-2rem,430px)] flex-col overflow-hidden p-0 shadow-2xl"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            <div className="doodle-tape doodle-tape-green -top-3 left-6" />
            <div
              className="doodle-tape doodle-tape-dots -top-3 right-6"
              style={{ transform: "rotate(4deg)" }}
            />

            {/* Header */}
            <div className="border-b-2 border-dashed border-[var(--border-soft)] bg-[var(--surface-2)] px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[var(--color-primary)] font-display">✎</span>
                  <p className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)] font-display">
                    Astra Doodle Copilot
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="doodle-btn h-7 w-7 p-0 text-xs flex items-center justify-center rounded-full"
                  aria-label="Close copilot"
                >
                  ✕
                </button>
              </div>

              <p className="mt-1 text-xs text-[var(--muted)] font-hand">
                Tools + live ledger context every send. Markdown answers.
              </p>

              {providerLabel ? (
                <p className="mt-1 text-[10px] uppercase font-mono font-bold text-[var(--color-secondary)]">
                  {providerLabel}
                </p>
              ) : null}

              {enabled === false ? (
                <div className="mt-2.5 rounded-xl border border-dashed border-[var(--color-warning)] bg-[var(--color-warning)]/15 px-3 py-2 text-xs text-[var(--foreground)] font-hand">
                  Set <code className="doodle-badge font-mono text-[10px] bg-[var(--surface)] font-bold text-[var(--foreground)]">GROQ_API_KEY</code>{" "}
                  (free at console.groq.com) or{" "}
                  <code className="doodle-badge font-mono text-[10px] bg-[var(--surface)] font-bold text-[var(--foreground)]">OPENAI_API_KEY</code>.
                </div>
              ) : null}
            </div>

            {/* Messages Body */}
            <div ref={listRef} className="max-h-[min(48vh,380px)] min-h-[160px] space-y-3 overflow-y-auto px-4 py-4 font-hand">
              {messages.length === 0 ? (
                <div className="space-y-2 text-sm font-hand text-[var(--muted)]">
                  <p className="font-medium text-[var(--foreground)]">
                    ✎ Ask about runway, sketch categories, budgets, what changed this month, or how to improve savings pace.
                  </p>
                  {enabled === false && (
                    <p className="text-xs text-[var(--muted-2)] font-mono">
                      Add GROQ_API_KEY (free) or OPENAI_API_KEY on the server to enable chat.
                    </p>
                  )}
                </div>
              ) : null}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 text-sm font-bold leading-relaxed ${
                      m.role === "user" ? "doodle-bubble-user" : "doodle-bubble-copilot"
                    }`}
                  >
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] font-mono">
                      {m.role === "user" ? "You" : "✎ Copilot"}
                    </p>
                    {m.role === "assistant" ? (
                      <FinanceAssistantMarkdown content={m.content} />
                    ) : (
                      <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {error ? (
              <p className="px-4 pb-2 text-xs font-bold text-[var(--color-danger)] font-hand">{error}</p>
            ) : null}

            {/* Inputs & Controls */}
            <div className="space-y-2.5 border-t-2 border-dashed border-[var(--border-soft)] bg-[var(--surface-2)] p-4 font-hand">
              <input
                type="text"
                placeholder="Optional: what you see on screen (section name…)"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                className="doodle-input w-full text-xs"
              />

              <div className="flex gap-2 items-end">
                <textarea
                  rows={2}
                  placeholder="Ask anything about your sketch finances…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  className="doodle-input min-h-[48px] flex-1 resize-none text-sm font-hand"
                />

                <button
                  type="button"
                  disabled={sending || !input.trim()}
                  onClick={() => void send()}
                  className="doodle-btn shrink-0 bg-[#49B6E5] text-[#1A3644] h-[48px] px-5 text-sm font-black shadow-[2px_2px_0px_var(--border)] disabled:opacity-40"
                >
                  <span>Send</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
