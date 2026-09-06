"use client";

import { SlideFrame } from "@/components/SlideFrame";
import { Reveal } from "@/components/Reveal";
import { GoldRule } from "@/components/Typo";

const LINES = [
  "Mais fundo na própria experiência.",
  "Mais fundo no corpo.",
  "Mais fundo na compreensão do desejo.",
  "Mais fundo na relação com o outro.",
  "Mais fundo na prática terapêutica.",
];

export function Slide16GoDeeper({ active }: { active: boolean }) {
  return (
    <SlideFrame variant="dawn" active={active}>
      <div className="flex flex-col gap-2.5">
        {LINES.map((line, i) => (
          <Reveal key={line} active={active} order={i}>
            <p className="font-display text-xl italic leading-snug text-cream-50 sm:text-3xl">
              {line}
            </p>
          </Reveal>
        ))}
      </div>

      <Reveal active={active} order={LINES.length} className="mt-6">
        <GoldRule className="mb-4" />
        <p className="font-display text-xl font-medium leading-snug text-coral-300 sm:text-3xl">
          E, para quem desejar, mais fundo no caminho de se tornar terapeuta.
        </p>
      </Reveal>
    </SlideFrame>
  );
}
