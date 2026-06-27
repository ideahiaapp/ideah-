"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { aiHeaders } from "@/lib/api-key";
import {
  Plus, Send, Loader2, Brain, Heart, Layers, Users, Activity,
  Circle, Compass, AlertCircle, Copy, Check, Mic, MicOff,
  ChevronDown, MessageSquare, Clock, Shield, FileText,
} from "lucide-react";
import {
  getClients, getSupervisionsByClient, createSupervision,
  getMessages, addMessage, getEvolutionsByClient, createEvolution,
} from "@/lib/db";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import type { Client, Supervision, SupervisionMessage, Evolution } from "@/lib/database.types";

/* ─── Tipos ─────────────────────────────────────────── */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type Mode = "supervision" | "evolution";

/* ─── Abordagens ─────────────────────────────────────── */
const APPROACHES: Record<string, { label: string; badgeCls: string; iconBg: string; Icon: React.ElementType }> = {
  PSYCHOANALYSIS:       { label: "Psicanálise",  badgeCls: "bg-purple-50 text-purple-700 border-purple-200",   iconBg: "bg-purple-100 text-purple-600",  Icon: Brain    },
  COGNITIVE_BEHAVIORAL: { label: "TCC",          badgeCls: "bg-blue-50 text-blue-700 border-blue-200",         iconBg: "bg-blue-100 text-blue-600",      Icon: Layers   },
  JUNGIAN:              { label: "Junguiana",    badgeCls: "bg-amber-50 text-amber-700 border-amber-200",      iconBg: "bg-amber-100 text-amber-600",    Icon: Compass  },
  SOMATIC:              { label: "Somática",     badgeCls: "bg-orange-50 text-orange-700 border-orange-200",   iconBg: "bg-orange-100 text-orange-600",  Icon: Activity },
  GESTALT:              { label: "Gestalt",      badgeCls: "bg-teal-50 text-teal-700 border-teal-200",         iconBg: "bg-teal-100 text-teal-600",      Icon: Circle   },
  PSYCHODRAMA:          { label: "Psicodrama",   badgeCls: "bg-rose-50 text-rose-700 border-rose-200",         iconBg: "bg-rose-100 text-rose-600",      Icon: Users    },
  SYSTEMIC:             { label: "Sistêmica",    badgeCls: "bg-green-50 text-green-700 border-green-200",      iconBg: "bg-green-100 text-green-600",    Icon: Heart    },
};
const APPROACH_ORDER = ["PSYCHOANALYSIS","COGNITIVE_BEHAVIORAL","JUNGIAN","SOMATIC","GESTALT","PSYCHODRAMA","SYSTEMIC"];

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

