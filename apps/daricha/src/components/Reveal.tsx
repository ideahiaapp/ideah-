"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

const STEP_MS = 0.11;
const BASE_DELAY = 0.15;

export function Reveal({
  active,
  order = 0,
  children,
  className,
  y = 22,
  as = "div",
}: {
  active: boolean;
  order?: number;
  children: ReactNode;
  className?: string;
  y?: number;
  as?: "div" | "span" | "h1" | "h2" | "h3" | "p";
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as as "div"];
  const delay = reduced ? 0 : BASE_DELAY + order * STEP_MS;

  return (
    <Tag
      className={className}
      initial={false}
      animate={active ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: reduced ? 0 : y, filter: reduced ? "none" : "blur(6px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: {
            duration: reduced ? 0.15 : 0.75,
            delay,
            ease: [0.16, 1, 0.3, 1],
          },
        },
      }}
    >
      {children}
    </Tag>
  );
}
