"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, Briefcase, Clock, Calendar, FileText,
  MessageSquare, Plus, ChevronRight, Pencil, Sparkles, Target,
  UserCheck, Hourglass, Activity, Loader2, ClipboardList,
  ChevronDown, Save, AlertTriangle, Trash2, Link2, Copy, Check, X, ExternalLink,
} from "lucide-react";
import { getClient, getEvolutionsByClient, getSupervisionsByClient, deleteSupervision } from "@/lib/db";
import { formatDate, cn, maskCpf, isValidCpf } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import type { Client, Evolution, Supervision } from "@/lib/database.types";
import { TemplateAnswersView, TemplateFormSection, serializeTemplateForm } from "@/components/ui/TemplateFormSection";
import { TextareaWithMic } from "@/components/ui/VoiceField";
import { API_BASE } from "@/lib/api-base";

type Tab = "prontuario" | "anamnese" | "evolucoes" | "supervisoes";

interface Anamnese {
  id: string; name: string; email: string; phone: string | null; cpf: string | null;
  birth_date: string | null; emergency_contact: string | null;
  how_found: string | null;
  conditions: string[]; latex_allergy: boolean;
  oil_allergy: string | null; medication: string | null;
  emotional_state: string | null; body_pain: string | null;
  intention: string | null; sexual_discomfort: string | null;
  consent_nudity: boolean; consent_touch: boolean;
  consent_therapeutic: boolean; consent_payment: boolean;
  approach: string | null;
  template_answers: Record<string, unknown> | null;
  created_at: string;
}

const ALL_APPROACHES = [
  { value: "PSYCHOANALYSIS",       label: "Psicanálise Freudiana" },
  { value: "COGNITIVE_BEHAVIORAL", label: "TCC" },
  { value: "JUNGIAN",              label: "Junguiana" },
  { value: "SOMATIC",              label: "Somática / Corporal" },
  { value: "TANTRA",               label: "Sexualidade Humana e Tantra" },
  { value: "GESTALT",              label: "Gestalt-terapia" },
  { value: "PSYCHODRAMA",          label: "Psicodrama" },
  { value: "SYSTEMIC",             label: "Constelação Familiar" },
];

function approachLabels(client: Client): string[] {
  if (client.approaches?.length) {
    return client.approaches.map(v => ALL_APPROACHES.find(a => a.value === v)?.label ?? v);
  }
  return client.approach_label ? [client.approach_label] : [];
}

