// ─── Dados mockados para desenvolvimento sem backend ────────────────────────

export const mockUser = {
  id: "1",
  name: "Carlos Magno",
  email: "carlos.magno@gmail.com",
  role: "therapist" as const,
  avatarUrl: null,
  createdAt: new Date("2024-01-15"),
  subscription: {
    plan: "monthly" as const,
    status: "trial" as const,
    trialEndsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 dias
  },
};

export const mockClients = [
  {
    id: "c1",
    name: "Ana Paula Silva",
    email: "ana.paula@email.com",
    phone: "(11) 98765-4321",
    birthDate: new Date("1988-03-15"),
    approach: "PSYCHOANALYSIS",
    approachLabel: "Psicanálise",
    status: "ACTIVE",
    startDate: new Date("2025-12-01"),
    lastSession: new Date("2026-06-07"),
    nextSession: new Date("2026-06-14"),
    totalSessions: 18,
    sessionFrequency: "Semanal",
    sessionDuration: 50,
    initials: "AP",
    color: "#C2542F",
    occupation: "Designer Gráfica",
    referral: "Indicação de amiga",
    mainDemand: "Elaboração de luto — perda da mãe há 8 meses. Dificuldades de sono e anestesia afetiva.",
    notes: "Muito comprometida com o processo. Tem facilidade para associar livremente. Resistência inicial a falar sobre o pai.",
    emergencyContact: "Carlos Silva (irmão) — (11) 91234-5678",
  },
  {
    id: "c2",
    name: "Roberto Almeida",
    email: "roberto.almeida@email.com",
    phone: "(11) 97654-3210",
    birthDate: new Date("1985-07-22"),
    approach: "COGNITIVE_BEHAVIORAL",
    approachLabel: "TCC",
    status: "ACTIVE",
    startDate: new Date("2026-02-10"),
    lastSession: new Date("2026-06-06"),
    nextSession: new Date("2026-06-13"),
    totalSessions: 9,
    sessionFrequency: "Semanal",
    sessionDuration: 50,
    initials: "RA",
    color: "#3B82F6",
    occupation: "Engenheiro de Software",
    referral: "Busca própria (internet)",
    mainDemand: "Ansiedade de desempenho e procrastinação. Pressão no trabalho, dificuldade de concentração.",
    notes: "Muito analítico. Responde bem a psicoeducação. Tende a intelectualizar emoções.",
    emergencyContact: "Fernanda Almeida (esposa) — (11) 98765-0001",
  },
  {
    id: "c3",
    name: "Mariana Costa",
    email: "mariana.costa@email.com",
    phone: "(11) 96543-2109",
    birthDate: new Date("1992-11-08"),
    approach: "JUNGIAN",
    approachLabel: "Junguiana",
    status: "ACTIVE",
    startDate: new Date("2025-06-15"),
    lastSession: new Date("2026-06-05"),
    nextSession: new Date("2026-06-12"),
    totalSessions: 24,
    sessionFrequency: "Semanal",
    sessionDuration: 60,
    initials: "MC",
    color: "#F59E0B",
    occupation: "Professora universitária",
    referral: "Psiquiatra Dr. Renato Melo",
    mainDemand: "Crises de identidade e conflito entre vida pessoal e profissional. Sonhos recorrentes com temas de labirinto.",
    notes: "Grande riqueza simbólica. Engajada com análise de sonhos. Processo de individuação em curso.",
    emergencyContact: "Paulo Costa (marido) — (11) 92345-6789",
  },
  {
    id: "c4",
    name: "Felipe Torres",
    email: "felipe.torres@email.com",
    phone: "(11) 95432-1098",
    birthDate: new Date("1995-05-30"),
    approach: "SOMATIC",
    approachLabel: "Somática",
    status: "ACTIVE",
    startDate: new Date("2026-03-01"),
    lastSession: new Date("2026-06-04"),
    nextSession: new Date("2026-06-11"),
    totalSessions: 6,
    sessionFrequency: "Quinzenal",
    sessionDuration: 60,
    initials: "FT",
    color: "#10B981",
    occupation: "Músico",
    referral: "Centro de Trauma SP",
    mainDemand: "Sequelas de acidente de carro (2024). Hipervigilância, sobressalto fácil, evitação de direção.",
    notes: "Processo inicial. Alta ativação somática. Respondendo bem a titulação e pendulação.",
    emergencyContact: "Lúcia Torres (mãe) — (11) 91111-2222",
  },
  {
    id: "c5",
    name: "Beatriz Lemos",
    email: "beatriz.lemos@email.com",
    phone: "(11) 94321-0987",
    birthDate: new Date("1990-09-12"),
    approach: "GESTALT",
    approachLabel: "Gestalt",
    status: "WAITLIST",
    startDate: null,
    lastSession: null,
    nextSession: new Date("2026-06-20"),
    totalSessions: 0,
    sessionFrequency: "Semanal",
    sessionDuration: 50,
    initials: "BL",
    color: "#EF4444",
    occupation: "Nutricionista",
    referral: "Indicação de paciente",
    mainDemand: "Dificuldades nos relacionamentos amorosos. Padrão repetitivo de abandono.",
    notes: "Aguardando vaga. Primeira sessão agendada.",
    emergencyContact: null,
  },
];

