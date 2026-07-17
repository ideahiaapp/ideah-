import { Award } from "lucide-react";

const HOURS_ROWS = [
  { approach: "Psicanálise Freudiana", hours: "18h" },
  { approach: "Gestalt-terapia", hours: "6h" },
  { approach: "Junguiana", hours: "4h" },
];

export function TheorySection() {
  return (
    <section className="py-24 md:py-32 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Texto */}
        <div>
          <h2 className="font-serif text-3xl md:text-4xl text-ink leading-tight mb-6">
            Sua prática também constrói sua formação.
          </h2>
          <p className="text-gray-600 text-base md:text-lg leading-relaxed">
            Ao longo das supervisões, o Paideia registra seu percurso de aprendizagem, organiza os conteúdos
            efetivamente estudados e reconhece seu desenvolvimento por meio da Formação Clínica Continuada.
          </p>
        </div>

        {/* Mockup do certificado */}
        <div className="relative">
          <div className="bg-white border border-sand-200 rounded-3xl shadow-xl p-8 mx-auto max-w-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-brand-500" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest">Certificado</p>
                <p className="text-sm font-semibold text-ink">Formação Clínica Continuada</p>
              </div>
            </div>

            <div className="space-y-2.5 mb-6">
              {HOURS_ROWS.map((row) => (
                <div
                  key={row.approach}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-sand-50 border border-sand-100"
                >
                  <span className="text-sm text-gray-700">{row.approach}</span>
                  <span className="text-sm font-semibold text-brand-600">{row.hours}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-brand-500 text-white">
              <span className="text-sm font-semibold">Total acumulado</span>
              <span className="text-sm font-bold">28h</span>
            </div>
          </div>

          {/* Selo decorativo */}
          <div
            aria-hidden
            className="hidden md:flex absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-sand-100 border border-sand-200 items-center justify-center"
          >
            <Award className="w-8 h-8 text-brand-300" strokeWidth={1.4} />
          </div>
        </div>
      </div>
    </section>
  );
}