function SendAnamneseCard({ therapistId, client }: { therapistId: string; client: Client }) {
  const [approach,   setApproach]   = useState("");
  const [emailOpen,  setEmailOpen]  = useState(false);
  const [sending,    setSending]    = useState(false);
  const [emailSent,  setEmailSent]  = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [copied,     setCopied]     = useState(false);

  const [acquiredApproaches, setAcquiredApproaches] = useState<string[]>([]);
  const [loadingApproaches,  setLoadingApproaches]  = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/therapist-approaches?therapistId=${therapistId}`)
      .then(r => r.json())
      .then(d => setAcquiredApproaches(d.approaches ?? []))
      .catch(() => {})
      .finally(() => setLoadingApproaches(false));
  }, [therapistId]);

  const approachOptions = ALL_APPROACHES.filter(a => acquiredApproaches.includes(a.value));
  const baseUrl = typeof window !== "undefined" ? `${window.location.origin}${API_BASE}` : "";

  const ready = !!approach;
  const approachParam = approach ? `?approach=${approach}` : "";
  const link = `${baseUrl}/anamnese/preencher/${client.id}${approachParam}`;

  const waText = encodeURIComponent(
    `Olá ${client.name}! Para seguirmos com seu atendimento, peço que confirme/preencha sua anamnese pelo link abaixo:\n${link}`
  );

  function copyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendEmail() {
    setSending(true); setEmailError(null);
    try {
      const res = await fetch(`${API_BASE}/api/anamnese/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ therapistId, clientId: client.id }),
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
          <p className="text-xs text-brand-600 mt-0.5">
            Os dados de cadastro de {client.name} já vêm preenchidos no link.
          </p>
        </div>
      </div>

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
              aria-label="Abordagem terapêutica"
              className={cn(
                "w-full appearance-none pr-9 px-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300",
                approach ? "border-brand-300 text-gray-800" : "border-brand-200 text-gray-500"
              )}
            >
              <option value="">Selecionar abordagem terapêutica *</option>
              {approachOptions.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
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

      {emailOpen && (
        <div className="flex gap-2 items-center bg-white border border-brand-200 rounded-xl px-3 py-2">
          <Mail className="w-4 h-4 text-brand-300 flex-shrink-0" />
          <span className="flex-1 text-sm text-gray-700">{client.email ?? "Cliente sem e-mail cadastrado"}</span>
          {emailSent ? (
            <span className="text-xs font-semibold text-green-600 px-2">Enviado!</span>
          ) : (
            <button
              onClick={sendEmail}
              disabled={sending || !client.email}
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

const STATUS_CONFIG = {
  ACTIVE:   { label: "Ativo",           badge: "bg-green-50 text-green-700 border-green-200",  icon: UserCheck },
  WAITLIST: { label: "Lista de espera", badge: "bg-amber-50 text-amber-700 border-amber-200",  icon: Hourglass },
  INACTIVE: { label: "Inativo",         badge: "bg-gray-50  text-gray-500  border-gray-200",   icon: Activity  },
};

function calcAge(dateStr: string) {
  const birth = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const CONDITIONS = [
  "Gravidez", "Diabetes", "Problemas cardíacos", "Cirurgia recente",
  "Limitação física", "Convulsão ou epilepsia",
  "IST (Infecções Sexualmente Transmissíveis)", "Depressão",
  "Ansiedade", "Síndrome do pânico",
];

const HOW_FOUND_OPTIONS = [
  "Indicação de amigo(a)", "Redes sociais", "Google", "Evento ou palestra",
  "Outro profissional de saúde", "Outro",
];

const inputCls = "w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent text-gray-800 placeholder-gray-400";

type AnamneseForm = {
  cpf: string; emergency_contact: string;
  how_found: string;
  conditions: string[];
  latex_allergy: boolean; oil_allergy: string; medication: string;
  emotional_state: string; body_pain: string; intention: string; sexual_discomfort: string;
};

export default function ClientDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("prontuario");
  const [anamneseFormOpen, setAnamneseFormOpen] = useState(false);
  const [anamneseForm, setAnamneseForm] = useState<AnamneseForm>({
    cpf: "",
    emergency_contact: "", how_found: "",
    conditions: [], latex_allergy: false, oil_allergy: "", medication: "",
    emotional_state: "", body_pain: "", intention: "", sexual_discomfort: "",
  });
  const [anamneseSaving, setAnamneseSaving] = useState(false);
  const [anamneseSaveError, setAnamneseSaveError] = useState<string | null>(null);

  // Abordagem usada para decidir qual template de anamnese apresentar ao preencher no
  // sistema — mesmo critério usado ao gerar o link enviado ao cliente.
  const [showApproachPicker, setShowApproachPicker] = useState(false);
  const [fillApproach,       setFillApproach]       = useState<string | null>(null);
  const [fillTemplateHtml,   setFillTemplateHtml]   = useState<string | null>(null);
  const [loadingFillTemplate, setLoadingFillTemplate] = useState(false);
  const fillTemplateRef = useRef<HTMLDivElement>(null);

  const [client,      setClient]      = useState<Client | null>(null);
  const [evolutions,  setEvolutions]  = useState<Evolution[]>([]);
  const [supervisions,setSupervisions]= useState<Supervision[]>([]);
  const [anamnese,      setAnamnese]      = useState<Anamnese | null>(null);
  const [templateHtml,  setTemplateHtml]  = useState<string | null>(null);
  const [anamneseLoading, setAnamneseLoading] = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [deletingSupervisionId, setDeletingSupervisionId] = useState<string | null>(null);

  async function handleDeleteSupervision(sv: Supervision) {
    if (!confirm(`Excluir a supervisão "${sv.title}"? Essa ação não pode ser desfeita.`)) return;
    setDeletingSupervisionId(sv.id);
    try {
      await deleteSupervision(sv.id);
      setSupervisions(prev => prev.filter(s => s.id !== sv.id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir supervisão.");
    } finally {
      setDeletingSupervisionId(null);
    }
  }

  useEffect(() => {
    Promise.all([
      getClient(id),
      getEvolutionsByClient(id),
      getSupervisionsByClient(id),
    ])
      .then(([c, evs, svs]) => { setClient(c); setEvolutions(evs); setSupervisions(svs); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!client || client.anamnese_id) return;
    setAnamneseForm(prev => ({
      ...prev,
      emergency_contact: client.emergency_contact ?? "",
    }));
  }, [client]);

  function setAF<K extends keyof AnamneseForm>(key: K, value: AnamneseForm[K]) {
    setAnamneseForm(prev => ({ ...prev, [key]: value }));
  }

  function toggleAFCondition(c: string) {
    setAnamneseForm(prev => ({
      ...prev,
      conditions: prev.conditions.includes(c)
        ? prev.conditions.filter(x => x !== c)
        : [...prev.conditions, c],
    }));
  }

  /* Clique em "Preencher anamnese": se o cliente tem mais de uma abordagem cadastrada,
     pergunta com base em qual delas a anamnese deve ser apresentada — mesmo critério do
     link enviado ao cliente. Com uma só (ou nenhuma), segue direto. */
  function startFillAnamnese() {
    const approaches = client?.approaches?.length ? client.approaches : (client?.approach ? [client.approach] : []);
    if (approaches.length > 1) {
      setShowApproachPicker(true);
      return;
    }
    setFillApproach(approaches[0] ?? null);
    setAnamneseFormOpen(true);
  }

  function chooseFillApproach(approach: string) {
    setFillApproach(approach);
    setShowApproachPicker(false);
    setAnamneseFormOpen(true);
  }

  useEffect(() => {
    if (!fillApproach) { setFillTemplateHtml(null); return; }
    setLoadingFillTemplate(true);
    fetch(`${API_BASE}/api/anamnese-templates/${fillApproach}`, { cache: "no-store" })
      .then(r => r.json())
      .then(d => setFillTemplateHtml(d.content ?? null))
      .catch(() => setFillTemplateHtml(null))
      .finally(() => setLoadingFillTemplate(false));
  }, [fillApproach]);

  async function handleSaveAnamnese() {
    if (!client || !user) return;
    setAnamneseSaving(true); setAnamneseSaveError(null);
    try {
      const res = await fetch(`${API_BASE}/api/anamnese/create-for-client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          therapistId: user.id, clientId: client.id, ...anamneseForm,
          approach: fillApproach ?? undefined,
          template_answers: fillTemplateRef.current ? serializeTemplateForm(fillTemplateRef.current) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar anamnese.");
      const updatedClient = await getClient(id);
      setClient(updatedClient);
      setAnamneseFormOpen(false);
    } catch (e) {
      setAnamneseSaveError(e instanceof Error ? e.message : "Erro ao salvar anamnese.");
    } finally {
      setAnamneseSaving(false);
    }
  }

  useEffect(() => {
    if (!client?.anamnese_id) return;
    setAnamneseLoading(true);
    fetch(`${API_BASE}/api/anamnese/${client.anamnese_id}`)
      .then(r => r.json())
      .then(d => {
        const a: Anamnese | null = d.anamnese ?? null;
        setAnamnese(a);
        if (a?.approach && a?.template_answers) {
          fetch(`${API_BASE}/api/anamnese-templates/${a.approach}`, { cache: "no-store" })
            .then(r => r.json())
            .then(t => setTemplateHtml(t.content ?? null))
            .catch(() => {});
        }
      })
      .catch(() => setAnamnese(null))
      .finally(() => setAnamneseLoading(false));
  }, [client?.anamnese_id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
    </div>
  );

  if (error || !client) return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <p className="text-gray-400 mb-4">{error ?? "Cliente não encontrado."}</p>
      <Link href="/dashboard/clients" className="text-brand-500 hover:underline text-sm font-medium">
        ← Voltar para clientes
      </Link>
    </div>
  );

  const status     = STATUS_CONFIG[client.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.INACTIVE;
  const StatusIcon = status.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-ink">{client.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{approachLabels(client).join(", ")} · {client.total_sessions} sessões</p>
          </div>
        </div>
        <Link href={`/dashboard/clients/${client.id}/edit`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          <Pencil className="w-3.5 h-3.5" /> Editar
        </Link>
      </div>

      {/* Card de identidade */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-sm"
            style={{ backgroundColor: client.color ?? "#C2542F" }}>
            {client.initials ?? client.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <h2 className="text-lg font-bold text-gray-900">{client.name}</h2>
              <span className={cn("flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium", status.badge)}>
                <StatusIcon className="w-3 h-3" strokeWidth={2} />
                {status.label}
              </span>
              {approachLabels(client).map(label => (
                <span key={label} className="text-xs bg-brand-50 text-brand-600 px-2.5 py-1 rounded-full font-medium border border-brand-100">
                  {label}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {client.email      && <InfoItem icon={Mail}     label="E-mail"      value={client.email} />}
              {client.phone      && <InfoItem icon={Phone}    label="Telefone"    value={client.phone} />}
              {client.occupation && <InfoItem icon={Briefcase}label="Profissão"   value={client.occupation} />}
              {client.birth_date && <InfoItem icon={Calendar} label="Idade"       value={`${calcAge(client.birth_date)} anos (${formatDate(new Date(client.birth_date))})`} />}
              {client.start_date && <InfoItem icon={Clock}    label="Desde"       value={formatDate(new Date(client.start_date))} />}
              {client.session_frequency && <InfoItem icon={Activity} label="Frequência" value={`${client.session_frequency} · ${client.session_duration}min`} />}
            </div>
          </div>
        </div>

        {client.next_session && (
          <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-brand-500" strokeWidth={1.8} />
              </div>
              <span className="text-gray-500">Próxima sessão:</span>
              <span className="font-semibold text-gray-800">{formatDate(new Date(client.next_session))}</span>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/supervision?client=${client.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 border border-brand-200 text-xs font-semibold text-brand-700 transition-colors">
                <Sparkles className="w-3.5 h-3.5" /> Supervisionar
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { id: "prontuario",  label: "Prontuário",                              icon: FileText      },
          { id: "anamnese",    label: "Anamnese",                                icon: ClipboardList },
          { id: "evolucoes",   label: `Evoluções (${evolutions.length})`,        icon: Target        },
          { id: "supervisoes", label: `Supervisões (${supervisions.length})`,    icon: MessageSquare },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === t.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            )}>
            <t.icon className="w-3.5 h-3.5" strokeWidth={1.8} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Prontuário */}
      {tab === "prontuario" && (
        <div className="space-y-4">
          <ProntuarioSection title="Demanda principal" icon={Target}>
            <p className="text-sm text-gray-700 leading-relaxed">
              {client.main_demand || <span className="text-gray-400 italic">Não registrado</span>}
            </p>
          </ProntuarioSection>
          <ProntuarioSection title="Observações clínicas" icon={FileText}>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {client.notes || <span className="text-gray-400 italic">Sem observações registradas</span>}
            </p>
          </ProntuarioSection>
          {client.referral && (
            <ProntuarioSection title="Como chegou até você" icon={Activity}>
              <p className="text-sm text-gray-700">{client.referral}</p>
            </ProntuarioSection>
          )}
          {client.emergency_contact && (
            <ProntuarioSection title="Contato de emergência" icon={Phone}>
              <p className="text-sm text-gray-700">{client.emergency_contact}</p>
            </ProntuarioSection>
          )}
        </div>
      )}

      {/* Tab: Anamnese */}
      {tab === "anamnese" && (
        <div className="space-y-4">
          {anamneseLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
            </div>
          ) : !anamnese ? (
            anamneseFormOpen ? (
              <AnamneseFormCard
                client={client}
                form={anamneseForm}
                setField={setAF}
                toggleCondition={toggleAFCondition}
                saving={anamneseSaving}
                error={anamneseSaveError}
                onCancel={() => { setAnamneseFormOpen(false); setFillApproach(null); }}
                onSave={handleSaveAnamnese}
                approach={fillApproach}
                templateHtml={fillTemplateHtml}
                loadingTemplate={loadingFillTemplate}
                templateRef={fillTemplateRef}
              />
            ) : (
              <>
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                  <ClipboardList className="w-8 h-8 text-gray-200 mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-sm text-gray-400 mb-4">Nenhuma anamnese vinculada a este cliente.</p>
                  <button onClick={startFillAnamnese}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Preencher anamnese
                  </button>
                  {(client.approaches?.[0] ?? client.approach) && (
                    <Link
                      href={`/anamnese/preencher/${client.id}?approach=${client.approaches?.[0] ?? client.approach}`}
                      target="_blank"
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 mt-3"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Abrir o mesmo formulário enviado ao cliente
                    </Link>
                  )}
                </div>
                {user && <SendAnamneseCard therapistId={user.id} client={client} />}
              </>
            )
          ) : (
            <>
              <ProntuarioSection title="Dados preenchidos pelo cliente" icon={ClipboardList}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnamneseField label="Nome" value={anamnese.name} />
                  <AnamneseField label="E-mail" value={anamnese.email} />
                  <AnamneseField label="Telefone" value={anamnese.phone} />
                  <AnamneseField label="CPF" value={anamnese.cpf} />
                  <AnamneseField label="Data de nascimento"
                    value={anamnese.birth_date ? formatDate(new Date(anamnese.birth_date)) : null} />
                  <AnamneseField label="Contato de emergência" value={anamnese.emergency_contact} />
                  <AnamneseField label="Como chegou" value={anamnese.how_found} />
                </div>

                {anamnese.conditions && anamnese.conditions.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-400 mb-1.5">Condições de saúde</p>
                    <div className="flex flex-wrap gap-1.5">
                      {anamnese.conditions.map(c => (
                        <span key={c} className="text-xs bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {anamnese.approach === "SOMATIC" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <AnamneseField label="Medicamentos" value={anamnese.medication} />
                    <AnamneseField label="Alergia a óleos" value={anamnese.oil_allergy} />
                    {anamnese.latex_allergy && (
                      <div><p className="text-xs font-semibold text-red-400">Alergia a latex</p></div>
                    )}
                  </div>
                )}

                {/* Campos padrão (usados quando não há template configurado para a
                    abordagem) — se a anamnese tem template_answers, essas perguntas foram
                    respondidas dentro do template abaixo, não aqui. */}
                {!anamnese.template_answers && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <AnamneseField label="Estado emocional" value={anamnese.emotional_state} />
                      <AnamneseField label="Dor no corpo" value={anamnese.body_pain} />
                      <AnamneseField label="Incômodo sexual" value={anamnese.sexual_discomfort} />
                    </div>

                    {anamnese.intention && (
                      <div className="mt-4 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
                        <p className="text-xs font-semibold text-brand-600 mb-1">Intenção da sessão</p>
                        <p className="text-sm text-brand-900 italic">"{anamnese.intention}"</p>
                      </div>
                    )}
                  </>
                )}

                {anamnese.approach === "SOMATIC" && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-400 mb-1.5">Consentimentos</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Nudez",       ok: anamnese.consent_nudity },
                        { label: "Toque",       ok: anamnese.consent_touch },
                        { label: "Terapêutico", ok: anamnese.consent_therapeutic },
                        { label: "Pagamento",   ok: anamnese.consent_payment },
                      ].map(({ label, ok }) => (
                        <span key={label} className={cn("text-xs px-2.5 py-1 rounded-full border font-medium",
                          ok ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-400 border-gray-200")}>
                          {ok ? "✓" : "✗"} {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </ProntuarioSection>

              {anamnese.template_answers && (
                <ProntuarioSection title="Respostas da anamnese" icon={ClipboardList}>
                  {templateHtml ? (
                    <TemplateAnswersView
                      html={templateHtml}
                      answers={anamnese.template_answers as Record<string, unknown>}
                    />
                  ) : (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
                    </div>
                  )}
                </ProntuarioSection>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Evoluções */}
      {tab === "evolucoes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{evolutions.length} evoluções registradas</p>
            <Link href={`/dashboard/supervision?client=${client.id}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:text-brand-700">
              <Sparkles className="w-3.5 h-3.5" /> Supervisionar
            </Link>
          </div>
          {evolutions.length === 0 ? (
            <EmptyState icon={FileText} text="Nenhuma evolução registrada para este cliente." />
          ) : (
            evolutions.map(ev => (
              <Link key={ev.id} href={`/dashboard/evolutions/${ev.id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-brand-200 hover:shadow-md transition-all p-5 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(new Date(ev.session_date))}
                      </span>
                      {ev.session_number && <>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">Sessão #{ev.session_number}</span>
                      </>}
                    </div>
                    {ev.hypothesis && <p className="text-sm font-semibold text-brand-600 mb-1">{ev.hypothesis}</p>}
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{ev.content}</p>
                    {ev.ai_hypothesis && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-purple-500">
                        <Sparkles className="w-3 h-3" /> Hipótese IA
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-400 flex-shrink-0 mt-1 transition-colors" />
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Tab: Supervisões */}
      {tab === "supervisoes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{supervisions.length} supervisões sobre este caso</p>
            <Link href={`/dashboard/supervision?client=${client.id}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:text-brand-700">
              <Plus className="w-3.5 h-3.5" /> Nova supervisão
            </Link>
          </div>
          {supervisions.length === 0 ? (
            <EmptyState icon={MessageSquare} text="Nenhuma supervisão sobre este caso ainda." />
          ) : (
            supervisions.map(sv => (
              <div key={sv.id} className="relative group">
                <Link href={`/dashboard/supervision?client=${client.id}&session=${sv.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-brand-200 hover:shadow-md transition-all p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageSquare className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-gray-800 truncate pr-8">{sv.title}</p>
                        <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0 border border-brand-100">
                          {sv.approach}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 pr-8">
                      <p className="text-xs text-gray-400">{formatDate(new Date(sv.updated_at))}</p>
                      <p className="text-xs text-gray-300 mt-1">{sv.messages_count} msgs</p>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteSupervision(sv); }}
                  disabled={deletingSupervisionId === sv.id}
                  aria-label="Excluir supervisão"
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deletingSupervisionId === sv.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" strokeWidth={1.8} />}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {showApproachPicker && (
        <ChooseApproachModal
          approaches={client.approaches?.length ? client.approaches : (client.approach ? [client.approach] : [])}
          onChoose={chooseFillApproach}
          onCancel={() => setShowApproachPicker(false)}
        />
      )}
    </div>
  );
}

function ChooseApproachModal({ approaches, onChoose, onCancel }: {
  approaches: string[]; onChoose: (approach: string) => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-gray-900">Qual abordagem?</h2>
          <button onClick={onCancel} className="text-gray-300 hover:text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Este cliente tem mais de uma abordagem cadastrada. Com base em qual delas a anamnese deve ser preenchida?
        </p>
        <div className="space-y-2">
          {approaches.map(value => (
            <button key={value} onClick={() => onChoose(value)}
              className="w-full text-left px-4 py-2.5 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50 text-sm font-semibold text-gray-700 transition-colors">
              {ALL_APPROACHES.find(a => a.value === value)?.label ?? value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function AnamneseFormCard({
  client, form, setField, toggleCondition, saving, error, onCancel, onSave,
  approach, templateHtml, loadingTemplate, templateRef,
}: {
  client: Client;
  form: {
    cpf: string; emergency_contact: string; how_found: string;
    conditions: string[]; latex_allergy: boolean; oil_allergy: string; medication: string;
    emotional_state: string; body_pain: string; intention: string; sexual_discomfort: string;
  };
  setField: (key: keyof AnamneseForm, value: string | boolean | string[]) => void;
  toggleCondition: (c: string) => void;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: () => void;
  approach: string | null;
  templateHtml: string | null;
  loadingTemplate: boolean;
  templateRef: React.RefObject<HTMLDivElement>;
}) {
  const canSave = true;
  const isSomatic = approach === "SOMATIC";

  return (
    <div className="space-y-4">
      <ProntuarioSection title="Dados pessoais (do cadastro do cliente)" icon={ClipboardList}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnamneseField label="Nome completo" value={client.name} />
          <AnamneseField label="E-mail" value={client.email} />
          <AnamneseField label="Telefone / WhatsApp" value={client.phone} />
          <AnamneseField label="Data de nascimento" value={client.birth_date ? formatDate(new Date(client.birth_date)) : null} />
        </div>
        <p className="text-xs text-gray-400">Para alterar esses dados, edite o cadastro do cliente.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="CPF">
            <input value={form.cpf} onChange={e => setField("cpf", maskCpf(e.target.value) as never)}
              className={cn(inputCls, form.cpf.length === 14 && !isValidCpf(form.cpf) && "border-red-300 focus:ring-red-200")}
              placeholder="000.000.000-00" />
            {form.cpf.length === 14 && !isValidCpf(form.cpf) && (
              <p className="text-xs text-red-500 mt-1">CPF inválido.</p>
            )}
          </FormField>
          <FormField label="Contato de emergência">
            <input value={form.emergency_contact} onChange={e => setField("emergency_contact", e.target.value as never)} className={inputCls} />
          </FormField>
          <FormField label="Como chegou até você">
            <div className="relative">
              <select value={form.how_found} onChange={e => setField("how_found", e.target.value as never)}
                className={inputCls + " appearance-none pr-9"}>
                <option value="">Selecionar...</option>
                {HOW_FOUND_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </FormField>
        </div>
      </ProntuarioSection>

      {isSomatic && (
        <ProntuarioSection title="Saúde" icon={Activity}>
          <FormField label="Condições de saúde">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {CONDITIONS.map(c => (
                <label key={c} className="flex items-center gap-2.5 cursor-pointer group">
                  <div onClick={() => toggleCondition(c)}
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                      form.conditions.includes(c) ? "border-brand-500 bg-brand-500" : "border-gray-300 group-hover:border-brand-300"
                    )}>
                    {form.conditions.includes(c) && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <polyline points="1.5 5 4 7.5 8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-700">{c}</span>
                </label>
              ))}
            </div>
          </FormField>
          <FormField label="Tem alergia a látex?">
            <div className="flex gap-4">
              {[true, false].map(v => (
                <label key={String(v)} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={form.latex_allergy === v}
                    onChange={() => setField("latex_allergy", v as never)} className="accent-brand-600" />
                  <span className="text-sm">{v ? "Sim" : "Não"}</span>
                </label>
              ))}
            </div>
          </FormField>
          <FormField label="Alergia a óleo de massagem">
            <input value={form.oil_allergy} onChange={e => setField("oil_allergy", e.target.value as never)} className={inputCls} />
          </FormField>
          <FormField label="Medicamentos em uso">
            <TextareaWithMic rows={2} value={form.medication} onValueChange={v => setField("medication", v as never)} className={inputCls + " resize-none"} />
          </FormField>
        </ProntuarioSection>
      )}

      {/* Perguntas clínicas: template configurado em Configurações → Anamnese para a
          abordagem escolhida, ou os campos padrão se não houver template. */}
      {loadingTemplate ? (
        <ProntuarioSection title="Estado emocional e intenção" icon={Target}>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
          </div>
        </ProntuarioSection>
      ) : templateHtml ? (
        <div ref={templateRef}>
          <TemplateFormSection html={templateHtml} />
        </div>
      ) : (
        <ProntuarioSection title="Estado emocional e intenção" icon={Target}>
          <FormField label="Estado emocional atual">
            <TextareaWithMic rows={3} value={form.emotional_state} onValueChange={v => setField("emotional_state", v as never)} className={inputCls + " resize-none"} />
          </FormField>
          <FormField label="Dor no corpo">
            <TextareaWithMic rows={2} value={form.body_pain} onValueChange={v => setField("body_pain", v as never)} className={inputCls + " resize-none"} />
          </FormField>
          <FormField label="Intenção com a sessão / processo">
            <TextareaWithMic rows={3} value={form.intention} onValueChange={v => setField("intention", v as never)} className={inputCls + " resize-none"} />
          </FormField>
          <FormField label="Incômodo na vida sexual">
            <TextareaWithMic rows={2} value={form.sexual_discomfort} onValueChange={v => setField("sexual_discomfort", v as never)} className={inputCls + " resize-none"} />
          </FormField>
        </ProntuarioSection>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="flex items-center gap-3 pb-2">
        <button onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
        <button onClick={onSave} disabled={!canSave || saving}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
            canSave && !saving ? "bg-brand-500 hover:bg-brand-600 text-white shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar anamnese</>}
        </button>
      </div>
    </div>
  );
}

function AnamneseField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={1.8} />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-xs font-medium text-gray-700 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function ProntuarioSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-50 bg-gray-50/50">
        <div className="w-6 h-6 bg-brand-50 rounded-lg flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-brand-500" strokeWidth={1.8} />
        </div>
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
      <Icon className="w-8 h-8 text-gray-200 mx-auto mb-3" strokeWidth={1.5} />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}
