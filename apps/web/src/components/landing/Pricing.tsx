import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

const MONTHLY_PRICE_PER_BASE = 97.0;

const INCLUDES = [
  "Supervisão Clínica na abordagem escolhida",
  "Reflexão Dialógica",
  "Evolução Clínica estruturada a partir das supervisões",
  "Registros e Relatórios Clínicos",
  "Organização longitudinal dos casos",
  "Formação Clínica Continuada",
  "Acúmulo de horas de supervisão por abordagem",
  "Percurso para certificação",
  "Ambiente permanente de supervisão e reflexão",
];

export function PricingSection() {
  return (
    <section id="programa" className="py-24 md:py-32 bg-sand-50">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-4">
          <span className="text-brand-600 text-sm font-semibold uppercase tracking-widest">
            Programa de Formação Clínica Continuada por Abordagem
          </span>
        </div>
        <h2 className="font-serif text-3xl md:text-4xl text-ink text-center leading-tight mb-4 max-w-2xl mx-auto">
          Sua formação não termina quando o curso acaba. Ela continua em cada caso que você acompanha.
        </h2>
        <p className="text-gray-500 text-center max-w-xl mx-auto mb-12 leading-relaxed">
          Escolha a abordagem que orienta sua prática e participe de um percurso contínuo de supervisão, reflexão e
          desenvolvimento profissional.
        </p>

        {/* Card premium */}
        <div className="bg-ink rounded-3xl p-9 md:p-11 shadow-xl">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-6">Plano único</p>

          <div className="flex items-end gap-2 mb-1">
            <span className="text-4xl md:text-5xl font-serif text-white">
              R$ {MONTHLY_PRICE_PER_BASE.toFixed(2).replace(".", ",")}
            </span>
            <span className="text-sm text-white/60 mb-1.5">/mês</span>
          </div>
          <p className="text-xs text-white/40 mb-8">por abordagem clínica · Cobrado mensalmente</p>

          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">O programa inclui</p>
          <ul className="space-y-3.5 mb-9">
            {INCLUDES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/85">
                <Check className="w-4 h-4 text-brand-300 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                {item}
              </li>
            ))}
          </ul>

          <Link
            href="/auth/register"
            className="flex items-center justify-center gap-2 w-full text-center bg-brand-500 hover:bg-brand-400 text-white font-semibold rounded-xl py-3.5 transition-colors text-sm uppercase tracking-wide"
          >
            Escolher minha abordagem
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </Link>
          <p className="text-white/40 text-xs text-center mt-4">
            Você escolhe a abordagem clínica que deseja desenvolver.
          </p>
        </div>
      </div>
    </section>
  );
}
