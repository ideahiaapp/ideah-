import { Briefcase, MessageSquare, Brain, TrendingUp, BookOpen, Clock, ArrowRight } from "lucide-react";

const STEPS = [
  { icon: Briefcase, label: "Caso Clínico" },
  { icon: MessageSquare, label: "Supervisão" },
  { icon: Brain, label: "Reflexão Dialógica" },
  { icon: TrendingUp, label: "Evolução" },
  { icon: BookOpen, label: "Aprendizagem" },
  { icon: Clock, label: "Formação" },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24 md:py-32 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-brand-600 text-xs font-semibold uppercase tracking-widest">Passo a passo</span>
          <h2 className="font-serif text-3xl md:text-4xl text-ink mt-3 max-w-2xl mx-auto leading-tight">
            Transforme cada caso em um percurso de aprendizagem.
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-6 mb-14">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-2 w-24">
                <div className="w-11 h-11 rounded-xl bg-sand-50 border border-sand-200 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-brand-500" strokeWidth={1.6} />
                </div>
                <span className="text-[11px] font-semibold text-ink uppercase tracking-wide text-center leading-tight">
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="hidden sm:block w-4 h-4 text-brand-200 flex-shrink-0" strokeWidth={2} />
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-gray-500 text-base leading-relaxed max-w-xl mx-auto">
          Cada caso pode gerar novas questões. Cada supervisão pode gerar reflexão. E aquilo que é desenvolvido na
          prática passa a fazer parte do percurso de aprendizagem do profissional.
        </p>
      </div>
    </section>
  );
}
