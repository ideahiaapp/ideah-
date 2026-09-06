"use client";

import { SlideFrame } from "@/components/SlideFrame";
import { Reveal } from "@/components/Reveal";
import { Counter } from "@/components/Counter";
import { GoldRule } from "@/components/Typo";

function Stat({
  active,
  value,
  label,
  order,
  size = "md",
}: {
  active: boolean;
  value: number;
  label: string;
  order: number;
  size?: "lg" | "md";
}) {
  return (
    <Reveal active={active} order={order} className="text-center">
      <div
        className={`font-display font-medium text-cream-50 ${
          size === "lg" ? "text-6xl sm:text-7xl" : "text-3xl sm:text-4xl"
        }`}
      >
        <Counter value={value} active={active} suffix="h" />
      </div>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gold-300">{label}</p>
    </Reveal>
  );
}

export function Slide08Hours({ active }: { active: boolean }) {
  return (
    <SlideFrame variant="gold" active={active} kicker="A dimensão da jornada">
      <div className="text-center">
        <Stat active={active} order={1} value={110} label="Horas, ao todo" size="lg" />
      </div>

      <Reveal active={active} order={2} className="mt-10">
        <GoldRule className="mx-auto" />
      </Reveal>

      <div className="mt-10 grid grid-cols-2 gap-6">
        <Stat active={active} order={3} value={85} label="Presenciais" />
        <Stat active={active} order={4} value={25} label="Online" />
      </div>

      <Reveal active={active} order={5} className="mx-auto mt-9 max-w-[240px] rounded-2xl border border-cream-100/10 bg-cream-100/5 p-5 text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-coral-300">Dentro das 25h online</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="font-display text-2xl font-medium text-cream-50">
              <Counter value={8} active={active} suffix="h" delay={0.5} />
            </div>
            <p className="mt-0.5 text-[0.7rem] leading-tight text-cream-100/70">Ao vivo</p>
          </div>
          <div>
            <div className="font-display text-2xl font-medium text-cream-50">
              <Counter value={17} active={active} suffix="h" delay={0.65} />
            </div>
            <p className="mt-0.5 text-[0.7rem] leading-tight text-cream-100/70">
              Gravadas, textos e atividades
            </p>
          </div>
        </div>
      </Reveal>
    </SlideFrame>
  );
}
