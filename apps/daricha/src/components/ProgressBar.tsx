"use client";

import { motion } from "framer-motion";
import { TOTAL_SLIDES } from "@/lib/slideMeta";

export function ProgressBar({ index, onJump }: { index: number; onJump?: (i: number) => void }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-40 flex gap-1.5 px-4"
      style={{ paddingTop: "max(0.9rem, env(safe-area-inset-top))" }}
      role="tablist"
      aria-label="Progresso da apresentação"
    >
      {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === index}
          aria-label={`Ir para a tela ${i + 1} de ${TOTAL_SLIDES}`}
          onClick={onJump ? () => onJump(i) : undefined}
          className={`pointer-events-auto h-[3px] flex-1 overflow-hidden rounded-full bg-cream-100/20 ${
            onJump ? "cursor-pointer" : "cursor-default"
          }`}
        >
          <motion.span
            className="block h-full rounded-full bg-cream-100"
            initial={false}
            animate={{
              width: i < index ? "100%" : i === index ? "100%" : "0%",
              opacity: i <= index ? 1 : 0,
            }}
            transition={{ duration: i === index ? 0.5 : 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </button>
      ))}
    </div>
  );
}
