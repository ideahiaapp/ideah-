"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus, Search, Users, Clock,
  ChevronRight, UserCheck, UserX, Hourglass, Loader2,
  Bell, XCircle, ChevronDown, ChevronUp,
  Link2, Mail, X, Copy, Check, ClipboardList, ClipboardCheck,
} from "lucide-react";
import { getClients } from "@/lib/db";
import { useAuthStore } from "@/store/auth.store";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/database.types";

type TabId = "sem-anamnese" | "ativos" | "aguardando";

interface Anamnese {
  id: string;
  therapist_id: string;
  email: string;
  name: string;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
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
  status: string;
  created_at: string;
}

const STATUS_CONFIG = {
  ACTIVE:   { label: "Ativo",            dot: "bg-green-400",  badge: "bg-green-50 text-green-700 border-green-200" },
  WAITLIST: { label: "Lista de espera",  dot: "bg-amber-400",  badge: "bg-amber-50 text-amber-700 border-amber-200" },
  INACTIVE: { label: "Inativo",          dot: "bg-gray-300",   badge: "bg-gray-50 text-gray-500 border-gray-200" },
};

const APPROACH_COLORS: Record<string, string> = {
  "Psicanálise": "bg-purple-50 text-purple-700",
  "TCC":         "bg-blue-50 text-blue-700",
  "Junguiana":   "bg-amber-50 text-amber-700",
  "Humanista":   "bg-green-50 text-green-700",
  "Sistêmica":   "bg-pink-50 text-pink-700",
  "Somática":    "bg-orange-50 text-orange-700",
  "Gestalt":     "bg-teal-50 text-teal-700",
  "ACT":         "bg-indigo-50 text-indigo-700",
};

const ALL_APPROACHES = [
  { value: "PSYCHOANALYSIS",       label: "Psicanálise Freudiana" },
  { value: "COGNITIVE_BEHAVIORAL", label: "TCC" },
  { value: "JUNGIAN",              label: "Junguiana" },
  { value: "SOMATIC",              label: "Somática / Corporal" },
  { value: "GESTALT",              label: "Gestalt-terapia" },
  { value: "PSYCHODRAMA",          label: "Psicodrama" },
  { value: "SYSTEMIC",             label: "Constelação Familiar" },
];

type AnamneseLinkMode = "new" | "existing";

