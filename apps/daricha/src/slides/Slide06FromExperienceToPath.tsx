"use client";

import { SlideFrame } from "@/components/SlideFrame";
import { Reveal } from "@/components/Reveal";
import { GoldRule } from "@/components/Typo";

const FLOW = ["Experiência", "Pergunta", "Compreensão", "Prática", "Integração", "Caminho"];

const MOTIVATIONS = [
  "aprofundamento pessoal",
  "compreensão de uma experiência",
  "ampliação profissional",
  "desejo de iniciar uma trajetória como terapeuta",
];

export function Slide06FromExperienceToPath({ active }: { active: boolean }) {
  return (
    <SlideFrame variant="quiet" active={active} kicker="De experiência a caminho">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {FLOW.map((step, i) => (
          <span key={step} className="flex items-center gap-1.5">
            <Reveal active={active} order={1 + i * 2}>
              <span
                className={`font-display text-lg sm:text-2xl ${
                  i === FLOW.length - 1 ? "font-medium text-coral-300" : "text-cream-50/90"
                }`}
              >
                {step}
              </span>
            </Reveal>
            {i < FLOW.length - 1 && (
              <Reveal active={active} order={2 + i * 2}>
                <span className="text-gold-400/60">→</span>
              </Reveal>
            )}
          </span>
        ))}
      </div>

      <Reveal active={active} order={1 + FLOW.length * 2} className="mt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-300">
          Você pode entrar na jornada por caminhos diferentes
        </p>
        <ul className="mt-3 flex flex-col gap-1.5">
          {MOTIVATIONS.map((m) => (
            <li key={m} className="flex items-baseline gap-2 text-[0.92rem] text-cream-100/85">
              <span className="text-coral-400">·</span>
              <span className="leading-snug">{m}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal active={active} order={2 + FLOW.length * 2} className="mt-6">
        <GoldRule className="mb-4" />
        <p className="font-display text-2xl font-medium leading-snug text-cream-50 sm:text-3xl">
          Uma experiência pode despertar uma pergunta.
        </p>
        <p className="font-display text-2xl italic leading-snug text-coral-300 sm:text-3xl">
          A iniciação começa quando você decide ir mais fundo.
        </p>
      </Reveal>
    </SlideFrame>
  );
}