export const mockSupervisions = [
  {
    id: "s1",
    clientName: "Ana Paula Silva",
    approach: "Psicanálise",
    title: "Elaboração de luto e defesas",
    lastMessage: "Freud distingue o trabalho de luto da melancolia...",
    updatedAt: new Date("2026-06-07T14:30:00"),
    messagesCount: 12,
  },
  {
    id: "s2",
    clientName: "Roberto Almeida",
    approach: "TCC",
    title: "Crenças centrais e pensamentos automáticos",
    lastMessage: "A crença central de abandono pode estar ativando...",
    updatedAt: new Date("2026-06-06T10:00:00"),
    messagesCount: 7,
  },
  {
    id: "s3",
    clientName: "Mariana Costa",
    approach: "Junguiana",
    title: "Anima e sonho recorrente",
    lastMessage: "O símbolo do labirinto em Jung remete ao processo de individuação...",
    updatedAt: new Date("2026-06-05T16:45:00"),
    messagesCount: 19,
  },
];

export const mockEvolutions = [
  {
    id: "e1",
    clientId: "c1",
    clientName: "Ana Paula Silva",
    initials: "AP",
    color: "#C2542F",
    approachLabel: "Psicanálise",
    sessionDate: new Date("2026-06-07"),
    sessionNumber: 18,
    hypothesis: "Luto complicado com traços melancólicos",
    content: "Sessão marcada por silêncios longos e relatos de anestesia afetiva. A paciente trouxe lembrança da mãe pela terceira sessão consecutiva, dessa vez com tom mais raivoso do que triste. Relatou sonho em que tentava ligar para a mãe, mas o telefone não funcionava.",
    interventions: "Acolhimento do silêncio. Espelhamento do afeto raivoso. Perguntei sobre o que ela diria à mãe se o telefone tivesse funcionado no sonho.",
    nextSessionPlan: "Acompanhar elaboração da raiva. Verificar se surgem mais sonhos. Explorar a relação com a irmã mencionada brevemente.",
    mood: 3,
    aiHypothesis: "A recorrência da figura materna sugere que o trabalho de luto ainda não foi completado. A transição da tristeza para a raiva pode indicar movimento no processo — a raiva frequentemente precede a elaboração mais profunda da perda (Freud, Luto e Melancolia, 1917). O sonho do telefone inoperante é rico: pode simbolizar a comunicação interrompida, o desejo não realizado de dizer algo que ficou por dizer.",
  },
  {
    id: "e2",
    clientId: "c2",
    clientName: "Roberto Almeida",
    initials: "RA",
    color: "#3B82F6",
    approachLabel: "TCC",
    sessionDate: new Date("2026-06-06"),
    sessionNumber: 9,
    hypothesis: "Crença central de incapacidade",
    content: "Cliente relatou episódio de procrastinação intensa relacionado ao trabalho. Tinha prazo de entrega de relatório na sexta, adiou até quinta à noite. Descreveu 'travamento' quando abriu o documento. Identificamos pensamento automático: 'vai ficar uma merda de qualquer jeito'.",
    interventions: "Registro de pensamento disfuncional. Questionamento socrático: evidências a favor e contra. Experimento comportamental: escrever apenas o primeiro parágrafo sem revisar.",
    nextSessionPlan: "Revisar resultado do experimento. Introduzir conceito de crença central de incapacidade. Iniciar conceitualização cognitiva.",
    mood: 2,
    aiHypothesis: "O padrão de procrastinação + 'travamento' é consistente com uma crença central de incapacidade ou fracasso (Beck, 1979). O pensamento automático 'vai ficar uma merda' tem características de catastrofização e leitura de mente (do próprio futuro). Vale investigar se esse padrão aparece em outros contextos além do trabalho.",
  },
  {
    id: "e3",
    clientId: "c3",
    clientName: "Mariana Costa",
    initials: "MC",
    color: "#F59E0B",
    approachLabel: "Junguiana",
    sessionDate: new Date("2026-06-05"),
    sessionNumber: 24,
    hypothesis: "Conflito anima — persona",
    content: "Trouxe sonho recorrente com labirinto e figura feminina guia que aparece pela quarta vez. Desta vez a figura falou: 'você já sabe o caminho'. Mariana acordou agitada e não conseguiu dormir mais. Associou a figura à avó materna que faleceu há 3 anos.",
    interventions: "Amplificação do símbolo do labirinto. Exploração da figura da anima como guia do processo de individuação. Pergunta sobre o que ela 'já sabe' mas ainda não reconhece.",
    nextSessionPlan: "Continuar trabalho com o sonho. Trazer imagem ou desenho da figura se possível. Explorar relação com a avó e o que representa essa herança feminina.",
    mood: 4,
    aiHypothesis: "A figura feminina recorrente tem forte conotação de anima — o arquétipo do feminino interior (Jung, 1954). A fala 'você já sabe o caminho' sugere que o inconsciente está comunicando uma sabedoria que o ego ainda não integrou. A associação com a avó aponta para a dimensão do inconsciente coletivo familiar. O labirinto é arquétipo clássico do processo de individuação.",
  },
];

