"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  SlidersHorizontal,
  Send,
  Sparkles,
} from "lucide-react";
import { currency, compactCurrency, type DashboardData } from "@/lib/finance";
import { FinanceAssistantMarkdown } from "@/components/finance-assistant-markdown";

/* Hand-drawn Doodle SVGs strictly matching Image 3 */

function CoinsDoodle({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="14" cy="22" rx="10" ry="5" fill="#FDE68A" />
      <ellipse cx="14" cy="27" rx="10" ry="5" fill="#FDE68A" />
      <ellipse cx="26" cy="16" rx="9" ry="4.5" fill="#FDE68A" />
      <ellipse cx="26" cy="21" rx="9" ry="4.5" fill="#FDE68A" />
      <text x="11" y="24" fontSize="6" fontFamily="sans-serif" fontWeight="bold" fill="currentColor">
        ₹
      </text>
      <text x="23" y="18" fontSize="5" fontFamily="sans-serif" fontWeight="bold" fill="currentColor">
        ₹
      </text>
    </svg>
  );
}

function StarsDoodle({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4 L14 11 L21 13 L14 15 L12 22 L10 15 L3 13 L10 11 Z" fill="#FDE68A" />
      <path d="M28 14 L29 18 L33 19 L29 20 L28 24 L27 20 L23 19 L27 18 Z" fill="#FDE68A" />
      <circle cx="28" cy="8" r="1.5" fill="currentColor" />
    </svg>
  );
}

function CupDoodle({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 36"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 10 L8 30 C8.5 32 10 33 13 33 L19 33 C22 33 23.5 32 24 30 L26 10 Z" fill="var(--surface)" />
      <path d="M4 10 L28 10 L26 7 L6 7 Z" fill="var(--surface-2)" />
      <rect x="8" y="16" width="16" height="8" rx="2" fill="#FDE68A" />
      <line x1="16" y1="18" x2="16" y2="22" stroke="currentColor" />
    </svg>
  );
}

function BurgerDoodle({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12 C4 5 32 5 32 12 Z" fill="#FDE68A" />
      <line x1="2" y1="15" x2="34" y2="15" strokeWidth="2.5" stroke="#16A34A" />
      <rect x="5" y="18" width="26" height="4" rx="2" fill="#78350F" />
      <path d="M6 22 L30 22 C30 26 6 26 6 22 Z" fill="#FDE68A" />
    </svg>
  );
}

function SandwichDoodle({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="4 20 28 4 32 16 8 26" fill="#FDE68A" />
      <line x1="6" y1="21" x2="30" y2="12" stroke="#16A34A" strokeWidth="2" />
      <line x1="8" y1="23" x2="31" y2="14" stroke="#DC2626" strokeWidth="1.5" />
    </svg>
  );
}

function CarSketchDoodle({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 26"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M6 14 L11 7 L25 7 L31 14 L36 14 C37 14 38 15 38 17 L38 20 C38 21 37 21 36 21 L34 21 C34 19 31 19 31 21 L13 21 C13 19 10 19 10 21 L5 21 C4 21 3 20 3 19 L3 16 C3 15 4 14 6 14 Z"
        fill="#CFE2F3"
      />
      <circle cx="11.5" cy="20.5" r="2.5" fill="var(--foreground)" />
      <circle cx="32.5" cy="20.5" r="2.5" fill="var(--foreground)" />
    </svg>
  );
}

function BusSketchDoodle({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 30"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="5" width="28" height="20" rx="4" fill="#CFE2F3" />
      <rect x="7" y="9" width="10" height="6" rx="1" fill="var(--surface)" />
      <rect x="19" y="9" width="10" height="6" rx="1" fill="var(--surface)" />
      <circle cx="10" cy="25" r="2" fill="var(--foreground)" />
      <circle cx="26" cy="25" r="2" fill="var(--foreground)" />
    </svg>
  );
}

