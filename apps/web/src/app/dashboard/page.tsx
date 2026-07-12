"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users, MessageSquare, FileText, CalendarDays, TrendingUp,
  Clock, ArrowRight, Plus, Sparkles, CheckCircle2,
  Brain, Activity, Zap, Circle, Compass, Layers, Heart, UserCheck, ClipboardList, Flame,
} from "lucide-react";
import { getClients, getEvolutions, getSupervisions } from "@/lib/db";
import { useAuthStore } from "@/store/auth.store";
import { getClinicSettings } from "@/lib/clinic-settings";
import { formatRelative, cn } from "@/lib/utils";
import type { Client } from "@/lib/database.types";
import type { EvolutionWithClient } from "@/lib/db/evolutions";
import type { SupervisionWithClient } from "@/lib/db/supervisions";

/* ─── Helpers ──────────────────────────────────────────────────────── */
const APPROACH_ICONS: Record<string, React.ElementType> = {
  PSYCHOANALYSIS: Brain, COGNITIVE_BEHAVIORAL: Layers,
  JUNGIAN: Compass, HUMANISTIC: Heart,
  SYSTEMIC: Users, SOMATIC: Activity, TANTRA: Flame,
  GESTALT: Circle, ACCEPTANCE_COMMITMENT: Zap,
};

const APPROACH_COLORS: Record<string, string> = {
  PSYCHOANALYSIS: "#C2542F", COGNITIVE_BEHAVIORAL: "#3B82F6",
  JUNGIAN: "#F59E0B", HUMANISTIC: "#22C55E",
  SYSTEMIC: "#EC4899", SOMATIC: "#F97316", TANTRA: "#A855F7",
  GESTALT: "#14B8A6", ACCEPTANCE_COMMITMENT: "#6366F1",
};

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

function BarChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map(m => m.count), 1);
  const W = 480; const H = 120; const BAR_W = 40;
  const GAP = (W - data.length * BAR_W) / (data.length + 1);
  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full" style={{ maxHeight: 160 }}>
      {data.map((m, i) => {
        const x    = GAP + i * (BAR_W + GAP);
        const barH = Math.max(4, (m.count / max) * H);
        const y    = H - barH;
        const isLast = i === data.length - 1;
        return (
          <g key={m.label}>
            <rect x={x} y={y} width={BAR_W} height={barH} rx={6}
              fill={isLast ? "#C2542F" : "#F5C0AC"} />
            {isLast && (
              <text x={x + BAR_W / 2} y={y - 6} textAnchor="middle"
                fontSize={11} fontWeight="700" fill="#C2542F">{m.count}</text>
            )}
            <text x={x + BAR_W / 2} y={H + 18} textAnchor="middle"
              fontSize={10} fill={isLast ? "#C2542F" : "#9CA3AF"}
              fontWeight={isLast ? "700" : "400"}>{m.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Página ────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuthStore();
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = user?.name?.split(" ")[0] ?? "terapeuta";

  const [clients,          setClients]          = useState<Client[]>([]);
  const [evolutions,       setEvolutions]       = useState<EvolutionWithClient[]>([]);
  const [supervisions,     setSupervisions]     = useState<SupervisionWithClient[]>([]);
  const [pendingAnamneseApproval, setPendingAnamneseApproval] = useState(0);

  useEffect(() => {
    if (!user) return;
    getClients(user.id).then(setClients).catch(() => {});
    getEvolutions(user.id).then(setEvolutions).catch(() => {});
    getSupervisions(user.id).then(setSupervisions).catch(() => {});
    fetch(`/api/anamnese/list?therapistId=${user.id}&status=PENDING`)
      .then(r => r.json())
      .then(d => setPendingAnamneseApproval((d.anamneses ?? []).length))
      .catch(() => {});
  }, [user]);

  /* ── computados ── */
  const activeClients = useMemo(() => clients.filter(c => c.status === "ACTIVE"), [clients]);
  const pendingAnamnese = useMemo(() => activeClients.filter(c => !c.anamnese_id).length, [activeClients]);

  const avgMood = useMemo(() => {
    const moods = evolutions.map(e => e.mood).filter(Boolean) as number[];
    return moods.length ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : "—";
  }, [evolutions]);

  const approachDist = useMemo(() => {
    const map: Record<string, { label: string; count: number; approach: string }> = {};
    activeClients.forEach(c => {
      const key = c.approach ?? "OTHER";
      if (!map[key]) map[key] = { label: c.approach_label ?? key, count: 0, approach: key };
      map[key].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [activeClients]);

  const maxApproach = Math.max(...approachDist.map(a => a.count), 1);

  const recentActivity = useMemo(() => {
    const evs = evolutions.slice(0, 6).map(e => ({
      id: e.id, type: "evolution" as const,
      label: `Evolução de ${e.clients?.name ?? "cliente"}`,
      sub:   e.hypothesis ?? undefined,
      date:  new Date(e.session_date),
      color: e.clients?.color ?? "#C2542F",
      initials: e.clients?.initials ?? "?",
      href:  `/dashboard/evolutions/${e.id}`,
    }));
    const sups = supervisions.slice(0, 6).map(s => ({
      id: s.id, type: "supervision" as const,
      label: s.title,
      sub:   s.clients?.name ?? undefined,
      date:  new Date(s.updated_at),
      color: "#C2542F",
      initials: "IA",
      href:  `/dashboard/supervision`,
    }));
    return [...evs, ...sups]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 6);
  }, [evolutions, supervisions]);

  /* gráfico: último semestre com base em evoluções reais */
  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      const ym    = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const count = evolutions.filter(e => e.session_date.startsWith(ym)).length;
      return { label, count };
    });
  }, [evolutions]);

  const totalMonthly = monthlyData.reduce((a, m) => a + m.count, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{greeting}, {firstName}</h1>
          <p className="text-gray-500 text-sm mt-1 capitalize">
            {new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}
          </p>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Clientes ativos" value={activeClients.length}
          sub={`de ${clients.length} cadastrados`}
          color="bg-brand-50 text-brand-500" href="/dashboard/clients" />
        <StatCard icon={ClipboardList} label="Anamnese pendente" value={pendingAnamnese}
          sub={pendingAnamnese === 0 ? "todos preenchidos" : "pacientes sem anamnese"}
          color="bg-amber-50 text-amber-500" href="/dashboard/clients?tab=sem-anamnese" />
        <StatCard icon={UserCheck} label="Aguardando aprovação" value={pendingAnamneseApproval}
          sub={pendingAnamneseApproval === 0 ? "nenhuma pendente" : "anamneses para revisar"}
          color="bg-orange-50 text-orange-500" href="/dashboard/clients?tab=aguardando" />
        <StatCard icon={CalendarDays} label="Supervisões" value={supervisions.length}
          sub="sessões dialógicas"
          color="bg-blue-50 text-blue-500" href="/dashboard/supervision" />
        <StatCard icon={FileText} label="Evoluções" value={evolutions.length}
          sub={evolutions.length === 0 ? "Nenhuma ainda" : "registros clínicos"}
          color="bg-green-50 text-green-500" href="/dashboard/evolutions" />
        <StatCard icon={TrendingUp} label="Tom médio das sessões" value={`${avgMood} / 5`}
          sub="média das últimas evoluções"
          color="bg-purple-50 text-purple-500" />
      </div>

      {/* ── Ações rápidas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Nova supervisão", href: "/dashboard/supervision",      icon: Sparkles,     color: "bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-200" },
          { label: "Novo cliente",    href: "/dashboard/clients/new",      icon: Users,        color: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
          { label: "Nova evolução",   href: "/dashboard/evolutions/new",   icon: FileText,     color: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
          { label: "Abrir agenda",    href: "/dashboard/schedule",         icon: CalendarDays, color: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className={cn("flex items-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-colors", a.color)}>
            <Plus className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
            {a.label}
          </Link>
        ))}
      </div>

      {/* ── Grid principal ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Clientes ativos ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
              <h2 className="font-semibold text-gray-800 text-sm">Clientes ativos</h2>
            </div>
            <Link href="/dashboard/clients" className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {activeClients.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <CheckCircle2 className="w-8 h-8 text-gray-200 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm text-gray-500">Nenhum cliente ativo ainda</p>
              <Link href="/dashboard/clients/new"
                className="mt-3 inline-flex items-center gap-1 text-xs text-brand-500 font-medium hover:underline">
                <Plus className="w-3.5 h-3.5" /> Cadastrar cliente
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activeClients.slice(0, 5).map(c => (
                <Link key={c.id} href={`/dashboard/clients/${c.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: c.color ?? "#C2542F" }}>{c.initials ?? c.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {c.total_sessions} sessões · {c.approach_label}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Evoluções por mês ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
              <h2 className="font-semibold text-gray-800 text-sm">Evoluções por mês</h2>
            </div>
            <span className="text-xs text-gray-400">últimos 6 meses</span>
          </div>
          <div className="px-6 pt-5 pb-4">
            <BarChart data={monthlyData} />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
              <div className="text-center">
                <p className="text-xs text-gray-400">Total semestre</p>
                <p className="text-lg font-bold text-gray-800 mt-0.5">{totalMonthly}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Média mensal</p>
                <p className="text-lg font-bold text-gray-800 mt-0.5">{(totalMonthly / 6).toFixed(0)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Clientes cobertos</p>
                <p className="text-lg font-bold text-gray-800 mt-0.5">
                  {new Set(evolutions.map(e => e.client_id)).size}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Horas clínicas</p>
                <p className="text-lg font-bold text-gray-800 mt-0.5">
                  {Math.round(totalMonthly * getClinicSettings().sessionDuration / 60)}h
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
            {approachDist.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Nenhum cliente cadastrado</p>
            ) : approachDist.map(a => {
              const Icon  = APPROACH_ICONS[a.approach] ?? Brain;
              const color = APPROACH_COLORS[a.approach] ?? "#C2542F";
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
          {recentActivity.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Activity className="w-8 h-8 text-gray-200 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm text-gray-500">Nenhuma atividade ainda</p>
              <p className="text-xs text-gray-400 mt-1">Suas evoluções e supervisões aparecerão aqui</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentActivity.map(item => (
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
                    {item.sub && <p className="text-xs text-gray-500 truncate mt-0.5">{item.sub}</p>}
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
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
          )}
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
