"use client";

import { SlideFrame } from "@/components/SlideFrame";
import { Reveal } from "@/components/Reveal";
import { Counter } from "@/components/Counter";
import { GoldRule } from "@/components/Typo";

const RECAP = [
  "7 dias de imersão",
  "Hospedagem + alimentação",
  "25 horas online",
  "85 horas presenciais",
  "Grupo máximo de 11 participantes",
];

const fmt = (n: number) => n.toLocaleString("pt-BR");

export function Slide15Investment({ active }: { active: boolean }) {
  return (
    <SlideFrame variant="gold" active={active} kicker="Investimento">
      <Reveal active={active} order={1}>
        <p className="font-display text-xl italic leading-snug text-cream-50 sm:text-3xl">
          Uma jornada de 110 horas.
        </p>
      </Reveal>

      <Reveal active={active} order={2} className="mt-3">
        <p className="text-[0.85rem] leading-relaxed text-cream-100/75">{RECAP.join(" · ")}</p>
      </Reveal>

      <Reveal active={active} order={3} className="mt-5">
        <GoldRule className="mb-4" />
      </Reveal>

      <Reveal active={active} order={4} className="text-center">
        <div className="font-display text-4xl font-medium text-cream-50 sm:text-6xl">
          <Counter value={7480} active={active} prefix="R$ " format={fmt} duration={2} />
        </div>
      </Reveal>

      <Reveal active={active} order={5} className="mt-5 flex flex-col gap-2">
        <div className="rounded-xl border border-cream-100/12 bg-cream-100/[0.05] px-4 py-2.5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold-300">
            Cartão
          </p>
          <p className="mt-0.5 text-[0.92rem] text-cream-50">
            Até 10x sem juros — <span className="text-cream-100/85">10x de R$ 748</span>
          </p>
        </div>
        <div className="rounded-xl border border-cream-100/12 bg-cream-100/[0.05] px-4 py-2.5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold-300">
            Pix
          </p>
          <p className="mt-0.5 text-[0.92rem] text-cream-50">R$ 6.900 à vista</p>
        </div>
        <div className="rounded-xl border border-cream-100/12 bg-cream-100/[0.05] px-4 py-2.5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold-300">
            Boleto
          </p>
          <p className="mt-0.5 text-[0.92rem] text-cream-50">R$ 8.200 no total</p>
          <p className="text-xs text-cream-100/70">R$ 1.750 de entrada + 9 parcelas</p>
        </div>
      </Reveal>
    </SlideFrame>
  );
}
