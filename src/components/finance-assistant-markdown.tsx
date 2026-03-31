"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const mdBase =
  "text-[13px] leading-relaxed text-[var(--foreground)] [&_p]:my-2 [&_p:first-child]:mt-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_strong]:font-semibold [&_strong]:text-[var(--foreground)] [&_a]:text-[var(--accent)] [&_a]:underline [&_hr]:my-4 [&_hr]:border-[var(--border)]";

export function FinanceAssistantMarkdown({ content }: { content: string }) {
  if (!content.trim()) {
    return <span className="text-[var(--muted-2)]">…</span>;
  }

  return (
    <div className={mdBase}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h3 className="mb-2 mt-4 text-base font-semibold tracking-tight text-[var(--foreground)] first:mt-0">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h3 className="mb-2 mt-4 text-[15px] font-semibold tracking-tight text-[var(--accent)] first:mt-0">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="mb-1.5 mt-3 text-sm font-semibold text-[var(--accent-muted)]">{children}</h4>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = Boolean(className);
            if (!isBlock) {
              return (
                <code
                  className="rounded border border-[var(--border)] bg-[var(--input-bg)] px-1 py-0.5 font-mono text-[12px] text-[var(--foreground)]"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className="block font-mono text-[11px] text-[var(--foreground)]" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-3 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--input-bg)] p-3">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="w-full border-collapse text-left text-[12px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[var(--surface-2)] text-[var(--foreground)]">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-[var(--border)] px-3 py-2 font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-b border-[var(--border)] px-3 py-2 text-[var(--foreground)]">{children}</td>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-4 border-[var(--accent)] pl-3 text-[var(--muted)] italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
