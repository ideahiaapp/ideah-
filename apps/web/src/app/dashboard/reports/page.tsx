"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BarChart2, Users, FileText, Brain, TrendingUp, TrendingDown,
  CalendarDays, Clock, Sparkles, ArrowUpRight, ArrowRight, Minus, X, Plus,
  ChevronRight, Loader2, ChevronDown, CheckCircle2, AlertTriangle, Activity,
  Download, ScrollText, ClipboardList, UserCheck, MessageSquare,
} from "lucide-react";
import { getClients, getEvolutions, getSupervisions } from "@/lib/db";
import { aiHeaders } from "@/lib/api-key";
import { getClinicSettings } from "@/lib/clinic-settings";
import { useAuthStore } from "@/store/auth.store";
import { cn, formatRelative } from "@/lib/utils";
import type { Client } from "@/lib/database.types";
import type { EvolutionWithClient } from "@/lib/db/evolutions";
import type { SupervisionWithClient } from "@/lib/db/supervisions";

/* ─── Paleta ─────────────────────────────────────────────────────── */
const APPROACH_COLORS: Record<string, string> = {
  PSYCHOANALYSIS: "#C2542F", COGNITIVE_BEHAVIORAL: "#3B82F6",
  JUNGIAN: "#F59E0B", HUMANISTIC: "#22C55E",
  SYSTEMIC: "#EC4899", SOMATIC: "#F97316",
  GESTALT: "#14B8A6", ACCEPTANCE_COMMITMENT: "#6366F1",
  TANTRA: "#A855F7",
};
const APPROACH_LABEL: Record<string, string> = {
  PSYCHOANALYSIS: "Psicanálise", COGNITIVE_BEHAVIORAL: "TCC",
  JUNGIAN: "Junguiana", HUMANISTIC: "Humanista",
  SYSTEMIC: "Sistêmica", SOMATIC: "Somática",
  GESTALT: "Gestalt", ACCEPTANCE_COMMITMENT: "ACT",
  TANTRA: "Sexualidade Humana e Tantra",
};
const MOOD_COLOR = ["", "#EF4444", "#F97316", "#EAB308", "#22C55E", "#10B981"];
const MOOD_LABEL = ["", "Muito difícil", "Difícil", "Neutro", "Produtivo", "Excelente"];
const MOOD_EMOJI = ["", "😟", "😕", "😐", "🙂", "😊"];

type Tab       = "geral" | "clientes" | "relatorios";
type DrillType = "sessions" | "clients" | "hours" | "evolutions";
type ReportSubTab = "evolucao" | "relatorio_evolucoes" | "documentos_oficiais";

const REPORT_SUB_TABS: { id: ReportSubTab; label: string }[] = [
  { id: "evolucao",             label: "Evolução" },
  { id: "relatorio_evolucoes",  label: "Relatório de Evoluções" },
  { id: "documentos_oficiais",  label: "Documentos Oficiais" },
];

const EVOLUTION_PROMPT_KEYS: Partial<Record<ReportSubTab, string>> = {
  evolucao: "EVOLUTION",
  relatorio_evolucoes: "EVOLUTION_REPORT",
};

const DOCUMENT_TYPE_OPTIONS = [
  { value: "DOC_DECLARACAO_COMPARECIMENTO", label: "Declaração de comparecimento" },
  { value: "DOC_RELATORIO_ACOMPANHAMENTO",  label: "Relatório de acompanhamento psicológico" },
  { value: "DOC_ATESTADO_PSICOLOGICO",      label: "Atestado psicológico" },
  { value: "DOC_ENCAMINHAMENTO",            label: "Encaminhamento" },
];

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
  const summary = data.map(d => `${d.label}: ${d[valueKey]}`).join(", ");
  return (
    <svg viewBox={`0 0 ${W} ${height + 30}`} className="w-full" role="img" aria-label={`Gráfico de barras. ${summary}`}>
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
  const summary = segments.map(s => `${s.label}: ${s.value}`).join(", ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Gráfico de rosca. Total: ${total}. ${summary}`}>
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
  const trendCls  = trend === "up" ? "text-green-700" : trend === "down" ? "text-red-600" : "text-gray-500";
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
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </button>
  );
}

