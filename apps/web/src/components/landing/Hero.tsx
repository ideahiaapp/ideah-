import Link from "next/link";
import { ArrowRight, ArrowDown, BookOpen } from "lucide-react";
import { ProductMockup } from "./ProductMockup";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-20 md:pt-28 md:pb-28">
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[1.05fr_0.95fr] gap-16 items-center">
        {/* Texto */}
        <div>
          <span className="inline-flex items-center gap-2 text-brand-600 text-xs font-semibold uppercase tracking-widest mb-6">
            Formação Clínica Continuada
          </span>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-[3.25rem] text-ink leading-[1.15] tracking-tight mb-6">
            Aprenda com a própria prática clínica.
          </h1>

          <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-4 max-w-xl">
            Supervisão clínica por abordagem, reflexão dialógica e acompanhamento longitudinal dos seus casos em um
            único ambiente.
          </p>

          <p className="text-base md:text-lg text-gray-500 leading-relaxed mb-10 max-w-xl">
            O Paideia transforma as questões que surgem na prática em oportunidades de desenvolver seu raciocínio
            clínico e construir uma trajetória contínua de formação.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-10">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors shadow-sm"
            >
              Começar minha formação
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
            <a
              href="#como-funciona"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-brand-300 text-gray-600 hover:text-brand-600 font-semibold px-8 py-4 rounded-xl text-base transition-colors"
            >
              Ver como funciona
              <ArrowDown className="w-4 h-4" strokeWidth={2} />
            </a>
          </div>

          <p className="font-serif italic text-ink/70 text-sm">
            <strong className="not-italic font-semibold text-ink">PAIDEIA</strong> — É conversando que se aprende.
          </p>
        </div>

        {/* Mockup do produto */}
        <div className="hidden lg:block">
          <ProductMockup
            sectionLabel="Supervisão clínica"
            sectionTitle="Questões da sessão"
            badge="Psicanálise Freudiana"
            message="Vamos examinar o que essa situação mobiliza na condução do caso."
          />
          <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
            <BookOpen className="w-3.5 h-3.5 text-brand-400" strokeWidth={1.8} />
            Supervisão orientada por abordagem clínica
          </div>
        </div>
      </div>
    </section>
  );
}
