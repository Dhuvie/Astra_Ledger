"use client";

import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      data-cursor="active"
      className="astra-glass-chip rounded-full px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
      aria-label="Toggle theme"
    >
      <span className="theme-toggle-light">Light</span>
      <span className="theme-toggle-dark">Dark</span>
    </button>
  );
}
