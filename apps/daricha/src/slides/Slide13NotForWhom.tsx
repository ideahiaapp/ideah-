"use client";

import { SlideFrame } from "@/components/SlideFrame";
import { Reveal } from "@/components/Reveal";
import { GoldRule } from "@/components/Typo";

const NOTS = [
  "Não é uma formação rápida de técnicas.",
  "Não é uma experiência exclusivamente sexual.",
  "Não é uma promessa de cura instantânea.",
  "Não é uma formação baseada apenas em certificado.",
  "Não é um espaço para satisfazer curiosidades sexuais.",
];

export function Slide13NotForWhom({ active }: { active: boolean }) {
  return (
    <SlideFrame variant="dusk" active={active}>
      <Reveal active={active} order={0}>
        <h2 className="font-display text-3xl font-medium leading-tight text-cream-50 sm:text-4xl">
          Esta experiência não é para todo mundo.
        </h2>
      </Reveal>

      <div className="mt-8 flex flex-col gap-3.5">
        {NOTS.map((line, i) => (
          <Reveal key={line} active={active} order={1 + i}>
            <p className="text-[1.05rem] leading-relaxed text-cream-100/75">{line}</p>
          </Reveal>
        ))}
      </div>

      <Reveal active={active} order={1 + NOTS.length} className="mt-9">
        <GoldRule className="mb-6" />
        <p className="text-lg leading-relaxed text-cream-50">
          É uma jornada que exige maturidade, disponibilidade para o autoconhecimento, respeito
          aos limites e compromisso com uma postura ética.
        </p>
      </Reveal>
    </SlideFrame>
  );
}
