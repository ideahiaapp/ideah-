"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  const open  = useCallback((c: HowItWorksContent) => setContent(c), []);
  const close = useCallback(() => setContent(null), []);

  // Fecha o painel automaticamente ao trocar de página, já que o conteúdo
  // (ex.: "Iniciar supervisão") deixa de fazer sentido para a nova rota.
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setContent(null);
    }
  }, [pathname]);

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
