"use client";

/**
 * Reserva o lugar exato onde uma fotografia realista deve entrar.
 *
 * Esta sessão não tem geração de imagens disponível, então o espaço é
 * preenchido por uma composição têxtil/luminosa (sem fotografia) — mas a
 * marcação e a legenda descrevem exatamente o que fotografar, para que a
 * substituição por `next/image` seja só trocar o conteúdo deste componente.
 */
export function PhotoSlot({
  brief,
  className,
  tone = "warm",
}: {
  brief: string;
  className?: string;
  tone?: "warm" | "quiet" | "gold";
}) {
  const tones: Record<string, string> = {
    warm: "from-coral-500/30 via-wine-800/40 to-wine-950/80",
    quiet: "from-wine-700/40 via-wine-900/50 to-wine-950/90",
    gold: "from-gold-400/25 via-wine-800/40 to-wine-950/80",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-cream-100/10 bg-gradient-to-br ${tones[tone]} ${className ?? ""}`}
      role="img"
      aria-label={brief}
      data-photo-brief={brief}
    >
      <div className="absolute inset-0 opacity-[0.16] mix-blend-soft-light [background-image:radial-gradient(circle_at_30%_20%,#fff_0%,transparent_45%)]" />
      <div className="grain-overlay" />
      <svg
        className="absolute inset-0 h-full w-full opacity-30"
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M20 40 C 60 20, 100 20, 120 60 C 150 50, 180 70, 170 110 C 190 130, 180 170, 140 170"
          stroke="#D4BA80"
          strokeWidth="0.5"
          fill="none"
        />
      </svg>
    </div>
  );
}
