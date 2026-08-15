/**
 * Ilustrações decorativas exibidas ao final do painel "Como funciona?", uma por
 * tema, sempre nos tons da marca (escala terracota do Paideia).
 */

const BRAND = {
  50:  "#FDF1ED",
  100: "#FBE0D6",
  200: "#F5C0AC",
  300: "#ED9777",
  400: "#DB6F49",
  500: "#C2542F",
  600: "#A8451F",
};

function Base({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {children}
    </svg>
  );
}

/** Supervisão — bússola, orientação para a reflexão clínica. */
function CompassIllustration() {
  return (
    <Base>
      <circle cx="80" cy="66" r="50" fill={BRAND[50]} />
      <circle cx="80" cy="66" r="34" fill={BRAND[100]} stroke={BRAND[300]} strokeWidth="2" />
      <circle cx="80" cy="66" r="34" fill="none" stroke={BRAND[300]} strokeWidth="1" strokeDasharray="2 4" />
      <path d="M80 44 L88 66 L80 88 L72 66 Z" fill={BRAND[500]} />
      <circle cx="80" cy="66" r="4" fill={BRAND[600]} />
      <path d="M40 20 l6 10 h-12 z" fill={BRAND[300]} />
    </Base>
  );
}

/** Clientes — pessoas e prontuário organizado. */
function PeopleIllustration() {
  return (
    <Base>
      <circle cx="80" cy="60" r="48" fill={BRAND[50]} />
      <rect x="52" y="46" width="56" height="42" rx="6" fill="white" stroke={BRAND[200]} strokeWidth="2" />
      <rect x="60" y="56" width="40" height="4" rx="2" fill={BRAND[300]} />
      <rect x="60" y="66" width="28" height="4" rx="2" fill={BRAND[200]} />
      <rect x="60" y="76" width="34" height="4" rx="2" fill={BRAND[200]} />
      <circle cx="45" cy="40" r="10" fill={BRAND[400]} />
      <path d="M31 62c0-8 6-14 14-14s14 6 14 14" fill={BRAND[400]} />
      <circle cx="118" cy="44" r="8" fill={BRAND[300]} />
      <path d="M106 64c0-6.6 5.4-12 12-12s12 5.4 12 12" fill={BRAND[300]} />
    </Base>
  );
}

/** Agenda — calendário com sessão marcada. */
function CalendarIllustration() {
  return (
    <Base>
      <circle cx="80" cy="62" r="48" fill={BRAND[50]} />
      <rect x="44" y="38" width="72" height="56" rx="8" fill="white" stroke={BRAND[300]} strokeWidth="2" />
      <rect x="44" y="38" width="72" height="16" rx="8" fill={BRAND[500]} />
      <rect x="56" y="30" width="6" height="14" rx="3" fill={BRAND[600]} />
      <rect x="98" y="30" width="6" height="14" rx="3" fill={BRAND[600]} />
      <rect x="54" y="62" width="12" height="12" rx="3" fill={BRAND[200]} />
      <rect x="74" y="62" width="12" height="12" rx="3" fill={BRAND[400]} />
      <rect x="94" y="62" width="12" height="12" rx="3" fill={BRAND[200]} />
      <rect x="54" y="78" width="12" height="8" rx="2" fill={BRAND[100]} />
      <rect x="74" y="78" width="12" height="8" rx="2" fill={BRAND[100]} />
    </Base>
  );
}

/** Meu Escritório — pilha de documentos/relatórios. */
function DocsIllustration() {
  return (
    <Base>
      <circle cx="80" cy="62" r="48" fill={BRAND[50]} />
      <rect x="52" y="50" width="46" height="58" rx="4" fill={BRAND[100]} />
      <rect x="62" y="40" width="46" height="58" rx="4" fill="white" stroke={BRAND[300]} strokeWidth="2" />
      <rect x="70" y="52" width="30" height="4" rx="2" fill={BRAND[400]} />
      <rect x="70" y="62" width="30" height="4" rx="2" fill={BRAND[200]} />
      <rect x="70" y="72" width="22" height="4" rx="2" fill={BRAND[200]} />
      <rect x="70" y="82" width="26" height="4" rx="2" fill={BRAND[200]} />
    </Base>
  );
}

/** Certificado — selo/premiação. */
function AwardIllustration() {
  return (
    <Base>
      <circle cx="80" cy="58" r="48" fill={BRAND[50]} />
      <path d="M64 84 L52 106 L66 102 L72 112 L82 90 Z" fill={BRAND[300]} />
      <path d="M96 84 L108 106 L94 102 L88 112 L78 90 Z" fill={BRAND[400]} />
      <circle cx="80" cy="62" r="28" fill={BRAND[100]} stroke={BRAND[500]} strokeWidth="3" />
      <path d="M68 62 l8 8 16-16" stroke={BRAND[600]} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Base>
  );
}

/** Configurações — engrenagem. */
function GearIllustration() {
  return (
    <Base>
      <circle cx="80" cy="62" r="48" fill={BRAND[50]} />
      <path
        d="M80 34a6 6 0 016 6l1 8 7 3 6-5 8 8-5 6 3 7 8 1a6 6 0 016 6v0a6 6 0 01-6 6l-8 1-3 7 5 6-8 8-6-5-7 3-1 8a6 6 0 01-6 6h0a6 6 0 01-6-6l-1-8-7-3-6 5-8-8 5-6-3-7-8-1a6 6 0 01-6-6v0a6 6 0 016-6l8-1 3-7-5-6 8-8 6 5 7-3 1-8a6 6 0 016-6z"
        fill={BRAND[300]}
      />
      <circle cx="80" cy="62" r="16" fill="white" stroke={BRAND[600]} strokeWidth="3" />
      <circle cx="80" cy="62" r="6" fill={BRAND[500]} />
    </Base>
  );
}

export const HOW_IT_WORKS_ILLUSTRATIONS = {
  supervision: CompassIllustration,
  clients:     PeopleIllustration,
  schedule:    CalendarIllustration,
  reports:     DocsIllustration,
  certificate: AwardIllustration,
  settings:    GearIllustration,
} as const;

export type HowItWorksIllustrationKey = keyof typeof HOW_IT_WORKS_ILLUSTRATIONS;
