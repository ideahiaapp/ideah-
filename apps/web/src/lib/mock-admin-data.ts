// ─── Dados mock para o painel admin ─────────────────────────────────────────

export type Plan = "trial" | "pro" | "clinic";
export type SaleStatus = "active" | "cancelled" | "past_due";

export interface Sale {
  id:        string;
  name:      string;
  email:     string;
  plan:      Plan;
  billing:   "monthly" | "annual";
  value:     number;       // R$ por mês (equivalente)
  total:     number;       // total já pago
  status:    SaleStatus;
  createdAt: Date;
  lastLogin: Date | null;
  loginCount: number;
  source:    string;       // canal de venda
}

export interface LoginEvent {
  id:        string;
  email:     string;
  name:      string;
  plan:      Plan;
  at:        Date;
  device:    string;
}

/* ── Compradores / assinantes ── */
export const mockSales: Sale[] = [
  {
    id: "s01", name: "Fernanda Rocha", email: "fernanda.rocha@gmail.com",
    plan: "pro", billing: "monthly", value: 49.90, total: 249.50,
    status: "active", createdAt: new Date("2026-01-10"),
    lastLogin: new Date("2026-06-09T14:22:00"), loginCount: 47, source: "Instagram",
  },
  {
    id: "s02", name: "Rodrigo Menezes", email: "rodrigo.menezes@hotmail.com",
    plan: "pro", billing: "annual", value: 39.90, total: 478.80,
    status: "active", createdAt: new Date("2025-12-03"),
    lastLogin: new Date("2026-06-10T08:05:00"), loginCount: 91, source: "LinkedIn",
  },
  {
    id: "s03", name: "Camila Torres", email: "camila.torres@outlook.com",
    plan: "clinic", billing: "monthly", value: 129.90, total: 779.40,
    status: "active", createdAt: new Date("2025-11-15"),
    lastLogin: new Date("2026-06-08T18:30:00"), loginCount: 138, source: "Indicação",
  },
  {
    id: "s04", name: "Beatriz Alves", email: "beatriz.alves@gmail.com",
    plan: "pro", billing: "monthly", value: 49.90, total: 149.70,
    status: "active", createdAt: new Date("2026-03-22"),
    lastLogin: new Date("2026-06-07T11:00:00"), loginCount: 22, source: "Instagram",
  },
  {
    id: "s05", name: "Lucas Ferreira", email: "lucas.ferreira@gmail.com",
    plan: "trial", billing: "monthly", value: 0, total: 0,
    status: "active", createdAt: new Date("2026-06-05"),
    lastLogin: new Date("2026-06-10T09:45:00"), loginCount: 4, source: "Google Ads",
  },
  {
    id: "s06", name: "Patrícia Lima", email: "patricia.lima@yahoo.com.br",
    plan: "pro", billing: "monthly", value: 49.90, total: 99.80,
    status: "past_due", createdAt: new Date("2026-04-01"),
    lastLogin: new Date("2026-05-28T16:00:00"), loginCount: 15, source: "Facebook",
  },
  {
    id: "s07", name: "André Souza", email: "andre.souza@gmail.com",
    plan: "pro", billing: "annual", value: 39.90, total: 478.80,
    status: "active", createdAt: new Date("2025-10-30"),
    lastLogin: new Date("2026-06-09T20:10:00"), loginCount: 210, source: "LinkedIn",
  },
  {
    id: "s08", name: "Juliana Costa", email: "juliana.costa@gmail.com",
    plan: "clinic", billing: "annual", value: 99.90, total: 1198.80,
    status: "active", createdAt: new Date("2025-09-01"),
    lastLogin: new Date("2026-06-10T07:30:00"), loginCount: 312, source: "Indicação",
  },
  {
    id: "s09", name: "Marcos Vieira", email: "marcos.vieira@gmail.com",
    plan: "pro", billing: "monthly", value: 49.90, total: 49.90,
    status: "cancelled", createdAt: new Date("2026-05-01"),
    lastLogin: new Date("2026-05-10T10:00:00"), loginCount: 6, source: "Google Ads",
  },
  {
    id: "s10", name: "Renata Gomes", email: "renata.gomes@outlook.com",
    plan: "trial", billing: "monthly", value: 0, total: 0,
    status: "active", createdAt: new Date("2026-06-08"),
    lastLogin: new Date("2026-06-09T15:00:00"), loginCount: 2, source: "Instagram",
  },
  {
    id: "s11", name: "Thiago Cardoso", email: "thiago.cardoso@gmail.com",
    plan: "pro", billing: "annual", value: 39.90, total: 478.80,
    status: "active", createdAt: new Date("2025-12-20"),
    lastLogin: new Date("2026-06-10T06:55:00"), loginCount: 88, source: "Facebook",
  },
  {
    id: "s12", name: "Simone Nunes", email: "simone.nunes@gmail.com",
    plan: "pro", billing: "monthly", value: 49.90, total: 349.30,
    status: "active", createdAt: new Date("2025-12-28"),
    lastLogin: new Date("2026-06-06T13:20:00"), loginCount: 55, source: "Indicação",
  },
];

