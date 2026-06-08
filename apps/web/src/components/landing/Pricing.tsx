import Link from "next/link";

export function PricingSection() {
  return (
    <section id="precos" className="py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Preços</span>
          <h2 className="text-3xl md:text-4xl font-bold text-ink mt-3">Simples e transparente</h2>
          <p className="text-gray-500 mt-3">7 dias gratuitos com acesso completo. Sem cartão de crédito para começar.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Plano mensal */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <p className="text-sm font-semibold text-gray-500 mb-2">Mensal</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-bold text-ink">R$ 49</span>
              <span className="text-2xl font-bold text-ink">,90</span>
              <span className="text-gray-400 text-sm mb-1">/mês</span>
            </div>
            <p className="text-xs text-gray-400 mb-6">Cobrado mensalmente</p>
            <ul className="space-y-3 mb-8">
              {["Supervisão dialógica ilimitada", "Gestão de casos", "Evolução viva", "Anexos e dashboard", "Suporte via e-mail"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/register"
              className="block w-full text-center border border-brand-300 text-brand-600 hover:bg-brand-50 font-semibold rounded-xl py-3 transition-colors text-sm"
            >
              Começar grátis
            </Link>
          </div>

          {/* Plano anual — destaque */}
          <div className="bg-brand-500 rounded-2xl p-8 shadow-xl relative overflow-hidden">
            {/* Badge */}
            <span className="absolute top-4 right-4 bg-white text-brand-600 text-xs font-bold px-3 py-1 rounded-full">
              20% OFF
            </span>

            <p className="text-sm font-semibold text-white/70 mb-2">Anual</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-bold text-white">R$ 39</span>
              <span className="text-2xl font-bold text-white">,92</span>
              <span className="text-white/60 text-sm mb-1">/mês</span>
            </div>
            <p className="text-xs text-white/50 mb-1">Cobrado anualmente · R$ 479,04/ano</p>
            <p className="text-xs text-white/60 mb-6 line-through">R$ 598,80/ano</p>
            <ul className="space-y-3 mb-8">
              {["Tudo do plano mensal", "Economia de R$ 119,76/ano", "Prioridade no suporte", "Acesso a novos recursos primeiro"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                  <span className="text-white/70">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/register"
              className="block w-full text-center bg-white text-brand-600 hover:bg-brand-50 font-semibold rounded-xl py-3 transition-colors text-sm"
            >
              Começar grátis
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          Garantia de reembolso integral durante o período de trial.
        </p>
      </div>
    </section>
  );
}
