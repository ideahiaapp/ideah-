import { MessageSquare } from "lucide-react";

const METRICS = [
  { value: "9,3/10", label: "Contribuição para refletir sobre os casos e a prática" },
  { value: "9,2/10", label: "Contribuição para relacionar teoria e prática" },
  { value: "9,0/10", label: "Intenção média de continuar utilizando o Paideia" },
  { value: "NPS +67", label: "Índice de recomendação entre os participantes" },
];

export function MetricsSection() {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-brand-600 text-xs font-semibold uppercase tracking-widest">
            Pesquisa de satisfação
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-ink leading-tight mt-3">
            O que os terapeutas estão percebendo com o uso do Paideia.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {METRICS.map((m) => (
            <div
              key={m.label}
              className="bg-sand-50 border border-sand-100 rounded-2xl p-6 text-center"
            >
              <strong className="block font-serif text-3xl text-brand-600 mb-2">{m.value}</strong>
              <p className="text-gray-500 text-sm leading-relaxed">{m.label}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-xs leading-relaxed max-w-xl mx-auto mb-12">
          Resultados da Pesquisa de Satisfação realizada com usuários do Paideia. n=6 respondentes, excluindo
          integrante da equipe da análise.
        </p>

        <div className="flex items-center justify-center gap-3 text-gray-400 text-sm border border-dashed border-gray-200 rounded-2xl py-6 px-6 max-w-xl mx-auto text-center">
          <MessageSquare className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
          <span>Espaço preparado para futuros depoimentos reais autorizados.</span>
        </div>
      </div>
    </section>
  );
}
