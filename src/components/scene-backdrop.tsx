"use client";

export type SceneTheme = "light" | "dark";

/**
 * Ultra-fast, pure CSS executive backdrop:
 * Replaces heavy Three.js / WebGL with an elegant, responsive ambient lighting gradient.
 * Zero CPU, zero GPU overhead, instant rendering.
 * Fully hydration-safe via CSS class selectors.
 */
export function SceneBackdrop({ theme }: { theme?: SceneTheme }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Top Ambient Glow */}
      <div className="ambient-glow-top absolute -top-32 left-1/2 -translate-x-1/2 h-[520px] w-[900px] max-w-[100vw] rounded-full blur-[140px] transition-opacity duration-700" />

      {/* Subtle Side Refraction */}
      <div className="ambient-glow-side absolute top-1/3 -right-48 h-[400px] w-[500px] rounded-full blur-[160px] transition-opacity duration-700" />
    </div>
  );
}
