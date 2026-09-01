import { Check } from "lucide-react";

const BENEFITS = [
  "Mais segurança na condução clínica",
  "Maior continuidade entre as sessões",
  "Histórico organizado dos casos",
  "Decisões mais fundamentadas",
  "Ampliação do repertório clínico",
  "Desenvolvimento contínuo do raciocínio clínico",
];

export function BenefitsSection() {
  return (
    <section id="beneficios" className="py-24 md:py-32 bg-sand-50">
      <div className="max-w-5xl mx-auto px-6 grid lg:grid-cols-[0.9fr_1.1fr] gap-14 items-center">
        <div>
          <span className="text-brand-600 text-xs font-semibold uppercase tracking-widest">Na prática</span>
          <h2 className="font-serif text-3xl md:text-4xl text-ink leading-tight mt-3 mb-6">
            Uma prática mais refletida muda a forma de conduzir os casos.
          </h2>
          <p className="font-serif italic text-lg text-ink/70">
            Quem continua aprendendo constrói uma prática cada vez mais consistente.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
          {BENEFITS.map((b) => (
            <div key={b} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-brand-600" strokeWidth={2.5} />
              </span>
              <p className="text-gray-700 text-base leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