export type SessionStatus = "confirmed" | "pending" | "cancelled" | "done";

export interface ScheduleSession {
  id: string;
  clientId: string;
  clientName: string;
  initials: string;
  color: string;
  date: string;        // "YYYY-MM-DD"
  startTime: string;   // "HH:MM"
  duration: number;    // minutos
  status: SessionStatus;
  notes?: string;
  price?: number;      // valor cobrado nesta sessão (sobrepõe config. clínica)
}

// Gera data relativa a hoje
function d(offsetDays: number, hhmm: string): { date: string; startTime: string } {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDays);
  return {
    date: dt.toISOString().split("T")[0],
    startTime: hhmm,
  };
}

export const mockSchedule: ScheduleSession[] = [
  { id: "ss1",  clientId: "c1", clientName: "Ana Paula Silva",  initials: "AP", color: "#C2542F", ...d(0,  "09:00"), duration: 50, status: "confirmed" },
  { id: "ss2",  clientId: "c2", clientName: "Roberto Almeida",  initials: "RA", color: "#3B82F6", ...d(0,  "11:00"), duration: 50, status: "confirmed" },
  { id: "ss3",  clientId: "c3", clientName: "Mariana Costa",    initials: "MC", color: "#F59E0B", ...d(1,  "10:00"), duration: 60, status: "confirmed" },
  { id: "ss4",  clientId: "c4", clientName: "Felipe Torres",    initials: "FT", color: "#10B981", ...d(1,  "14:00"), duration: 60, status: "pending"   },
  { id: "ss5",  clientId: "c1", clientName: "Ana Paula Silva",  initials: "AP", color: "#C2542F", ...d(2,  "09:00"), duration: 50, status: "confirmed" },
  { id: "ss6",  clientId: "c2", clientName: "Roberto Almeida",  initials: "RA", color: "#3B82F6", ...d(3,  "11:00"), duration: 50, status: "confirmed" },
  { id: "ss7",  clientId: "c3", clientName: "Mariana Costa",    initials: "MC", color: "#F59E0B", ...d(4,  "10:00"), duration: 60, status: "cancelled"  },
  { id: "ss8",  clientId: "c4", clientName: "Felipe Torres",    initials: "FT", color: "#10B981", ...d(-1, "14:00"), duration: 60, status: "done"       },
  { id: "ss9",  clientId: "c1", clientName: "Ana Paula Silva",  initials: "AP", color: "#C2542F", ...d(-2, "09:00"), duration: 50, status: "done"       },
  { id: "ss10", clientId: "c3", clientName: "Mariana Costa",    initials: "MC", color: "#F59E0B", ...d(5,  "16:00"), duration: 60, status: "pending"    },
];

export const mockStats = {
  totalClients: 5,
  activeClients: 4,
  sessionsThisWeek: 7,
  supervisionsTotal: 3,
  trialDaysLeft: 4,
};
