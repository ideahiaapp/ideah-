import { ArrowRight, ArrowDown } from "lucide-react";

const PAIDEIA_CHAIN = ["Caso", "Diálogo", "Reflexão", "Fundamentação", "Aprendizagem", "Continuidade"];

export function DialogicIntelligenceSection() {
  return (
    <section id="inteligencia-dialogica" className="py-24 md:py-32 bg-ink">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-brand-300 text-xs font-semibold uppercase tracking-widest">
            Inteligência Dialógica
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-white leading-tight mt-3 mb-4">
            A aprendizagem se constrói no diálogo.
          </h2>
          <p className="text-white/60 text-base leading-relaxed">
            O Paideia não foi criado apenas para responder perguntas sobre um caso. Sua Inteligência Dialógica
            sustenta um processo de reflexão ancorado na abordagem clínica escolhida, ajudando o profissional a
            examinar hipóteses, ampliar perspectivas e desenvolver seu próprio raciocínio clínico.
          </p>
        </div>

        <div className="grid sm:grid-cols-[0.7fr_1.3fr] gap-6 mb-14">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
            <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">IA generalista</span>
            <div className="text-white/80 text-sm font-medium">Pergunta</div>
            <ArrowDown className="w-4 h-4 text-white/30" strokeWidth={2} />
            <div className="text-white/80 text-sm font-medium">Resposta</div>
          </div>

          <div className="bg-brand-500/10 border border-brand-400/30 rounded-2xl p-6 flex flex-col justify-center">
            <span className="text-brand-300 text-xs font-semibold uppercase tracking-widest mb-4 block">
              Paideia
            </span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
              {PAIDEIA_CHAIN.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <strong className="text-white text-sm font-semibold">{step}</strong>
                  {i < PAIDEIA_CHAIN.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-brand-300" strokeWidth={2} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <blockquote className="text-center font-serif text-xl md:text-2xl text-white/90 italic leading-snug max-w-2xl mx-auto">
          "Não se trata apenas de encontrar uma resposta. Trata-se de aprender a pensar sobre a própria prática."
        </blockquote>
      </div>
    </section>
  );
}
