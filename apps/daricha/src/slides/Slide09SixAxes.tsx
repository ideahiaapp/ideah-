"use client";

import { SlideFrame } from "@/components/SlideFrame";
import { Reveal } from "@/components/Reveal";
import { AxisCard } from "@/components/AxisCard";

const AXES = [
  { n: "01", title: "Abrir", description: "Abertura do campo terapêutico." },
  { n: "02", title: "Perceber", description: "Corpo, dor e consciência." },
  { n: "03", title: "Desejar", description: "Desejo e vitalidade." },
  { n: "04", title: "Tocar", description: "O toque que libera." },
  { n: "05", title: "Atravessar", description: "Sexualidade consciente." },
  { n: "06", title: "Integrar", description: "Integração e encerramento." },
];

export function Slide09SixAxes({ active }: { active: boolean }) {
  return (
    <SlideFrame variant="quiet" active={active} kicker="Os seis eixos" wide>
      <Reveal active={active} order={0} className="mb-6">
        <p className="text-sm text-cream-100/70">Toque em cada eixo para abrir.</p>
      </Reveal>

      <div className="flex flex-col gap-2.5">
        {AXES.map((axis, i) => (
          <Reveal key={axis.n} active={active} order={1 + i}>
            <AxisCard {...axis} />
          </Reveal>
        ))}
      </div>
    </SlideFrame>
  );
}