/* ─── Drawer de drill-down ───────────────────────────────────────── */
function DrillDrawer({ title, subtitle, onClose, children }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, []);

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col focus:outline-none">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Fechar" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-600">
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
        <p className="text-xs text-gray-500 leading-relaxed">
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
  supervisions: SupervisionWithClient[];
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
                <p className="text-xs text-gray-500 mt-0.5">{c.approach_label} · {c.session_frequency} · {c.session_duration}min</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-gray-500">{c.total_sessions} sessões</span>
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
                  <span className="text-[10px] text-gray-500">
                    próx. {new Date(c.next_session).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </Link>
          );
        })}
        {activeClients.length === 0 && (
          <div className="px-6 py-16 text-center text-sm text-gray-500">Nenhum cliente ativo</div>
        )}
      </div>
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
        <Link href="/dashboard/clients" onClick={onClose}
          className="flex items-center justify-center gap-2 text-sm text-brand-600 font-semibold hover:text-brand-700">
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
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-lg font-bold text-gray-800 mt-0.5">{s.value}</p>
            <p className="text-[10px] text-gray-500">{s.sub}</p>
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
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Por cliente</p>
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
            <p className="text-sm text-gray-500 text-center py-4">Nenhum cliente ativo</p>
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
        : `${evolutions.length} evoluções em ${clientsWithEvolutions.length} clientes`}
      onClose={onClose}
    >
      {selected && (
        <div className="px-6 pt-4 pb-0">
          <button onClick={() => setSelectedClientId(null)}
            className="flex items-center gap-1.5 text-xs text-brand-600 font-medium hover:text-brand-700">
            ← Todos os clientes
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
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
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
            <div className="px-6 py-16 text-center text-sm text-gray-500">Nenhuma evolução registrada</div>
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
                    <p className="text-xs text-gray-500">
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

/* ═══ Aba: Relatórios › Evolução ═══════════════════════════════════ */
const EVOLUTION_PERIOD_OPTIONS = [
  { value: "1m",  label: "Último mês" },
  { value: "3m",  label: "Últimos 3 meses" },
  { value: "6m",  label: "Últimos 6 meses" },
  { value: "1y",  label: "Último ano" },
  { value: "all", label: "Todo o período de atendimento" },
];

function EvolutionMarkdownReport({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("# "))   return <h1  key={i} className="text-xl font-bold text-gray-900 mt-2">{line.slice(2)}</h1>;
        if (line.startsWith("## "))  return <h2  key={i} className="text-base font-bold text-gray-800 mt-5 pb-1 border-b border-gray-100">{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3  key={i} className="text-sm font-semibold text-gray-700 mt-3">{line.slice(4)}</h3>;
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i}>
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
          </p>
        );
      })}
    </div>
  );
}

