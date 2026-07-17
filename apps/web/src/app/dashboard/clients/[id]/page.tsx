"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, Briefcase, Clock, Calendar, FileText,
  MessageSquare, Plus, ChevronRight, Pencil, Sparkles, Target,
  UserCheck, Hourglass, Activity, Loader2, ClipboardList,
  ChevronDown, Save, AlertTriangle,
} from "lucide-react";
import { getClient, getEvolutionsByClient, getSupervisionsByClient } from "@/lib/db";
import { formatDate, cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import type { Client, Evolution, Supervision } from "@/lib/database.types";
import { TemplateAnswersView } from "@/components/ui/TemplateFormSection";
import { TextareaWithMic } from "@/components/ui/VoiceField";

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

  const [client,      setClient]      = useState<Client | null>(null);
  const [evolutions,  setEvolutions]  = useState<Evolution[]>([]);
  const [supervisions,setSupervisions]= useState<Supervision[]>([]);
  const [anamnese,      setAnamnese]      = useState<Anamnese | null>(null);
  const [templateHtml,  setTemplateHtml]  = useState<string | null>(null);
  const [anamneseLoading, setAnamneseLoading] = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

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

  async function handleSaveAnamnese() {
    if (!client || !user) return;
    setAnamneseSaving(true); setAnamneseSaveError(null);
    try {
      const res = await fetch("/api/anamnese/create-for-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ therapistId: user.id, clientId: client.id, ...anamneseForm }),
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
    fetch(`/api/anamnese/${client.anamnese_id}`)
      .then(r => r.json())
      .then(d => {
        const a: Anamnese | null = d.anamnese ?? null;
        setAnamnese(a);
        if (a?.approach && a?.template_answers) {
          fetch(`/api/anamnese-templates/${a.approach}`, { cache: "no-store" })
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
            <p className="text-gray-400 text-sm mt-0.5">{client.approach_label} · {client.total_sessions} sessões</p>
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
              <span className="text-xs bg-brand-50 text-brand-600 px-2.5 py-1 rounded-full font-medium border border-brand-100">
                {client.approach_label}
              </span>
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
                onCancel={() => setAnamneseFormOpen(false)}
                onSave={handleSaveAnamnese}
              />
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <ClipboardList className="w-8 h-8 text-gray-200 mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-sm text-gray-400 mb-4">Nenhuma anamnese vinculada a este cliente.</p>
                <button onClick={() => setAnamneseFormOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Preencher anamnese
                </button>
              </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <AnamneseField label="Medicamentos" value={anamnese.medication} />
                  <AnamneseField label="Alergia a óleos" value={anamnese.oil_allergy} />
                  {anamnese.latex_allergy && (
                    <div><p className="text-xs font-semibold text-red-400">Alergia a latex</p></div>
                  )}
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
              </ProntuarioSection>

              {templateHtml && anamnese.template_answers && (
                <ProntuarioSection title="Respostas da anamnese específica" icon={ClipboardList}>
                  <TemplateAnswersView
                    html={templateHtml}
                    answers={anamnese.template_answers as Record<string, unknown>}
                  />
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
              <Link key={sv.id} href={`/dashboard/supervision`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-brand-200 hover:shadow-md transition-all p-5 group">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-800 truncate">{sv.title}</p>
                      <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0 border border-brand-100">
                        {sv.approach}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{formatDate(new Date(sv.updated_at))}</p>
                    <p className="text-xs text-gray-300 mt-1">{sv.messages_count} msgs</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
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

function AnamneseFormCard({ client, form, setField, toggleCondition, saving, error, onCancel, onSave }: {
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
}) {
  const canSave = true;

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
            <input value={form.cpf} onChange={e => setField("cpf", e.target.value as never)} className={inputCls} />
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
