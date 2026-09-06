"use client";

import { SlideFrame } from "@/components/SlideFrame";
import { Reveal } from "@/components/Reveal";
import { GoldRule } from "@/components/Typo";

const LINES = [
  "É perceber.",
  "É sustentar presença.",
  "É reconhecer limites.",
  "É escutar o corpo.",
  "É compreender o que está acontecendo.",
];

export function Slide04NotEnoughTechnique({ active }: { active: boolean }) {
  return (
    <SlideFrame variant="quiet" active={active} kicker="Uma técnica não é suficiente">
      <Reveal active={active} order={1}>
        <p className="font-display text-xl font-medium leading-tight text-cream-50 sm:text-[2rem]">
          Aprender uma técnica não faz de alguém um terapeuta.
        </p>
      </Reveal>

      <Reveal active={active} order={2} className="mt-4">
        <p className="text-[0.95rem] leading-relaxed text-cream-100/85">
          Tocar não é apenas executar movimentos.
        </p>
      </Reveal>

      <div className="mt-4 flex flex-col gap-2">
        {LINES.map((line, i) => (
          <Reveal key={line} active={active} order={3 + i}>
            <div className="flex items-baseline gap-2.5">
              <span className="h-px w-5 flex-shrink-0 translate-y-[-4px] bg-coral-400" />
              <span className="font-display text-base italic text-coral-300 sm:text-xl">
                {line}
              </span>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal active={active} order={3 + LINES.length} className="mt-6">
        <GoldRule className="mb-4" />
        <p className="font-display text-2xl font-medium leading-snug text-cream-50 sm:text-3xl">
          Não ensinamos apenas o que fazer.
        </p>
        <p className="font-display text-2xl italic leading-snug text-coral-300 sm:text-3xl">
          Ensinamos a perceber.
        </p>
      </Reveal>
    </SlideFrame>
  );
}
