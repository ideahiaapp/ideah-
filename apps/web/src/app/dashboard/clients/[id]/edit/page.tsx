"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Loader2, CheckCircle2,
  Phone, Mail, Heart, FileText,
  ChevronDown, AlertTriangle, Mic, ShieldAlert, Info, User,
  ClipboardList,
} from "lucide-react";
import { getClient, updateClient } from "@/lib/db";
import { cn, maskCpf, maskPhone } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { VoiceInput, VoiceTextarea } from "@/components/ui/VoiceField";
import type { Client } from "@/lib/database.types";

const CONDITIONS = [
  "Gravidez", "Diabetes", "Problemas cardíacos", "Cirurgia recente",
  "Limitação física", "Convulsão ou epilepsia",
  "IST (Infecções Sexualmente Transmissíveis)", "Depressão",
  "Ansiedade", "Síndrome do pânico", "Nenhuma das anteriores",
];

const HOW_FOUND_OPTIONS = [
  "Indicação de amigo(a)", "Redes sociais", "Google", "Evento ou palestra",
  "Outro profissional de saúde", "Outro",
];

type AnamneseForm = {
  cpf: string; emergency_contact: string; how_found: string;
  conditions: string[]; latex_allergy: boolean; oil_allergy: string; medication: string;
  emotional_state: string; body_pain: string; intention: string; sexual_discomfort: string;
};

function emptyAnamneseForm(): AnamneseForm {
  return {
    cpf: "",
    emergency_contact: "", how_found: "",
    conditions: [], latex_allergy: false, oil_allergy: "", medication: "",
    emotional_state: "", body_pain: "", intention: "", sexual_discomfort: "",
  };
}

const ALL_APPROACHES = [
  { value: "PSYCHOANALYSIS",       label: "Psicanálise Freudiana" },
  { value: "COGNITIVE_BEHAVIORAL", label: "TCC" },
  { value: "JUNGIAN",              label: "Junguiana" },
  { value: "SOMATIC",              label: "Somática / Corporal" },
  { value: "GESTALT",              label: "Gestalt-terapia" },
  { value: "PSYCHODRAMA",          label: "Psicodrama" },
  { value: "SYSTEMIC",             label: "Constelação Familiar" },
];

const FREQUENCIES = ["Semanal", "Quinzenal", "Mensal", "Sob demanda"];
const DURATIONS   = ["45", "50", "60", "90"];
const STATUS_OPTS = [
  { value: "ACTIVE",   label: "Ativo" },
  { value: "WAITLIST", label: "Lista de espera" },
  { value: "INACTIVE", label: "Inativo" },
];

const inputCls = "w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent text-gray-800 placeholder-gray-400";

