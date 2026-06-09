"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Users, MessageSquare, FileText, CalendarDays, TrendingUp,
  Clock, ArrowRight, Plus, Sparkles, AlertCircle, CheckCircle2,
  Brain, Activity, Zap, Circle, Compass, Layers, Heart, UserCheck,
} from "lucide-react";
import {
  mockUser, mockClients, mockSupervisions, mockEvolutions,
  mockSchedule, mockStats,
} from "@/lib/mock-data";
import { getClinicSettings } from "@/lib/clinic-settings";
import { formatRelative, cn } from "@/lib/utils";

/* ─── Helpers ──────────────────────────────────────────────────────── */
function today() { return new Date().toISOString().split("T")[0]; }

const APPROACH_ICONS: Record<string, React.ElementType> = {
  PSYCHOANALYSIS: Brain, COGNITIVE_BEHAVIORAL: Layers,
  JUNGIAN: Compass, HUMANISTIC: Heart,
  SYSTEMIC: Users, SOMATIC: Activity,
  GESTALT: Circle, ACCEPTANCE_COMMITMENT: Zap,
};

const APPROACH_COLORS: Record<string, string> = {
  PSYCHOANALYSIS: "#924B92", COGNITIVE_BEHAVIORAL: "#3B82F6",
  JUNGIAN: "#F59E0B", HUMANISTIC: "#22C55E",
  SYSTEMIC: "#EC4899", SOMATIC: "#F97316",
  GESTALT: "#14B8A6", ACCEPTANCE_COMMITMENT: "#6366F1",
};


/* dados mensais simulados (último semestre) */
const MONTHLY_SESSIONS = (() => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    const count = [12, 15, 11, 18, 14, mockStats.sessionsThisWeek + 2][i];
    return { label, count };
  });
})();

const MAX_MONTHLY = Math.max(...MONTHLY_SESSIONS.map(m => m.count));

/* ─── Componentes ──────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, color, href }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string; href?: string;
}) {
  const inner = (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-ink mt-1 leading-none">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{sub}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
          <Icon className="w-5 h-5" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* gráfico de barras SVG */