function EvolutionReportPanel({ clients, promptKey }: { clients: Client[]; promptKey: string }) {
  const { user } = useAuthStore();
  const [clientId, setClientId] = useState("");
  const [period,   setPeriod]   = useState("3m");
  const [generating, setGenerating] = useState(false);
  const [report,   setReport]   = useState<{ report: string; clientName: string; sessionCount: number; period: string; dateRange: string } | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  async function generate() {
    if (!clientId || !user?.id) return;
    setGenerating(true);
    setReport(null);
    setError(null);
    try {
      const res = await fetch("/api/reports/clinical-evolution", {
        method:  "POST",
        headers: await aiHeaders(),
        body:    JSON.stringify({ clientId, therapistId: user.id, period, promptKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar relatório");
      setReport(data);
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setGenerating(false);
    }
  }

  const activeClients = clients.filter(c => c.status === "ACTIVE");

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <ScrollText className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
          <h2 className="text-sm font-semibold text-gray-800">Gerar relatório de evolução clínica</h2>
          <span className="ml-auto text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full border border-brand-100 font-medium">IA</span>
        </div>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          Selecione um cliente e o período desejado. A IA analisará todas as evoluções e supervisões registradas e gerará um relatório clínico detalhado.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Cliente</label>
            <div className="relative">
              <select
                value={clientId}
                onChange={e => { setClientId(e.target.value); setReport(null); setError(null); }}
                aria-label="Cliente"
                className="w-full appearance-none px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 pr-9 text-gray-800"
              >
                <option value="">Selecionar cliente...</option>
                {activeClients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Período de análise</label>
            <div className="relative">
              <select
                value={period}
                onChange={e => { setPeriod(e.target.value); setReport(null); setError(null); }}
                aria-label="Período de análise"
                className="w-full appearance-none px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 pr-9 text-gray-800"
              >
                {EVOLUTION_PERIOD_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <button
          onClick={generate}
          disabled={!clientId || generating}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all",
            clientId && !generating
              ? "bg-brand-500 hover:bg-brand-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
        >
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando relatório...</>
            : <><Sparkles className="w-4 h-4" /> Gerar relatório</>}
        </button>

        {error && (
          <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {generating && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-gray-100 rounded-lg w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
          <div className="space-y-2 pt-4">
            {[100, 80, 90, 70, 85, 75].map((w, i) => (
              <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      )}

      {report && (
        <div ref={reportRef} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div>
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
                <p className="text-sm font-bold text-gray-800">{report.clientName}</p>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {report.period} · {report.sessionCount} sessões analisadas · {report.dateRange}
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>
          </div>

          <div className="px-6 py-5">
            <EvolutionMarkdownReport text={report.report} />
          </div>

          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-[10px] text-gray-500">
              Relatório gerado por IA com base nos registros clínicos. Não substitui avaliação clínica profissional.
            </p>
          </div>
        </div>
      )}

      {!report && !generating && !error && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <ScrollText className="w-10 h-10 text-gray-200 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-gray-500">Nenhum relatório gerado</p>
          <p className="text-xs text-gray-500 mt-1">Selecione um cliente e o período para gerar o relatório de evolução clínica.</p>
        </div>
      )}
    </div>
  );
}

/* ═══ Aba: Relatórios › Documentos Oficiais ════════════════════════ */
function OfficialDocumentPanel({ clients }: { clients: Client[] }) {
  const { user } = useAuthStore();
  const [clientId,     setClientId]     = useState("");
  const [documentType, setDocumentType] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result,   setResult]   = useState<{ documentText: string; documentLabel: string; clientName: string } | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const activeClients = clients.filter(c => c.status === "ACTIVE");

  async function generate() {
    if (!clientId || !documentType || !user?.id) return;
    setGenerating(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/reports/official-document", {
        method:  "POST",
        headers: await aiHeaders(),
        body:    JSON.stringify({ clientId, therapistId: user.id, documentType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar documento");
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
          <h2 className="text-sm font-semibold text-gray-800">Gerar documento oficial</h2>
          <span className="ml-auto text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full border border-brand-100 font-medium">IA</span>
        </div>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          Selecione o cliente e o tipo de documento. A IA gerará o texto com base nos dados registrados do acompanhamento.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Cliente</label>
            <div className="relative">
              <select
                value={clientId}
                onChange={e => { setClientId(e.target.value); setResult(null); setError(null); }}
                aria-label="Cliente"
                className="w-full appearance-none px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 pr-9 text-gray-800"
              >
                <option value="">Selecionar cliente...</option>
                {activeClients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Documento</label>
            <div className="relative">
              <select
                value={documentType}
                onChange={e => { setDocumentType(e.target.value); setResult(null); setError(null); }}
                aria-label="Documento"
                className="w-full appearance-none px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 pr-9 text-gray-800"
              >
                <option value="">Selecionar documento...</option>
                {DOCUMENT_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <button
          onClick={generate}
          disabled={!clientId || !documentType || generating}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all",
            clientId && documentType && !generating
              ? "bg-brand-500 hover:bg-brand-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
        >
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando documento...</>
            : <><Sparkles className="w-4 h-4" /> Gerar documento</>}
        </button>

        {error && (
          <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {generating && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-gray-100 rounded-lg w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
          <div className="space-y-2 pt-4">
            {[100, 80, 90, 70, 85].map((w, i) => (
              <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      )}

      {result && (
        <div ref={resultRef} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
              <p className="text-sm font-bold text-gray-800">{result.documentLabel} — {result.clientName}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>
          </div>
          <div className="px-6 py-5">
            <EvolutionMarkdownReport text={result.documentText} />
          </div>
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-[10px] text-gray-500">
              Documento gerado por IA. Revise o conteúdo antes de assinar ou enviar.
            </p>
          </div>
        </div>
      )}

      {!result && !generating && !error && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-gray-500">Nenhum documento gerado</p>
          <p className="text-xs text-gray-500 mt-1">Selecione um cliente e o tipo de documento para gerar.</p>
        </div>
      )}
    </div>
  );
}

/* ─── Página principal ───────────────────────────────────────────── */
export default function ReportsPage() {
  const { user } = useAuthStore();
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = user?.name?.split(" ")[0] ?? "terapeuta";

  const [tab, setTab]           = useState<Tab>("geral");
  const [reportSubTab, setReportSubTab] = useState<ReportSubTab>("evolucao");
  const [drillDown, setDrillDown] = useState<DrillType | null>(null);

  const [clients,     setClients]     = useState<Client[]>([]);
  const [evolutions,  setEvolutions]  = useState<EvolutionWithClient[]>([]);
  const [supervisions, setSupervisions] = useState<SupervisionWithClient[]>([]);
  const [pendingAnamneseApproval, setPendingAnamneseApproval] = useState(0);
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
    fetch(`/api/anamnese/list?therapistId=${user.id}&status=PENDING`)
      .then(r => r.json())
      .then(d => setPendingAnamneseApproval((d.anamneses ?? []).length))
      .catch(() => {});
  }, [user?.id]);

  const pendingAnamnese = useMemo(() => clients.filter(c => c.status === "ACTIVE" && !c.anamnese_id).length, [clients]);

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
    { id: "geral",      label: "Visão Geral",  icon: BarChart2 },
    { id: "clientes",   label: "Clientes",     icon: Users },
    { id: "relatorios", label: "Relatórios",   icon: ScrollText },
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
          <h1 className="text-xl font-bold text-ink">{greeting}, {firstName}</h1>
          <p className="text-gray-500 text-sm mt-0.5 capitalize">
            {new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}
          </p>
        </div>
        <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
          Dados dos últimos 6 meses
        </span>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Nova supervisão", href: "/dashboard/supervision",      icon: Sparkles,     color: "bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-200" },
          { label: "Novo cliente",    href: "/dashboard/clients/new",      icon: Users,        color: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
          { label: "Abrir agenda",    href: "/dashboard/schedule",         icon: CalendarDays, color: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className={cn("flex items-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-colors", a.color)}>
            <Plus className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
            {a.label}
          </Link>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setDrillDown(null); }}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === t.id ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-800"
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
            <KpiCard icon={ClipboardList} label="Anamnese pendente" value={pendingAnamnese}
              sub={pendingAnamnese === 0 ? "todos preenchidos" : "clientes sem anamnese"}
              color="bg-amber-50 text-amber-500" />
            <KpiCard icon={UserCheck} label="Aguardando aprovação" value={pendingAnamneseApproval}
              sub={pendingAnamneseApproval === 0 ? "nenhuma pendente" : "anamneses para revisar"}
              color="bg-orange-50 text-orange-500" />
            <KpiCard icon={MessageSquare} label="Supervisões" value={supervisions.length}
              sub="sessões dialógicas" color="bg-blue-50 text-blue-500" />
          </div>

          {!drillDown && (
            <p className="text-xs text-gray-500 text-center -mt-2">
              Clique em qualquer card para ver o detalhamento
            </p>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-800">Evoluções por mês</h2>
                <span className="text-xs text-gray-500">últimos 6 meses</span>
              </div>
              <BarChart data={MONTHS} valueKey="sessions" color="#C2542F" />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Total semestre</p>
                  <p className="text-lg font-bold text-gray-800 mt-0.5">{totalSessions}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Média mensal</p>
                  <p className="text-lg font-bold text-gray-800 mt-0.5">{(totalSessions / 6).toFixed(0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Clientes cobertos</p>
                  <p className="text-lg font-bold text-gray-800 mt-0.5">
                    {new Set(evolutions.map(e => e.client_id)).size}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Horas clínicas</p>
                  <p className="text-lg font-bold text-gray-800 mt-0.5">{totalHours}h</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Clientes por abordagem</h2>
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
                          <span className="text-xs text-gray-500">
                            {Math.round(s.value / donutSegments.reduce((a, x) => a + x.value, 0) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">Nenhum cliente ativo</p>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Clientes ativos */}
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
              {clients.filter(c => c.status === "ACTIVE").length === 0 ? (
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
                  {clients.filter(c => c.status === "ACTIVE").slice(0, 5).map(c => (
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

            {/* Atividade recente */}
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

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Status das sessões registradas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sessionStatusDist.map(s => {
                const total = sessionStatusDist.reduce((a, x) => a + x.value, 0) || 1;
                return (
                  <div key={s.label} className="text-center">
                    <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white text-xl font-bold mb-2"
                      style={{ backgroundColor: s.color }}>{s.value}</div>
                    <p className="text-xs font-semibold text-gray-700">{s.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{Math.round(s.value / total * 100)}%</p>
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
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Distribuição por abordagem</h2>
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
                <p className="text-sm text-gray-500 text-center py-8">Nenhum cliente ativo</p>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Clientes ativos</h2>
                <Link href="/dashboard/clients" className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">Ver todos <ArrowUpRight className="w-3 h-3" /></Link>
              </div>
              <div className="divide-y divide-gray-50">
                {clients.filter(c => c.status === "ACTIVE").map(c => (
                  <Link key={c.id} href={`/dashboard/clients/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: c.color ?? "#C2542F" }}>{c.initials ?? c.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.approach_label} · {c.total_sessions} sessões</p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">{c.session_frequency}</span>
                  </Link>
                ))}
                {clients.filter(c => c.status === "ACTIVE").length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">Nenhum cliente ativo</p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Novos clientes por mês</h2>
            <p className="text-xs text-gray-500 mb-4">Captação no semestre</p>
            <BarChart data={MONTHS} valueKey="newClients" color="#C2542F" height={80} />
          </div>
        </div>
      )}

      {/* ══ TAB: RELATÓRIOS ══ */}
      {tab === "relatorios" && (
        <div className="space-y-6">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {REPORT_SUB_TABS.map(t => (
              <button key={t.id} onClick={() => setReportSubTab(t.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  reportSubTab === t.id ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-800"
                )}>
                {t.label}
              </button>
            ))}
          </div>
          {reportSubTab === "documentos_oficiais"
            ? <OfficialDocumentPanel key={reportSubTab} clients={clients} />
            : <EvolutionReportPanel key={reportSubTab} clients={clients} promptKey={EVOLUTION_PROMPT_KEYS[reportSubTab]!} />
          }
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
