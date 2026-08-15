"use client";

import Link from "next/link";
import { X, BookOpen, HelpCircle } from "lucide-react";
import { useHowItWorks, type HowItWorksContent } from "@/lib/how-it-works-context";

export type { HowItWorksContent };

/**
 * Painel lateral "Como funciona?" — renderizado uma única vez no shell do dashboard
 * (ver DashboardShell), empurrando o conteúdo principal em vez de sobrepor. Fica aberto
 * até o usuário clicar no X, mesmo enquanto ele navega/interage com o resto da página.
 */
export function HowItWorksPanel() {
  const { content, close } = useHowItWorks();
  if (!content) return null;

  return (
    <aside className="print-hide w-[380px] flex-shrink-0 bg-white border-l border-gray-100 shadow-sm overflow-y-auto">
      <div className="px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-400">
            <HelpCircle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wide">Como funciona?</span>
          </div>
          <button
            onClick={close}
            aria-label="Fechar"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="font-serif text-2xl text-brand-600 mt-4">{content.title}</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">{content.subtitle}</p>

        <div className="mt-6 space-y-5">
          {content.steps.map((step, i) => (
            <div key={step.title} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-600 text-sm font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{step.title}</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {content.ctaLabel && content.ctaHref && (
          <Link
            href={content.ctaHref}
            onClick={close}
            className="mt-8 flex items-center justify-center bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors w-full"
          >
            {content.ctaLabel}
          </Link>
        )}

        <Link
          href="/dashboard/manual"
          onClick={close}
          className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-brand-600 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Ver manual completo
        </Link>
      </div>
    </aside>
  );
}

/** Botão-gatilho padrão para abrir o painel, no mesmo estilo em toda a aplicação. */
export function HowItWorksTrigger({ content, label = "Como funciona?" }: { content: HowItWorksContent; label?: string }) {
  const { open } = useHowItWorks();
  return (
    <button
      onClick={() => open(content)}
      className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
    >
      <HelpCircle className="w-4 h-4" />
      {label}
    </button>
  );
}
