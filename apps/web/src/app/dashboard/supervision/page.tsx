"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { aiHeaders } from "@/lib/api-key";
import {
  Plus, Send, Loader2, Brain, Heart, Layers, Users, Activity,
  Circle, Compass, Flame, AlertCircle, Copy, Check, Mic, MicOff,
  ChevronDown, MessageSquare, Clock, Shield, FileText, PlayCircle, StopCircle, PauseCircle, X,
} from "lucide-react";
import {
  getClients, getSupervisionsByClient, createSupervision,
  getMessages, addMessage, getEvolutionsByClient, createEvolution,
} from "@/lib/db";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { TemplateAnswersView } from "@/components/ui/TemplateFormSection";
import type { Client, Supervision, SupervisionMessage, Evolution } from "@/lib/database.types";

/* ─── Tipos ─────────────────────────────────────────── */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}


interface ClientAnamnese {
  name: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  cpf: string | null;
  emergency_contact: string | null;
  how_found: string | null;
  accepts_email: boolean;
  conditions: string[];
  latex_allergy: boolean;
  oil_allergy: string | null;
  medication: string | null;
  emotional_state: string | null;
  body_pain: string | null;
  intention: string | null;
  sexual_discomfort: string | null;
  consent_nudity: boolean;
  consent_touch: boolean;
  consent_therapeutic: boolean;
  consent_payment: boolean;
  approach: string | null;
  template_answers: Record<string, unknown> | null;
}

