"use client";

import type { ReactNode } from "react";

/**
 * TypeUI DOODLE Style Hero Card matching Image 1:
 * Lined notebook paper aesthetic with ruled horizontal lines,
 * pink margin rule, punched paper binder holes, and corner washi tape.
 */
export function DepthHero({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative mx-auto w-full max-w-5xl border-[2.5px] border-[var(--border)] bg-[var(--surface)] px-6 py-8 sm:px-10 sm:py-10 ${
        className ?? ""
      }`}
      style={{
        borderRadius: "20px 16px 22px 18px / 18px 22px 16px 20px",
        boxShadow: "var(--shadow-doodle-lg)",
        backgroundImage:
          "repeating-linear-gradient(transparent, transparent 33px, var(--border-soft) 33px, var(--border-soft) 34px)",
        backgroundPosition: "0 18px",
      }}
    >
      {/* Hand-drawn washi tape placed diagonally across the top-right corner */}
      <div
        className="pointer-events-none absolute -top-3 right-8 h-7 w-24 rotate-6 border border-[var(--border)] bg-[#fef08a]/90 shadow-sm z-20"
        style={{
          borderRadius: "1px",
          maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      />

      {/* Binder Punch-Holes on far left */}
      <div className="pointer-events-none absolute left-3 top-0 bottom-0 flex flex-col justify-around py-8 z-10">
        <div className="h-3.5 w-3.5 rounded-full border border-[var(--border)] bg-[var(--background)] shadow-inner" />
        <div className="h-3.5 w-3.5 rounded-full border border-[var(--border)] bg-[var(--background)] shadow-inner" />
        <div className="h-3.5 w-3.5 rounded-full border border-[var(--border)] bg-[var(--background)] shadow-inner" />
      </div>

      {/* Pink Notebook Left Margin Rule */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-rose-400/40 dark:border-rose-500/30 ml-3 sm:ml-4">
        {children}
      </div>
    </div>
  );
}
