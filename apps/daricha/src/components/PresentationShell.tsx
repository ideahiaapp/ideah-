"use client";

import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { useCallback } from "react";
import { usePresentation } from "@/lib/usePresentation";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { ProgressBar } from "@/components/ProgressBar";
import { SLIDES } from "@/slides";
import { TOTAL_SLIDES } from "@/lib/slideMeta";

const DRAG_THRESHOLD = 90;
const VELOCITY_THRESHOLD = 500;

export function PresentationShell() {
  const { index, direction, next, prev, goTo } = usePresentation();
  const reduced = useReducedMotion();
  const Slide = SLIDES[index];

  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-tap-safe="true"]')) return;
      const x = e.clientX;
      const width = window.innerWidth;
      if (x < width * 0.32) prev();
      else next();
    },
    [next, prev],
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.x < -DRAG_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD) {
        next();
      } else if (info.offset.x > DRAG_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD) {
        prev();
      }
    },
    [next, prev],
  );

  const variants = reduced
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (dir: number) => ({ x: dir >= 0 ? "12%" : "-12%", opacity: 0, scale: 0.98 }),
        center: { x: 0, opacity: 1, scale: 1 },
        exit: (dir: number) => ({ x: dir >= 0 ? "-12%" : "12%", opacity: 0, scale: 0.98 }),
      };

  return (
    <div className="fixed inset-0 select-none bg-wine-950 text-cream-50">
      <div className="relative h-[100dvh] w-full overflow-hidden" onClick={handleTap}>
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduced ? 0.2 : 0.55, ease: [0.16, 1, 0.3, 1] }}
            drag={reduced ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.14}
            onDragEnd={handleDragEnd}
            className="absolute inset-0"
          >
            <Slide active />
          </motion.div>
        </AnimatePresence>
      </div>

      <ProgressBar index={index} onJump={goTo} />

      <div
        data-tap-safe="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden items-center justify-between px-6 sm:flex"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <NavButton direction="prev" onClick={prev} disabled={index === 0} />
        <span className="pointer-events-none text-xs tracking-wider text-cream-100/50">
          {index + 1} / {TOTAL_SLIDES}
        </span>
        <NavButton direction="next" onClick={next} disabled={index === TOTAL_SLIDES - 1} />
      </div>
    </div>
  );
}

function NavButton({
  direction,
  onClick,
  disabled,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      data-tap-safe="true"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "next" ? "Próximo" : "Anterior"}
      className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-cream-100/20 bg-wine-950/60 text-cream-50 backdrop-blur transition-opacity disabled:opacity-0"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d={direction === "next" ? "M6 3l5 5-5 5" : "M10 3l-5 5 5 5"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
