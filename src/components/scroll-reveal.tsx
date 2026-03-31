"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/** Easing reminiscent of smooth scroll-synced demos (easeOutExpo-ish). */
export const unfoldEase = [0.19, 1, 0.22, 1] as const;

export const unfoldDuration = 0.85;

export const unfoldBlock: Variants = {
  hidden: { opacity: 0, y: 52, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: unfoldDuration, ease: unfoldEase },
  },
};

export const unfoldStagger: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.06 },
  },
};

export const unfoldItem: Variants = {
  hidden: { opacity: 0, y: 28, skewY: -0.5 },
  show: {
    opacity: 1,
    y: 0,
    skewY: 0,
    transition: { duration: 0.65, ease: unfoldEase },
  },
};

const defaultViewport = {
  once: false,
  amount: 0.22,
  margin: "0px 0px -12% 0px",
} as const;

export function ScrollFold({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={defaultViewport}
      variants={unfoldBlock}
    >
      {children}
    </motion.div>
  );
}

export function ScrollStagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={defaultViewport}
      variants={unfoldStagger}
    >
      {children}
    </motion.div>
  );
}

export function ScrollLine({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={unfoldItem}>
      {children}
    </motion.div>
  );
}

/** Word-by-word title unfold. */
export function UnfoldTitle({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const words = text.split(" ");
  return (
    <motion.h1
      className={className}
      style={{ perspective: 960 }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.5 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
      }}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block origin-bottom"
          style={{ marginRight: "0.28em", transformStyle: "preserve-3d" }}
          variants={{
            hidden: { opacity: 0, y: "1.05em", rotateX: -38 },
            show: {
              opacity: 1,
              y: 0,
              rotateX: 0,
              transition: { duration: 0.72, ease: unfoldEase },
            },
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
}