/* ─── Banner ético ───────────────────────────────────── */
function EthicsBanner() {
  const [open, setOpen] = useState(true);
  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-amber-50 border-b border-amber-100 text-[11px] text-amber-600 hover:bg-amber-100 transition-colors flex-shrink-0">
      <AlertCircle className="w-3 h-3" strokeWidth={1.8} />
      Aviso ético CFP nº 21/2025 — clique para expandir
    </button>
  );
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-start gap-3 flex-shrink-0">
      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-amber-800 mb-0.5">Recurso de apoio clínico — Res. CFP nº 21/2025</p>
        <p className="text-[11px] text-amber-700 leading-relaxed">
          As respostas geradas pela IA são suporte ao raciocínio clínico e <strong>não substituem o juízo profissional do(a) psicólogo(a)</strong>.
          A decisão clínica é sempre sua.
        </p>
      </div>
      <button onClick={() => setOpen(false)} className="text-amber-400 hover:text-amber-600 text-lg leading-none flex-shrink-0">×</button>
    </div>
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
            <AlertCircle className="w-3 h-3 text-gray-300 flex-shrink-0" strokeWidth={1.8} />
            <p className="text-[10px] text-gray-300">Apoio ao raciocínio clínico — CFP nº 21/2025</p>
          </div>
        )}
        <div className={cn("flex items-center gap-2 px-1", isUser ? "flex-row-reverse" : "flex-row")}>
          <span className="text-xs text-gray-300">
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
                  {new Date(evolution.session_date + "T12:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"short", year:"numeric" })}
                </span>
                {mood && <span className="text-sm">{mood.emoji}</span>}
              </div>
              <p className="text-xs text-gray-600 truncate">{evolution.content}</p>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-emerald-400 transition-transform flex-shrink-0", expanded && "rotate-180")} />
          </div>
          {expanded && (
            <div className="border-t border-emerald-100 px-4 py-3 space-y-2 bg-white">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">O que aconteceu</p>
                <p className="text-sm text-gray-700 leading-relaxed">{evolution.content}</p>
              </div>
              {evolution.hypothesis && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Hipótese clínica</p>
                  <p className="text-sm text-gray-700">{evolution.hypothesis}</p>
                </div>
              )}
              {evolution.next_session_plan && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Plano para próxima sessão</p>
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

/* ─── Formulário de evolução inline ──────────────────── */
function EvolutionForm({
  client, user,
  onSaved,
}: {
  client: Client;
  user: { id: string };
  onSaved: (ev: Evolution) => void;
}) {
  const [form, setForm] = useState({
    sessionDate: new Date().toISOString().split("T")[0],
    mood: 0,
    content: "",
    hypothesis: "",
    nextSessionPlan: "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const canSave = form.content.trim().length >= 20 && form.mood > 0;

  function set(field: string, value: string | number) {
    setForm(p => ({ ...p, [field]: value }));
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true); setError(null);
    try {
      const ev = await createEvolution({
        therapist_id:      user.id,
        client_id:         client.id,
        session_date:      form.sessionDate,
        content:           form.content.trim(),
        hypothesis:        form.hypothesis.trim() || null,
        next_session_plan: form.nextSessionPlan.trim() || null,
        mood:              form.mood || null,
      });
      setForm({ sessionDate: new Date().toISOString().split("T")[0], mood: 0, content: "", hypothesis: "", nextSessionPlan: "" });
      onSaved(ev);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 px-5 py-4 overflow-y-auto max-h-[calc(100vh-280px)]">
      {/* Data + Mood */}
      <div className="flex gap-3 items-start">
        <div className="flex-shrink-0">
          <label className="block text-[10px] font-semibold text-gray-500 mb-1">Data</label>
          <input type="date" value={form.sessionDate} onChange={e => set("sessionDate", e.target.value)}
            className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 text-gray-800" />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-semibold text-gray-500 mb-1">Tom da sessão *</label>
          <div className="flex gap-1.5 flex-wrap">
            {MOOD_OPTIONS.map(m => (
              <button key={m.value} type="button" onClick={() => set("mood", m.value)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border-2 transition-all",
                  form.mood === m.value ? m.cls + " shadow-sm" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                )}>
                {m.emoji} <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div>
        <label className="block text-[10px] font-semibold text-gray-500 mb-1">
          O que aconteceu na sessão * <span className="font-normal text-gray-400">({form.content.length}/20 mín.)</span>
        </label>
        <textarea
          value={form.content} onChange={e => set("content", e.target.value)}
          placeholder="Temas trazidos, dinâmicas observadas, momentos significativos..."
          rows={4}
          className="w-full text-sm bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none placeholder-gray-400"
        />
      </div>

      {/* Hipótese */}
      <div>
        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Hipótese clínica</label>
        <input value={form.hypothesis} onChange={e => set("hypothesis", e.target.value)}
          placeholder="Sua interpretação clínica desta sessão..."
          className="w-full text-sm bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 placeholder-gray-400"
        />
      </div>

      {/* Próxima sessão */}
      <div>
        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Plano para próxima sessão</label>
        <textarea value={form.nextSessionPlan} onChange={e => set("nextSessionPlan", e.target.value)}
          placeholder="Pontos a retomar, temas a explorar..."
          rows={2}
          className="w-full text-sm bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none placeholder-gray-400"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button onClick={handleSave} disabled={!canSave || saving}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
          canSave && !saving
            ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        )}>
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                : <><FileText className="w-4 h-4" /> Salvar evolução</>}
      </button>
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

  const [mode, setMode] = useState<Mode>("supervision");
  const [clientIntention, setClientIntention] = useState<string | null>(null);

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

  /* ── Load acquired approaches by email ── */
  useEffect(() => {
    if (!user?.email) return;
    fetch(`/api/therapist-approaches?email=${encodeURIComponent(user.email)}`)
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

  /* ── Fetch anamnese intention ── */
  useEffect(() => {
    if (!selectedClientId || !user) { setClientIntention(null); return; }
    const client = clients.find(c => c.id === selectedClientId);
    if (!client?.email) return;
    fetch(`/api/anamnese/list?therapistId=${user.id}&email=${encodeURIComponent(client.email)}&status=ACCEPTED`)
      .then(r => r.json())
      .then(d => setClientIntention(d.anamneses?.[0]?.intention ?? null))
      .catch(() => {});
  }, [selectedClientId, user, clients]);

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

  function selectClient(clientId: string) {
    setSelectedClientId(clientId);
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    setMode("supervision");
  }

  async function loadSession(session: Supervision) {
    setActiveSessionId(session.id);
    setApproachKey(session.approach ?? "PSYCHOANALYSIS");
    setMode("supervision");
    setError(null);
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

  function newSession() {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    setMode("supervision");
  }

  /* ── Last evolution for AI context ── */
  const lastEvolution = evolutions[0] ?? null;

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || !selectedClientId || !user) return;

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
          approach: approachKey,
          clientName: selectedClient?.name ?? "paciente",
          therapistId: user.id,
          clientIntention,
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
  }, [input, loading, messages, approachKey, selectedClient, selectedClientId, activeSessionId, user, clientIntention, lastEvolution]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function handleEvolutionSaved(ev: Evolution) {
    setEvolutions(prev => [ev, ...prev]);
    setMode("supervision");
    setActiveSessionId(null);
    setMessages([]);
  }

  return (
    <div className="flex h-full -m-6 overflow-hidden">

      {/* ══ SIDEBAR ══ */}
      <aside className="w-[248px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-100">
          <button onClick={newSession} disabled={!selectedClientId}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors",
              selectedClientId ? "bg-brand-500 hover:bg-brand-600 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}>
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nova supervisão
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pb-3">
          <p className="text-[10.5px] font-bold tracking-widest uppercase text-gray-400 px-4 pt-4 pb-2">Pacientes</p>
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
                  style={{ backgroundColor: client.color ?? "#924B92" }}>
                  {client.initials ?? client.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[13px] font-semibold truncate", isSelected ? "text-brand-700" : "text-gray-800")}>
                    {client.name}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">{client.approach_label}</p>
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
          <Shield className="w-3 h-3 text-gray-400 flex-shrink-0" strokeWidth={1.8} />
          <p className="text-[10px] text-gray-400 leading-tight">Casos pseudonimizados · LGPD</p>
        </div>
      </aside>

      {/* ══ WORKSPACE ══ */}
      <section className="flex-1 flex flex-col min-w-0 bg-gray-50">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-white border-b border-gray-100 flex-shrink-0">
          {selectedClient ? (
            <>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: selectedClient.color ?? "#924B92" }}>
                {selectedClient.initials ?? selectedClient.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{selectedClient.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{selectedClient.approach_label}</span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400">
                    {evolutions.length} {evolutions.length === 1 ? "evolução" : "evoluções"} · {supervisions.length} supervisões
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-lg flex-shrink-0">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Workspace ativo
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <MessageSquare className="w-5 h-5" strokeWidth={1.5} />
              <p className="text-sm">Selecione um paciente para iniciar</p>
            </div>
          )}
        </div>

        {selectedClient && <EthicsBanner />}

        {/* Thread */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2">

          {!selectedClient && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-brand-400" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-700">Supervisão & Evolução</h3>
                <p className="text-sm text-gray-400 mt-1 max-w-xs leading-relaxed">
                  Selecione um paciente para acessar o workspace clínico integrado.
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
                {clientIntention && (
                  <div className="mt-3 bg-brand-50 border border-brand-100 rounded-xl px-4 py-2.5 text-left">
                    <p className="text-[10px] font-semibold text-brand-500 mb-1">Intenção da anamnese</p>
                    <p className="text-xs text-brand-800 italic">"{clientIntention}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mensagens da supervisão ativa */}
          {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-gray-500">IA</div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-gray-400">
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

            {/* Toggle de modo */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setMode("supervision")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors",
                  mode === "supervision"
                    ? "text-brand-700 border-b-2 border-brand-500 bg-brand-50/50"
                    : "text-gray-400 hover:text-gray-600"
                )}>
                <Brain className="w-3.5 h-3.5" strokeWidth={1.8} />
                Supervisionar
              </button>
              <button
                onClick={() => setMode("evolution")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors",
                  mode === "evolution"
                    ? "text-emerald-700 border-b-2 border-emerald-500 bg-emerald-50/50"
                    : "text-gray-400 hover:text-gray-600"
                )}>
                <FileText className="w-3.5 h-3.5" strokeWidth={1.8} />
                Registrar sessão
              </button>
            </div>

            {/* Modo Supervisionar */}
            {mode === "supervision" && (
              <div className="px-5 py-4">
                <p className="text-[10px] text-gray-300 text-center mb-3">
                  Apoio ao raciocínio clínico — sem diagnósticos. O julgamento clínico é sempre do terapeuta.
                </p>
                <div className={cn(
                  "border rounded-2xl transition-all overflow-visible",
                  isRecording
                    ? "bg-red-50/40 border-red-300 ring-2 ring-red-100"
                    : "bg-gray-50 border-gray-200 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100"
                )}>
                  <textarea
                    ref={textareaRef}
                    value={isRecording && interimText ? `${input} ${interimText}` : input}
                    onChange={e => !isRecording && setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    readOnly={isRecording}
                    placeholder={isRecording ? "Ouvindo…" : "Traga o recorte do caso — o que apareceu na sessão…"}
                    rows={1}
                    className={cn(
                      "w-full bg-transparent px-4 pt-3 pb-2 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none",
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
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100 transition-colors">
                        <ApproachIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
                        {approachInfo.label}
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>
                      {lensMenuOpen && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 min-w-[200px] z-30">
                          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 px-3 py-1.5">Referencial teórico</p>
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
                        <button type="button" onClick={toggleVoice}
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all border",
                            isRecording
                              ? "bg-red-500 border-red-500 text-white animate-pulse"
                              : "bg-white border-gray-200 text-gray-400 hover:border-brand-300 hover:text-brand-500"
                          )}>
                          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                      )}
                      <button onClick={sendMessage} disabled={!input.trim() || loading}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                          input.trim() && !loading
                            ? "bg-brand-500 hover:bg-brand-600 text-white"
                            : "bg-gray-100 text-gray-300 cursor-not-allowed"
                        )}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={2} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modo Evolução */}
            {mode === "evolution" && (
              <EvolutionForm
                client={selectedClient}
                user={user!}
                onSaved={handleEvolutionSaved}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
