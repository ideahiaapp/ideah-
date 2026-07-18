import Image from "next/image";
import { Calendar, Clock, Users } from "lucide-react";

interface CertificateTemplateProps {
  therapistName: string;
  approachLabel: string;
  periodLabel: string;
  totalHoursLabel: string;
  totalSessions: number;
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <Icon className="w-5 h-5 text-brand-500" strokeWidth={1.6} />
      <p className="text-[9px] font-bold tracking-widest text-gray-500">{label}</p>
      <p className="text-xs font-bold text-ink">{value}</p>
    </div>
  );
}

export function CertificateTemplate({
  therapistName, approachLabel, periodLabel, totalHoursLabel, totalSessions,
}: CertificateTemplateProps) {
  return (
    <div
      id="certificate-print-area"
      className="relative w-full aspect-[1.55] mx-auto overflow-hidden rounded-2xl border border-brand-100 shadow-xl bg-[#FDF6EF]"
    >
      {/* Onda decorativa à esquerda */}
      <div
        className="absolute inset-y-0 left-0 w-[26%] bg-gradient-to-br from-brand-600 to-brand-400"
        style={{ clipPath: "ellipse(75% 60% at 0% 50%)" }}
        aria-hidden
      />

      {/* Faixa superior */}
      <div className="absolute top-0 left-0 right-0 h-[13%] bg-brand-500 flex items-center justify-center z-10">
        <Image src="/paideia-wordmark-white.svg" alt="Paideia" width={140} height={33} />
      </div>

      {/* Conteúdo */}
      <div className="absolute inset-0 pt-[16%] pb-[5%] px-[8%] pl-[30%] flex flex-col">
        <p className="text-[11px] font-bold tracking-[0.25em] text-ink text-center">CERTIFICADO</p>
        <h1 className="font-serif text-[clamp(1.4rem,3vw,2.25rem)] leading-tight text-ink text-center mt-1">
          Formação Clínica Continuada
        </h1>
        <p className="font-serif italic text-[clamp(0.9rem,1.4vw,1.15rem)] text-brand-600 text-center mt-1">
          Estudo Clínico Supervisionado
        </p>

        <div className="flex items-center justify-center gap-3 my-4">
          <div className="h-px bg-brand-200 flex-1 max-w-[110px]" />
          <span className="w-1.5 h-1.5 rotate-45 bg-brand-400 flex-shrink-0" />
          <div className="h-px bg-brand-200 flex-1 max-w-[110px]" />
        </div>

        <p className="text-center text-xs text-gray-500">Certificamos que</p>
        <p className="text-center font-serif font-bold text-[clamp(1.3rem,2.6vw,2rem)] text-brand-600 uppercase tracking-wide mt-1 px-2 break-words">
          {therapistName || "—"}
        </p>

        <p className="text-center text-[12px] text-gray-600 leading-relaxed mt-3 max-w-2xl mx-auto">
          concluiu <strong className="text-ink">{totalHoursLabel}</strong> de Formação Clínica Continuada, desenvolvidas
          na modalidade de <strong className="text-ink">Estudo Clínico Supervisionado</strong> na plataforma Paideia,
          por meio da análise de casos clínicos, formulação de hipóteses, aprofundamento teórico, reflexão técnica
          e integração entre teoria e prática dentro da abordagem:
        </p>

        <div className="mx-auto mt-3 border border-brand-300 rounded-lg px-6 py-1.5">
          <p className="text-xs font-bold text-brand-600 tracking-wide text-center">{approachLabel}</p>
        </div>

        <div className="flex items-center justify-center gap-12 mt-6">
          <Stat icon={Calendar} label="PERÍODO" value={periodLabel} />
          <Stat icon={Clock} label="CARGA HORÁRIA" value={totalHoursLabel} />
          <Stat icon={Users} label="SUPERVISÕES CLÍNICAS" value={`${totalSessions} sessões`} />
        </div>

        {/* Assinatura */}
        <div className="mt-auto pt-6 flex flex-col items-center">
          <p className="font-serif italic text-lg text-ink">Equipe Paideia</p>
          <div className="h-px bg-gray-300 w-40 my-1" />
          <p className="text-[9px] font-bold text-gray-500 tracking-widest">EQUIPE PAIDEIA</p>
          <p className="text-[8px] text-gray-400 tracking-wide">PLATAFORMA DE SUPERVISÃO CLÍNICA</p>
        </div>
      </div>
    </div>
  );
}
