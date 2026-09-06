"use client";

import { SlideFrame } from "@/components/SlideFrame";
import { Reveal } from "@/components/Reveal";
import { GoldRule } from "@/components/Typo";

const LAYERS = ["corpo", "emoção", "desejo", "limites", "presença", "escuta", "percepção", "relação"];

export function Slide03BehindTouch({ active }: { active: boolean }) {
  return (
    <SlideFrame variant="dusk" active={active} kicker="O que existe por trás do toque">
      <div className="flex flex-col gap-1.5">
        {LAYERS.map((word, i) => (
          <Reveal key={word} active={active} order={1 + i}>
            <div
              className="rounded-full border border-cream-100/10 py-1.5 pl-4 pr-5 backdrop-blur-sm"
              style={{
                marginLeft: `${i * 5}%`,
                background: `linear-gradient(90deg, rgba(243,152,115,${0.16 - i * 0.012}) 0%, rgba(243,152,115,0) 85%)`,
              }}
            >
              <span className="font-display text-base capitalize text-cream-50 sm:text-xl">
                {word}
              </span>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal active={active} order={1 + LAYERS.length} className="mt-7">
        <GoldRule className="mb-4" />
        <p className="font-display text-2xl font-medium leading-snug text-cream-50 sm:text-3xl">
          O terapeuta não está apenas tocando um corpo.
        </p>
        <p className="mt-1 font-display text-2xl italic leading-snug text-coral-300 sm:text-3xl">
          Está sustentando uma experiência.
        </p>
      </Reveal>
    </SlideFrame>
  );
}
