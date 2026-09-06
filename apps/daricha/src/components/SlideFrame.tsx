"use client";

import { ReactNode } from "react";
import { Backdrop, BackdropVariant } from "@/components/Backdrop";
import { Reveal } from "@/components/Reveal";

export function SlideFrame({
  variant = "quiet",
  kicker,
  active,
  children,
  justify = "center",
  wide = false,
}: {
  variant?: BackdropVariant;
  kicker?: string;
  active: boolean;
  children: ReactNode;
  justify?: "center" | "end" | "start";
  wide?: boolean;
}) {
  const justifyClass =
    justify === "end" ? "justify-end" : justify === "start" ? "justify-start" : "justify-center";

  return (
    <div className="relative h-full w-full">
      <Backdrop variant={variant} />
      {/* O scroll fica no wrapper "plano"; o miolo flex-col é quem centraliza —
          separar os dois evita que o topo do conteúdo alto suma atrás do centro
          quando a tela é baixa (bug clássico de overflow + justify-center). */}
      <div className="no-scrollbar relative z-10 h-full w-full overflow-y-auto">
        <div
          className={`mx-auto flex min-h-full w-full flex-col ${justifyClass} ${
            wide ? "max-w-2xl" : "max-w-[560px]"
          } px-6 pb-24 pt-16 sm:px-10 sm:pt-20`}
        >
          {kicker && (
            <Reveal active={active} order={0} className="mb-4">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-300">
                {kicker}
              </span>
            </Reveal>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
