"use client";

import { SlideFrame } from "@/components/SlideFrame";
import { Reveal } from "@/components/Reveal";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Stage = {
  n: string;
  title: string;
  when: string;
  duration?: string;
  bullets: string[];
  note?: string;
};

const STAGES: Stage[] = [
  {
    n: "01",
    title: "Preparação online",
    when: "Outubro de 2026",
    duration: "25 horas online",
    bullets: ["Encontros ao vivo", "Aulas gravadas", "Autoestudo", "Textos", "Atividades orientadas"],
  },
  {
    n: "02",
    title: "Imersão presencial",
    when: "26/10 a 01/11/2026",
    duration: "7 dias · 85 horas presenciais",
    bullets: [
      "Aulas",
      "Demonstrações",
      "Práticas supervisionadas",
      "Vivências corporais",
      "Meditações",
      "Integração",
    ],
  },
  {
    n: "03",
    title: "Aprofundamento online",
    when: "10/11/2026 · 19h30 às 21h30",
    bullets: [],
    note: "Integração e aprofundamento após a experiência presencial.",
  },
];

export function Slide07Journey({ active }: { active: boolean }) {
  const reduced = useReducedMotion();

  return (
    <SlideFrame variant="quiet" active={active} kicker="A jornada" wide>
      <div className="relative flex flex-col gap-9 pl-8">
        <div className="absolute bottom-3 left-[7px] top-3 w-px bg-cream-100/15">
          <motion.div
            className="w-full origin-top bg-gold-400"
            initial={false}
            animate={active ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ duration: reduced ? 0.2 : 2.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: "100%" }}
          />
        </div>

        {STAGES.map((stage, i) => (
          <div key={stage.n} className="relative">
            <Reveal active={active} order={1 + i * 3} className="absolute -left-8 top-0.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-gold-400 bg-wine-950" />
            </Reveal>

            <Reveal active={active} order={1 + i * 3}>
              <span className="font-display text-sm italic text-gold-300">Etapa {stage.n}</span>
              <h3 className="font-display text-xl font-medium text-cream-50 sm:text-2xl">
                {stage.title}
              </h3>
              <p className="mt-1 text-sm text-coral-300">{stage.when}</p>
              {stage.duration && (
                <p className="text-sm font-semibold text-cream-100/80">{stage.duration}</p>
              )}
            </Reveal>

            {stage.bullets.length > 0 && (
              <Reveal active={active} order={2 + i * 3} className="mt-2">
                <div className="flex flex-wrap gap-1.5">
                  {stage.bullets.map((b) => (
                    <span
                      key={b}
                      className="rounded-full bg-cream-100/8 px-3 py-1 text-xs text-cream-100/75"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </Reveal>
            )}

            {stage.note && (
              <Reveal active={active} order={2 + i * 3} className="mt-2">
                <p className="text-sm leading-relaxed text-cream-100/75">{stage.note}</p>
              </Reveal>
            )}
          </div>
        ))}
      </div>
    </SlideFrame>
  );
}
