import { Check } from "lucide-react";

const BENEFITS = [
  "Mais segurança na condução clínica.",
  "Decisões mais consistentes.",
  "Evolução organizada dos casos.",
  "Continuidade entre as sessões.",
  "Relatórios melhor fundamentados.",
  "Desenvolvimento permanente do raciocínio clínico.",
];

export function ForWhomSection() {
  return (
    <section id="beneficios" className="py-24 md:py-32 bg-sand-50">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-serif text-3xl md:text-4xl text-ink leading-tight">
            Quando o terapeuta evolui, o cliente percebe.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-5 mb-14">
          {BENEFITS.map((b) => (
            <div key={b} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-brand-600" strokeWidth={2.5} />
              </span>
              <p className="text-gray-700 text-base leading-relaxed">{b}</p>
            </div>
          ))}
        </div>

        <p className="text-center font-serif text-xl md:text-2xl text-ink italic">
          "Quem continua aprendendo oferece um cuidado cada vez mais consistente."
        </p>
      </div>
    </section>
  );
}
