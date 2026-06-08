import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-white pt-20 pb-28">
      {/* Blob decorativo */}
      <div
        aria-hidden
        className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #924B92 0%, transparent 70%)" }}
      />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <span className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          Em conformidade com o CFP · LGPD
        </span>

        <h1 className="text-4xl md:text-6xl font-bold text-ink leading-tight tracking-tight mb-6">
          Converse com a teoria.{" "}
          <span className="text-brand-500">Supervisão Clínica dialógica.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-4">
          Você dialoga com a base teórica de sua abordagem para levantar perguntas, hipóteses abertas e recursos clínicos,{" "}
          <strong className="text-gray-700">sem diagnóstico nem rótulos.</strong>
        </p>

        <p className="text-sm text-gray-400 mb-10">
          Um supervisor clínico dialógico que respeita a orientação do Conselho Federal de Psicologia quanto ao uso de IA.
        </p>

        {/* Blockquote destaque */}
        <blockquote className="inline-block bg-white border border-brand-200 rounded-2xl px-6 py-4 mb-10 shadow-sm text-brand-700 font-medium text-sm md:text-base">
          "Base teórica curada e fechada. Você decide o que registrar e exportar."
        </blockquote>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/auth/register"
            className="w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors shadow-lg shadow-brand-200"
          >
            Começar grátis — 7 dias sem cobrança
          </Link>
          <a
            href="#como-funciona"
            className="w-full sm:w-auto border border-gray-200 hover:border-brand-300 text-gray-600 hover:text-brand-600 font-semibold px-8 py-4 rounded-xl text-base transition-colors"
          >
            Ver como funciona ↓
          </a>
        </div>

        <p className="text-xs text-gray-400 mt-4">Sem cartão de crédito · Cancele quando quiser</p>
      </div>
    </section>
  );
}