/* ─── Abordagens ─────────────────────────────────────── */
const APPROACHES: Record<string, { label: string; badgeCls: string; iconBg: string; Icon: React.ElementType }> = {
  PSYCHOANALYSIS:       { label: "Psicanálise",  badgeCls: "bg-purple-50 text-purple-700 border-purple-200",   iconBg: "bg-purple-100 text-purple-600",  Icon: Brain    },
  COGNITIVE_BEHAVIORAL: { label: "TCC",          badgeCls: "bg-blue-50 text-blue-700 border-blue-200",         iconBg: "bg-blue-100 text-blue-600",      Icon: Layers   },
  JUNGIAN:              { label: "Junguiana",    badgeCls: "bg-amber-50 text-amber-700 border-amber-200",      iconBg: "bg-amber-100 text-amber-600",    Icon: Compass  },
  SOMATIC:              { label: "Somática",     badgeCls: "bg-orange-50 text-orange-700 border-orange-200",   iconBg: "bg-orange-100 text-orange-600",  Icon: Activity },
  TANTRA:               { label: "Sexualidade Humana e Tantra",       badgeCls: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200", iconBg: "bg-fuchsia-100 text-fuchsia-600", Icon: Flame    },
  GESTALT:              { label: "Gestalt",      badgeCls: "bg-teal-50 text-teal-700 border-teal-200",         iconBg: "bg-teal-100 text-teal-600",      Icon: Circle   },
  PSYCHODRAMA:          { label: "Psicodrama",   badgeCls: "bg-rose-50 text-rose-700 border-rose-200",         iconBg: "bg-rose-100 text-rose-600",      Icon: Users    },
  SYSTEMIC:             { label: "Sistêmica",    badgeCls: "bg-green-50 text-green-700 border-green-200",      iconBg: "bg-green-100 text-green-600",    Icon: Heart    },
};
const APPROACH_ORDER = ["PSYCHOANALYSIS","COGNITIVE_BEHAVIORAL","JUNGIAN","SOMATIC","TANTRA","GESTALT","PSYCHODRAMA","SYSTEMIC"];

const MOOD_OPTIONS = [
  { value: 1, emoji: "😟", label: "Muito difícil", cls: "border-red-300 bg-red-50 text-red-700" },
  { value: 2, emoji: "😕", label: "Difícil",       cls: "border-orange-300 bg-orange-50 text-orange-700" },
  { value: 3, emoji: "😐", label: "Neutro",        cls: "border-yellow-300 bg-yellow-50 text-yellow-700" },
  { value: 4, emoji: "🙂", label: "Produtivo",     cls: "border-green-300 bg-green-50 text-green-700" },
  { value: 5, emoji: "😊", label: "Excelente",     cls: "border-emerald-300 bg-emerald-50 text-emerald-700" },
];

/* ─── Markdown simples ───────────────────────────────── */
function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("- ") || line.startsWith("• "))
      return <li key={i} className="ml-4 text-sm leading-relaxed">{formatInline(line.slice(2))}</li>;
    if (line.startsWith("> "))
      return <blockquote key={i} className="border-l-2 border-brand-300 pl-3 text-brand-700 italic text-xs my-1">{line.slice(2)}</blockquote>;
    if (line.trim() === "") return <div key={i} className="h-1.5" />;
    return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>;
  });
}
function formatInline(text: string) {
  return text.split(/(\*\*.*?\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="font-semibold text-gray-900">{p.slice(2,-2)}</strong>
      : p
  );
}


/* ─── Bolha de mensagem ──────────────────────────────── */
function MessageBubble({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  async function copy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className={cn("flex gap-3 group", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold",
        isUser ? "bg-brand-100 text-brand-600" : "bg-gray-100 text-gray-500")}>
        {isUser ? "Eu" : "IA"}
      </div>
      <div className={cn("max-w-[78%] space-y-1", isUser ? "items-end" : "items-start")}>
        <div className={cn("rounded-2xl px-4 py-3 shadow-sm",
          isUser ? "bg-brand-500 text-white rounded-tr-sm"
                 : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm")}>
          {isUser
            ? <p className="text-sm leading-relaxed">{message.content}</p>
            : <>{renderMarkdown(message.content)}</>}
        </div>
        {!isUser && (
          <div className="flex items-center gap-1.5 px-1">
            <AlertCircle className="w-3 h-3 text-gray-400 flex-shrink-0" strokeWidth={1.8} />
            <p className="text-[10px] text-gray-500">Apoio ao raciocínio clínico — CFP nº 21/2025</p>
          </div>
        )}
        <div className={cn("flex items-center gap-2 px-1", isUser ? "flex-row-reverse" : "flex-row")}>
          <span className="text-xs text-gray-500">
            {new Intl.DateTimeFormat("pt-BR", { hour:"2-digit", minute:"2-digit" }).format(message.timestamp)}
          </span>
          {!isUser && (
            <button onClick={copy} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-gray-500">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const APPROACH_LABELS: Record<string, string> = {
  PSYCHOANALYSIS: "Psicanálise Freudiana", COGNITIVE_BEHAVIORAL: "TCC",
  JUNGIAN: "Junguiana", SOMATIC: "Somática / Corporal", TANTRA: "Sexualidade Humana e Tantra",
  GESTALT: "Gestalt-terapia", PSYCHODRAMA: "Psicodrama", SYSTEMIC: "Constelação Familiar",
};

/* ─── Resumo completo da anamnese ─────────────────────── */
function AnamneseSummaryCard({ anamnese, templateHtml }: { anamnese: ClientAnamnese; templateHtml: string | null }) {
  const [expanded, setExpanded] = useState(false);

  const personalRows: { label: string; value: string }[] = [
    anamnese.email           ? { label: "E-mail",               value: anamnese.email }           : null,
    anamnese.phone           ? { label: "Telefone",             value: anamnese.phone }           : null,
    anamnese.birth_date      ? { label: "Nascimento",           value: new Date(anamnese.birth_date).toLocaleDateString("pt-BR") } : null,
    anamnese.cpf             ? { label: "CPF",                  value: anamnese.cpf }             : null,
    anamnese.emergency_contact ? { label: "Emergência",         value: anamnese.emergency_contact } : null,
    anamnese.how_found       ? { label: "Como chegou",          value: anamnese.how_found }       : null,
  ].filter((r): r is { label: string; value: string } => r !== null);

  const clinicalRows: { label: string; value: string }[] = [
    anamnese.medication      ? { label: "Medicamentos",          value: anamnese.medication }      : null,
    anamnese.oil_allergy     ? { label: "Alergia a óleo",        value: anamnese.oil_allergy }     : null,
    anamnese.latex_allergy   ? { label: "Alergia a látex",       value: "Sim" }                    : null,
    anamnese.emotional_state ? { label: "Estado emocional",      value: anamnese.emotional_state } : null,
    anamnese.body_pain       ? { label: "Dor no corpo",          value: anamnese.body_pain }       : null,
    anamnese.sexual_discomfort ? { label: "Vida sexual",         value: anamnese.sexual_discomfort } : null,
  ].filter((r): r is { label: string; value: string } => r !== null);

  const hasTemplateData = !!(templateHtml && anamnese.template_answers);
  const hasAnyClinical  = clinicalRows.length > 0 || anamnese.conditions.length > 0;

  return (
    <div className="mt-4 w-full max-w-2xl text-left border border-brand-100 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-brand-50 hover:bg-brand-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-brand-700 uppercase tracking-wide">Anamnese completa</span>
          {anamnese.approach && (
            <span className="text-[10px] bg-white border border-brand-200 text-brand-600 px-2 py-0.5 rounded-full font-medium">
              {APPROACH_LABELS[anamnese.approach] ?? anamnese.approach}
            </span>
          )}
        </div>
        <span className="text-[10px] text-brand-400">{expanded ? "▲ fechar" : "▼ expandir"}</span>
      </button>

      {/* Intenção — sempre visível */}
      {anamnese.intention && (
        <div className="px-5 py-3 border-b border-gray-50 bg-brand-50/40">
          <p className="text-[10px] font-semibold text-brand-500 mb-0.5">Intenção da sessão</p>
          <p className="text-sm text-brand-800 italic leading-relaxed">"{anamnese.intention}"</p>
        </div>
      )}

      {expanded && (
        <div className="divide-y divide-gray-50">
          {/* Dados pessoais */}
          {personalRows.length > 0 && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Dados pessoais</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                {personalRows.map(r => (
                  <div key={r.label}>
                    <span className="text-[10px] font-semibold text-gray-500">{r.label}</span>
                    <p className="text-xs text-gray-700">{r.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Condições de saúde e clínico */}
          {hasAnyClinical && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Saúde</p>
              {anamnese.conditions.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-semibold text-gray-500 mb-1">Condições</p>
                  <div className="flex flex-wrap gap-1.5">
                    {anamnese.conditions.map(c => (
                      <span key={c} className="text-[10px] bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-1.5">
                {clinicalRows.map(r => (
                  <div key={r.label}>
                    <span className="text-[10px] font-semibold text-gray-500">{r.label}: </span>
                    <span className="text-xs text-gray-700">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consentimentos */}
          {(anamnese.consent_nudity || anamnese.consent_touch || anamnese.consent_therapeutic || anamnese.consent_payment) && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Consentimentos</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Nudez",       ok: anamnese.consent_nudity },
                  { label: "Toque",       ok: anamnese.consent_touch },
                  { label: "Terapêutico", ok: anamnese.consent_therapeutic },
                  { label: "Pagamento",   ok: anamnese.consent_payment },
                ].map(({ label, ok }) => ok && (
                  <span key={label} className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                    ✓ {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Respostas do template específico */}
          {hasTemplateData && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-3">
                Questionário — {APPROACH_LABELS[anamnese.approach!] ?? anamnese.approach}
              </p>
              <TemplateAnswersView
                html={templateHtml!}
                answers={anamnese.template_answers as Record<string, unknown>}
              />
            </div>
          )}

          {/* Botão fechar no rodapé */}
          <button
            onClick={() => setExpanded(false)}
            className="w-full py-2.5 text-[11px] font-semibold text-brand-500 hover:bg-brand-50 transition-colors border-t border-brand-100"
          >
            ▲ Fechar anamnese
          </button>
        </div>
      )}
    </div>
  );
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/* ─── Card de evolução na thread ─────────────────────── */
function EvolutionCard({ evolution }: { evolution: Evolution }) {
  const [expanded, setExpanded] = useState(false);
  const mood = MOOD_OPTIONS.find(m => m.value === evolution.mood);
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center gap-1">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <FileText className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.8} />
        </div>
        <div className="w-px flex-1 bg-gray-100" />
      </div>
      <div className="flex-1 pb-4">
        <div
          className="bg-emerald-50 border border-emerald-100 rounded-2xl overflow-hidden cursor-pointer"
          onClick={() => setExpanded(v => !v)}
        >
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-emerald-700">Evolução registrada</span>
                <span className="text-[10px] text-emerald-500">
                  Data da sessão: {new Date(evolution.session_date + "T12:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" })}
                  {evolution.session_time && ` às ${evolution.session_time.slice(0, 5)} h`}
                  {evolution.duration_seconds != null &&
                    `; Supervisionado em ${new Date(evolution.created_at).toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" })} por ${formatDuration(evolution.duration_seconds)} horas`}
                </span>
                {mood && <span className="text-sm">{mood.emoji}</span>}
              </div>
              <p className="text-xs text-gray-600 truncate">{evolution.content}</p>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-emerald-400 transition-transform flex-shrink-0", expanded && "rotate-180")} />
          </div>
          {expanded && (
            <div className="border-t border-emerald-100 px-4 py-3 space-y-2 bg-white">
              {evolution.approach && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Abordagem teórica utilizada</p>
                  <p className="text-sm text-gray-700">{APPROACH_LABELS[evolution.approach] ?? evolution.approach}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">O que aconteceu</p>
                <p className="text-sm text-gray-700 leading-relaxed">{evolution.content}</p>
              </div>
              {evolution.hypothesis && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Hipótese clínica</p>
                  <p className="text-sm text-gray-700">{evolution.hypothesis}</p>
                </div>
              )}
              {evolution.next_session_plan && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Plano para próxima sessão</p>
                  <p className="text-sm text-gray-700">{evolution.next_session_plan}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Card de supervisão anterior na thread ──────────── */
function PastSupervisionCard({ supervision, onLoad }: { supervision: Supervision; onLoad: (s: Supervision) => void }) {
  const approachInfo = APPROACHES[supervision.approach] ?? APPROACHES.PSYCHOANALYSIS;
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center gap-1">
        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
          <Brain className="w-3.5 h-3.5 text-brand-600" strokeWidth={1.8} />
        </div>
        <div className="w-px flex-1 bg-gray-100" />
      </div>
      <div className="flex-1 pb-4">
        <button
          onClick={() => onLoad(supervision)}
          className="w-full text-left bg-brand-50 border border-brand-100 rounded-2xl px-4 py-3 hover:bg-brand-100 transition-colors"
        >
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-brand-700 truncate flex-1">{supervision.title}</span>
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0", approachInfo.badgeCls)}>
              {approachInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-brand-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{supervision.messages_count} msgs</span>
            <span>{new Date(supervision.updated_at).toLocaleDateString("pt-BR", { day:"2-digit", month:"short" })}</span>
            <span className="ml-auto text-brand-400">Clique para retomar →</span>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ─── Modal: iniciar supervisão ───────────────────────── */
function StartSupervisionModal({
  clientName, onConfirm, onCancel,
}: {
  clientName: string;
  onConfirm: (date: string, time: string, impressions: string) => void;
  onCancel: () => void;
}) {
  const now = new Date();
  const [date, setDate] = useState(now.toISOString().split("T")[0]);
  const [time, setTime] = useState(now.toTimeString().slice(0, 5));
  const [impressions, setImpressions] = useState("");

  const canConfirm = impressions.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-start justify-between px-5 pt-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
              <PlayCircle className="w-5 h-5 text-brand-500" strokeWidth={1.8} />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Iniciar supervisão</h2>
          </div>
          <button onClick={onCancel} className="text-gray-300 hover:text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-3 pb-1">
          <p className="text-sm text-gray-600 leading-relaxed">
            Vamos evoluir <strong>{clientName}</strong> hoje? Me informe a data da sessão, o horário e quais as suas impressões para, juntos, fazer o estudo do caso.
          </p>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-gray-500 mb-1">Data da sessão</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 text-gray-800" />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-gray-500 mb-1">Horário</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 text-gray-800" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Suas impressões</label>
            <textarea
              value={impressions} onChange={e => setImpressions(e.target.value)}
              placeholder="O que trouxe da sessão, primeiras impressões, pontos de atenção..."
              rows={4} autoFocus
              className="w-full text-sm bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 pb-5">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 border border-gray-200 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => canConfirm && onConfirm(date, time, impressions.trim())}
            disabled={!canConfirm}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors",
              canConfirm ? "bg-brand-500 hover:bg-brand-600 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}>
            <PlayCircle className="w-4 h-4" strokeWidth={1.8} />
            Iniciar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal: confirmar finalização ───────────────────── */
function ConfirmEndSupervisionModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <StopCircle className="w-5 h-5 text-amber-500" strokeWidth={1.8} />
          </div>
          <h2 className="text-sm font-bold text-gray-900">Deseja finalizar a supervisão?</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">A supervisão em andamento será encerrada.</p>
        <div className="flex items-center gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 border border-gray-200 transition-colors">
            Continuar supervisão
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors">
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal: encerrar supervisão (hipótese + plano) ──── */
function FinishSupervisionModal({
  onConfirm, onCancel,
}: {
  onConfirm: (hypothesis: string, nextSessionPlan: string) => void;
  onCancel: () => void;
}) {
  const [hypothesis, setHypothesis] = useState("");
  const [nextSessionPlan, setNextSessionPlan] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-start justify-between px-5 pt-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-emerald-600" strokeWidth={1.8} />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Encerrar supervisão</h2>
          </div>
          <button onClick={onCancel} className="text-gray-300 hover:text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-3 pb-1">
          <p className="text-sm text-gray-600 leading-relaxed">
            Antes de finalizar, registre sua hipótese clínica e o plano para a próxima sessão.
          </p>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Hipótese clínica</label>
            <input value={hypothesis} onChange={e => setHypothesis(e.target.value)} autoFocus
              placeholder="Sua interpretação clínica desta sessão..."
              className="w-full text-sm bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Plano para próxima sessão</label>
            <textarea value={nextSessionPlan} onChange={e => setNextSessionPlan(e.target.value)}
              placeholder="Pontos a retomar, temas a explorar..."
              rows={3}
              className="w-full text-sm bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 pb-5">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 border border-gray-200 transition-colors">
            Cancelar
          </button>
          <button onClick={() => onConfirm(hypothesis, nextSessionPlan)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
            <StopCircle className="w-4 h-4" strokeWidth={1.8} />
            Finalizar e salvar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Página principal ───────────────────────────────── */
export default function WorkspacePage() {
  const { user }       = useAuthStore();
  const searchParams   = useSearchParams();

  const [clients,      setClients]      = useState<Client[]>([]);
  const [supervisions, setSupervisions] = useState<Supervision[]>([]);
  const [evolutions,   setEvolutions]   = useState<Evolution[]>([]);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(searchParams.get("client"));
  const [activeSessionId,  setActiveSessionId]  = useState<string | null>(null);

  const [acquiredApproaches, setAcquiredApproaches] = useState<string[]>(APPROACH_ORDER);
  const [approachKey,  setApproachKey]  = useState("PSYCHOANALYSIS");
  const [lensMenuOpen, setLensMenuOpen] = useState(false);
  const lensRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  useEffect(() => {
    if (loading) {
      setLiveAnnouncement("Gerando resposta...");
      return;
    }
    const last = messages[messages.length - 1];
    if (last?.role === "assistant") {
      setLiveAnnouncement(`Resposta da IA: ${last.content}`);
    }
  }, [messages, loading]);

  const [clientIntention, setClientIntention] = useState<string | null>(null);
  const [clientAnamnese,  setClientAnamnese]  = useState<ClientAnamnese | null>(null);
  const [templateHtml,    setTemplateHtml]    = useState<string | null>(null);

  const [supervisionActive, setSupervisionActive] = useState(false);
  const [supervisionPaused, setSupervisionPaused] = useState(false);
  const [showStartModal,    setShowStartModal]    = useState(false);
  const [showFinishModal,   setShowFinishModal]   = useState(false);
  const [pendingLeaveAction, setPendingLeaveAction] = useState<(() => void) | null>(null);
  const [afterFinishAction,  setAfterFinishAction]  = useState<(() => void) | null>(null);
  const [sessionMeta, setSessionMeta] = useState<{ date: string; time: string; impressions: string } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  /* Texto só pode ser escrito com a supervisão ativa e não pausada */
  const canWrite = supervisionActive && !supervisionPaused;

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { state: voiceState, interimText, toggle: toggleVoice } = useVoiceInput({
    onFinal: (text) => setInput(prev => prev ? `${prev.trimEnd()} ${text}` : text),
  });
  const isRecording = voiceState === "recording";

  const selectedClient = clients.find(c => c.id === selectedClientId) ?? null;
  const approachInfo   = APPROACHES[approachKey] ?? APPROACHES.PSYCHOANALYSIS;
  const ApproachIcon   = approachInfo.Icon;

  /* ── Sorted thread items ── */
  type ThreadItem =
    | { kind: "supervision"; data: Supervision }
    | { kind: "evolution";   data: Evolution   };

  const threadItems: ThreadItem[] = [
    ...supervisions
      .filter(s => s.id !== activeSessionId)
      .map(s => ({ kind: "supervision" as const, data: s, date: s.updated_at })),
    ...evolutions.map(e => ({ kind: "evolution" as const, data: e, date: e.session_date })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  /* ── Load acquired approaches ── */
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/therapist-approaches?therapistId=${user.id}`)
      .then(r => r.json())
      .then(d => {
        const list: string[] = d.approaches ?? [];
        if (list.length > 0) {
          setAcquiredApproaches(list);
          if (!list.includes(approachKey)) setApproachKey(list[0]);
        }
      })
      .catch(() => {});
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Load clients ── */
  useEffect(() => {
    if (!user) return;
    getClients(user.id).then(setClients).catch(() => {});
  }, [user]);

  /* ── Load data when client selected ── */
  useEffect(() => {
    if (!selectedClientId) { setSupervisions([]); setEvolutions([]); return; }
    Promise.all([
      getSupervisionsByClient(selectedClientId),
      getEvolutionsByClient(selectedClientId),
    ]).then(([svs, evs]) => {
      setSupervisions(svs);
      setEvolutions(evs);
    }).catch(() => {});
  }, [selectedClientId]);

  /* ── Fetch anamnese completa do cliente ── */
  useEffect(() => {
    if (!selectedClientId) {
      setClientIntention(null); setClientAnamnese(null); setTemplateHtml(null); return;
    }
    const client = clients.find(c => c.id === selectedClientId);
    if (!client?.anamnese_id) {
      setClientIntention(null); setClientAnamnese(null); setTemplateHtml(null); return;
    }
    fetch(`/api/anamnese/${client.anamnese_id}`)
      .then(r => r.json())
      .then(d => {
        if (d.anamnese) {
          setClientIntention(d.anamnese.intention ?? null);
          setClientAnamnese(d.anamnese);
          if (d.anamnese.approach && d.anamnese.template_answers) {
            fetch(`/api/anamnese-templates/${d.anamnese.approach}`, { cache: "no-store" })
              .then(r => r.json())
              .then(t => setTemplateHtml(t.content ?? null))
              .catch(() => setTemplateHtml(null));
          } else {
            setTemplateHtml(null);
          }
        } else {
          setClientIntention(null); setClientAnamnese(null); setTemplateHtml(null);
        }
      })
      .catch(() => {});
  }, [selectedClientId, clients]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    const ta = textareaRef.current; if (!ta) return;
    ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (lensRef.current && !lensRef.current.contains(e.target as Node)) setLensMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  /* Se houver supervisão ativa, pede confirmação antes de executar a ação que sairia dela. */
  function guardLeave(action: () => void) {
    if (supervisionActive) { setPendingLeaveAction(() => action); return; }
    action();
  }

  function selectClientImpl(clientId: string) {
    const client = clients.find(c => c.id === clientId);
    if (client && !client.anamnese_id) {
      alert("Para fazer a primeira supervisão é OBRIGATÓRIO o preenchimento da anamnese");
      return;
    }
    setSelectedClientId(clientId);
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    setSupervisionActive(false);
    setSupervisionPaused(false);
  }
  function selectClient(clientId: string) {
    if (clientId === selectedClientId) return;
    guardLeave(() => selectClientImpl(clientId));
  }

  async function loadSessionImpl(session: Supervision) {
    setActiveSessionId(session.id);
    setApproachKey(session.approach ?? "PSYCHOANALYSIS");
    setError(null);
    setSupervisionActive(false);
    setSupervisionPaused(false);
    try {
      const msgs = await getMessages(session.id);
      setMessages(msgs.map((m: SupervisionMessage) => ({
        id: m.id, role: m.role as "user" | "assistant",
        content: m.content, timestamp: new Date(m.created_at),
      })));
      // Remove from thread (it becomes active)
      setSupervisions(prev => prev); // keep list, filter in threadItems
    } catch { setMessages([]); }
    // Scroll to bottom
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }
  function loadSession(session: Supervision) {
    guardLeave(() => loadSessionImpl(session));
  }

  function newSessionImpl() {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    setSupervisionActive(false);
    setSupervisionPaused(false);
  }
  function newSession() {
    guardLeave(newSessionImpl);
  }

  function handleStartSupervision() {
    if (!selectedClient) return;
    setShowStartModal(true);
  }

  function handleConfirmStartSupervision(date: string, time: string, impressions: string) {
    setShowStartModal(false);
    setSupervisionActive(true);
    setSupervisionPaused(false);
    setSessionMeta({ date, time, impressions });
    setElapsedSeconds(0);
    const text = `Sessão em ${new Date(date + "T12:00:00").toLocaleDateString("pt-BR")} às ${time}. Minhas impressões: ${impressions}`;
    sendMessageText(text);
  }

  /* Clique direto no botão "Finalizar supervisão" — sem ação pendente após salvar */
  function handleFinishSupervision() {
    setAfterFinishAction(null);
    setShowFinishModal(true);
  }

  /* Pausa: timer para, nenhuma pergunta de encerramento, nenhuma interação com a IA */
  function handlePauseSupervision() {
    setSupervisionPaused(true);
  }
  function handleResumeSupervision() {
    setSupervisionPaused(false);
  }

  /* Confirmação de "Deseja finalizar a supervisão?" ao tentar sair da tela —
     abre o mesmo popup de encerramento, e roda a ação pendente depois de salvar. */
  function handleConfirmLeave() {
    const action = pendingLeaveAction;
    setPendingLeaveAction(null);
    setAfterFinishAction(() => action ?? undefined);
    setShowFinishModal(true);
  }

  async function handleConfirmFinishSupervision(hypothesis: string, nextSessionPlan: string) {
    setShowFinishModal(false);
    setSupervisionActive(false);
    setSupervisionPaused(false);

    const durationSeconds = elapsedSeconds;
    setElapsedSeconds(0);

    if (selectedClient && user) {
      const transcript = messages
        .map(m => `${m.role === "user" ? "Terapeuta" : "IA"}: ${m.content}`)
        .join("\n\n");
      const impressionsHeader = sessionMeta?.impressions
        ? `Impressões iniciais: ${sessionMeta.impressions}`
        : "";
      const content = [impressionsHeader, transcript].filter(Boolean).join("\n\n");

      try {
        const ev = await createEvolution({
          therapist_id:      user.id,
          client_id:         selectedClient.id,
          session_date:      sessionMeta?.date ?? new Date().toISOString().split("T")[0],
          session_time:      sessionMeta?.time ?? null,
          content:           content || "Supervisão realizada.",
          hypothesis:        hypothesis.trim() || null,
          next_session_plan: nextSessionPlan.trim() || null,
          mood:              null,
          approach:          approachKey,
          duration_seconds:  durationSeconds,
        });
        setEvolutions(prev => [ev, ...prev]);
      } catch {
        setError("Não foi possível salvar a evolução desta supervisão.");
      }
    }

    setSessionMeta(null);
    const action = afterFinishAction;
    setAfterFinishAction(null);
    action?.();
  }

  /* Avisa antes de fechar/recarregar a aba com supervisão em andamento */
  useEffect(() => {
    if (!supervisionActive) return;
    function handler(e: BeforeUnloadEvent) { e.preventDefault(); e.returnValue = ""; }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [supervisionActive]);

  /* Temporizador da supervisão em andamento — pausa sem avançar o tempo */
  useEffect(() => {
    if (!supervisionActive || supervisionPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [supervisionActive, supervisionPaused]);

  /* ── Last evolution for AI context ── */
  const lastEvolution = evolutions[0] ?? null;

  const sendMessageText = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text || loading || !selectedClientId || !user) return;

    if (!selectedClient?.anamnese_id) {
      setError("Para supervisionar é OBRIGATÓRIO o preenchimento da anamnese");
      return;
    }

    const isFirstSupervision = !activeSessionId && supervisions.length === 0;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput(""); setLoading(true); setError(null);

    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        const title = text.slice(0, 60) + (text.length > 60 ? "…" : "");
        const session = await createSupervision({
          therapist_id: user.id, client_id: selectedClientId, title, approach: approachKey,
        });
        sessionId = session.id;
        setActiveSessionId(session.id);
        setSupervisions(prev => [session, ...prev]);
      }

      await addMessage({ supervision_id: sessionId, role: "user", content: text });

      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/supervision/chat", {
        method: "POST",
        headers: await aiHeaders(),
        body: JSON.stringify({
          messages: history,
          approach: approachKey,           // sempre enviado com a seleção atual
          clientName: selectedClient?.name ?? "cliente",
          therapistId: user.id,
          clientIntention,
          clientAnamnese: isFirstSupervision ? clientAnamnese : null,
          lastEvolution: lastEvolution ? {
            sessionDate:     lastEvolution.session_date,
            content:         lastEvolution.content,
            hypothesis:      lastEvolution.hypothesis,
            nextSessionPlan: lastEvolution.next_session_plan,
          } : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao consultar o supervisor");

      await addMessage({ supervision_id: sessionId, role: "assistant", content: data.content });
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: data.content, timestamp: new Date() }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [loading, messages, approachKey, selectedClient, selectedClientId, activeSessionId, user, clientIntention, clientAnamnese, lastEvolution]);

  const sendMessage = useCallback(() => sendMessageText(input), [sendMessageText, input]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }


  return (
    <div className="flex h-full -m-6 overflow-hidden">
      <h1 className="sr-only">Supervisão e Evolução</h1>

      {/* ══ SIDEBAR ══ */}
      <aside aria-label="Lista de clientes" className="w-[248px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-100">
          <button onClick={newSession} disabled={!selectedClientId}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors",
              selectedClientId ? "bg-brand-500 hover:bg-brand-600 text-white" : "bg-gray-100 text-gray-500 cursor-not-allowed"
            )}>
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nova supervisão
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pb-3">
          <p className="text-[10.5px] font-bold tracking-widest uppercase text-gray-500 px-4 pt-4 pb-2">Clientes</p>
          {clients.filter(c => c.status !== "WAITLIST").map(client => {
            const isSelected = selectedClientId === client.id;
            const evCount    = isSelected ? evolutions.length : 0;
            const svCount    = isSelected ? supervisions.length : 0;
            return (
              <button key={client.id} onClick={() => selectClient(client.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 mx-1 rounded-xl transition-colors text-left border",
                  isSelected ? "bg-brand-50 border-brand-100" : "hover:bg-gray-50 border-transparent"
                )}
                style={{ width: "calc(100% - 8px)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: client.color ?? "#C2542F" }}>
                  {client.initials ?? client.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[13px] font-semibold truncate", isSelected ? "text-brand-700" : "text-gray-800")}>
                    {client.name}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">{client.approach_label}</p>
                </div>
                {isSelected && (evCount > 0 || svCount > 0) && (
                  <div className="flex gap-1 flex-shrink-0">
                    {svCount > 0 && <span className="text-[10px] font-semibold text-brand-500 bg-brand-50 border border-brand-100 rounded-full px-1.5 py-0.5">{svCount}s</span>}
                    {evCount > 0 && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-1.5 py-0.5">{evCount}e</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-2">
          <Shield className="w-3 h-3 text-gray-500 flex-shrink-0" strokeWidth={1.8} />
          <p className="text-[10px] text-gray-500 leading-tight">Casos pseudonimizados · LGPD</p>
        </div>
      </aside>

      {/* ══ WORKSPACE ══ */}
      <section className="flex-1 flex flex-col min-w-0 bg-gray-50">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-white border-b border-gray-100 flex-shrink-0">
          {selectedClient ? (
            <>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: selectedClient.color ?? "#C2542F" }}>
                {selectedClient.initials ?? selectedClient.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{selectedClient.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">{selectedClient.approach_label}</span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-500">
                    {evolutions.length} {evolutions.length === 1 ? "evolução" : "evoluções"} · {supervisions.length} supervisões
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <MessageSquare className="w-5 h-5" strokeWidth={1.5} />
              <p className="text-sm">Selecione um cliente para iniciar</p>
            </div>
          )}
        </div>


        {/* Anúncio para leitores de tela */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">{liveAnnouncement}</div>

        {/* Thread */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2" tabIndex={0} aria-label="Histórico da conversa">

          {!selectedClient && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-brand-400" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-700">Supervisão & Evolução</h2>
                <p className="text-sm text-gray-500 mt-1 max-w-xs leading-relaxed">
                  Selecione um cliente para acessar o workspace clínico integrado.
                </p>
              </div>
            </div>
          )}

          {/* Thread histórica */}
          {selectedClient && threadItems.length > 0 && (
            <div className="space-y-0 mb-4">
              {threadItems.map(item =>
                item.kind === "evolution"
                  ? <EvolutionCard key={`ev-${item.data.id}`} evolution={item.data} />
                  : <PastSupervisionCard key={`sv-${item.data.id}`} supervision={item.data} onLoad={loadSession} />
              )}
              {(messages.length > 0 || activeSessionId) && (
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-brand-100" />
                  <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-wide">Supervisão atual</span>
                  <div className="flex-1 h-px bg-brand-100" />
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {selectedClient && threadItems.length === 0 && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", approachInfo.iconBg)}>
                <ApproachIcon className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">Início do acompanhamento</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-sm leading-relaxed">
                  Traga um recorte da sessão ou da anamnese de <strong>{selectedClient.name}</strong> para iniciar a supervisão.
                </p>
                {clientAnamnese && <AnamneseSummaryCard anamnese={clientAnamnese} templateHtml={templateHtml} />}
              </div>
            </div>
          )}

          {/* Mensagens da supervisão ativa */}
          {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-gray-500">IA</div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Elaborando resposta clínica...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Erro ao enviar</p>
                <p className="text-xs mt-0.5 text-red-500">{error}</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Barra inferior ── */}
        {selectedClient && (
          <div className="border-t border-gray-100 bg-white flex-shrink-0">

            <div className="px-5 py-4">
                {/* Controle da supervisão — bem visível, acima da caixa de diálogo */}
                <div className="flex items-center justify-center mb-3">
                  {supervisionActive && supervisionPaused ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1.5 rounded-lg tabular-nums">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        {formatDuration(elapsedSeconds)}
                      </span>
                      <button onClick={handleResumeSupervision}
                        className="flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-5 py-2.5 rounded-xl transition-colors shadow-sm">
                        <PlayCircle className="w-4 h-4" strokeWidth={1.8} />
                        Retomar supervisão
                      </button>
                    </div>
                  ) : supervisionActive ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1.5 rounded-lg tabular-nums">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        {formatDuration(elapsedSeconds)}
                      </span>
                      <button onClick={handlePauseSupervision}
                        className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-white border border-amber-200 hover:bg-amber-50 px-3.5 py-2 rounded-xl transition-colors">
                        <PauseCircle className="w-4 h-4" strokeWidth={1.8} />
                        Pausar
                      </button>
                      <button onClick={handleFinishSupervision}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl transition-colors shadow-sm">
                        <StopCircle className="w-4 h-4" strokeWidth={1.8} />
                        Finalizar supervisão
                      </button>
                    </div>
                  ) : (
                    <button onClick={handleStartSupervision}
                      className="flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-5 py-2.5 rounded-xl transition-colors shadow-sm">
                      <PlayCircle className="w-4 h-4" strokeWidth={1.8} />
                      Iniciar supervisão
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-gray-500 text-center mb-3">
                  {supervisionActive && supervisionPaused
                    ? "Supervisão pausada. Retome para continuar escrevendo."
                    : supervisionActive
                    ? "Apoio ao raciocínio clínico — sem diagnósticos. O julgamento clínico é sempre do terapeuta."
                    : "Inicie a supervisão para liberar o campo de escrita."}
                </p>
                <div className={cn(
                  "border rounded-2xl transition-all overflow-visible",
                  !canWrite
                    ? "bg-gray-100 border-gray-200 opacity-60"
                    : isRecording
                    ? "bg-red-50/40 border-red-300 ring-2 ring-red-100"
                    : "bg-gray-50 border-gray-200 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100"
                )}>
                  <textarea
                    ref={textareaRef}
                    value={isRecording && interimText ? `${input} ${interimText}` : input}
                    onChange={e => !isRecording && setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    readOnly={isRecording}
                    disabled={!canWrite}
                    placeholder={!canWrite ? (supervisionPaused ? "Supervisão pausada…" : "Inicie a supervisão para escrever…") : isRecording ? "Ouvindo…" : "Traga o recorte do caso — o que apareceu na sessão…"}
                    rows={1}
                    className={cn(
                      "w-full bg-transparent px-4 pt-3 pb-2 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none disabled:cursor-not-allowed",
                      isRecording && "italic text-gray-600"
                    )}
                    style={{ maxHeight: 120 }}
                  />

                  {isRecording && interimText && (
                    <div className="px-4 pb-2">
                      <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                        <p className="text-xs text-red-600 italic">{interimText}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between px-3 pb-2.5 pt-1 gap-2">
                    <div className="relative" ref={lensRef}>
                      <button
                        onClick={() => setLensMenuOpen(v => !v)}
                        disabled={!canWrite}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        <ApproachIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
                        {approachInfo.label}
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>
                      {lensMenuOpen && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 min-w-[200px] z-30">
                          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 px-3 py-1.5">Referencial teórico</p>
                          {APPROACH_ORDER.filter(key => acquiredApproaches.includes(key)).map(key => {
                            const ap = APPROACHES[key]; const Icon = ap.Icon;
                            return (
                              <button key={key} onClick={() => { setApproachKey(key); setLensMenuOpen(false); }}
                                className={cn(
                                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left",
                                  approachKey === key ? "bg-brand-50 text-brand-700 font-semibold" : "text-gray-700 hover:bg-gray-50"
                                )}>
                                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
                                {ap.label}
                                {approachKey === key && <Check className="w-3.5 h-3.5 ml-auto text-brand-500" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {voiceState !== "unsupported" && (
                        <button type="button" onClick={toggleVoice} disabled={!canWrite}
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all border disabled:opacity-40 disabled:cursor-not-allowed",
                            isRecording
                              ? "bg-red-500 border-red-500 text-white animate-pulse"
                              : "bg-white border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-500"
                          )}>
                          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                      )}
                      <button onClick={sendMessage} disabled={!canWrite || !input.trim() || loading}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                          canWrite && input.trim() && !loading
                            ? "bg-brand-500 hover:bg-brand-600 text-white"
                            : "bg-gray-100 text-gray-300 cursor-not-allowed"
                        )}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={2} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        )}
      </section>

      {showStartModal && selectedClient && (
        <StartSupervisionModal
          clientName={selectedClient.name}
          onConfirm={handleConfirmStartSupervision}
          onCancel={() => setShowStartModal(false)}
        />
      )}

      {pendingLeaveAction && (
        <ConfirmEndSupervisionModal
          onConfirm={handleConfirmLeave}
          onCancel={() => setPendingLeaveAction(null)}
        />
      )}

      {showFinishModal && (
        <FinishSupervisionModal
          onConfirm={handleConfirmFinishSupervision}
          onCancel={() => { setShowFinishModal(false); setAfterFinishAction(null); }}
        />
      )}
    </div>
  );
}
