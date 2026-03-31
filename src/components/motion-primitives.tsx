"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { useRef } from "react";

export const springSnappy = { type: "spring" as const, stiffness: 420, damping: 34 };

export const staggerContainer: import("framer-motion").Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.055, delayChildren: 0.06 },
  },
};

export const staggerItem: import("framer-motion").Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: springSnappy,
  },
};

export const chipReveal: import("framer-motion").Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 520, damping: 28 },
  },
};

export const listParent: import("framer-motion").Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

export const listItem: import("framer-motion").Variants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 380, damping: 32 } },
};

type TiltPanelProps = HTMLMotionProps<"div">;

export function TiltPanel({ children, className, style, ...rest }: TiltPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const smoothX = useSpring(x, { stiffness: 280, damping: 36 });
  const smoothY = useSpring(y, { stiffness: 280, damping: 36 });
  const rotateX = useTransform(smoothY, [0, 1], [2.8, -2.8]);
  const rotateY = useTransform(smoothX, [0, 1], [-3.5, 3.5]);

  return (
    <motion.div
      ref={ref}
      className={`will-change-transform ${className ?? ""}`}
      style={{ rotateX, rotateY, transformPerspective: 1400, ...style }}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width);
        y.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        x.set(0.5);
        y.set(0.5);
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function MotionHeroPanel({ children, className, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div className={className} {...rest}>
      {children}
    </motion.div>
  );
}

export function AnimatedMeterBar({
  className,
  widthPct,
  delay = 0,
}: {
  className: string;
  widthPct: number;
  delay?: number;
}) {
  const w = Math.max(widthPct, 6);
  return (
    <motion.div
      className={`h-2 rounded-full ${className}`}
      initial={{ width: "0%" }}
      animate={{ width: `${w}%` }}
      transition={{ delay, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}
