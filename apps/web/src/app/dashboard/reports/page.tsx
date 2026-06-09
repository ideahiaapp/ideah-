"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart2, Users, FileText, Brain, TrendingUp, TrendingDown,
  CalendarDays, Clock, Sparkles, ArrowUpRight, Minus, X,
  ChevronRight, Filter, Search,
} from "lucide-react";
import {
  mockClients, mockEvolutions, mockSchedule, mockSupervisions,
} from "@/lib/mock-data";
import { getClinicSettings } from "@/lib/clinic-settings";
import { cn } from "@/lib/utils";

/* ─── Paleta ─────────────────────────────────────────────────────── */
const APPROACH_COLORS: Record<string, string> = {
  PSYCHOANALYSIS: "#924B92", COGNITIVE_BEHAVIORAL: "#3B82F6",
  JUNGIAN: "#F59E0B", HUMANISTIC: "#22C55E",
  SYSTEMIC: "#EC4899", SOMATIC: "#F97316",
  GESTALT: "#14B8A6", ACCEPTANCE_COMMITMENT: "#6366F1",
};
const MOOD_COLOR = ["", "#EF4444", "#F97316", "#EAB308", "#22C55E", "#10B981"];
const MOOD_LABEL = ["", "Muito difícil", "Difícil", "Neutro", "Produtivo", "Excelente"];
const MOOD_EMOJI = ["", "😟", "😕", "😐", "🙂", "😊"];

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmada", pending: "Pendente",
  done: "Realizada", cancelled: "Cancelada",
};
const STATUS_CLS: Record<string, string> = {
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  done:      "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-400 border-red-200",
};

type Tab       = "geral" | "producao" | "clientes" | "clinico";
type DrillType = "sessions" | "clients" | "hours" | "evolutions";

/* ─── Dados mensais simulados ────────────────────────────────────── */
const now = new Date();
const MONTHS = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
  return {
    label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    full:  d.toLocaleDateString("pt-BR", { month: "long" }),
    sessions:   [12, 15, 11, 18, 14, 17][i],
    evolutions: [8, 10, 7, 14, 11, 13][i],
    newClients: [1, 2, 0, 1, 0, 1][i],
  };
});
const CURRENT_MONTH = MONTHS[MONTHS.length - 1];
const PREV_MONTH    = MONTHS[MONTHS.length - 2];