function BarChart() {
  const W = 480; const H = 120; const BAR_W = 40; const GAP = (W - MONTHLY_SESSIONS.length * BAR_W) / (MONTHLY_SESSIONS.length + 1);
  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full" style={{ maxHeight: 160 }}>
      {MONTHLY_SESSIONS.map((m, i) => {
        const x = GAP + i * (BAR_W + GAP);
        const barH = Math.max(4, (m.count / MAX_MONTHLY) * H);
        const y = H - barH;
        const isLast = i === MONTHLY_SESSIONS.length - 1;
        return (
          <g key={m.label}>
            <rect x={x} y={y} width={BAR_W} height={barH} rx={6}
              fill={isLast ? "#924B92" : "#E9D5F0"} />
            {isLast && (
              <text x={x + BAR_W / 2} y={y - 6} textAnchor="middle"
                fontSize={11} fontWeight="700" fill="#924B92">{m.count}</text>
            )}
            <text x={x + BAR_W / 2} y={H + 18} textAnchor="middle"
              fontSize={10} fill={isLast ? "#924B92" : "#9CA3AF"}
              fontWeight={isLast ? "700" : "400"}>{m.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Página ────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = mockUser.name.split(" ")[0];

  /* dados computados */
  const todayStr = today();
  const todaySessions = useMemo(
    () => mockSchedule.filter(s => s.date === todayStr && s.status !== "cancelled").sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [todayStr]
  );

  const pendingEvolutions = useMemo(() => {
    const doneSessionIds = new Set(mockEvolutions.map(e => e.clientId + e.sessionDate.toISOString().split("T")[0]));
    return mockSchedule.filter(s =>
      s.status === "done" && !doneSessionIds.has(s.clientId + s.date)
    );
  }, []);

  const approachDist = useMemo(() => {
    const map: Record<string, { label: string; count: number; approach: string }> = {};
    mockClients.filter(c => c.status === "ACTIVE").forEach(c => {
      const key = c.approach;
      if (!map[key]) map[key] = { label: c.approachLabel, count: 0, approach: key };
      map[key].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, []);

  const maxApproach = Math.max(...approachDist.map(a => a.count), 1);

  const recentActivity = useMemo(() => {
    const evs = mockEvolutions.map(e => ({
      id: e.id, type: "evolution" as const,
      label: `Evolução de ${e.clientName}`,
      sub: e.hypothesis,
      date: e.sessionDate,
      color: e.color,
      initials: e.initials,
      href: `/dashboard/evolutions/${e.id}`,
    }));
    const sups = mockSupervisions.map(s => ({
      id: s.id, type: "supervision" as const,
      label: s.title,
      sub: s.clientName,
      date: s.updatedAt,
      color: "#924B92",
      initials: "IA",
      href: `/dashboard/supervision/${s.id}`,
    }));
    return [...evs, ...sups].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  }, []);

  /* evolução de humor média */
  const avgMood = useMemo(() => {
    const moods = mockEvolutions.map(e => e.mood).filter(Boolean);
    return moods.length ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : "—";
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1 capitalize">
            {new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex-shrink-0">
          <div>
            <p className="text-xs font-semibold text-amber-800">Período de trial</p>
            <p className="text-xs text-amber-600 mt-0.5">{mockStats.trialDaysLeft} dias restantes</p>
          </div>
          <Link href="/dashboard/settings"
            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
            Assinar agora
          </Link>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Clientes ativos" value={mockStats.activeClients}
          sub={`de ${mockStats.totalClients} cadastrados`}
          color="bg-brand-50 text-brand-500" href="/dashboard/clients" />
        <StatCard icon={CalendarDays} label="Sessões esta semana" value={mockStats.sessionsThisWeek}
          sub={todaySessions.length > 0 ? `${todaySessions.length} hoje` : "Nenhuma hoje"}
          color="bg-blue-50 text-blue-500" href="/dashboard/schedule" />
        <StatCard icon={FileText} label="Evoluções" value={mockEvolutions.length}
          sub={pendingEvolutions.length > 0 ? `⚠ ${pendingEvolutions.length} pendentes` : "Em dia ✓"}
          color="bg-green-50 text-green-500" href="/dashboard/evolutions" />
        <StatCard icon={TrendingUp} label="Tom médio das sessões" value={`${avgMood} / 5`}
          sub="média das últimas evoluções"
          color="bg-purple-50 text-purple-500" />
      </div>

      {/* ── Ações rápidas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Nova supervisão",   href: "/dashboard/supervision/new", icon: Sparkles,    color: "bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-200" },
          { label: "Novo cliente",       href: "/dashboard/clients/new",     icon: Users,       color: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
          { label: "Nova evolução",      href: "/dashboard/evolutions/new",  icon: FileText,    color: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
          { label: "Abrir agenda",       href: "/dashboard/schedule",        icon: CalendarDays,color: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className={cn("flex items-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-colors", a.color)}>
            <Plus className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
            {a.label}
          </Link>
        ))}
      </div>

      {/* ── Alerta: evoluções pendentes ── */}
      {pendingEvolutions.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {pendingEvolutions.length} sessão{pendingEvolutions.length > 1 ? "ões" : ""} sem evolução registrada
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {pendingEvolutions.map(s => (
                <Link key={s.id} href={`/dashboard/evolutions/new?clientId=${s.clientId}`}
                  className="text-xs bg-white border border-amber-200 text-amber-700 px-3 py-1 rounded-lg font-medium hover:bg-amber-100 transition-colors">
                  + Evoluir {s.clientName}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Grid principal ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Agenda do dia ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
              <h2 className="font-semibold text-gray-800 text-sm">Agenda de hoje</h2>
            </div>
            <Link href="/dashboard/schedule" className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
              Ver semana <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {todaySessions.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <CheckCircle2 className="w-8 h-8 text-gray-200 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm text-gray-400">Nenhuma sessão hoje</p>
              <Link href="/dashboard/schedule"
                className="mt-3 inline-flex items-center gap-1 text-xs text-brand-500 font-medium hover:underline">
                <Plus className="w-3.5 h-3.5" /> Agendar sessão
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todaySessions.map(s => {
                const [h, m] = s.startTime.split(":").map(Number);
                const endMin  = h * 60 + m + s.duration;
                const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
                const STATUS_CLS = {
                  confirmed: "bg-green-50 text-green-700 border-green-200",
                  pending:   "bg-amber-50 text-amber-700 border-amber-200",
                  done:      "bg-gray-50 text-gray-400 border-gray-200",
                  cancelled: "bg-red-50 text-red-400 border-red-200",
                };
                const STATUS_LABEL = { confirmed: "Confirmada", pending: "Pendente", done: "Realizada", cancelled: "Cancelada" };
                return (
                  <Link key={s.id} href={`/dashboard/clients/${s.clientId}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: s.color }}>{s.initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{s.clientName}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {s.startTime} – {endTime} · {s.duration}min
                      </p>
                    </div>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0", STATUS_CLS[s.status])}>
                      {STATUS_LABEL[s.status]}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Sessões por mês ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
              <h2 className="font-semibold text-gray-800 text-sm">Sessões por mês</h2>
            </div>
            <span className="text-xs text-gray-400">últimos 6 meses</span>
          </div>
          <div className="px-6 pt-5 pb-4">
            <BarChart />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
              <div className="text-center">
                <p className="text-xs text-gray-400">Total semestre</p>
                <p className="text-lg font-bold text-gray-800 mt-0.5">
                  {MONTHLY_SESSIONS.reduce((a, m) => a + m.count, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Média mensal</p>
                <p className="text-lg font-bold text-gray-800 mt-0.5">
                  {(MONTHLY_SESSIONS.reduce((a, m) => a + m.count, 0) / 6).toFixed(0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Melhor mês</p>
                <p className="text-lg font-bold text-brand-600 mt-0.5">
                  {MONTHLY_SESSIONS.reduce((best, m) => m.count > best.count ? m : best).label}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Horas clínicas</p>
                <p className="text-lg font-bold text-gray-800 mt-0.5">
                  {Math.round(MONTHLY_SESSIONS.reduce((a, m) => a + m.count, 0) * getClinicSettings().sessionDuration / 60)}h
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Segunda linha ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Abordagens ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
              <h2 className="font-semibold text-gray-800 text-sm">Clientes por abordagem</h2>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            {approachDist.map(a => {
              const Icon = APPROACH_ICONS[a.approach] || Brain;
              const color = APPROACH_COLORS[a.approach] || "#924B92";
              const pct   = Math.round((a.count / maxApproach) * 100);
              return (
                <div key={a.approach}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} strokeWidth={1.8} />
                    <span className="text-xs font-medium text-gray-700 flex-1">{a.label}</span>
                    <span className="text-xs font-bold text-gray-500">{a.count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Atividade recente ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
              <h2 className="font-semibold text-gray-800 text-sm">Atividade recente</h2>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActivity.map((item) => (
              <Link key={item.id + item.type} href={item.href}
                className="flex items-start gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                {item.type === "supervision" ? (
                  <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: item.color }}>{item.initials}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.label}</p>
                  {item.sub && <p className="text-xs text-gray-400 truncate mt-0.5">{item.sub}</p>}
                  <p className="text-xs text-gray-300 mt-1 flex items-center gap-1">
                    <span className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                      item.type === "supervision" ? "bg-brand-50 text-brand-600" : "bg-green-50 text-green-600"
                    )}>
                      {item.type === "supervision" ? "Supervisão" : "Evolução"}
                    </span>
                    <span className="text-gray-300">·</span>
                    {formatRelative(item.date)}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-1" />
              </Link>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-50 flex gap-4">
            <Link href="/dashboard/evolutions"
              className="text-xs text-gray-400 hover:text-brand-500 font-medium flex items-center gap-1">
              <FileText className="w-3 h-3" /> Ver evoluções
            </Link>
            <Link href="/dashboard/supervision"
              className="text-xs text-gray-400 hover:text-brand-500 font-medium flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> Ver supervisões
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
