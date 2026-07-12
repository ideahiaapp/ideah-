"use client";

import { useState } from "react";
import Link from "next/link";

const MONTHLY_PRICE_PER_BASE = 147.00;
const ANNUAL_PRICE_PER_BASE = MONTHLY_PRICE_PER_BASE * 0.8; // 20% off no anual

const PLAN = {
  label: "Individual",
  description: "Para terapeutas autônomos",
  feature: "1 terapeuta",
  features: ["Supervisão dialógica ilimitada", "Gestão de casos", "Evolução viva", "Anexos e dashboard", "Suporte via e-mail"],
};

export function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const pricePerBase = billing === "annual" ? ANNUAL_PRICE_PER_BASE : MONTHLY_PRICE_PER_BASE;

  return (
    <section id="precos" className="py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          <span className="text-brand-600 text-sm font-semibold uppercase tracking-widest">Preços</span>
          <h2 className="text-3xl md:text-4xl font-bold text-ink mt-3">Simples e transparente</h2>
          <p className="text-gray-500 mt-3">O valor final depende de quantas bases teóricas você selecionar no cadastro.</p>
        </div>

        {/* Toggle de cobrança */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm font-medium ${billing === "monthly" ? "text-gray-900" : "text-gray-500"}`}>Mensal</span>
          <button
            onClick={() => setBilling(b => b === "monthly" ? "annual" : "monthly")}
            aria-label={billing === "annual" ? "Mudar para cobrança mensal" : "Mudar para cobrança anual"}
            className={`relative w-12 h-6 rounded-full transition-colors ${billing === "annual" ? "bg-brand-500" : "bg-gray-300"}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${billing === "annual" ? "left-7" : "left-1"}`} />
          </button>
          <span className={`text-sm font-medium ${billing === "annual" ? "text-gray-900" : "text-gray-500"}`}>Anual</span>
          <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-1 rounded-full">20% OFF</span>
        </div>

        <div className="max-w-sm mx-auto">
          <div className="bg-brand-500 rounded-2xl p-8 shadow-xl relative overflow-hidden">
            <p className="text-sm font-semibold mb-1 text-white">{PLAN.label}</p>
            <p className="text-xs mb-4 text-white/80">{PLAN.description}</p>

            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-bold text-white">
                R$ {pricePerBase.toFixed(2).replace(".", ",")}
              </span>
              <span className="text-sm mb-1 text-white">/base/mês</span>
            </div>
            <p className="text-xs mb-6 text-white/80">
              {billing === "annual" ? "Cobrado anualmente" : "Cobrado mensalmente"} · {PLAN.feature}
            </p>

            <ul className="space-y-3 mb-8">
              {PLAN.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-white">
                  <span className="text-white">✓</span> {f}
                </li>
              ))}
            </ul>

            <Link
              href="/auth/register"
              className="block w-full text-center bg-white text-brand-600 hover:bg-brand-50 font-semibold rounded-xl py-3 transition-colors text-sm"
            >
              Começar agora
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Cancele quando quiser, sem multa.
        </p>
      </div>
    </section>
  );
}
