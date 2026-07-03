const STEPS = [
  {
    number: "01",
    title: "Escolha sua abordagem",
    description:
      "Psicanálise, psicologia corporal, psicossomática, cognitivo-comportamental, e outras. A teoria é o ponto de partida.",
    icon: "🧭",
  },
  {
    number: "02",
    title: "Converse com a teoria",
    description:
      "Levante questões acerca do seu cliente e do que ele te traz na sessão, converse sobre hipóteses e recursos clínicos com citação quando pertinente.",
    icon: "💬",
  },
  {
    number: "03",
    title: "Registre a evolução viva",
    description:
      "Possibilidades e próximos focos — não apenas relato. Hipóteses abertas que acompanham o processo clínico.",
    icon: "📝",
  },
  {
    number: "04",
    title: "Tudo no app ou browser",
    description:
      "Escolha a plataforma, o cliente, evolua a partir do relato da sessão, acesse o histórico, dashboard, anexos, pagamento e agendamento — sem sair do celular.",
    icon: "📱",
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Passo a passo</span>
          <h2 className="text-3xl md:text-4xl font-bold text-ink mt-3">Como funciona?</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step, i) => (
            <div key={i} className="relative group">
              {/* Linha conectora (exceto último) */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(100%_-_16px)] w-8 h-0.5 bg-brand-200 z-10" />
              )}

              <div className="bg-brand-50 rounded-2xl p-6 h-full hover:bg-brand-100 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{step.icon}</span>
                  <span className="text-brand-600 font-bold text-lg">{step.number}</span>
                </div>
                <h3 className="font-bold text-ink text-base mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
