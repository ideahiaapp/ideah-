"use client";

import { SlideFrame } from "@/components/SlideFrame";
import { Reveal } from "@/components/Reveal";
import { GoldRule } from "@/components/Typo";

const WORDS = ["Prazer.", "Desconforto.", "Emoção.", "Expansão.", "Transformação."];

export function Slide02Question({ active }: { active: boolean }) {
  return (
    <SlideFrame variant="quiet" active={active} kicker="Antes de tudo">
      <Reveal active={active} order={1}>
        <p className="font-display text-[1.4rem] italic leading-[1.2] text-cream-50 sm:text-3xl">
          Você já viveu uma experiência tântrica que mexeu profundamente com você?
        </p>
      </Reveal>

      <div className="mt-6 flex flex-col gap-1.5">
        {WORDS.map((word, i) => (
          <Reveal key={word} active={active} order={2 + i}>
            <span className="font-display text-xl font-medium text-coral-300 sm:text-3xl">
              {word}
            </span>
          </Reveal>
        ))}
      </div>

      <Reveal active={active} order={2 + WORDS.length} className="mt-7">
        <GoldRule className="mb-4" />
        <p className="font-display text-xl font-medium leading-snug text-cream-50 sm:text-[2rem]">
          Mas você sabe o que estava acontecendo por trás daquela experiência?
        </p>
      </Reveal>
    </SlideFrame>
  );
}
