export type SlideMeta = {
  id: string;
  label: string;
};

// Ordem canônica das 17 telas do briefing.
export const SLIDE_META: SlideMeta[] = [
  { id: "capa", label: "Capa" },
  { id: "pergunta", label: "A pergunta" },
  { id: "por-tras-do-toque", label: "Por trás do toque" },
  { id: "tecnica-nao-basta", label: "Uma técnica não é suficiente" },
  { id: "por-que-iniciacao", label: "Por que Iniciação?" },
  { id: "de-experiencia-a-caminho", label: "De experiência a caminho" },
  { id: "jornada", label: "A jornada" },
  { id: "110-horas", label: "110 horas" },
  { id: "seis-eixos", label: "Os seis eixos" },
  { id: "imersao", label: "O que acontece na imersão" },
  { id: "onze-pessoas", label: "Por que apenas 11 pessoas?" },
  { id: "para-quem-e", label: "Para quem é" },
  { id: "para-quem-nao-e", label: "Para quem não é" },
  { id: "incluido", label: "O que está incluído" },
  { id: "investimento", label: "Investimento" },
  { id: "mais-fundo", label: "Uma experiência para entrar mais fundo" },
  { id: "convite", label: "Encerramento / Convite" },
];

export const TOTAL_SLIDES = SLIDE_META.length;
export const INVESTMENT_SLIDE_INDEX = SLIDE_META.findIndex((s) => s.id === "investimento");
export const CLOSING_SLIDE_INDEX = SLIDE_META.length - 1;
