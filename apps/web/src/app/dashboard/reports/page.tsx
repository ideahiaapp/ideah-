"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BarChart2, Users, FileText, Brain, TrendingUp, TrendingDown,
  CalendarDays, Clock, Sparkles, ArrowUpRight, Minus, X,
  ChevronRight, Loader2, ChevronDown, CheckCircle2, AlertTriangle, Activity,
  Download, ScrollText,
} from "lucide-react";
import { getClients, getEvolutions, getSupervisions } from "@/lib/db";
import { aiHeaders } from "@/lib/api-key";
import { getClinicSettings } from "@/lib/clinic-settings";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import type { Client, Supervision } from "@/lib/database.types";
import type { EvolutionWithClient } from "@/lib/db/evolutions";

/* ─── Paleta ─────────────────────────────────────────────────────── */
const APPROACH_COLORS: Record<string, string> = {
  PSYCHOANALYSIS: "#C2542F", COGNITIVE_BEHAVIORAL: "#3B82F6",
  JUNGIAN: "#F59E0B", HUMANISTIC: "#22C55E",
  SYSTEMIC: "#EC4899", SOMATIC: "#F97316",
  GESTALT: "#14B8A6", ACCEPTANCE_COMMITMENT: "#6366F1",
};
const APPROACH_LABEL: Record<string, string> = {
  PSYCHOANALYSIS: "Psicanálise", COGNITIVE_BEHAVIORAL: "TCC",
  JUNGIAN: "Junguiana", HUMANISTIC: "Humanista",
  SYSTEMIC: "Sistêmica", SOMATIC: "Somática",
  GESTALT: "Gestalt", ACCEPTANCE_COMMITMENT: "ACT",
};
const MOOD_COLOR = ["", "#EF4444", "#F97316", "#EAB308", "#22C55E", "#10B981"];
const MOOD_LABEL = ["", "Muito difícil", "Difícil", "Neutro", "Produtivo", "Excelente"];
const MOOD_EMOJI = ["", "😟", "😕", "😐", "🙂", "😊"];

type Tab       = "geral" | "clientes";
type DrillType = "sessions" | "clients" | "hours" | "evolutions";

type MonthData = {
  label: string; full: string;
  sessions: number; evolutions: number; newClients: number; ym: string;
};

