"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  PILOT_TERM_TITLE,
  PILOT_TERM_SUBTITLE,
  PILOT_TERM_TEXT,
} from "@/lib/pilotTerm";

function TermBody() {
  const lines = PILOT_TERM_TEXT.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        if (line.trim() === "") return <div key={i} className="h-3" />;
        const isHeading = /^\d{1,2}\.\s+[A-ZÀ-ÚÇ]/.test(line);
        return (
          <p
            key={i}
            className={isHeading ? "font-bold text-ink mt-2 mb-1" : "text-gray-600 leading-relaxed"}
          >
            {line}
          </p>
        );
      })}
    </>
  );
}

export function PilotTermModal({ onAccept }: { onAccept: () => Promise<void> }) {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    if (!agreed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onAccept();
    } catch {
      setError("Não foi possível registrar seu aceite. Tente novamente.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h1 className="font-serif text-lg text-ink leading-snug">{PILOT_TERM_TITLE}</h1>
          <p className="text-xs text-gray-400 mt-1">{PILOT_TERM_SUBTITLE}</p>
        </div>

        <div className="px-6 py-4 overflow-y-auto text-sm">
          <TermBody />
        </div>

        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 accent-brand-600 w-4 h-4 flex-shrink-0"
            />
            <span className="text-sm text-ink">
              Declaro que li e concordo com o Termo de Participação no Programa-Piloto e Confidencialidade do
              Paideia
            </span>
          </label>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <button
            onClick={handleAccept}
            disabled={!agreed || submitting}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            ACEITAR E CONTINUAR
          </button>
        </div>
      </div>
    </div>
  );
}
