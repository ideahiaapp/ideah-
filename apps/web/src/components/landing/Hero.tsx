import Link from "next/link";
import { FlowChain } from "./FlowChain";

const HERO_FLOW = ["Prática Clínica", "Supervisão", "Reflexão", "Aprendizagem", "Desenvolvimento Profissional"];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-24 pb-24 md:pt-32 md:pb-32">
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[1.15fr_0.85fr] gap-16 items-center">
        {/* Texto */}
        <div>
          <span className="inline-flex items-center gap-2 text-brand-600 text-xs font-semibold uppercase tracking-widest mb-6">
            Formação Clínica Continuada
          </span>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-[3.25rem] text-ink leading-[1.15] tracking-tight mb-6">
            Toda prática clínica começa com dúvidas.
            <br />
            <span className="text-brand-500">As melhores trajetórias continuam aprendendo com elas.</span>
          </h1>

          <div className="space-y-1.5 text-base md:text-lg text-gray-500 leading-relaxed mb-4 max-w-xl">
            <p>A formação oferece fundamentos.</p>
            <p>A prática apresenta novos desafios todos os dias.</p>
          </div>

          <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-10 max-w-xl">
            O Paideia transforma cada supervisão clínica em um processo contínuo de aprendizagem, fortalecendo o
            raciocínio clínico, organizando o conhecimento produzido na prática e qualificando o cuidado oferecido
            aos clientes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto text-center bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors shadow-sm"
            >
              Conhecer o Programa
            </Link>
            <a
              href="#como-funciona"
              className="w-full sm:w-auto text-center border border-gray-200 hover:border-brand-300 text-gray-600 hover:text-brand-600 font-semibold px-8 py-4 rounded-xl text-base transition-colors"
            >
              Ver como funciona ↓
            </a>
          </div>
        </div>

        {/* Ilustração: fluxo elegante */}
        <div className="hidden lg:flex justify-center">
          <div className="bg-sand-50 border border-sand-200 rounded-3xl p-10 w-full max-w-sm">
            <FlowChain steps={HERO_FLOW} />
          </div>
        </div>
      </div>
    </section>
  );
}