function initForm(client: Client) {
  const approachLabel = ALL_APPROACHES.find(a => a.value === client.approach)?.label ?? client.approach_label ?? "";
  return {
    name:             client.name,
    email:            client.email ?? "",
    phone:            client.phone ?? "",
    birthDate:        client.birth_date ? client.birth_date.split("T")[0] : "",
    occupation:       client.occupation ?? "",
    approach:         approachLabel,
    frequency:        client.session_frequency ?? "Semanal",
    duration:         String(client.session_duration ?? 50),
    status:           client.status,
    mainDemand:       client.main_demand ?? "",
    notes:            client.notes ?? "",
    emergencyContact: client.emergency_contact ?? "",
    vulnerability:    [] as string[],
    pseudonymized:    false,
    lgpdConsent:      true,
  };
}

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [client,  setClient]  = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [form, setForm]   = useState(initForm({} as Client));
  const [saving, setSaving] = useState(false);
  const [saved,   setSaved]  = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const [anamneseForm, setAnamneseForm] = useState<AnamneseForm>(emptyAnamneseForm());
  const [anamneseLoading, setAnamneseLoading] = useState(false);

  const [acquiredApproaches, setAcquiredApproaches] = useState<string[]>([]);
  const [loadingApproaches,  setLoadingApproaches]  = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/therapist-approaches?therapistId=${user.id}`)
      .then(r => r.json())
      .then(d => setAcquiredApproaches(d.approaches ?? []))
      .catch(() => {})
      .finally(() => setLoadingApproaches(false));
  }, [user]);

  const acquiredOptions = ALL_APPROACHES.filter(a => acquiredApproaches.includes(a.value));
  const currentNotAcquired = client && form.approach && !acquiredOptions.some(a => a.label === form.approach)
    ? ALL_APPROACHES.find(a => a.label === form.approach)
    : null;
  const APPROACHES = currentNotAcquired ? [...acquiredOptions, currentNotAcquired] : acquiredOptions;

  useEffect(() => {
    getClient(id)
      .then(c => { setClient(c); setForm(initForm(c)); })
      .catch(e => setLoadErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!client) return;
    if (client.anamnese_id) {
      setAnamneseLoading(true);
      fetch(`/api/anamnese/${client.anamnese_id}`)
        .then(r => r.json())
        .then(d => {
          if (d.anamnese) {
            const a = d.anamnese;
            setAnamneseForm({
              cpf: a.cpf ?? "",
              emergency_contact: a.emergency_contact ?? "",
              how_found: a.how_found ?? "", conditions: a.conditions ?? [],
              latex_allergy: a.latex_allergy ?? false, oil_allergy: a.oil_allergy ?? "",
              medication: a.medication ?? "", emotional_state: a.emotional_state ?? "",
              body_pain: a.body_pain ?? "", intention: a.intention ?? "",
              sexual_discomfort: a.sexual_discomfort ?? "",
            });
          }
        })
        .finally(() => setAnamneseLoading(false));
    } else {
      setAnamneseForm(prev => ({
        ...prev,
        emergency_contact: client.emergency_contact ?? "",
      }));
    }
  }, [client]);

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }));
  }
  function toggleVulnerability(v: string) {
    setForm(p => ({
      ...p,
      vulnerability: p.vulnerability.includes(v)
        ? p.vulnerability.filter(x => x !== v)
        : [...p.vulnerability, v],
    }));
  }

  function setAF(key: keyof AnamneseForm, value: string | boolean | string[]) {
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

  async function saveAnamnese() {
    if (!client || !user) return;
    if (client.anamnese_id) {
      await fetch(`/api/anamnese/${client.anamnese_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(anamneseForm),
      });
    } else {
      const res = await fetch("/api/anamnese/create-for-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ therapistId: user.id, clientId: client.id, ...anamneseForm }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = await getClient(id);
        setClient(updated);
      }
    }
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true); setSaveErr(null);
    const selectedApproach = APPROACHES.find(a => a.label === form.approach);
    const statusValue = STATUS_OPTS.find(s => s.label === form.status)?.value ?? form.status;
    try {
      await updateClient(id, {
        name:              form.name.trim(),
        email:             form.email || null,
        phone:             form.phone || null,
        birth_date:        form.birthDate || null,
        occupation:        form.occupation || null,
        approach:          selectedApproach?.value ?? null,
        approach_label:    selectedApproach?.label ?? null,
        status:            statusValue,
        session_frequency: form.frequency,
        session_duration:  parseInt(form.duration),
        main_demand:       form.mainDemand.trim() || null,
        notes:             form.notes.trim() || null,
        emergency_contact: form.emergencyContact.trim() || null,
      });
      const hasAnamneseInput = client?.anamnese_id || Object.entries(anamneseForm).some(([k, v]) =>
        k === "conditions" ? (v as string[]).length > 0 : typeof v === "string" ? v.trim() : v
      );
      if (hasAnamneseInput) {
        await saveAnamnese();
      }
      setSaved(true);
      setTimeout(() => router.push(`/dashboard/clients/${id}`), 1200);
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : "Erro ao salvar");
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
    </div>
  );

  if (loadErr || !client) return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <p className="text-gray-400 mb-4">{loadErr ?? "Cliente não encontrado."}</p>
      <Link href="/dashboard/clients" className="text-brand-500 hover:underline text-sm font-medium">
        ← Voltar para clientes
      </Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <Link href={`/dashboard/clients/${id}`}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-ink">Editar Cliente</h1>
          <p className="text-gray-500 text-sm">{client.name}</p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
          <Mic className="w-3.5 h-3.5" />
          Campos aceitam voz
        </div>
      </div>

      <Section icon={User} title="Dados pessoais">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <VoiceInput label="Nome completo" required value={form.name} onChange={v => set("name", v)} />
          </div>
          <Field label="Data de nascimento">
            <input type="date" value={form.birthDate} onChange={e => set("birthDate", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Status">
            <SelectField value={STATUS_OPTS.find(s => s.value === form.status)?.label ?? form.status}
              onChange={v => set("status", STATUS_OPTS.find(s => s.label === v)?.value ?? v)}
              options={STATUS_OPTS.map(s => s.label)} />
          </Field>
          <Field label="E-mail">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="email@exemplo.com" className={inputCls + " pl-9"} />
            </div>
          </Field>
          <Field label="Telefone / WhatsApp">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={form.phone} onChange={e => set("phone", maskPhone(e.target.value))}
                placeholder="(11) 99999-9999" className={inputCls + " pl-9"} />
            </div>
          </Field>
          <VoiceInput label="Profissão / Ocupação" value={form.occupation} onChange={v => set("occupation", v)}
            placeholder="Ex: Designer, Engenheiro..." />
        </div>
      </Section>

      <Section icon={Heart} title="Configuração clínica">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Abordagem terapêutica" required>
            {loadingApproaches ? (
              <div className={inputCls + " flex items-center text-gray-400"}>Carregando...</div>
            ) : (
              <SelectField value={form.approach} onChange={v => set("approach", v)} options={APPROACHES.map(a => a.label)} />
            )}
          </Field>
          <Field label="Frequência">
            <SelectField value={form.frequency} onChange={v => set("frequency", v)} options={FREQUENCIES} />
          </Field>
          <Field label="Duração (min)">
            <SelectField value={form.duration} onChange={v => set("duration", v)} options={DURATIONS} />
          </Field>
        </div>
      </Section>

      <Section icon={FileText} title="Prontuário">
        <VoiceTextarea label="Demanda principal" required rows={3}
          value={form.mainDemand} onChange={v => set("mainDemand", v)}
          placeholder="Motivo da busca por terapia, queixas principais..." />
        <VoiceTextarea label="Observações clínicas" rows={3}
          value={form.notes} onChange={v => set("notes", v)}
          placeholder="Impressões, hipóteses iniciais, aspectos relevantes..." />
      </Section>

      <Section icon={AlertTriangle} title="Contato de emergência">
        <VoiceInput label="Nome e telefone" value={form.emergencyContact} onChange={v => set("emergencyContact", v)}
          placeholder="Ex: João Silva (irmão) — (11) 99999-9999" />
      </Section>

      <Section icon={ClipboardList} title="Anamnese">
        {anamneseLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-xs text-gray-400 -mt-1">
              Nome, e-mail, telefone e data de nascimento usados na anamnese são os mesmos do cadastro do cliente, na seção "Dados pessoais" acima.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="CPF">
                <input value={anamneseForm.cpf} onChange={e => setAF("cpf", maskCpf(e.target.value))} className={inputCls} placeholder="000.000.000-00" />
              </Field>
              <Field label="Contato de emergência">
                <input value={anamneseForm.emergency_contact} onChange={e => setAF("emergency_contact", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Como chegou até você">
                <SelectField value={anamneseForm.how_found} onChange={v => setAF("how_found", v)} options={HOW_FOUND_OPTIONS} />
              </Field>
            </div>

            <Field label="Condições de saúde">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {CONDITIONS.map(c => (
                  <label key={c} className="flex items-center gap-2.5 cursor-pointer group">
                    <div onClick={() => toggleAFCondition(c)}
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                        anamneseForm.conditions.includes(c) ? "border-brand-500 bg-brand-500" : "border-gray-300 group-hover:border-brand-300"
                      )}>
                      {anamneseForm.conditions.includes(c) && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <polyline points="1.5 5 4 7.5 8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-700">{c}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Tem alergia a látex?">
              <div className="flex gap-4">
                {[true, false].map(v => (
                  <label key={String(v)} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={anamneseForm.latex_allergy === v}
                      onChange={() => setAF("latex_allergy", v)} className="accent-brand-600" />
                    <span className="text-sm">{v ? "Sim" : "Não"}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Alergia a óleo de massagem">
              <input value={anamneseForm.oil_allergy} onChange={e => setAF("oil_allergy", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Medicamentos em uso">
              <textarea rows={2} value={anamneseForm.medication} onChange={e => setAF("medication", e.target.value)} className={inputCls + " resize-none"} />
            </Field>
            <Field label="Estado emocional atual">
              <textarea rows={3} value={anamneseForm.emotional_state} onChange={e => setAF("emotional_state", e.target.value)} className={inputCls + " resize-none"} />
            </Field>
            <Field label="Dor no corpo">
              <textarea rows={2} value={anamneseForm.body_pain} onChange={e => setAF("body_pain", e.target.value)} className={inputCls + " resize-none"} />
            </Field>
            <Field label="Intenção com a sessão / processo">
              <textarea rows={3} value={anamneseForm.intention} onChange={e => setAF("intention", e.target.value)} className={inputCls + " resize-none"} />
            </Field>
            <Field label="Incômodo na vida sexual">
              <textarea rows={2} value={anamneseForm.sexual_discomfort} onChange={e => setAF("sexual_discomfort", e.target.value)} className={inputCls + " resize-none"} />
            </Field>
          </div>
        )}
      </Section>

      <Section icon={Info} title="Sigilo, consentimento e LGPD">
        <div className="space-y-3">
          <Checkbox checked={form.pseudonymized} onChange={v => setForm(p => ({ ...p, pseudonymized: v }))}>
            <strong>Pseudonimização ativa</strong> — o nome real não será exibido nas interações com a IA.
          </Checkbox>
          <Checkbox checked={form.lgpdConsent} onChange={v => setForm(p => ({ ...p, lgpdConsent: v }))}>
            TCLE obtido — consentimento LGPD confirmado <span className="text-gray-400 text-xs">(Res. CFP nº 21/2025)</span>
          </Checkbox>
        </div>
      </Section>

      {saveErr && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{saveErr}</div>
      )}

      <div className="flex items-center gap-3 pb-6">
        <Link href={`/dashboard/clients/${id}`}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          Cancelar
        </Link>
        <button onClick={handleSave} disabled={!form.name.trim() || saving || saved}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
            saved ? "bg-green-500 text-white"
              : form.name.trim() && !saving ? "bg-brand-500 hover:bg-brand-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}>
          {saved   ? <><CheckCircle2 className="w-4 h-4" /> Salvo! Redirecionando...</>
          : saving  ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
          :           <><Save className="w-4 h-4" /> Salvar alterações</>}
        </button>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50 bg-gray-50/50">
        <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
        </div>
        <p className="text-sm font-semibold text-gray-700">{title}</p>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function SelectField({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 appearance-none pr-9 text-gray-800">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div onClick={() => onChange(!checked)}
        className={cn(
          "w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors",
          checked ? "border-brand-500 bg-brand-500" : "border-gray-300 group-hover:border-brand-300"
        )}>
        {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="1.5 5 4 7.5 8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <span className="text-sm text-gray-700 leading-relaxed">{children}</span>
    </label>
  );
}
