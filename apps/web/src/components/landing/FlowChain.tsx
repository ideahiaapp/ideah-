"use client";

/**
 * Fluxo vertical elegante e minimalista usado no Hero (versão curta)
 * e na seção "Como funciona" (versão completa).
 */
export function FlowChain({ steps, variant = "light" }: { steps: string[]; variant?: "light" | "dark" }) {
  const isDark = variant === "dark";
  return (
    <div className="flex flex-col items-start">
      {steps.map((step, i) => (
        <div key={step} className="flex flex-col items-start">
          <div className="flex items-center gap-3">
            <span
              className={
                isDark
                  ? "w-2 h-2 rounded-full bg-brand-300 flex-shrink-0"
                  : "w-2 h-2 rounded-full bg-brand-500 flex-shrink-0"
              }
            />
            <span className={isDark ? "text-sm font-medium text-white/90" : "text-sm font-medium text-ink"}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={isDark ? "w-px h-6 ml-[3px] bg-white/20" : "w-px h-6 ml-[3px] bg-brand-200"}
              aria-hidden
            />
          )}
        </div>
      ))}
    </div>
  );
}