/* ─── SVG Charts ─────────────────────────────────────────────────── */
function BarChart({ data, valueKey, color = "#924B92", height = 140 }: {
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
  const clinicCfg = getClinicSettings();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const sessions = useMemo(() => {
    return mockSchedule
      .filter(s => {
        if (dateFrom && s.date < dateFrom) return false;
        if (dateTo   && s.date > dateTo)   return false;
        if (search && !s.clientName.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
  }, [dateFrom, dateTo, search]);

  const selectedSession = selected ? mockSchedule.find(s => s.id === selected) : null;
  const selectedClient  = selectedSession ? mockClients.find(c => c.id === selectedSession.clientId) : null;

  return (
    <DrillDrawer
      title="Sessões no semestre"
      subtitle={`${sessions.length} sessões encontradas`}
      onClose={onClose}
    >
      {/* Filtros */}
      <div className="px-6 py-4 border-b border-gray-50 space-y-3 bg-gray-50/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por paciente..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-300" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 flex-shrink-0">Período:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-300" />
          <span className="text-xs text-gray-400">até</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-300" />
          {(dateFrom || dateTo || search) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); setSearch(""); }}
              className="text-xs text-brand-500 font-medium hover:text-brand-700 flex-shrink-0">Limpar</button>
          )}
        </div>
      </div>

      {/* Detalhe da sessão selecionada */}
      {selectedSession && selectedClient && (
        <div className="mx-6 mt-4 mb-1 bg-brand-50 border border-brand-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: selectedSession.color }}>{selectedSession.initials}</div>
              <div>
                <p className="text-sm font-bold text-gray-900">{selectedSession.clientName}</p>
                <p className="text-xs text-gray-500">
                  {selectedSession.date.split("-").reverse().join("/")} · {selectedSession.startTime} · {selectedSession.duration}min
                </p>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", STATUS_CLS[selectedSession.status])}>
                {STATUS_LABEL[selectedSession.status]}
              </span>
            </div>
            <div className="bg-white rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Valor</p>
              <p className="text-sm font-bold text-gray-800">
                R$ {(selectedSession.price ?? getClinicSettings().sessionPrice).toLocaleString("pt-BR")}
                {selectedSession.price && <span className="text-[10px] text-amber-600 ml-1">custom</span>}
              </p>
            </div>
            <div className="bg-white rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Abordagem</p>
              <p className="text-xs font-semibold text-gray-700">{selectedClient.approachLabel}</p>
            </div>
          </div>
          {selectedSession.notes && (
            <div className="bg-white rounded-xl px-4 py-2.5 text-xs text-gray-600">{selectedSession.notes}</div>
          )}
          <div className="flex gap-2 pt-1">
            <Link href={`/dashboard/evolutions/new?clientId=${selectedSession.clientId}`} onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 bg-white transition-colors">
              <FileText className="w-3.5 h-3.5" /> Registrar evolução
            </Link>
            <Link href={`/dashboard/clients/${selectedSession.clientId}`} onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors">
              <Users className="w-3.5 h-3.5" /> Ver prontuário
            </Link>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="divide-y divide-gray-50">
        {sessions.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-400">Nenhuma sessão encontrada</div>
        ) : sessions.map(s => (
          <button key={s.id} onClick={() => setSelected(s.id === selected ? null : s.id)}
            className={cn(
              "w-full flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors text-left",
              selected === s.id && "bg-brand-50/60"
            )}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: s.color }}>{s.initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{s.clientName}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {s.date.split("-").reverse().join("/")} · {s.startTime} · {s.duration}min
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-semibold text-gray-600">
                R$ {(s.price ?? clinicCfg.sessionPrice).toLocaleString("pt-BR")}
              </span>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", STATUS_CLS[s.status])}>
                {STATUS_LABEL[s.status]}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Rodapé com totais */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between text-xs text-gray-500">
        <span>{sessions.length} sessões</span>
        <span className="font-semibold text-gray-700">
          Total: R$ {sessions.reduce((a, s) => a + (s.price ?? clinicCfg.sessionPrice), 0).toLocaleString("pt-BR")}
        </span>
      </div>
    </DrillDrawer>
  );
}

/* ═══ Drill: Clientes ══════════════════════════════════════════════ */
function DrillClients({ onClose }: { onClose: () => void }) {
  const activeClients = mockClients.filter(c => c.status === "ACTIVE");
  return (
    <DrillDrawer title="Clientes ativos" subtitle={`${activeClients.length} clientes em acompanhamento`} onClose={onClose}>
      <div className="divide-y divide-gray-50">
        {activeClients.map(c => {
          const evols = mockEvolutions.filter(e => e.clientId === c.id).length;
          const sups  = mockSupervisions.filter(s => s.clientName === c.name).length;
          return (
            <Link key={c.id} href={`/dashboard/clients/${c.id}`} onClick={onClose}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: c.color }}>{c.initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.approachLabel} · {c.sessionFrequency} · {c.sessionDuration}min</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-gray-400">{c.totalSessions} sessões</span>
                  <span className="text-[10px] text-gray-300">·</span>
                  <span className="text-[10px] text-green-600">{evols} evoluções</span>
                  {sups > 0 && <>
                    <span className="text-[10px] text-gray-300">·</span>
                    <span className="text-[10px] text-brand-500">{sups} supervisões</span>
                  </>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {c.nextSession && (
                  <span className="text-[10px] text-gray-400">
                    próx. {new Date(c.nextSession).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </Link>
          );
        })}
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
function DrillHours({ onClose }: { onClose: () => void }) {
  const clinicCfg    = getClinicSettings();
  const totalSessions = MONTHS.reduce((a, m) => a + m.sessions, 0);
  const totalHours    = Math.round(totalSessions * clinicCfg.sessionDuration / 60);
  const totalMin      = totalSessions * clinicCfg.sessionDuration;

  /* Horas por cliente (simulado com base em mockClients e totalSessions) */
  const activeClients = mockClients.filter(c => c.status === "ACTIVE");
  const perClient = activeClients.map(c => ({
    ...c,
    sessions: Math.round(totalSessions / activeClients.length * (0.8 + Math.random() * 0.4)),
    hours: 0,
  })).map(c => ({ ...c, hours: Math.round(c.sessions * clinicCfg.sessionDuration / 60) }));
  const maxH = Math.max(...perClient.map(c => c.hours), 1);

  return (
    <DrillDrawer title="Horas clínicas" subtitle={`${totalHours}h em ${totalSessions} sessões` } onClose={onClose}>
      {/* Resumo */}
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

      {/* Por mês */}
      <div className="px-6 pt-5 pb-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Por mês</p>
        <div className="space-y-2">
          {MONTHS.map((m, i) => {
            const h   = Math.round(m.sessions * clinicCfg.sessionDuration / 60);
            const pct = Math.round(h / totalHours * 100);
            const isLast = i === MONTHS.length - 1;
            return (
              <div key={m.label} className={cn("rounded-xl p-3", isLast ? "bg-brand-50 border border-brand-100" : "bg-gray-50")}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn("text-xs font-semibold", isLast ? "text-brand-700" : "text-gray-700")}>
                    {m.full} {isLast && <span className="text-brand-400 font-normal">(atual)</span>}
                  </span>
                  <span className="text-xs font-bold text-gray-700">{h}h · {m.sessions} sessões</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-100">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: isLast ? "#924B92" : "#E9D5F0" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Por cliente */}
      <div className="px-6 pt-5 pb-6">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Por paciente</p>
        <div className="space-y-3">
          {perClient.sort((a, b) => b.hours - a.hours).map(c => (
            <div key={c.id}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                  style={{ backgroundColor: c.color }}>{c.initials}</div>
                <span className="text-xs font-medium text-gray-700 flex-1">{c.name}</span>
                <span className="text-xs font-bold text-gray-600">{c.hours}h ({c.sessions} sessões)</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                  style={{ width: `${Math.round(c.hours / maxH * 100)}%`, backgroundColor: c.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DrillDrawer>
  );
}

/* ═══ Drill: Evoluções ═════════════════════════════════════════════ */
function DrillEvolutions({ onClose }: { onClose: () => void }) {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const clientsWithEvolutions = useMemo(() => {
    const map: Record<string, { clientId: string; clientName: string; initials: string; color: string; evolutions: typeof mockEvolutions }> = {};
    mockEvolutions.forEach(e => {
      if (!map[e.clientId]) map[e.clientId] = { clientId: e.clientId, clientName: e.clientName, initials: e.initials, color: e.color, evolutions: [] };
      map[e.clientId].evolutions.push(e);
    });
    return Object.values(map).sort((a, b) => b.evolutions.length - a.evolutions.length);
  }, []);

  const selected = selectedClient ? clientsWithEvolutions.find(c => c.clientId === selectedClient) : null;

  return (
    <DrillDrawer
      title={selected ? `Evoluções — ${selected.clientName}` : "Evoluções registradas"}
      subtitle={selected ? `${selected.evolutions.length} registros` : `${mockEvolutions.length} evoluções em ${clientsWithEvolutions.length} pacientes`}
      onClose={onClose}
    >
      {/* Breadcrumb */}
      {selected && (
        <div className="px-6 pt-4 pb-0">
          <button onClick={() => setSelectedClient(null)}
            className="flex items-center gap-1.5 text-xs text-brand-500 font-medium hover:text-brand-700">
            ← Todos os pacientes
          </button>
        </div>
      )}

      {/* Lista de pacientes */}
      {!selected && (
        <div className="divide-y divide-gray-50">
          {clientsWithEvolutions.map(c => {
            const lastEv = c.evolutions.sort((a, b) => b.sessionDate.getTime() - a.sessionDate.getTime())[0];
            return (
              <button key={c.clientId} onClick={() => setSelectedClient(c.clientId)}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: c.color }}>{c.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">{c.clientName}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    Última: {lastEv.hypothesis || lastEv.content.slice(0, 40)}…
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
        </div>
      )}

      {/* Lista de evoluções do paciente */}
      {selected && (
        <div className="divide-y divide-gray-50 mt-3">
          {selected.evolutions
            .sort((a, b) => b.sessionDate.getTime() - a.sessionDate.getTime())
            .map(ev => (
              <Link key={ev.id} href={`/dashboard/evolutions/${ev.id}`} onClick={onClose}
                className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full mt-1.5",
                  )} style={{ backgroundColor: MOOD_COLOR[ev.mood] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs text-gray-400">
                      {ev.sessionDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs">{MOOD_EMOJI[ev.mood]} {MOOD_LABEL[ev.mood]}</span>
                  </div>
                  {ev.hypothesis && (
                    <p className="text-sm font-semibold text-brand-700">{ev.hypothesis}</p>
                  )}
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">{ev.content}</p>
                  {ev.aiHypothesis && (
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
  const [tab, setTab]           = useState<Tab>("geral");
  const [drillDown, setDrillDown] = useState<DrillType | null>(null);

  function toggleDrill(type: DrillType) {
    setDrillDown(prev => prev === type ? null : type);
  }

  const clinicCfg       = useMemo(() => getClinicSettings(), []);
  const sessionPrice    = clinicCfg.sessionPrice;
  const sessionDuration = clinicCfg.sessionDuration;

  const activeClients    = mockClients.filter(c => c.status === "ACTIVE").length;
  const totalSessions    = MONTHS.reduce((a, m) => a + m.sessions, 0);
  const avgMood          = +(mockEvolutions.reduce((a, e) => a + e.mood, 0) / mockEvolutions.length).toFixed(1);
  const totalHours       = Math.round(totalSessions * sessionDuration / 60);
  const estimatedRevenue = totalSessions * sessionPrice;

  const approachDist = useMemo(() => {
    const map: Record<string, { label: string; value: number; approach: string }> = {};
    mockClients.filter(c => c.status === "ACTIVE").forEach(c => {
      if (!map[c.approach]) map[c.approach] = { label: c.approachLabel, value: 0, approach: c.approach };
      map[c.approach].value++;
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, []);

  const donutSegments = approachDist.map(a => ({
    label: a.label, value: a.value, color: APPROACH_COLORS[a.approach] || "#924B92",
  }));

  const moodDist = useMemo(() => {
    const cnt = [0, 0, 0, 0, 0, 0];
    mockEvolutions.forEach(e => { if (e.mood >= 1 && e.mood <= 5) cnt[e.mood]++; });
    return [1, 2, 3, 4, 5].map(i => ({ mood: i, count: cnt[i] }));
  }, []);

  const sessionStatusDist = useMemo(() => {
    const cnt: Record<string, number> = { confirmed: 0, pending: 0, done: 0, cancelled: 0 };
    mockSchedule.forEach(s => { cnt[s.status] = (cnt[s.status] || 0) + 1; });
    return [
      { label: "Realizadas",  value: cnt.done,      color: "#22C55E" },
      { label: "Confirmadas", value: cnt.confirmed,  color: "#3B82F6" },
      { label: "Pendentes",   value: cnt.pending,    color: "#F59E0B" },
      { label: "Canceladas",  value: cnt.cancelled,  color: "#EF4444" },
    ];
  }, []);

  const supByApproach = useMemo(() => {
    const map: Record<string, number> = {};
    mockSupervisions.forEach(s => { map[s.approach] = (map[s.approach] || 0) + 1; });
    return Object.entries(map).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  }, []);

  const maxSup = Math.max(...supByApproach.map(s => s.count), 1);
  const sessionTrend   = CURRENT_MONTH.sessions  >= PREV_MONTH.sessions  ? "up" : "down" as const;
  const sessionDelta   = Math.abs(CURRENT_MONTH.sessions - PREV_MONTH.sessions);
  const evolutionTrend = CURRENT_MONTH.evolutions >= PREV_MONTH.evolutions ? "up" : "down" as const;
  const totalEvolutions = MONTHS.reduce((a, m) => a + m.evolutions, 0);

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "geral",    label: "Visão Geral",  icon: BarChart2 },
    { id: "producao", label: "Produção",     icon: CalendarDays },
    { id: "clientes", label: "Clientes",     icon: Users },
    { id: "clinico",  label: "Clínico",      icon: Brain },
  ];

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
          {/* KPIs clicáveis */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={CalendarDays} label="Sessões no semestre" value={totalSessions}
              sub={`${CURRENT_MONTH.sessions} este mês`} color="bg-blue-50 text-blue-500"
              trend={sessionTrend} trendLabel={`${sessionDelta} vs mês anterior`}
              onClick={() => toggleDrill("sessions")} active={drillDown === "sessions"} />
            <KpiCard icon={Users} label="Clientes ativos" value={activeClients}
              sub={`${mockClients.length} cadastrados`} color="bg-brand-50 text-brand-500"
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

          {/* Hint clique */}
          {!drillDown && (
            <p className="text-xs text-gray-400 text-center -mt-2">
              💡 Clique em qualquer card para ver o detalhamento
            </p>
          )}

          {/* Gráficos */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Sessões por mês</h3>
                <span className="text-xs text-gray-400">últimos 6 meses</span>
              </div>
              <BarChart data={MONTHS} valueKey="sessions" color="#924B92" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Clientes por abordagem</h3>
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
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Status das sessões agendadas</h3>
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

      {/* ══ TAB: PRODUÇÃO ══ */}
      {tab === "producao" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={CalendarDays} label="Sessões este mês" value={CURRENT_MONTH.sessions}
              sub="meta estimada: 20" color="bg-blue-50 text-blue-500"
              trend={sessionTrend} trendLabel={`${sessionDelta} vs mês passado`} />
            <KpiCard icon={Clock} label="Horas trabalhadas" value={`${Math.round(CURRENT_MONTH.sessions * sessionDuration / 60)}h`}
              sub={`${sessionDuration}min por sessão`} color="bg-purple-50 text-purple-500" trend="up" trendLabel="+3h" />
            <KpiCard icon={TrendingUp} label="Receita estimada" value={`R$ ${(CURRENT_MONTH.sessions * sessionPrice).toLocaleString("pt-BR")}`}
              sub={`R$ ${sessionPrice}/sessão`} color="bg-green-50 text-green-500"
              trend={sessionTrend} trendLabel={sessionTrend === "up" ? "acima do mês ant." : "abaixo do mês ant."} />
            <KpiCard icon={TrendingUp} label="Receita semestral" value={`R$ ${estimatedRevenue.toLocaleString("pt-BR")}`}
              sub="projeção estimada" color="bg-brand-50 text-brand-500" trend="up" trendLabel="+18% vs sem. ant." />
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Sessões realizadas</h3>
              <p className="text-xs text-gray-400 mb-4">Evolução mensal dos últimos 6 meses</p>
              <BarChart data={MONTHS} valueKey="sessions" color="#3B82F6" />
              <div className="flex justify-between mt-3 pt-3 border-t border-gray-50 text-center">
                <div><p className="text-xs text-gray-400">Total</p><p className="text-base font-bold text-gray-800">{totalSessions}</p></div>
                <div><p className="text-xs text-gray-400">Média/mês</p><p className="text-base font-bold text-gray-800">{(totalSessions / 6).toFixed(0)}</p></div>
                <div><p className="text-xs text-gray-400">Melhor mês</p><p className="text-base font-bold text-brand-600">{MONTHS.reduce((b, m) => m.sessions > b.sessions ? m : b).full}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Evoluções registradas</h3>
              <p className="text-xs text-gray-400 mb-4">Produtividade de documentação clínica</p>
              <BarChart data={MONTHS} valueKey="evolutions" color="#22C55E" />
              <div className="flex justify-between mt-3 pt-3 border-t border-gray-50 text-center">
                <div><p className="text-xs text-gray-400">Total</p><p className="text-base font-bold text-gray-800">{totalEvolutions}</p></div>
                <div><p className="text-xs text-gray-400">Taxa</p><p className="text-base font-bold text-gray-800">{Math.round(totalEvolutions / totalSessions * 100)}%</p></div>
                <div><p className="text-xs text-gray-400">Este mês</p><p className="text-base font-bold text-green-600">{CURRENT_MONTH.evolutions}</p></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50"><h3 className="text-sm font-semibold text-gray-800">Detalhamento mensal</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Mês","Sessões","Evoluções","Taxa reg.","Horas","Receita est."].map(h => (
                      <th key={h} className={cn("px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide", h === "Mês" ? "text-left" : "text-right")}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MONTHS.map((m, i) => {
                    const isLast = i === MONTHS.length - 1;
                    const taxa   = Math.round(m.evolutions / m.sessions * 100);
                    return (
                      <tr key={m.label} className={cn("hover:bg-gray-50 transition-colors", isLast && "bg-brand-50/30")}>
                        <td className="px-5 py-3.5">
                          <span className={cn("text-sm font-medium", isLast ? "text-brand-700 font-semibold" : "text-gray-700")}>
                            {m.full} {isLast && <span className="text-xs ml-1 text-brand-400">(atual)</span>}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-gray-800">{m.sessions}</td>
                        <td className="px-5 py-3.5 text-right text-gray-600">{m.evolutions}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
                            taxa >= 80 ? "bg-green-50 text-green-700" : taxa >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"
                          )}>{taxa}%</span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-gray-600">{Math.round(m.sessions * sessionDuration / 60)}h</td>
                        <td className="px-5 py-3.5 text-right font-medium text-gray-700">R$ {(m.sessions * sessionPrice).toLocaleString("pt-BR")}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td className="px-5 py-3 text-xs font-bold text-gray-600 uppercase">Total</td>
                    <td className="px-5 py-3 text-right font-bold text-gray-800">{totalSessions}</td>
                    <td className="px-5 py-3 text-right font-bold text-gray-800">{totalEvolutions}</td>
                    <td className="px-5 py-3 text-right"><span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{Math.round(totalEvolutions / totalSessions * 100)}%</span></td>
                    <td className="px-5 py-3 text-right font-bold text-gray-800">{totalHours}h</td>
                    <td className="px-5 py-3 text-right font-bold text-brand-700">R$ {estimatedRevenue.toLocaleString("pt-BR")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: CLIENTES ══ */}
      {tab === "clientes" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={Users} label="Clientes ativos" value={activeClients} color="bg-brand-50 text-brand-500" trend="up" trendLabel="+1 este mês" />
            <KpiCard icon={Users} label="Em lista de espera" value={mockClients.filter(c => c.status === "WAITLIST").length} sub="aguardando vaga" color="bg-amber-50 text-amber-500" trend="flat" trendLabel="sem mudança" />
            <KpiCard icon={Clock} label="Tempo médio em acomp." value="7 meses" sub="entre clientes ativos" color="bg-purple-50 text-purple-500" />
            <KpiCard icon={CalendarDays} label="Sessões / cliente" value={(totalSessions / Math.max(activeClients, 1)).toFixed(0)} sub="média no semestre" color="bg-blue-50 text-blue-500" />
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Distribuição por abordagem</h3>
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
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Clientes ativos</h3>
                <Link href="/dashboard/clients" className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">Ver todos <ArrowUpRight className="w-3 h-3" /></Link>
              </div>
              <div className="divide-y divide-gray-50">
                {mockClients.filter(c => c.status === "ACTIVE").map(c => (
                  <Link key={c.id} href={`/dashboard/clients/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: c.color }}>{c.initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.approachLabel} · {c.totalSessions} sessões</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{c.sessionFrequency}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Novos clientes por mês</h3>
            <p className="text-xs text-gray-400 mb-4">Captação no semestre</p>
            <BarChart data={MONTHS} valueKey="newClients" color="#924B92" height={80} />
          </div>
        </div>
      )}

      {/* ══ TAB: CLÍNICO ══ */}
      {tab === "clinico" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={FileText} label="Tom médio das sessões" value={`${avgMood}/5`} sub={`${MOOD_LABEL[Math.round(avgMood)]} em média`} color="bg-green-50 text-green-500" trend="up" trendLabel="+0.3 vs ant." />
            <KpiCard icon={Sparkles} label="Supervisões IA" value={mockSupervisions.length} sub={`${mockSupervisions.reduce((a, s) => a + s.messagesCount, 0)} mensagens`} color="bg-brand-50 text-brand-500" trend="up" trendLabel="+1 este mês" />
            <KpiCard icon={Brain} label="Abordagens consultadas" value={supByApproach.length} sub="em supervisões" color="bg-purple-50 text-purple-500" />
            <KpiCard icon={TrendingUp} label="Taxa de evolução" value={`${Math.round(mockEvolutions.length / totalSessions * 100)}%`} sub="sessões com registro" color="bg-blue-50 text-blue-500" trend="up" trendLabel="+5% vs ant." />
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Distribuição do tom das sessões</h3>
              <div className="space-y-3">
                {moodDist.filter(m => m.count > 0).map(m => {
                  const total = moodDist.reduce((a, x) => a + x.count, 0) || 1;
                  const pct   = Math.round(m.count / total * 100);
                  return (
                    <div key={m.mood}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{MOOD_EMOJI[m.mood]} {MOOD_LABEL[m.mood]}</span>
                        <span className="text-xs font-bold text-gray-600">{m.count} sessões ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: MOOD_COLOR[m.mood] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <span className="text-2xl">{MOOD_EMOJI[Math.round(avgMood)]}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Tom médio: {avgMood}/5</p>
                  <p className="text-xs text-gray-500">Suas sessões têm sido {MOOD_LABEL[Math.round(avgMood)].toLowerCase()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Supervisões por abordagem</h3>
              <div className="space-y-3">
                {supByApproach.map(s => {
                  const pct = Math.round(s.count / maxSup * 100);
                  return (
                    <div key={s.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{s.label}</span>
                        <span className="text-xs font-bold text-gray-600">{s.count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-brand-400" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50">
                <Link href="/dashboard/supervision" className="flex items-center justify-between text-sm text-brand-500 font-medium hover:text-brand-700">
                  Ver todas as supervisões <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
                <h3 className="text-sm font-semibold text-gray-800">Evoluções com hipótese IA</h3>
              </div>
              <span className="text-xs bg-brand-50 text-brand-600 px-2.5 py-1 rounded-full font-medium border border-brand-100">
                {mockEvolutions.filter(e => e.aiHypothesis).length} de {mockEvolutions.length} ({Math.round(mockEvolutions.filter(e => e.aiHypothesis).length / mockEvolutions.length * 100)}%)
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {mockEvolutions.filter(e => e.aiHypothesis).map(e => (
                <Link key={e.id} href={`/dashboard/evolutions/${e.id}`} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5" style={{ backgroundColor: e.color }}>{e.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{e.clientName}</p>
                    <p className="text-xs text-brand-600 font-medium mt-0.5 flex items-center gap-1"><Sparkles className="w-3 h-3" /> {e.hypothesis}</p>
                    <p className="text-xs text-gray-400 truncate mt-1">{e.aiHypothesis?.slice(0, 100)}…</p>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ Drawers de drill-down ══ */}
      {drillDown === "sessions"   && <DrillSessions   onClose={() => setDrillDown(null)} />}
      {drillDown === "clients"    && <DrillClients    onClose={() => setDrillDown(null)} />}
      {drillDown === "hours"      && <DrillHours      onClose={() => setDrillDown(null)} />}
      {drillDown === "evolutions" && <DrillEvolutions onClose={() => setDrillDown(null)} />}
    </div>
  );
}
