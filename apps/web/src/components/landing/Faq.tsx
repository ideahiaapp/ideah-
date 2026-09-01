"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "O Paideia substitui a supervisão com outro profissional?",
    a: "Não. É um espaço complementar de supervisão e reflexão contínua. A responsabilidade técnica e o julgamento clínico continuam sempre com você.",
  },
  {
    q: "Por que usar o Paideia em vez de uma IA generalista?",
    a: "Porque o Paideia não entrega respostas prontas. Sua Inteligência Dialógica conduz um processo de reflexão ancorado na abordagem clínica que você escolheu, ajudando a examinar hipóteses e desenvolver seu próprio raciocínio — não a substituí-lo.",
  },
  {
    q: "Como funciona a Formação Clínica Continuada?",
    a: "A cada supervisão realizada, o Paideia organiza o conteúdo trabalhado e acumula horas dentro da abordagem escolhida. Ao completar a carga horária prevista, você pode obter a certificação correspondente.",
  },
  {
    q: "Preciso escolher uma abordagem clínica?",
    a: "Sim. O programa é organizado por abordagem teórica, para manter a coerência e a profundidade da sua formação — sem misturar paradigmas diferentes.",
  },
  {
    q: "Como são contabilizadas as horas para certificação?",
    a: "As horas de supervisão são registradas automaticamente na abordagem escolhida. Ao completar a carga horária prevista para aquele percurso, você pode solicitar a certificação correspondente.",
  },
  {
    q: "Posso acompanhar mais de uma abordagem?",
    a: "Sim. Cada abordagem é contratada e acompanhada separadamente, com seu próprio percurso e acúmulo de horas.",
  },
  {
    q: "Meus dados e os dados dos meus clientes estão protegidos?",
    a: "Sim. Você controla o que é registrado e exportado, em conformidade com a LGPD.",
  },
  {
    q: "O Paideia realiza diagnósticos ou toma decisões clínicas?",
    a: "Não. O Paideia apoia o raciocínio profissional, organiza hipóteses e favorece a reflexão clínica fundamentada — mas não diagnostica, não prescreve condutas e não substitui o julgamento ou a supervisão humana.",
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
          <span className="text-brand-600 text-xs font-semibold uppercase tracking-widest">Dúvidas</span>
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
