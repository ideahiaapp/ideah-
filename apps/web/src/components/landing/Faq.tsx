"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "O Paideia substitui minha supervisão com outro profissional?",
    a: "Não. É um espaço complementar de supervisão e reflexão contínua. A responsabilidade técnica e o juízo clínico continuam sendo sempre seus.",
  },
  {
    q: "Como funciona a Formação Clínica Continuada?",
    a: "A cada supervisão realizada, o Paideia organiza o conteúdo estudado e acumula horas dentro da abordagem escolhida, reconhecidas por meio de certificação.",
  },
  {
    q: "Preciso escolher uma abordagem específica?",
    a: "Sim. O programa é organizado por abordagem teórica, para manter a coerência e a profundidade da sua formação.",
  },
  {
    q: "Meus dados e os dos meus clientes estão protegidos?",
    a: "Sim. Você controla o que é registrado e exportado, em conformidade com a LGPD.",
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
    <section id="faq" className="py-24 md:py-32 bg-white">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Dúvidas</span>
          <h2 className="font-serif text-3xl text-ink mt-3">Perguntas frequentes</h2>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6">
          {FAQS.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
