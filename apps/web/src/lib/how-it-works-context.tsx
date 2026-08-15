"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type HowItWorksContent = {
  title: string;
  subtitle: string;
  steps: { title: string; desc: string }[];
  ctaLabel?: string;
  ctaHref?: string;
};

interface HowItWorksContextValue {
  content: HowItWorksContent | null;
  open: (content: HowItWorksContent) => void;
  close: () => void;
}

const HowItWorksContext = createContext<HowItWorksContextValue | null>(null);

export function HowItWorksProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<HowItWorksContent | null>(null);

  const open  = useCallback((c: HowItWorksContent) => setContent(c), []);
  const close = useCallback(() => setContent(null), []);

  return (
    <HowItWorksContext.Provider value={{ content, open, close }}>
      {children}
    </HowItWorksContext.Provider>
  );
}

/** Painel "Como funciona?" — empurra o layout do dashboard, não sobrepõe. Fecha só pelo X. */
export function useHowItWorks() {
  const ctx = useContext(HowItWorksContext);
  if (!ctx) throw new Error("useHowItWorks precisa estar dentro de <HowItWorksProvider>");
  return ctx;
}
