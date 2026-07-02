const PILLARS = [
  {
    icon: "🚫",
    title: "Sem diagnóstico/rotulação",
    description: "Entregamos perguntas, hipóteses abertas e recursos — e você decide.",
  },
  {
    icon: "📚",
    title: "Base teórica fechada/curada",
    description: "Respostas ancoradas na obra; quando não há base, não inventamos.",
  },
  {
    icon: "🧠",
    title: "Supervisão humana obrigatória",
    description: "O juízo clínico é sempre seu.",
  },
  {
    icon: "🔐",
    title: "Consentimento e LGPD",
    description: "Você controla o que registrar/exportar e por quanto tempo.",
  },
  {
    icon: "⚖️",
    title: "Coerência de abordagem",
    description:
      "Se um pedido contrariar a teoria, o sistema explica o limite e oferece alternativas dentro da abordagem (ou comparação opt-in).",
  },
];

export function EthicsSection() {
  return (
    <section id="etica" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Responsabilidade</span>
          <h2 className="text-3xl md:text-4xl font-bold text-ink mt-3">Ética e conformidade</h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto text-base leading-relaxed">
            Como o Paideia respeita o Conselho Federal de Psicologia e o uso da I.A.
          </p>
          <a
            href="https://site.cfp.org.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-brand-500 hover:text-brand-600 text-sm font-medium mt-3"
          >
            Veja na íntegra a nota de posicionamento do CFP →
          </a>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PILLARS.map((p, i) => (
            <div
              key={i}
              className="bg-brand-50 rounded-2xl p-6 hover:bg-brand-100 transition-colors border border-brand-100"
            >
              <span className="text-2xl block mb-3">{p.icon}</span>
              <h3 className="font-bold text-ink text-sm mb-2">{p.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-10 bg-gray-50 border border-gray-200 rounded-2xl px-6 py-5 text-center">
          <p className="text-gray-500 text-sm leading-relaxed max-w-2xl mx-auto">
            Paideia é um espaço de supervisão dialógica, alinhado às orientações do CFP para o uso de tecnologias.
            Não realiza diagnósticos nem substitui o julgamento profissional.
            O uso pressupõe consentimento informado e respeito à LGPD.
          </p>
        </div>
      </div>
    </section>
  );
}
