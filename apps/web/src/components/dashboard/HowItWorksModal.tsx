"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, BookOpen, HelpCircle } from "lucide-react";

export type HowItWorksContent = {
  title: string;
  subtitle: string;
  steps: { title: string; desc: string }[];
  ctaLabel?: string;
  ctaHref?: string;
};

/**
 * Painel lateral "Como funciona?" reutilizado em todas as páginas do painel —
 * desliza a partir da borda direita da tela, sem escurecer o conteúdo principal.
 * Sempre termina com um link para o Manual completo (item final do menu lateral).
 */
export function HowItWorksModal({ content, onClose }: { content: HowItWorksContent; onClose: () => void }) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function handleClose() {
    setEntered(false);
    setTimeout(onClose, 200);
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Área clicável para fechar — sem escurecer o conteúdo principal */}
      <button
        aria-label="Fechar"
        onClick={handleClose}
        className="absolute inset-0 w-full h-full cursor-default"
      />
      <aside
        className={`absolute top-0 right-0 h-full w-full max-w-[380px] bg-white border-l border-gray-100 shadow-2xl overflow-y-auto transition-transform duration-200 ease-out ${
          entered ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-400">
              <HelpCircle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">Como funciona?</span>
            </div>
            <button
              onClick={handleClose}
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
              onClick={handleClose}
              className="mt-8 flex items-center justify-center bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors w-full"
            >
              {content.ctaLabel}
            </Link>
          )}

          <Link
            href="/dashboard/manual"
            onClick={handleClose}
            className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-brand-600 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Ver manual completo
          </Link>
        </div>
      </aside>
    </div>
  );
}

/** Botão-gatilho padrão para abrir o painel, no mesmo estilo em toda a aplicação. */
export function HowItWorksTrigger({ onClick, label = "Como funciona?" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
    >
      <HelpCircle className="w-4 h-4" />
      {label}
    </button>
  );
}