/* ── Histórico de logins ── */
export const mockLoginEvents: LoginEvent[] = [
  { id: "l01", email: "rodrigo.menezes@hotmail.com", name: "Rodrigo Menezes",   plan: "pro",    at: new Date("2026-06-10T08:05:00"), device: "Chrome · macOS"   },
  { id: "l02", email: "juliana.costa@gmail.com",     name: "Juliana Costa",     plan: "clinic", at: new Date("2026-06-10T07:30:00"), device: "Safari · iPhone"  },
  { id: "l03", email: "thiago.cardoso@gmail.com",    name: "Thiago Cardoso",    plan: "pro",    at: new Date("2026-06-10T06:55:00"), device: "Chrome · Windows" },
  { id: "l04", email: "lucas.ferreira@gmail.com",    name: "Lucas Ferreira",    plan: "trial",  at: new Date("2026-06-10T09:45:00"), device: "Firefox · Linux"  },
  { id: "l05", email: "fernanda.rocha@gmail.com",    name: "Fernanda Rocha",    plan: "pro",    at: new Date("2026-06-09T14:22:00"), device: "Chrome · Windows" },
  { id: "l06", email: "andre.souza@gmail.com",       name: "André Souza",       plan: "pro",    at: new Date("2026-06-09T20:10:00"), device: "Edge · Windows"   },
  { id: "l07", email: "renata.gomes@outlook.com",    name: "Renata Gomes",      plan: "trial",  at: new Date("2026-06-09T15:00:00"), device: "Chrome · Android" },
  { id: "l08", email: "camila.torres@outlook.com",   name: "Camila Torres",     plan: "clinic", at: new Date("2026-06-08T18:30:00"), device: "Safari · macOS"   },
  { id: "l09", email: "beatriz.alves@gmail.com",     name: "Beatriz Alves",     plan: "pro",    at: new Date("2026-06-07T11:00:00"), device: "Chrome · macOS"   },
  { id: "l10", email: "simone.nunes@gmail.com",      name: "Simone Nunes",      plan: "pro",    at: new Date("2026-06-06T13:20:00"), device: "Chrome · Windows" },
];

/* ── Vendas agrupadas por mês (últimos 6 meses) ── */
export const mockMonthlySales = [
  { month: "Jan",  sales: 2, revenue: 1317.60 },
  { month: "Fev",  sales: 1, revenue:  478.80 },
  { month: "Mar",  sales: 2, revenue:  628.80 },
  { month: "Abr",  sales: 2, revenue:  149.70 },
  { month: "Mai",  sales: 1, revenue:  349.30 },
  { month: "Jun",  sales: 2, revenue:    0.00 },
];
