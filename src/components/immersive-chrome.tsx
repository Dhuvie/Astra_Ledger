"use client";

import { useEffect, useRef } from "react";

/**
 * Global pointer-driven atmosphere: CSS variables for gradients + 3D,
 * plus an optional custom cursor on fine pointers.
 */
export function ImmersiveChrome({ children }: { children: React.ReactNode }) {
  const activeRef = useRef(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const hovering = useRef(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const apply = (active: boolean) => {
      activeRef.current = active;
      document.documentElement.classList.toggle("astra-immersive", active);
      if (ringRef.current) ringRef.current.style.display = active ? "block" : "none";
      if (cursorRef.current) cursorRef.current.style.display = active ? "block" : "none";
    };

    const onChange = () => {
      const active = fine.matches && !reduce.matches;
      apply(active);
    };
    fine.addEventListener("change", onChange);
    reduce.addEventListener("change", onChange);
    onChange();
    return () => {
      fine.removeEventListener("change", onChange);
      reduce.removeEventListener("change", onChange);
      document.documentElement.classList.remove("astra-immersive");
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    const setVars = (clientX: number, clientY: number) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const nx = (clientX / w) * 2 - 1;
      const ny = (clientY / h) * 2 - 1;
      root.style.setProperty("--ptr-x", `${(clientX / w) * 100}%`);
      root.style.setProperty("--ptr-y", `${(clientY / h) * 100}%`);
      root.style.setProperty("--ptr-nx", nx.toFixed(5));
      root.style.setProperty("--ptr-ny", ny.toFixed(5));
      target.current.x = clientX;
      target.current.y = clientY;
    };

    const updateCursor = () => {
      const cx = cursorRef.current;
      const ring = ringRef.current;
      if (!cx || !ring) return;
      const tx = target.current.x;
      const ty = target.current.y;
      const scale = hovering.current ? 1.55 : 1;
      const dotScale = hovering.current ? 0.35 : 1;

      // Direct transforms: removes the "chasing" lag from smoothing.
      cx.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%) scale(${dotScale})`;
      ring.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%) scale(${scale})`;
    };

    const onPointerMove = (e: PointerEvent) => {
      setVars(e.clientX, e.clientY);
      if (!activeRef.current) {
        return;
      }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      hovering.current = Boolean(
        el?.closest(
          "button, a, input, textarea, select, label, [role='button'], [data-cursor='active']",
        ),
      );
      updateCursor();
    };

    const onPointerLeave = () => {
      hovering.current = false;
      updateCursor();
    };

    setVars(window.innerWidth / 2, window.innerHeight / 2);
    updateCursor();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      root.style.removeProperty("--ptr-x");
      root.style.removeProperty("--ptr-y");
      root.style.removeProperty("--ptr-nx");
      root.style.removeProperty("--ptr-ny");
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[200]"
        style={{
          display: "none",
          width: 42,
          height: 42,
          borderRadius: 9999,
          border: "2px solid var(--cursor-ring)",
          boxShadow: "0 0 0 1px color-mix(in srgb, var(--cursor-ring) 25%, transparent)",
          willChange: "transform",
        }}
      />
      <div
        ref={cursorRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[201]"
        style={{
          display: "none",
          width: 7,
          height: 7,
          borderRadius: 9999,
          background: "var(--cursor-dot)",
          border: "1px solid color-mix(in srgb, var(--foreground) 35%, transparent)",
          boxShadow: "0 2px 12px color-mix(in srgb, var(--accent) 45%, transparent)",
          willChange: "transform",
        }}
      />
      {children}
    </>
  );
}
