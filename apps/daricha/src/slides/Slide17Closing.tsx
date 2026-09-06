"use client";

import { SlideFrame } from "@/components/SlideFrame";
import { Reveal } from "@/components/Reveal";
import { GoldRule } from "@/components/Typo";
import { buildWhatsAppLink, CTA_MESSAGE } from "@/lib/whatsapp";
import { trackEvent } from "@/lib/tracking";
import { CLOSING_SLIDE_INDEX, SLIDE_META } from "@/lib/slideMeta";

const FACTS = [
  "06/10 a 10/11/2026",
  "Imersão: 26/10 a 01/11/2026",
  "110 horas",
  "Máximo de 11 participantes",
];

export function Slide17Closing({ active }: { active: boolean }) {
  function handleCtaClick() {
    trackEvent("cta_click", CLOSING_SLIDE_INDEX, SLIDE_META[CLOSING_SLIDE_INDEX].id);
  }

  return (
    <SlideFrame variant="dawn" active={active} justify="center">
      <div className="text-center">
        <Reveal active={active} order={0}>
          <p className="font-display text-2xl font-medium leading-snug text-cream-50 sm:text-3xl">
            Uma experiência pode despertar uma pergunta.
          </p>
        </Reveal>

        <Reveal active={active} order={1} className="mt-3">
          <p className="font-display text-xl italic leading-snug text-coral-300 sm:text-2xl">
            A iniciação começa quando você decide ir mais fundo.
          </p>
        </Reveal>

        <Reveal active={active} order={2} className="mt-8">
          <GoldRule className="mx-auto" />
        </Reveal>

        <Reveal active={active} order={3} className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-300">
            Iniciação e Qualificação em Terapêutica Tântrica
          </p>
          <p className="mt-1 font-display text-lg italic text-cream-50/90">
            Método Daricha Sundari
          </p>
        </Reveal>

        <Reveal active={active} order={4} className="mt-6 flex flex-col gap-1.5">
          {FACTS.map((f) => (
            <p key={f} className="text-sm text-cream-100/75">
              {f}
            </p>
          ))}
        </Reveal>

        <Reveal active={active} order={5} className="mt-10">
          <a
            href={buildWhatsAppLink(CTA_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            data-tap-safe="true"
            onClick={handleCtaClick}
            className="inline-flex w-full items-center justify-center rounded-full bg-coral-400 px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-wine-950 shadow-lg shadow-coral-500/20 transition-transform active:scale-[0.98] sm:w-auto"
          >
            Quero conhecer a formação
          </a>
        </Reveal>
      </div>
    </SlideFrame>
  );
}