function AnamneseLinkCard({ therapistId, clients }: { therapistId: string; clients: Client[] }) {
  const [mode,        setMode]        = useState<AnamneseLinkMode>("new");
  const [selectedId,  setSelectedId]  = useState("");
  const [approach,    setApproach]    = useState("");
  const [newEmail,    setNewEmail]    = useState("");
  const [emailOpen,   setEmailOpen]   = useState(false);
  const [sending,     setSending]     = useState(false);
  const [emailSent,   setEmailSent]   = useState(false);
  const [emailError,  setEmailError]  = useState<string | null>(null);
  const [copied,      setCopied]      = useState(false);

  const [acquiredApproaches, setAcquiredApproaches] = useState<string[]>([]);
  const [loadingApproaches,  setLoadingApproaches]  = useState(true);

  useEffect(() => {
    fetch(`/api/therapist-approaches?therapistId=${therapistId}`)
      .then(r => r.json())
      .then(d => setAcquiredApproaches(d.approaches ?? []))
      .catch(() => {})
      .finally(() => setLoadingApproaches(false));
  }, [therapistId]);

  const approachOptions = ALL_APPROACHES.filter(a => acquiredApproaches.includes(a.value));

  const selectedClient = clients.find(c => c.id === selectedId) ?? null;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const ready = approach && (mode === "new" ? true : !!selectedClient);
  const approachParam = approach ? `?approach=${approach}` : "";
  const link  = mode === "new"
    ? `${baseUrl}/anamnese/${therapistId}${approachParam}`
    : (selectedClient ? `${baseUrl}/anamnese/preencher/${selectedClient.id}${approachParam}` : "");

  const waText = encodeURIComponent(
    mode === "new"
      ? `Olá! Para agendarmos sua sessão, peço que preencha a anamnese inicial pelo link abaixo:\n${link}`
      : `Olá ${selectedClient?.name ?? ""}! Para seguirmos com seu atendimento, peço que confirme/preencha sua anamnese pelo link abaixo:\n${link}`
  );

  function switchMode(m: AnamneseLinkMode) {
    setMode(m); setEmailOpen(false); setEmailSent(false); setEmailError(null); setCopied(false); setSelectedId("");
  }

  function copyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendEmail() {
    if (mode === "existing" && !selectedClient) return;
    if (mode === "new" && !newEmail.trim()) return;
    setSending(true); setEmailError(null);
    try {
      const res = await fetch("/api/anamnese/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "existing"
            ? { therapistId, clientId: selectedClient!.id }
            : { therapistId, patientEmail: newEmail.trim() }
        ),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro ao enviar.");
      }
      setEmailSent(true);
      setTimeout(() => { setEmailSent(false); setEmailOpen(false); }, 3000);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-brand-50 border border-brand-100 rounded-2xl px-5 py-4 space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
          <Link2 className="w-5 h-5 text-brand-600" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-brand-900">Enviar anamnese</p>
          <p className="text-xs text-brand-500 mt-0.5">
            {mode === "new"
              ? "Novo paciente — o preenchimento é o pré-cadastro. Ao receber, você ativa como cliente."
              : "Paciente já cadastrado — os dados de cadastro já vêm preenchidos no link."}
          </p>
        </div>
      </div>

      <div className="flex gap-1 bg-white border border-brand-200 rounded-xl p-1 w-fit">
        <button
          onClick={() => switchMode("new")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
            mode === "new" ? "bg-brand-500 text-white" : "text-brand-600 hover:bg-brand-50"
          )}
        >
          Novo paciente (pré-cadastro)
        </button>
        <button
          onClick={() => switchMode("existing")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
            mode === "existing" ? "bg-brand-500 text-white" : "text-brand-600 hover:bg-brand-50"
          )}
        >
          Paciente já cadastrado
        </button>
      </div>

      {/* Seletor de abordagem */}
      <div className="relative">
        {loadingApproaches ? (
          <div className="px-4 py-2.5 text-sm text-gray-400 bg-white border border-brand-200 rounded-xl">Carregando abordagens...</div>
        ) : approachOptions.length === 0 ? (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            Nenhuma base teórica adquirida. Acesse Configurações → Minhas Bases.
          </p>
        ) : (
          <>
            <select
              value={approach}
              onChange={e => { setApproach(e.target.value); setCopied(false); setEmailOpen(false); }}
              className={cn(
                "w-full appearance-none pr-9 px-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300",
                approach ? "border-brand-300 text-gray-800" : "border-brand-200 text-gray-400"
              )}
            >
              <option value="">Selecionar abordagem terapêutica *</option>
              {approachOptions.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        {mode === "existing" && (
          <div className="relative flex-1 min-w-0">
            <select
              value={selectedId}
              onChange={e => { setSelectedId(e.target.value); setEmailOpen(false); setEmailSent(false); setEmailError(null); }}
              className="w-full appearance-none pr-9 px-4 py-2.5 text-sm bg-white border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 text-gray-800"
            >
              <option value="">Selecionar paciente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        )}

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={copyLink}
            disabled={!ready}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-white border border-brand-200 text-brand-700 hover:bg-brand-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copiado!" : "Copiar link"}
          </button>
          <a
            href={ready ? `https://wa.me/?text=${waText}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!ready}
            className={cn(
              "flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-colors shadow-sm",
              ready ? "bg-green-500 hover:bg-green-600" : "bg-gray-300 pointer-events-none"
            )}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
          <button
            onClick={() => setEmailOpen(v => !v)}
            disabled={!ready}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-white border border-brand-200 text-brand-700 hover:bg-brand-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Mail className="w-3.5 h-3.5" />
            E-mail
          </button>
        </div>
      </div>

      {emailOpen && mode === "new" && (
        <div className="flex gap-2 items-center bg-white border border-brand-200 rounded-xl px-3 py-2">
          <Mail className="w-4 h-4 text-brand-300 flex-shrink-0" />
          <input
            type="email"
            aria-label="E-mail do paciente"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="email@dopaciente.com"
            className="flex-1 text-sm bg-transparent focus:outline-none text-gray-800 placeholder-gray-400"
            autoFocus
          />
          {emailSent ? (
            <span className="text-xs font-semibold text-green-600 px-2">Enviado!</span>
          ) : (
            <button
              onClick={sendEmail}
              disabled={sending || !newEmail.trim()}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white transition-colors"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enviar"}
            </button>
          )}
          <button type="button" onClick={() => setEmailOpen(false)} className="text-gray-300 hover:text-gray-500 ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {emailOpen && mode === "existing" && selectedClient && (
        <div className="flex gap-2 items-center bg-white border border-brand-200 rounded-xl px-3 py-2">
          <Mail className="w-4 h-4 text-brand-300 flex-shrink-0" />
          <span className="flex-1 text-sm text-gray-700">{selectedClient.email ?? "Cliente sem e-mail cadastrado"}</span>
          {emailSent ? (
            <span className="text-xs font-semibold text-green-600 px-2">Enviado!</span>
          ) : (
            <button
              onClick={sendEmail}
              disabled={sending || !selectedClient.email}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white transition-colors"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enviar"}
            </button>
          )}
          <button type="button" onClick={() => setEmailOpen(false)} className="text-gray-300 hover:text-gray-500 ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {emailError && (
        <p className="text-xs text-red-500 px-1">{emailError}</p>
      )}
    </div>
  );
}

function AnamneseCard({ anamnese, onDecision }: { anamnese: Anamnese; onDecision: (id: string, status: "ACCEPTED" | "REJECTED") => void }) {
  const [expanded, setExpanded] = useState(false);
  const [deciding, setDeciding] = useState<"ACCEPTED" | "REJECTED" | null>(null);

  async function decide(status: "ACCEPTED" | "REJECTED") {
    setDeciding(status);
    try {
      const res = await fetch(`/api/anamnese/${anamnese.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      onDecision(anamnese.id, status);
    } catch {
      alert("Erro ao atualizar status. Tente novamente.");
    } finally {
      setDeciding(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-sm font-bold flex-shrink-0">
              {anamnese.name[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{anamnese.name}</p>
              <p className="text-xs text-gray-500 truncate">{anamnese.email}</p>
              {anamnese.phone && <p className="text-xs text-gray-500">{anamnese.phone}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400">
              {new Date(anamnese.created_at).toLocaleDateString("pt-BR")}
            </span>
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {anamnese.intention && (
          <div className="mt-3 px-3 py-2 bg-amber-50 rounded-xl">
            <p className="text-xs text-amber-700 font-medium mb-0.5">Intenção da sessão</p>
            <p className="text-sm text-amber-900 italic leading-snug">"{anamnese.intention}"</p>
          </div>
        )}

        {expanded && (
          <div className="mt-4 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {anamnese.birth_date && (
                <div><span className="text-gray-400 text-xs">Nascimento</span><p className="text-gray-800">{new Date(anamnese.birth_date).toLocaleDateString("pt-BR")}</p></div>
              )}
              {anamnese.cpf && (
                <div><span className="text-gray-400 text-xs">CPF</span><p className="text-gray-800">{anamnese.cpf}</p></div>
              )}
              {anamnese.emergency_contact && (
                <div className="col-span-2"><span className="text-gray-400 text-xs">Contato de emergência</span><p className="text-gray-800">{anamnese.emergency_contact}</p></div>
              )}
              {anamnese.how_found && (
                <div className="col-span-2"><span className="text-gray-400 text-xs">Como chegou</span><p className="text-gray-800">{anamnese.how_found}</p></div>
              )}
            </div>

            {anamnese.conditions.length > 0 && (
              <div>
                <span className="text-gray-400 text-xs">Condições de saúde</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {anamnese.conditions.map(c => (
                    <span key={c} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {anamnese.medication && (
              <div><span className="text-gray-400 text-xs">Medicamentos</span><p className="text-gray-800">{anamnese.medication}</p></div>
            )}
            {anamnese.emotional_state && (
              <div><span className="text-gray-400 text-xs">Estado emocional</span><p className="text-gray-800">{anamnese.emotional_state}</p></div>
            )}
            {anamnese.body_pain && (
              <div><span className="text-gray-400 text-xs">Dor no corpo</span><p className="text-gray-800">{anamnese.body_pain}</p></div>
            )}
            {anamnese.sexual_discomfort && (
              <div><span className="text-gray-400 text-xs">Incômodo sexual</span><p className="text-gray-800">{anamnese.sexual_discomfort}</p></div>
            )}

            <div>
              <span className="text-gray-400 text-xs">Consentimentos</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {[
                  { label: "Nudez", ok: anamnese.consent_nudity },
                  { label: "Toque", ok: anamnese.consent_touch },
                  { label: "Terapêutico", ok: anamnese.consent_therapeutic },
                  { label: "Pagamento", ok: anamnese.consent_payment },
                ].map(({ label, ok }) => (
                  <span key={label} className={cn("text-xs px-2 py-0.5 rounded-full", ok ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400")}>
                    {ok ? "✓" : "✗"} {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Link
            href={`/dashboard/clients/anamnese/${anamnese.id}`}
            className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            Visualizar
          </Link>
          <button
            onClick={() => decide("REJECTED")}
            disabled={deciding !== null}
            className="flex items-center gap-1.5 bg-white hover:bg-red-50 disabled:opacity-60 text-red-600 border border-red-200 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            {deciding === "REJECTED" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            Recusar
          </button>
        </div>
      </div>
    </div>
  );
}

function ClientRow({ client }: { client: Client }) {
  const status = STATUS_CONFIG[client.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.INACTIVE;
  const approachColor = APPROACH_COLORS[client.approach_label ?? ""] ?? "bg-gray-50 text-gray-600";
  return (
    <Link href={`/dashboard/clients/${client.id}`}
      className="flex md:grid md:grid-cols-[2fr_1.2fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-gray-50 transition-colors group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: client.color ?? "#C2542F" }}>
          {client.initials ?? client.name[0]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
          <p className="text-xs text-gray-500 truncate">{client.email}</p>
        </div>
        <span className={cn("w-2 h-2 rounded-full flex-shrink-0 hidden md:block", status.dot)} title={status.label} />
      </div>
      <div className="hidden md:flex">
        <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", approachColor)}>
          {client.approach_label}
        </span>
      </div>
      <div className="hidden md:block">
        <p className="text-sm font-semibold text-gray-800">{client.total_sessions}</p>
        <p className="text-xs text-gray-400">{client.session_frequency}</p>
      </div>
      <div className="hidden md:block">
        {client.last_session ? (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            {formatDate(new Date(client.last_session))}
          </div>
        ) : (
          <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", status.badge)}>
            {status.label}
          </span>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-400 transition-colors flex-shrink-0" />
    </Link>
  );
}

function ClientTable({ clients, emptyMessage }: { clients: Client[]; emptyMessage: React.ReactNode }) {
  if (clients.length === 0) return (
    <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
      {emptyMessage}
    </div>
  );
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="hidden md:grid grid-cols-[2fr_1.2fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-gray-50 bg-gray-50/60">
        {["Paciente", "Abordagem", "Sessões", "Última sessão", ""].map(h => (
          <p key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</p>
        ))}
      </div>
      <div className="divide-y divide-gray-50">
        {clients.map(c => <ClientRow key={c.id} client={c} />)}
      </div>
    </div>
  );
}

function ClientsPageInner() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabId) ?? "ativos";

  const [tab,     setTab]     = useState<TabId>(initialTab);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [search,  setSearch]  = useState("");

  const [pendingAnamneses,  setPendingAnamneses]  = useState<Anamnese[]>([]);
  const [loadingPending,    setLoadingPending]    = useState(true);

  useEffect(() => {
    if (!user) return;
    getClients(user.id)
      .then(setClients)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    fetch(`/api/anamnese/list?therapistId=${user.id}&status=PENDING`)
      .then(r => r.json())
      .then(d => setPendingAnamneses(d.anamneses ?? []))
      .catch(() => {})
      .finally(() => setLoadingPending(false));
  }, [user]);

  function handleDecision(id: string, _status: "ACCEPTED" | "REJECTED") {
    setPendingAnamneses(prev => prev.filter(a => a.id !== id));
  }

  const activeClients    = clients.filter(c => c.status === "ACTIVE");
  const semAnamnese      = activeClients.filter(c => !c.anamnese_id);
  const comAnamnese      = activeClients.filter(c => !!c.anamnese_id);

  const q = search.toLowerCase();
  const filterClients = (list: Client[]) =>
    list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.approach_label ?? "").toLowerCase().includes(q)
    );

  const TABS = [
    { id: "sem-anamnese" as TabId, label: "Sem anamnese",        icon: ClipboardList,  count: semAnamnese.length,       badge: semAnamnese.length > 0 ? "bg-amber-500" : undefined },
    { id: "ativos"       as TabId, label: "Pacientes ativos",    icon: UserCheck,      count: comAnamnese.length,       badge: undefined },
    { id: "aguardando"   as TabId, label: "Aguardando aprovação", icon: ClipboardCheck, count: pendingAnamneses.length,  badge: pendingAnamneses.length > 0 ? "bg-amber-500" : undefined },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">
        Erro ao carregar clientes: {error}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie seus pacientes e prontuários</p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Novo cliente
        </Link>
      </div>

      {/* Link de anamnese */}
      {user && <AnamneseLinkCard therapistId={user.id} clients={clients} />}

      {/* Abas */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearch(""); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
              tab === t.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <t.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
            <span className="hidden sm:inline">{t.label}</span>
            {t.count > 0 && (
              <span className={cn(
                "text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center",
                tab === t.id
                  ? (t.badge ?? "bg-gray-100 text-gray-600")
                  : (t.badge ? `${t.badge} text-white` : "bg-gray-200 text-gray-500")
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Busca (tabs que mostram lista de clientes) */}
      {(tab === "sem-anamnese" || tab === "ativos") && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            aria-label="Buscar por nome, e-mail ou abordagem"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou abordagem..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent"
          />
        </div>
      )}

      {/* Conteúdo das abas */}

      {tab === "sem-anamnese" && (
        <ClientTable
          clients={filterClients(semAnamnese)}
          emptyMessage={
            semAnamnese.length === 0 ? (
              <>
                <ClipboardList className="w-10 h-10 text-green-300 mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-gray-500 font-medium">Todos os pacientes ativos têm anamnese</p>
                <p className="text-gray-400 text-sm mt-1">Nenhuma anamnese pendente de preenchimento.</p>
              </>
            ) : (
              <>
                <UserX className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhum paciente encontrado</p>
                <button onClick={() => setSearch("")} className="mt-3 text-sm text-brand-500 underline">Limpar busca</button>
              </>
            )
          }
        />
      )}

      {tab === "ativos" && (
        clients.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Users className="w-8 h-8 text-brand-300" strokeWidth={1.5} />
            </div>
            <h2 className="text-gray-700 font-bold text-lg mb-2">Nenhum cliente cadastrado ainda</h2>
            <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed mb-6">
              Comece cadastrando seu primeiro paciente. O prontuário, as evoluções e as supervisões ficam todos aqui.
            </p>
            <Link href="/dashboard/clients/new"
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm">
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Cadastrar primeiro cliente
            </Link>
          </div>
        ) : (
          <ClientTable
            clients={filterClients(comAnamnese)}
            emptyMessage={
              <>
                <UserX className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhum paciente encontrado</p>
                <button onClick={() => setSearch("")} className="mt-3 text-sm text-brand-500 underline">Limpar busca</button>
              </>
            }
          />
        )
      )}

      {tab === "aguardando" && (
        loadingPending ? (
          <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        ) : pendingAnamneses.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
            <ClipboardCheck className="w-10 h-10 text-green-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-gray-500 font-medium">Nenhuma anamnese aguardando aprovação</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {pendingAnamneses.map(a => (
              <AnamneseCard key={a.id} anamnese={a} onDecision={handleDecision} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
      </div>
    }>
      <ClientsPageInner />
    </Suspense>
  );
}
