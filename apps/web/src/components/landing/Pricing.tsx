"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

const MONTHLY_PRICE_PER_BASE = 147.0;
const ANNUAL_PRICE_PER_BASE = MONTHLY_PRICE_PER_BASE * 0.8; // 20% off no anual

const INCLUDES = [
  "Supervisão Clínica especializada na abordagem escolhida",
  "Evolução Clínica automática",
  "Relatórios Clínicos",
  "Organização longitudinal dos casos",
  "Formação Clínica Continuada",
  "Acúmulo de horas para Certificação",
  "Ambiente permanente de supervisão e reflexão",
];

export function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const pricePerBase = billing === "annual" ? ANNUAL_PRICE_PER_BASE : MONTHLY_PRICE_PER_BASE;

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
          Escolha a abordagem que orienta sua prática clínica e participe de um programa contínuo de supervisão,
          reflexão e desenvolvimento profissional.
        </p>

        {/* Toggle de cobrança */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-sm font-medium ${billing === "monthly" ? "text-ink" : "text-gray-500"}`}>Mensal</span>
          <button
            onClick={() => setBilling((b) => (b === "monthly" ? "annual" : "monthly"))}
            aria-label={billing === "annual" ? "Mudar para cobrança mensal" : "Mudar para cobrança anual"}
            className={`relative w-12 h-6 rounded-full transition-colors ${billing === "annual" ? "bg-brand-500" : "bg-gray-300"}`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${billing === "annual" ? "left-7" : "left-1"}`}
            />
          </button>
          <span className={`text-sm font-medium ${billing === "annual" ? "text-ink" : "text-gray-500"}`}>Anual</span>
          <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-1 rounded-full">20% OFF</span>
        </div>

        {/* Card premium */}
        <div className="bg-ink rounded-3xl p-9 md:p-11 shadow-xl">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">
            Programa de Formação Clínica Continuada
          </p>
          <p className="text-white/50 text-xs uppercase tracking-widest mb-6">Investimento</p>

          <div className="flex items-end gap-2 mb-1">
            <span className="text-4xl md:text-5xl font-serif text-white">
              R$ {pricePerBase.toFixed(2).replace(".", ",")}
            </span>
            <span className="text-sm text-white/60 mb-1.5">/mês por abordagem clínica</span>
          </div>
          <p className="text-xs text-white/40 mb-8">
            {billing === "annual" ? "Cobrado anualmente" : "Cobrado mensalmente"}
          </p>

          <ul className="space-y-3.5 mb-9">
            {INCLUDES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/85">
                <Check className="w-4 h-4 text-brand-300 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                {item}
              </li>
            ))}
          </ul>

          <p className="text-white/50 text-sm leading-relaxed mb-8">
            Mais do que uma assinatura, este é um programa contínuo de desenvolvimento profissional criado para
            fortalecer seu raciocínio clínico e transformar cada caso em aprendizagem.
          </p>

          <Link
            href="/auth/register"
            className="block w-full text-center bg-brand-500 hover:bg-brand-400 text-white font-semibold rounded-xl py-3.5 transition-colors text-sm"
          >
            Quero participar do Programa
          </Link>
        </div>
      </div>
    </section>
  );
}