/* ─── SVG Charts ─────────────────────────────────────────────────── */
function BarChart({ data, valueKey, color = "#C2542F", height = 140 }: {
  data: { label: string; [k: string]: number | string }[];
  valueKey: string; color?: string; height?: number;
}) {
  const values = data.map(d => d[valueKey] as number);
  const max = Math.max(...values, 1);
  const W = 480; const BAR_W = 44;
  const GAP = (W - data.length * BAR_W) / (data.length + 1);
  return (
    <svg viewBox={`0 0 ${W} ${height + 30}`} className="w-full">
      {data.map((d, i) => {
        const val  = d[valueKey] as number;
        const x    = GAP + i * (BAR_W + GAP);
        const barH = Math.max(4, (val / max) * height);
        const y    = height - barH;
        const isLast = i === data.length - 1;
        return (
          <g key={i}>
            <rect x={x} y={y} width={BAR_W} height={barH} rx={6} fill={isLast ? color : `${color}40`} />
            <text x={x + BAR_W / 2} y={y - 5} textAnchor="middle" fontSize={10} fontWeight="700" fill={isLast ? color : "#9CA3AF"}>{val}</text>
            <text x={x + BAR_W / 2} y={height + 18} textAnchor="middle" fontSize={10} fill={isLast ? color : "#9CA3AF"} fontWeight={isLast ? "700" : "400"}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ segments, size = 140 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const r = size / 2 - 12; const cx = size / 2; const cy = size / 2;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const C = 2 * Math.PI * r;
  let offset = 0;
  const arcs = segments.map(seg => {
    const pct = seg.value / total; const dash = pct * C; const gap = C - dash; const rot = offset * 360 - 90;
    offset += pct;
    return { ...seg, dash, gap, rot };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((arc, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={arc.color} strokeWidth={20}
          strokeDasharray={`${arc.dash} ${arc.gap}`} strokeDashoffset={0}
          transform={`rotate(${arc.rot} ${cx} ${cy})`} style={{ transition: "stroke-dasharray 0.6s ease" }} />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={20} fontWeight="700" fill="#2D2D2D">{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={9} fill="#9CA3AF">total</text>
    </svg>
  );
}

/* ─── KPI Card clicável ──────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon, color, trend, trendLabel, onClick, active }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
  trend?: "up" | "down" | "flat"; trendLabel?: string;
  onClick?: () => void; active?: boolean;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendCls  = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-400" : "text-gray-400";
  return (
    <button onClick={onClick} className={cn(
      "bg-white rounded-2xl border shadow-sm p-5 text-left w-full transition-all",
      onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
      active ? "border-brand-300 ring-2 ring-brand-100" : "border-gray-100",
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", color)}>
          <Icon className="w-4.5 h-4.5" strokeWidth={1.8} />
        </div>
        <div className="flex items-center gap-2">
          {trend && (
            <div className={cn("flex items-center gap-1 text-xs font-semibold", trendCls)}>
              <TrendIcon className="w-3.5 h-3.5" />{trendLabel}
            </div>
          )}
          {onClick && <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", active ? "text-brand-500 rotate-90" : "text-gray-300")} />}
        </div>
      </div>
      <p className="text-2xl font-bold text-ink leading-none">{value}</p>
      <p className="text-xs font-medium text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </button>
  );
}

/* ─── Drawer de drill-down ───────────────────────────────────────── */
function DrillDrawer({ title, subtitle, onClose, children }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}

/* ═══ Drill: Sessões ═══════════════════════════════════════════════ */
function DrillSessions({ onClose }: { onClose: () => void }) {
  return (
    <DrillDrawer title="Sessões no semestre" subtitle="Agenda não sincronizada com banco" onClose={onClose}>
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-8">
        <CalendarDays className="w-10 h-10 text-gray-200" strokeWidth={1.5} />
        <p className="text-sm font-semibold text-gray-500">Agenda ainda não persistida</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          As sessões agendadas ficam apenas em memória local. Em breve haverá sincronização com o banco de dados.
        </p>
      </div>
    </DrillDrawer>
  );
}

/* ═══ Drill: Clientes ══════════════════════════════════════════════ */
function DrillClients({ onClose, clients, evolutions, supervisions }: {
  onClose: () => void;
  clients: Client[];
  evolutions: EvolutionWithClient[];
  supervisions: Supervision[];
}) {
  const activeClients = clients.filter(c => c.status === "ACTIVE");
  return (
    <DrillDrawer title="Clientes ativos" subtitle={`${activeClients.length} clientes em acompanhamento`} onClose={onClose}>
      <div className="divide-y divide-gray-50">
        {activeClients.map(c => {
          const evols = evolutions.filter(e => e.client_id === c.id).length;
          const sups  = supervisions.filter(s => s.client_id === c.id).length;
          return (
            <Link key={c.id} href={`/dashboard/clients/${c.id}`} onClick={onClose}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: c.color ?? "#C2542F" }}>{c.initials ?? c.name[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.approach_label} · {c.session_frequency} · {c.session_duration}min</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-gray-400">{c.total_sessions} sessões</span>
                  <span className="text-[10px] text-gray-300">·</span>
                  <span className="text-[10px] text-green-600">{evols} evoluções</span>
                  {sups > 0 && <>
                    <span className="text-[10px] text-gray-300">·</span>
                    <span className="text-[10px] text-brand-500">{sups} supervisões</span>
                  </>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {c.next_session && (
                  <span className="text-[10px] text-gray-400">
                    próx. {new Date(c.next_session).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </Link>
          );
        })}
        {activeClients.length === 0 && (
          <div className="px-6 py-16 text-center text-sm text-gray-400">Nenhum cliente ativo</div>
        )}
      </div>
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
        <Link href="/dashboard/clients" onClick={onClose}
          className="flex items-center justify-center gap-2 text-sm text-brand-500 font-semibold hover:text-brand-700">
          Ver todos os clientes <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </DrillDrawer>
  );
}

/* ═══ Drill: Horas Clínicas ════════════════════════════════════════ */
function DrillHours({ onClose, clients, months }: {
  onClose: () => void;
  clients: Client[];
  months: MonthData[];
}) {
  const clinicCfg     = getClinicSettings();
  const totalSessions = months.reduce((a, m) => a + m.sessions, 0);
  const totalHours    = Math.round(totalSessions * clinicCfg.sessionDuration / 60);
  const totalMin      = totalSessions * clinicCfg.sessionDuration;

  const activeClients = clients.filter(c => c.status === "ACTIVE");
  const perClient = activeClients.map(c => {
    const sess = c.total_sessions ?? 0;
    return { ...c, sessions: sess, hours: Math.round(sess * (c.session_duration ?? clinicCfg.sessionDuration) / 60) };
  }).sort((a, b) => b.hours - a.hours);
  const maxH = Math.max(...perClient.map(c => c.hours), 1);

  return (
    <DrillDrawer title="Horas clínicas" subtitle={`${totalHours}h em ${totalSessions} sessões`} onClose={onClose}>
      <div className="px-6 py-5 grid grid-cols-3 gap-4 border-b border-gray-50">
        {[
          { label: "Total de horas", value: `${totalHours}h`, sub: `${totalMin} minutos` },
          { label: "Média mensal",   value: `${Math.round(totalHours / 6)}h`, sub: "por mês" },
          { label: "Por sessão",     value: `${clinicCfg.sessionDuration}min`, sub: "duração padrão" },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className="text-lg font-bold text-gray-800 mt-0.5">{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="px-6 pt-5 pb-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Por mês</p>
        <div className="space-y-2">
          {months.map((m, i) => {
            const h   = Math.round(m.sessions * clinicCfg.sessionDuration / 60);
            const pct = totalHours > 0 ? Math.round(h / totalHours * 100) : 0;
            const isLast = i === months.length - 1;
            return (
              <div key={m.label} className={cn("rounded-xl p-3", isLast ? "bg-brand-50 border border-brand-100" : "bg-gray-50")}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn("text-xs font-semibold", isLast ? "text-brand-700" : "text-gray-700")}>
                    {m.full} {isLast && <span className="text-brand-400 font-normal">(atual)</span>}
                  </span>
                  <span className="text-xs font-bold text-gray-700">{h}h · {m.sessions} evoluções</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-100">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: isLast ? "#C2542F" : "#F5C0AC" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-6 pt-5 pb-6">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Por paciente</p>
        <div className="space-y-3">
          {perClient.map(c => (
            <div key={c.id}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                  style={{ backgroundColor: c.color ?? "#C2542F" }}>{c.initials ?? c.name[0]}</div>
                <span className="text-xs font-medium text-gray-700 flex-1">{c.name}</span>
                <span className="text-xs font-bold text-gray-600">{c.hours}h ({c.sessions} sessões)</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                  style={{ width: `${Math.round(c.hours / maxH * 100)}%`, backgroundColor: c.color ?? "#C2542F" }} />
              </div>
            </div>
          ))}
          {perClient.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum cliente ativo</p>
          )}
        </div>
      </div>
    </DrillDrawer>
  );
}

/* ═══ Drill: Evoluções ═════════════════════════════════════════════ */
function DrillEvolutions({ onClose, evolutions }: {
  onClose: () => void;
  evolutions: EvolutionWithClient[];
}) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const clientsWithEvolutions = useMemo(() => {
    const map: Record<string, {
      clientId: string; clientName: string; initials: string; color: string;
      evolutions: EvolutionWithClient[];
    }> = {};
    evolutions.forEach(e => {
      if (!map[e.client_id]) map[e.client_id] = {
        clientId: e.client_id,
        clientName: e.clients?.name ?? "Cliente",
        initials: e.clients?.initials ?? e.clients?.name?.[0] ?? "?",
        color: e.clients?.color ?? "#C2542F",
        evolutions: [],
      };
      map[e.client_id].evolutions.push(e);
    });
    return Object.values(map).sort((a, b) => b.evolutions.length - a.evolutions.length);
  }, [evolutions]);

  const selected = selectedClientId ? clientsWithEvolutions.find(c => c.clientId === selectedClientId) : null;

  return (
    <DrillDrawer
      title={selected ? `Evoluções — ${selected.clientName}` : "Evoluções registradas"}
      subtitle={selected
        ? `${selected.evolutions.length} registros`
        : `${evolutions.length} evoluções em ${clientsWithEvolutions.length} pacientes`}
      onClose={onClose}
    >
      {selected && (
        <div className="px-6 pt-4 pb-0">
          <button onClick={() => setSelectedClientId(null)}
            className="flex items-center gap-1.5 text-xs text-brand-500 font-medium hover:text-brand-700">
            ← Todos os pacientes
          </button>
        </div>
      )}

      {!selected && (
        <div className="divide-y divide-gray-50">
          {clientsWithEvolutions.map(c => {
            const sorted = [...c.evolutions].sort((a, b) => b.session_date.localeCompare(a.session_date));
            const lastEv = sorted[0];
            return (
              <button key={c.clientId} onClick={() => setSelectedClientId(c.clientId)}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: c.color }}>{c.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">{c.clientName}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    Última: {lastEv?.hypothesis || lastEv?.content?.slice(0, 40) || "—"}…
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-100">
                    {c.evolutions.length}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </button>
            );
          })}
          {clientsWithEvolutions.length === 0 && (
            <div className="px-6 py-16 text-center text-sm text-gray-400">Nenhuma evolução registrada</div>
          )}
        </div>
      )}

      {selected && (
        <div className="divide-y divide-gray-50 mt-3">
          {[...selected.evolutions]
            .sort((a, b) => b.session_date.localeCompare(a.session_date))
            .map(ev => (
              <Link key={ev.id} href={`/dashboard/evolutions/${ev.id}`} onClick={onClose}
                className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2.5 h-2.5 rounded-full mt-1.5"
                    style={{ backgroundColor: MOOD_COLOR[ev.mood ?? 3] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs text-gray-400">
                      {new Date(ev.session_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs">{MOOD_EMOJI[ev.mood ?? 3]} {MOOD_LABEL[ev.mood ?? 3]}</span>
                  </div>
                  {ev.hypothesis && (
                    <p className="text-sm font-semibold text-brand-700">{ev.hypothesis}</p>
                  )}
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">{ev.content}</p>
                  {ev.ai_hypothesis && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-purple-500 mt-1">
                      <Sparkles className="w-2.5 h-2.5" /> Hipótese IA
                    </span>
                  )}
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-1" />
              </Link>
            ))}
        </div>
      )}
    </DrillDrawer>
  );
}

/* ─── Página principal ───────────────────────────────────────────── */
export default function ReportsPage() {
  const { user } = useAuthStore();
  const [tab, setTab]           = useState<Tab>("geral");
  const [drillDown, setDrillDown] = useState<DrillType | null>(null);

  const [clients,     setClients]     = useState<Client[]>([]);
  const [evolutions,  setEvolutions]  = useState<EvolutionWithClient[]>([]);
  const [supervisions, setSupervisions] = useState<Supervision[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      getClients(user.id),
      getEvolutions(user.id),
      getSupervisions(user.id),
    ]).then(([c, e, s]) => {
      setClients(c);
      setEvolutions(e);
      setSupervisions(s);
    }).finally(() => setLoading(false));
  }, [user?.id]);

  function toggleDrill(type: DrillType) {
    setDrillDown(prev => prev === type ? null : type);
  }

  const clinicCfg       = getClinicSettings();
  const sessionPrice    = clinicCfg.sessionPrice;
  const sessionDuration = clinicCfg.sessionDuration;

  /* ── Meses (últimos 6) calculados a partir de evoluções reais ─── */
  const MONTHS: MonthData[] = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthEvols = evolutions.filter(e => e.session_date.startsWith(ym));
      const monthClients = clients.filter(c => c.start_date?.startsWith(ym));
      return {
        label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        full:  d.toLocaleDateString("pt-BR", { month: "long" }),
        sessions:   monthEvols.length,
        evolutions: monthEvols.length,
        newClients: monthClients.length,
        ym,
      };
    });
  }, [evolutions, clients]);

  const CURRENT_MONTH = MONTHS[MONTHS.length - 1];
  const PREV_MONTH    = MONTHS[MONTHS.length - 2];

  const activeClients    = clients.filter(c => c.status === "ACTIVE").length;
  const totalSessions    = MONTHS.reduce((a, m) => a + m.sessions, 0);
  const totalEvolutions  = evolutions.length;
  const avgMood          = evolutions.length > 0
    ? +(evolutions.reduce((a, e) => a + (e.mood ?? 3), 0) / evolutions.length).toFixed(1)
    : 3;
  const totalHours       = Math.round(totalSessions * sessionDuration / 60);
  const estimatedRevenue = totalSessions * sessionPrice;

  const approachDist = useMemo(() => {
    const map: Record<string, { label: string; value: number; approach: string }> = {};
    clients.filter(c => c.status === "ACTIVE" && c.approach).forEach(c => {
      const approach = c.approach!;
      if (!map[approach]) map[approach] = { label: c.approach_label ?? APPROACH_LABEL[approach] ?? approach, value: 0, approach };
      map[approach].value++;
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [clients]);

  const donutSegments = approachDist.map(a => ({
    label: a.label, value: a.value, color: APPROACH_COLORS[a.approach] || "#C2542F",
  }));

  const moodDist = useMemo(() => {
    const cnt = [0, 0, 0, 0, 0, 0];
    evolutions.forEach(e => { const m = e.mood ?? 3; if (m >= 1 && m <= 5) cnt[m]++; });
    return [1, 2, 3, 4, 5].map(i => ({ mood: i, count: cnt[i] }));
  }, [evolutions]);

  const sessionStatusDist = [
    { label: "Realizadas",  value: evolutions.length, color: "#22C55E" },
    { label: "Confirmadas", value: 0, color: "#3B82F6" },
    { label: "Pendentes",   value: 0, color: "#F59E0B" },
    { label: "Canceladas",  value: 0, color: "#EF4444" },
  ];

  const supByApproach = useMemo(() => {
    const map: Record<string, number> = {};
    supervisions.forEach(s => {
      if (s.approach) map[s.approach] = (map[s.approach] || 0) + 1;
    });
    return Object.entries(map)
      .map(([key, count]) => ({ label: APPROACH_LABEL[key] ?? key, count }))
      .sort((a, b) => b.count - a.count);
  }, [supervisions]);

  const maxSup         = Math.max(...supByApproach.map(s => s.count), 1);
  const sessionTrend   = CURRENT_MONTH.sessions >= PREV_MONTH.sessions ? "up" : "down" as const;
  const sessionDelta   = Math.abs(CURRENT_MONTH.sessions - PREV_MONTH.sessions);
  const evolutionTrend = CURRENT_MONTH.evolutions >= PREV_MONTH.evolutions ? "up" : "down" as const;

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "geral",    label: "Visão Geral",  icon: BarChart2 },
    { id: "clientes", label: "Clientes",     icon: Users },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Relatórios</h1>
          <p className="text-gray-400 text-sm mt-0.5">Análise da sua prática clínica</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
          Dados dos últimos 6 meses
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setDrillDown(null); }}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === t.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            )}>
            <t.icon className="w-3.5 h-3.5" strokeWidth={1.8} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: VISÃO GERAL ══ */}
      {tab === "geral" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={CalendarDays} label="Sessões no semestre" value={totalSessions}
              sub={`${CURRENT_MONTH.sessions} este mês`} color="bg-blue-50 text-blue-500"
              trend={sessionTrend} trendLabel={`${sessionDelta} vs mês anterior`}
              onClick={() => toggleDrill("sessions")} active={drillDown === "sessions"} />
            <KpiCard icon={Users} label="Clientes ativos" value={activeClients}
              sub={`${clients.length} cadastrados`} color="bg-brand-50 text-brand-500"
              trend="flat" trendLabel="estável"
              onClick={() => toggleDrill("clients")} active={drillDown === "clients"} />
            <KpiCard icon={Clock} label="Horas clínicas" value={`${totalHours}h`}
              sub="no período" color="bg-purple-50 text-purple-500" trend="up" trendLabel="+12%"
              onClick={() => toggleDrill("hours")} active={drillDown === "hours"} />
            <KpiCard icon={FileText} label="Evoluções registradas" value={totalEvolutions}
              sub={`${CURRENT_MONTH.evolutions} este mês`} color="bg-green-50 text-green-500"
              trend={evolutionTrend} trendLabel={`${CURRENT_MONTH.evolutions} este mês`}
              onClick={() => toggleDrill("evolutions")} active={drillDown === "evolutions"} />
          </div>

          {!drillDown && (
            <p className="text-xs text-gray-400 text-center -mt-2">
              Clique em qualquer card para ver o detalhamento
            </p>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Evoluções por mês</h3>
                <span className="text-xs text-gray-400">últimos 6 meses</span>
              </div>
              <BarChart data={MONTHS} valueKey="sessions" color="#C2542F" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Clientes por abordagem</h3>
              {donutSegments.length > 0 ? (
                <div className="flex items-center gap-6">
                  <DonutChart segments={donutSegments} size={140} />
                  <div className="flex-1 space-y-2">
                    {donutSegments.map(s => (
                      <div key={s.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                          <span className="text-xs text-gray-600 font-medium">{s.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-800">{s.value}</span>
                          <span className="text-xs text-gray-400">
                            {Math.round(s.value / donutSegments.reduce((a, x) => a + x.value, 0) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">Nenhum cliente ativo</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Status das sessões registradas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sessionStatusDist.map(s => {
                const total = sessionStatusDist.reduce((a, x) => a + x.value, 0) || 1;
                return (
                  <div key={s.label} className="text-center">
                    <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white text-xl font-bold mb-2"
                      style={{ backgroundColor: s.color }}>{s.value}</div>
                    <p className="text-xs font-semibold text-gray-700">{s.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{Math.round(s.value / total * 100)}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: CLIENTES ══ */}
      {tab === "clientes" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={Users} label="Clientes ativos" value={activeClients} color="bg-brand-50 text-brand-500" trend="up" trendLabel="" />
            <KpiCard icon={Users} label="Em lista de espera" value={clients.filter(c => c.status === "WAITLIST").length} sub="aguardando vaga" color="bg-amber-50 text-amber-500" trend="flat" trendLabel="sem mudança" />
            <KpiCard icon={Clock} label="Tempo médio em acomp." value="—" sub="entre clientes ativos" color="bg-purple-50 text-purple-500" />
            <KpiCard icon={CalendarDays} label="Evoluções / cliente" value={(totalEvolutions / Math.max(activeClients, 1)).toFixed(0)} sub="média no semestre" color="bg-blue-50 text-blue-500" />
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Distribuição por abordagem</h3>
              {donutSegments.length > 0 ? (
                <div className="flex items-center gap-6">
                  <DonutChart segments={donutSegments} size={160} />
                  <div className="flex-1 space-y-3">
                    {donutSegments.map(s => {
                      const pct = Math.round(s.value / donutSegments.reduce((a, x) => a + x.value, 0) * 100);
                      return (
                        <div key={s.label}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                              <span className="text-xs font-medium text-gray-700">{s.label}</span>
                            </div>
                            <span className="text-xs font-bold text-gray-700">{s.value} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">Nenhum cliente ativo</p>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Clientes ativos</h3>
                <Link href="/dashboard/clients" className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">Ver todos <ArrowUpRight className="w-3 h-3" /></Link>
              </div>
              <div className="divide-y divide-gray-50">
                {clients.filter(c => c.status === "ACTIVE").map(c => (
                  <Link key={c.id} href={`/dashboard/clients/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: c.color ?? "#C2542F" }}>{c.initials ?? c.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.approach_label} · {c.total_sessions} sessões</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{c.session_frequency}</span>
                  </Link>
                ))}
                {clients.filter(c => c.status === "ACTIVE").length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">Nenhum cliente ativo</p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Novos clientes por mês</h3>
            <p className="text-xs text-gray-400 mb-4">Captação no semestre</p>
            <BarChart data={MONTHS} valueKey="newClients" color="#C2542F" height={80} />
          </div>
        </div>
      )}

      {/* ══ Drawers de drill-down ══ */}
      {drillDown === "sessions"   && <DrillSessions onClose={() => setDrillDown(null)} />}
      {drillDown === "clients"    && <DrillClients  onClose={() => setDrillDown(null)} clients={clients} evolutions={evolutions} supervisions={supervisions} />}
      {drillDown === "hours"      && <DrillHours    onClose={() => setDrillDown(null)} clients={clients} months={MONTHS} />}
      {drillDown === "evolutions" && <DrillEvolutions onClose={() => setDrillDown(null)} evolutions={evolutions} />}
    </div>
  );
}
