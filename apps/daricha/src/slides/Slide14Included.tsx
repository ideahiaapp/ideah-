"use client";

import { SlideFrame } from "@/components/SlideFrame";
import { Reveal } from "@/components/Reveal";

const ITEMS = [
  "7 dias de imersão",
  "85h presenciais",
  "25h online",
  "Hospedagem",
  "Alimentação",
  "Práticas supervisionadas",
  "Aulas e demonstrações",
  "Acompanhamento de Daricha",
  "Materiais de apoio",
  "Grupo de até 11 pessoas",
];

export function Slide14Included({ active }: { active: boolean }) {
  return (
    <SlideFrame variant="quiet" active={active} kicker="O que está incluído" wide>
      <div className="grid grid-cols-2 gap-2.5">
        {ITEMS.map((item, i) => (
          <Reveal key={item} active={active} order={1 + i}>
            <div className="flex h-full items-center gap-2.5 rounded-xl border border-cream-100/12 bg-cream-100/[0.05] px-3.5 py-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                <path
                  d="M3 8.5l3 3 7-7"
                  stroke="#C3A359"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm leading-tight text-cream-50">{item}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </SlideFrame>
  );
}
