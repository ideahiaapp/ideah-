"use client";

import { SlideFrame } from "@/components/SlideFrame";
import { Reveal } from "@/components/Reveal";
import { GoldRule } from "@/components/Typo";

const TRIAD = ["entrada", "passagem", "começo de um caminho"];

const LINES = [
  "Você não precisa chegar pronto.",
  "Não precisa chegar decidido a ser terapeuta.",
  "Pode começar por uma experiência.",
  "Pode começar por uma pergunta.",
  "Pode começar pela curiosidade.",
];

export function Slide05WhyInitiation({ active }: { active: boolean }) {
  return (
    <SlideFrame variant="warm" active={active}>
      <Reveal active={active} order={0}>
        <h2 className="font-display text-[2rem] font-medium text-cream-50 sm:text-5xl">
          Por que <em className="text-coral-300">Iniciação</em>?
        </h2>
      </Reveal>

      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        {TRIAD.map((word, i) => (
          <Reveal key={word} active={active} order={1 + i}>
            <span className="rounded-full border border-gold-400/40 px-3.5 py-1 text-xs uppercase tracking-[0.12em] text-gold-300">
              {word}
            </span>
          </Reveal>
        ))}
      </div>

      <Reveal active={active} order={1 + TRIAD.length} className="mt-5">
        <p className="text-[0.95rem] leading-relaxed text-cream-100/85">
          A iniciação representa a entrada em um caminho de experiência, consciência e
          aprofundamento.
        </p>
      </Reveal>

      <div className="mt-4 flex flex-col gap-1.5">
        {LINES.map((line, i) => (
          <Reveal key={line} active={active} order={2 + TRIAD.length + i}>
            <p className="font-display text-base italic text-cream-50/90 sm:text-xl">{line}</p>
          </Reveal>
        ))}
      </div>

      <Reveal active={active} order={2 + TRIAD.length + LINES.length} className="mt-6">
        <GoldRule className="mb-4" />
        <p className="font-display text-2xl font-medium leading-snug text-cream-50 sm:text-3xl">
          A Iniciação não é o ponto de chegada.
        </p>
        <p className="font-display text-2xl italic leading-snug text-coral-300 sm:text-3xl">
          É o começo de um caminho.
        </p>
      </Reveal>
    </SlideFrame>
  );
}
