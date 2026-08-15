"use client";

import Link from "next/link";
import { X, BookOpen } from "lucide-react";

export type HowItWorksContent = {
  title: string;
  subtitle: string;
  steps: { title: string; desc: string }[];
  ctaLabel?: string;
  ctaHref?: string;
};

/**
 * Popup "Como funciona?" reutilizado em todas as páginas do painel.
 * Sempre termina com um link para o Manual completo (item final do menu lateral).
 */
export function HowItWorksModal({ content, onClose }: { content: HowItWorksContent; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-serif text-xl text-ink pr-6">{content.title}</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">{content.subtitle}</p>
        <div className="mt-5 space-y-4">
          {content.steps.map((step, i) => (
            <div key={step.title} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
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
            onClick={onClose}
            className="mt-6 flex items-center justify-center bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors w-full"
          >
            {content.ctaLabel}
          </Link>
        )}

        <Link
          href="/dashboard/manual"
          onClick={onClose}
          className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-brand-600 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Ver manual completo
        </Link>
      </div>
    </div>
  );
}

/** Botão-gatilho padrão para abrir o popup, no mesmo estilo em toda a aplicação. */
export function HowItWorksTrigger({ onClick, label = "Como funciona?" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
    >
      {label}
    </button>
  );
}
