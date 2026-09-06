"use client";

import { SlideFrame } from "@/components/SlideFrame";
import { Reveal } from "@/components/Reveal";
import { Counter } from "@/components/Counter";
import { GoldRule } from "@/components/Typo";

const REASONS = [
  "Proximidade com Daricha",
  "Acompanhamento mais próximo",
  "Maior espaço para perguntas",
  "Troca mais profunda",
  "Criação de vínculo e confiança",
  "Mais espaço para experimentar, errar, perguntar e elaborar",
];

export function Slide11ElevenPeople({ active }: { active: boolean }) {
  return (
    <SlideFrame variant="dusk" active={active} kicker="Por que apenas 11 pessoas?">
      <Reveal active={active} order={0} className="text-center">
        <div className="font-display text-8xl font-medium text-coral-300 sm:text-9xl">
          <Counter value={11} active={active} duration={1.1} />
        </div>
      </Reveal>

      <Reveal active={active} order={1} className="mx-auto mt-1 text-center">
        <GoldRule className="mx-auto" />
      </Reveal>

      <div className="mt-8 flex flex-col gap-3">
        {REASONS.map((r, i) => (
          <Reveal key={r} active={active} order={2 + i}>
            <p className="text-[1.05rem] leading-relaxed text-cream-100/85">{r}</p>
          </Reveal>
        ))}
      </div>

      <Reveal active={active} order={2 + REASONS.length} className="mt-9">
        <p className="font-display text-2xl italic leading-snug text-cream-50 sm:text-3xl">
          O número de pessoas também faz parte da experiência.
        </p>
      </Reveal>
    </SlideFrame>
  );
}
