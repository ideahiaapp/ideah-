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
    approach: "PSYCHOANALYSIS",
    approachLabel: "Psicanálise",
    status: "ACTIVE",
    lastSession: new Date("2026-06-07"),
    totalSessions: 18,
    initials: "AP",
    color: "#924B92",
  },
  {
    id: "c2",
    name: "Roberto Almeida",
    approach: "COGNITIVE_BEHAVIORAL",
    approachLabel: "TCC",
    status: "ACTIVE",
    lastSession: new Date("2026-06-06"),
    totalSessions: 9,
    initials: "RA",
    color: "#3B82F6",
  },
  {
    id: "c3",
    name: "Mariana Costa",
    approach: "JUNGIAN",
    approachLabel: "Junguiana",
    status: "ACTIVE",
    lastSession: new Date("2026-06-05"),
    totalSessions: 24,
    initials: "MC",
    color: "#F59E0B",
  },
  {
    id: "c4",
    name: "Felipe Torres",
    approach: "SOMATIC",
    approachLabel: "Somática",
    status: "ACTIVE",
    lastSession: new Date("2026-06-04"),
    totalSessions: 6,
    initials: "FT",
    color: "#10B981",
  },
  {
    id: "c5",
    name: "Beatriz Lemos",
    approach: "GESTALT",
    approachLabel: "Gestalt",
    status: "WAITLIST",
    lastSession: null,
    totalSessions: 0,
    initials: "BL",
    color: "#EF4444",
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
    clientName: "Ana Paula Silva",
    initials: "AP",
    color: "#924B92",
    sessionDate: new Date("2026-06-07"),
    hypothesis: "Luto complicado com traços melancólicos",
    content: "Sessão marcada por silêncios longos e relatos de anestesia afetiva...",
  },
  {
    id: "e2",
    clientName: "Roberto Almeida",
    initials: "RA",
    color: "#3B82F6",
    sessionDate: new Date("2026-06-06"),
    hypothesis: "Crença central de incapacidade",
    content: "Cliente relatou episódio de procrastinação intensa relacionado ao trabalho...",
  },
  {
    id: "e3",
    clientName: "Mariana Costa",
    initials: "MC",
    color: "#F59E0B",
    sessionDate: new Date("2026-06-05"),
    hypothesis: "Conflito anima — persona",
    content: "Trouxe sonho recorrente com labirinto e figura feminina guia...",
  },
];

export const mockStats = {
  totalClients: 5,
  activeClients: 4,
  sessionsThisWeek: 7,
  supervisionsTotal: 3,
  trialDaysLeft: 4,
};
