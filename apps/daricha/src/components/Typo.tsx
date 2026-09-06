import { ReactNode } from "react";

export function Title({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={`font-display text-[2rem] font-medium leading-[1.12] text-cream-50 sm:text-[2.5rem] ${className ?? ""}`}
    >
      {children}
    </h2>
  );
}

export function Lead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-display text-xl italic leading-snug text-coral-300 ${className ?? ""}`}>
      {children}
    </p>
  );
}

export function Body({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[1.05rem] leading-relaxed text-cream-100/85 ${className ?? ""}`}>
      {children}
    </p>
  );
}

export function GoldRule({ className }: { className?: string }) {
  return <div className={`h-px w-14 bg-gold-400/70 ${className ?? ""}`} />;
}
