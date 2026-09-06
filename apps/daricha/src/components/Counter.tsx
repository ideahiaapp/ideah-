"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

export function Counter({
  value,
  active,
  duration = 1.6,
  delay = 0.2,
  suffix = "",
  prefix = "",
  format,
  className,
}: {
  value: number;
  active: boolean;
  duration?: number;
  delay?: number;
  suffix?: string;
  prefix?: string;
  format?: (n: number) => string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const reduced = useReducedMotion();

  // Cada slide monta um único Counter por vez (o slide anterior desmonta ao
  // navegar), então o efeito de montagem é o próprio gatilho da contagem —
  // sem precisar de uma ref "já tocou" para não disparar de novo.
  useEffect(() => {
    if (!active) {
      setDisplay(0);
      return;
    }
    if (reduced) {
      setDisplay(value);
      return;
    }
    setDisplay(0);
    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [active, value, duration, delay, reduced]);

  return (
    <span className={className}>
      {prefix}
      {format ? format(display) : display}
      {suffix}
    </span>
  );
}
