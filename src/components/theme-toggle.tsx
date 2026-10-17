"use client";

import { useTheme } from "@/components/theme-provider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="doodle-btn flex h-9 w-9 items-center justify-center p-0"
      aria-label="Toggle notebook theme"
    >
      <span className="theme-toggle-light">
        <Sun className="h-4 w-4" />
      </span>
      <span className="theme-toggle-dark">
        <Moon className="h-4 w-4" />
      </span>
    </button>
  );
}