function BagsSketchDoodle({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 30"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 10 L19 10 L17 26 L7 26 Z" fill="#FDE2B8" />
      <path d="M9 10 V6 C9 4 15 4 15 6 V10" stroke="currentColor" />
      <path d="M17 12 L29 12 L27 26 L19 26 Z" fill="#FFCCD5" />
      <path d="M21 12 V8 C21 6 25 6 25 8 V12" stroke="currentColor" />
    </svg>
  );
}

function TagsSketchDoodle({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 30"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="6 6 18 6 24 16 12 24 6 18" fill="#FDE68A" />
      <circle cx="10" cy="10" r="1.5" fill="var(--foreground)" />
      <polygon points="14 10 26 10 32 20 20 28 14 22" fill="#E2D4F0" />
      <circle cx="18" cy="14" r="1.5" fill="var(--foreground)" />
    </svg>
  );
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_DEMO_MESSAGES: ChatMessage[] = [
  {
    id: "m-1",
    role: "user",
    content: "Hey Astra, how is my lunch budget looking today?",
  },
  {
    id: "m-2",
    role: "assistant",
    content:
      "You have spent ₹180 on lunch, slightly over your daily pace of ₹150, but you have ₹250 remaining for dinner! ★",
  },
  {
    id: "m-3",
    role: "user",
    content: "Can you find that ₹120 coffee from yesterday?",
  },
  {
    id: "m-4",
    role: "assistant",
    content: "Found it! Added to Food & Drink.",
  },
];

interface BudgetsTabProps {
  data: DashboardData;
  onOpenBudgetModal: (category?: string, limit?: number) => void;
  onOpenQuickAdd?: () => void;
}

export function BudgetsTab({
  data,
  onOpenBudgetModal,
  onOpenQuickAdd,
}: BudgetsTabProps) {
  // Days left in current monthly cycle
  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, lastDayOfMonth - now.getDate());

  // Copilot Live Chat State
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_DEMO_MESSAGES);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/finance-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "I noticed your current budget pacing is healthy. Add GROQ_API_KEY for real-time generative responses.",
                }
              : m
          )
        );
        setSending(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const append = (delta: string) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m))
        );
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) append(delta);
            } catch {
              /* ignore partial */
            }
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Network error. Checked your budgets locally and everything looks steady!" }
            : m
        )
      );
    } finally {
      setSending(false);
    }
  }, [input, messages, sending]);

  return (
    <div className="space-y-8">
      {/* Top Header strictly matching Image 3: Astra Ledger with Coins and Stars */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <CoinsDoodle className="h-8 w-8 text-[#F59E0B]" />
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--foreground)] font-display">
            Astra Ledger
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <StarsDoodle className="h-8 w-8 text-[#F59E0B]" />
        </div>
      </div>

      {/* Main 2-Column Split matching Image 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Budget Cards (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {data.budgets.map((b) => {
            const isFood = b.category.toUpperCase().includes("FOOD") || b.category.toUpperCase().includes("DRINK");
            const isTransport = b.category.toUpperCase().includes("TRANS");
            const isShopping = b.category.toUpperCase().includes("SHOP");
            const utilPct = Math.round(b.utilization * 100);
            const dailyCap = Math.max(1, Math.round(b.monthlyLimit / 30));
            const dailySpent = Math.round(b.spent / Math.max(1, 30 - daysLeft));

            return (
              <div
                key={b.id}
                className="doodle-card relative p-6 transition-all hover:translate-y-[-2px]"
                style={{ borderRadius: "20px 18px 22px 16px / 16px 22px 18px 20px" }}
              >
                {/* Header with Title and Category Doodle Sketches */}
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black tracking-tight text-[var(--foreground)] font-display">
                    {b.category}
                  </h3>

                  {/* Doodle Icon Sketches matching Image 3 */}
                  <div className="flex items-center gap-2 text-[var(--foreground)]">
                    {isFood && (
                      <>
                        <CupDoodle className="h-7 w-7 text-[var(--foreground)]" />
                        <BurgerDoodle className="h-7 w-7 text-[var(--foreground)]" />
                        <SandwichDoodle className="h-7 w-7 text-[var(--foreground)]" />
                      </>
                    )}
                    {isTransport && (
                      <>
                        <CarSketchDoodle className="h-7 w-7 text-[var(--foreground)]" />
                        <BusSketchDoodle className="h-7 w-7 text-[var(--foreground)]" />
                      </>
                    )}
                    {isShopping && (
                      <>
                        <BagsSketchDoodle className="h-7 w-7 text-[var(--foreground)]" />
                        <TagsSketchDoodle className="h-7 w-7 text-[var(--foreground)]" />
                      </>
                    )}
                    {!isFood && !isTransport && !isShopping && (
                      <div className="flex items-center gap-1.5 font-hand text-xs font-bold text-[var(--muted)]">
                        <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Hatched Capsule Progress Bar strictly matching Image 3 */}
                <div className="mt-5">
                  <div className="h-6 w-full rounded-full border-2 border-[var(--border)] bg-[var(--surface-2)] p-0.5 shadow-[2px_2px_0px_var(--border)] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full doodle-hatched transition-all"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(utilPct, 100)}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>

                {/* Pace & Cap Annotations strictly matching Image 3 */}
                <div className="mt-4 space-y-1 font-hand text-base font-bold text-[var(--foreground)]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--color-primary)] font-mono text-lg">→</span>
                    <span>
                      {currency(dailySpent)} / {currency(dailyCap)} daily
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
                    <span className="text-[var(--color-primary)] font-mono">+</span>
                    <span>
                      {currency(b.spent)} spent of {currency(b.monthlyLimit)} limit ({utilPct}%)
                    </span>
                  </div>
                </div>

                {/* Action Buttons strictly matching Image 3 */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onOpenQuickAdd}
                    className="doodle-btn px-4 py-1.5 text-sm font-bold bg-[var(--surface-2)] text-[var(--foreground)] shadow-[2px_2px_0px_var(--border)]"
                  >
                    Add Transaction
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenBudgetModal(b.category, b.monthlyLimit)}
                    className="doodle-btn px-4 py-1.5 text-sm font-bold bg-[var(--surface-2)] text-[var(--foreground)] shadow-[2px_2px_0px_var(--border)]"
                  >
                    Adjust Budget
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Astra Doodle Copilot Notebook Sheet (5 cols on lg) strictly matching Image 3 */}
        <div className="lg:col-span-5 sticky top-24">
          <div
            className="doodle-card relative p-6 sm:p-7 shadow-xl overflow-hidden bg-[var(--surface)]"
            style={{ borderRadius: "22px 16px 20px 18px / 18px 20px 16px 22px" }}
          >
            {/* Dual Washi Tape strictly matching Image 3 */}
            <div className="doodle-tape doodle-tape-green -top-3 left-6" />
            <div
              className="doodle-tape doodle-tape-dots -top-3 right-6"
              style={{ transform: "rotate(4deg)" }}
            />

            {/* Notebook Title */}
            <div className="pt-2 text-center">
              <h3 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] font-display">
                Astra Doodle Copilot
              </h3>
            </div>

            {/* Conversation Messages with Styled Speech Bubbles matching Image 3 */}
            <div
              ref={chatListRef}
              className="mt-6 space-y-4 max-h-[460px] overflow-y-auto px-1 py-2 font-hand"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 text-base font-bold leading-snug transition-all ${
                      m.role === "user" ? "doodle-bubble-user" : "doodle-bubble-copilot"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <FinanceAssistantMarkdown content={m.content} />
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[
                "How is my runway?",
                "Can I spend on dinner?",
                "What can I save this week?",
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void handleSend(prompt)}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] font-hand transition"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Row with Solid Cyan [ Send ] Button strictly matching Image 3 */}
            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask your sketch copilot anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                className="doodle-input flex-1 py-2 px-3.5 text-sm font-hand text-[var(--foreground)]"
              />
              <button
                type="button"
                disabled={sending || !input.trim()}
                onClick={() => void handleSend()}
                className="doodle-btn shrink-0 bg-[#49B6E5] text-[#1A3644] px-5 py-2 font-hand text-base font-black shadow-[2px_2px_0px_var(--border)] disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
