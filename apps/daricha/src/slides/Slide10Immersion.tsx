"use client";

import { SlideFrame } from "@/components/SlideFrame";
import { Reveal } from "@/components/Reveal";
import { PhotoSlot } from "@/components/PhotoSlot";
import { GoldRule } from "@/components/Typo";

const MOMENTS = [
  "Aulas",
  "Demonstrações",
  "Práticas supervisionadas",
  "Vivências corporais",
  "Meditações",
  "Rodas de integração",
  "Convivência",
  "Acompanhamento de Daricha",
];

export function Slide10Immersion({ active }: { active: boolean }) {
  return (
    <SlideFrame variant="warm" active={active} kicker="O que acontece na imersão" wide>
      <Reveal active={active} order={1}>
        <PhotoSlot
          tone="warm"
          className="h-28 w-full sm:h-40"
          brief="Grupo pequeno em roda, luz quente de fim de tarde, corpos presentes e à vontade — fotografia editorial, sem posar para a câmera."
        />
      </Reveal>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {MOMENTS.map((moment, i) => (
          <Reveal key={moment} active={active} order={2 + i}>
            <div className="flex h-full items-center justify-center rounded-xl border border-cream-100/12 bg-cream-100/[0.05] px-3 py-2.5 text-center">
              <span className="text-[0.82rem] font-medium leading-tight text-cream-50">
                {moment}
              </span>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal active={active} order={2 + MOMENTS.length} className="mt-6">
        <GoldRule className="mb-4" />
        <p className="font-display text-xl font-medium leading-snug text-cream-50 sm:text-3xl">
          Sete dias para viver, experimentar, perceber e integrar.
        </p>
      </Reveal>
    </SlideFrame>
  );
}
