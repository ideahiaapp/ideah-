"use client";

import { SlideFrame } from "@/components/SlideFrame";
import { Reveal } from "@/components/Reveal";
import { GoldRule } from "@/components/Typo";

const PATHS = [
  "Eu vivi uma experiência e quero compreender.",
  "Eu sinto vontade de ser terapeuta.",
  "Eu já trabalho com pessoas e quero ampliar meu repertório.",
  "Eu quero me aprofundar no Tantra.",
];

export function Slide12ForWhom({ active }: { active: boolean }) {
  return (
    <SlideFrame variant="warm" active={active} kicker="Para quem é">
      <div className="flex flex-col gap-4">
        {PATHS.map((path, i) => (
          <Reveal key={path} active={active} order={1 + i}>
            <div className="rounded-2xl border-l-2 border-coral-400 bg-cream-100/[0.04] py-3 pl-5 pr-4">
              <p className="font-display text-lg italic leading-snug text-cream-50 sm:text-xl">
                &ldquo;{path}&rdquo;
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal active={active} order={1 + PATHS.length} className="mt-9">
        <GoldRule className="mb-6" />
        <p className="font-display text-2xl font-medium leading-snug text-cream-50 sm:text-3xl">
          Você não precisa saber exatamente onde esse caminho vai levar antes de começar.
        </p>
      </Reveal>
    </SlideFrame>
  );
}
