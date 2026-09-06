"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function AxisCard({
  n,
  title,
  description,
}: {
  n: string;
  title: string;
  description: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      data-tap-safe="true"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      className="w-full rounded-2xl border border-cream-100/12 bg-cream-100/[0.04] px-5 py-4 text-left transition-colors active:bg-cream-100/[0.08]"
    >
      <div className="flex items-center gap-4">
        <span className="font-display text-lg italic text-gold-300">{n}</span>
        <span className="flex-1 font-display text-lg font-medium text-cream-50 sm:text-xl">
          {title}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-xl leading-none text-coral-300"
        >
          +
        </motion.span>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="mb-1 mt-3 border-t border-cream-100/10 pt-3 text-sm leading-relaxed text-cream-100/80">
              {description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
