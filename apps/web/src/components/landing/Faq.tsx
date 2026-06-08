"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "O ideah faz diagnóstico?",
    a: "Não. É um supervisor dialógico. Traz perguntas, hipóteses abertas e recursos — a decisão é sempre sua.",
  },
  {
    q: "Como a ferramenta lida com ética e CFP?",
    a: "Respeitamos a orientação do CFP: supervisão humana, sem diagnóstico, base curada e controle do registro pelo profissional.",
  },
  {
    q: "E a LGPD?",
    a: "Você escolhe o que registrar e exportar. Recomendamos pseudonimização quando cabível.",
  },
  {
    q: "Funciona só com uma abordagem?",
    a: "Você escolhe a abordagem ativa. Comparações com outras só ocorrem se você optar por isso (e sempre de forma descritiva).",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className="font-semibold text-ink text-sm group-hover:text-brand-600 transition-colors">
          {q}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-brand-500" : ""}`}
        />
      </button>
      {open && (
        <p className="pb-5 text-gray-500 text-sm leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export function FaqSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Dúvidas</span>
          <h2 className="text-3xl font-bold text-ink mt-3">Perguntas frequentes</h2>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6">
          {FAQS.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
