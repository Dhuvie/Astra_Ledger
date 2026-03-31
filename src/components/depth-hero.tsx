"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";

const stiff = { stiffness: 120, damping: 18, mass: 0.4 };

/**
 * Large, obvious 3D: pointer-driven tilt + subtle scroll-linked roll.
 */
export function DepthHero({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: zoneRef,
    offset: ["start start", "end start"],
  });
  const scrollTwist = useTransform(scrollYProgress, [0, 1], [0, 18]);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const tiltY = useSpring(useTransform(px, [0, 1], [22, -22]), stiff);
  const tiltX = useSpring(useTransform(py, [0, 1], [-16, 16]), stiff);
  const combinedY = useTransform([tiltY, scrollTwist], ([ty, s]) => Number(ty) + Number(s) * 0.35);
  const glowX = useTransform(px, [0, 1], [10, 90]);
  const glowY = useTransform(py, [0, 1], [14, 86]);
  const glowBg = useMotionTemplate`radial-gradient(ellipse at ${glowX}% ${glowY}%, var(--hero-glow), transparent 62%)`;

  return (
    <div
      ref={zoneRef}
      className={`relative min-h-[88vh] flex flex-col items-center justify-center px-6 py-20 ${className ?? ""}`}
      style={{ perspective: 1400 }}
    >
      {/* Decorative 3D orbit — always moving */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[42%] h-[min(72vw,420px)] w-[min(72vw,420px)]"
        style={{
          transformStyle: "preserve-3d",
          transform:
            "translate(calc(-50% + (var(--ptr-nx, 0) * 32px)), calc(-50% + (var(--ptr-ny, 0) * 22px)))",
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-[40%] border-2 border-[var(--accent)]"
          style={{ opacity: 0.85, rotateX: 58, rotateZ: 0, transformStyle: "preserve-3d" }}
          animate={{ rotateZ: 360 }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-[12%] rounded-full border border-[var(--border)]"
          style={{ opacity: 0.9, rotateX: 72, rotateY: 0, transformStyle: "preserve-3d" }}
          animate={{ rotateY: 360 }}
          transition={{ duration: 19, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-[26%] rounded-2xl border border-[var(--border)]"
          style={{ opacity: 0.88, rotateX: -22, transformStyle: "preserve-3d" }}
          animate={{ rotateY: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      <motion.div
        className="relative z-10 w-full max-w-lg"
        style={{
          transformStyle: "preserve-3d",
          rotateX: tiltX,
          rotateY: combinedY,
          translateZ: 48,
        }}
        onPointerMove={(e) => {
          const el = e.currentTarget;
          const r = el.getBoundingClientRect();
          px.set((e.clientX - r.left) / r.width);
          py.set((e.clientY - r.top) / r.height);
        }}
        onPointerLeave={() => {
          px.set(0.5);
          py.set(0.5);
        }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <motion.div
          className="absolute -inset-[10px] rounded-[32px] blur-2xl"
          style={{ background: glowBg, opacity: 0.95 }}
        />
        <div className="astra-glass relative overflow-hidden rounded-[28px]">
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              backgroundImage: `linear-gradient(to bottom right, color-mix(in srgb, var(--accent) 14%, transparent), transparent 45%, color-mix(in srgb, var(--accent) 10%, transparent))`,
            }}
          />
          <div className="relative p-10 sm:p-12">{children}</div>
        </div>
      </motion.div>

    </div>
  );
}

/** Second band: chart card rotates on Y as it crosses the viewport */
export function DepthScrollPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.15"],
  });
  const rotY = useTransform(scrollYProgress, [0, 0.5, 1], [-14, 0, 14]);
  const rotX = useTransform(scrollYProgress, [0, 0.5, 1], [8, 0, -6]);
  const lift = useTransform(scrollYProgress, [0, 0.45, 1], [40, 0, 24]);

  return (
    <div ref={ref} className={`py-20 ${className ?? ""}`} style={{ perspective: 1100 }}>
      <motion.div
        style={{
          transformStyle: "preserve-3d",
          rotateY: rotY,
          rotateX: rotX,
          y: lift,
          transformPerspective: 1100,
        }}
        className="astra-glass mx-auto w-full max-w-xl rounded-[24px] p-6 sm:p-8"
      >
        {children}
      </motion.div>
    </div>
  );
}
