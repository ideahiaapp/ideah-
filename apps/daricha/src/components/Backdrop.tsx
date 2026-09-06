"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

export type BackdropVariant = "cover" | "quiet" | "warm" | "gold" | "dawn" | "dusk";

const VARIANT_BLOBS: Record<BackdropVariant, { color: string; style: React.CSSProperties }[]> = {
  cover: [
    { color: "#F39873", style: { top: "-10%", left: "-15%", width: "70%", height: "55%" } },
    { color: "#C3A359", style: { bottom: "-15%", right: "-10%", width: "65%", height: "50%" } },
  ],
  quiet: [{ color: "#6B1F34", style: { top: "10%", right: "-20%", width: "60%", height: "60%" } }],
  warm: [
    { color: "#F39873", style: { top: "-5%", right: "-15%", width: "75%", height: "60%" } },
    { color: "#EA7E52", style: { bottom: "-20%", left: "-15%", width: "55%", height: "45%" } },
  ],
  gold: [
    { color: "#C3A359", style: { top: "-15%", left: "10%", width: "80%", height: "50%" } },
    { color: "#F39873", style: { bottom: "-10%", right: "-10%", width: "45%", height: "40%" } },
  ],
  dawn: [
    { color: "#F6BFA1", style: { top: "-20%", left: "5%", width: "90%", height: "65%" } },
    { color: "#C3A359", style: { bottom: "-20%", right: "0%", width: "60%", height: "45%" } },
  ],
  dusk: [{ color: "#491524", style: { top: "-10%", left: "-10%", width: "80%", height: "70%" } }],
};

export function Backdrop({ variant = "quiet" }: { variant?: BackdropVariant }) {
  const reduced = useReducedMotion();
  const blobs = VARIANT_BLOBS[variant];

  return (
    <div className="absolute inset-0 overflow-hidden bg-wine-gradient" aria-hidden="true">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[90px]"
          style={{ background: b.color, opacity: 0.28, ...b.style }}
          animate={
            reduced
              ? undefined
              : {
                  scale: [1, 1.08, 1],
                  opacity: [0.22, 0.32, 0.22],
                }
          }
          transition={{ duration: 14 + i * 4, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <LinePattern />
      <div className="grain-overlay" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
    </div>
  );
}

// Motivo linear fino, ecoando o traço do logo — substitui fotografia com
// uma textura sensorial e coerente com a marca.
function LinePattern() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
      viewBox="0 0 400 800"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <path
        d="M60 120 C 20 220, 20 320, 90 380 C 30 420, 30 520, 90 560"
        stroke="#D4BA80"
        strokeWidth="0.6"
      />
      <path
        d="M340 700 C 380 600, 380 500, 310 440 C 370 400, 370 300, 310 260"
        stroke="#F39873"
        strokeWidth="0.6"
      />
      <path d="M200 40 L200 760" stroke="#D4BA80" strokeWidth="0.3" strokeDasharray="1 10" />
    </svg>
  );
}
