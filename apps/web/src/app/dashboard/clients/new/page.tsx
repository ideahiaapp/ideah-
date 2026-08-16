"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Loader2, CheckCircle2,
  User, Phone, Mail, Heart, FileText,
  ChevronDown, AlertTriangle, Mic, ShieldAlert, Info,
  Link2, X, Copy, Check,
} from "lucide-react";
import { cn, maskPhone } from "@/lib/utils";
import { VoiceInput, VoiceTextarea } from "@/components/ui/VoiceField";
import { createClient, getClients, generateInitials, generateColor } from "@/lib/db";
import { useAuthStore } from "@/store/auth.store";
import type { Client } from "@/lib/database.types";

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

const FREQUENCIES = ["Semanal","Quinzenal","Mensal","Sob demanda"];
const DURATIONS   = ["45","50","60","90"];

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
          <p className="text-xs text-brand-600 mt-0.5">
            {mode === "new"
              ? "Novo cliente — o preenchimento é o pré-cadastro. Ao receber, você ativa como cliente."
              : "Cliente já cadastrado — os dados de cadastro já vêm preenchidos no link."}
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
          Novo cliente (pré-cadastro)
        </button>
        <button
          onClick={() => switchMode("existing")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
            mode === "existing" ? "bg-brand-500 text-white" : "text-brand-600 hover:bg-brand-50"
          )}
        >
          Cliente já cadastrado
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

      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        {mode === "existing" && (
          <div className="relative flex-1 min-w-0">
            <select
              value={selectedId}
              onChange={e => { setSelectedId(e.target.value); setEmailOpen(false); setEmailSent(false); setEmailError(null); }}
              aria-label="Selecionar cliente"
              className="w-full appearance-none pr-9 px-4 py-2.5 text-sm bg-white border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 text-gray-800"
            >
              <option value="">Selecionar cliente...</option>
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
            aria-label="E-mail do cliente"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="email@docliente.com"
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

export default function NewClientPage() {
  const router     = useRouter();
  const { user }   = useAuthStore();

  const [form, setForm] = useState({
    name: "", email: "", phone: "", birthDate: "", occupation: "",
    approaches: [] as string[], frequency: "Semanal", duration: "50",
    mainDemand: "", notes: "", emergencyContact: "",
    vulnerability: [] as string[],
    lgpdConsent: false, pseudonymized: false,
  });

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const [acquiredApproaches, setAcquiredApproaches] = useState<string[]>([]);
  const [loadingApproaches,  setLoadingApproaches]  = useState(true);

  const [existingClients, setExistingClients] = useState<Client[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/therapist-approaches?therapistId=${user.id}`)
      .then(r => r.json())
      .then(d => setAcquiredApproaches(d.approaches ?? []))
      .catch(() => {})
      .finally(() => setLoadingApproaches(false));

    getClients(user.id).then(setExistingClients).catch(() => {});
  }, [user]);

  const APPROACHES = ALL_APPROACHES.filter(a => acquiredApproaches.includes(a.value));

  const selectedApproaches = APPROACHES.filter(a => form.approaches.includes(a.label));
  const canSave = form.name.trim() && form.approaches.length > 0 && form.mainDemand.trim() && form.lgpdConsent;

  function toggleVulnerability(v: string) {
    setForm(p => ({
      ...p,
      vulnerability: p.vulnerability.includes(v)
        ? p.vulnerability.filter(x => x !== v)
        : [...p.vulnerability, v],
    }));
  }

  function toggleApproach(label: string) {
    setForm(p => ({
      ...p,
      approaches: p.approaches.includes(label)
        ? p.approaches.filter(x => x !== label)
        : [...p.approaches, label],
    }));
  }

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }));
  }

  async function handleSave() {
    if (!canSave || !user) return;
    setSaving(true); setError(null);
    try {
      await createClient({
        therapist_id:      user.id,
        name:              form.name.trim(),
        email:             form.email || null,
        phone:             form.phone || null,
        birth_date:        form.birthDate || null,
        occupation:        form.occupation || null,
        approach:          selectedApproaches[0]?.value ?? null,
        approach_label:    selectedApproaches[0]?.label ?? null,
        approaches:        selectedApproaches.map(a => a.value),
        status:            "ACTIVE",
        session_frequency: form.frequency,
        session_duration:  parseInt(form.duration),
        main_demand:       form.mainDemand.trim() || null,
        notes:             form.notes.trim() || null,
        emergency_contact: form.emergencyContact.trim() || null,
        initials:          generateInitials(form.name),
        color:             generateColor(form.name),
        total_sessions:    0,
      });
      setSaved(true);
      setTimeout(() => router.push("/dashboard/clients"), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <Link href="/dashboard/clients" aria-label="Voltar" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-ink">Novo Cliente</h1>
          <p className="text-gray-500 text-sm">Cadastro e configuração inicial</p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
          <Mic className="w-3.5 h-3.5" />
          Campos aceitam voz
        </div>
      </div>

      <Section icon={User} title="Dados pessoais">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <VoiceInput label="Nome completo" required value={form.name} onChange={v => set("name", v)} placeholder="Nome do cliente" />
          </div>
          <Field label="Data de nascimento">
            <input type="date" value={form.birthDate} onChange={e => set("birthDate", e.target.value)} className={inputCls} />
          </Field>
          <Field label="E-mail">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@exemplo.com" className={inputCls + " pl-9"} />
            </div>
          </Field>
          <Field label="Telefone / WhatsApp">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={form.phone} onChange={e => set("phone", maskPhone(e.target.value))} placeholder="(11) 99999-9999" className={inputCls + " pl-9"} />
            </div>
          </Field>
          <VoiceInput label="Profissão / Ocupação" value={form.occupation} onChange={v => set("occupation", v)} placeholder="Ex: Designer, Engenheiro..." />
        </div>
      </Section>

      <Section icon={Heart} title="Configuração clínica">
        <Field label="Abordagem terapêutica (selecione uma ou mais)" required>
          {loadingApproaches ? (
            <div className={inputCls + " flex items-center text-gray-400"}>Carregando...</div>
          ) : APPROACHES.length === 0 ? (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              Nenhuma base teórica adquirida. Acesse Configurações → Minhas Bases.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {APPROACHES.map(a => {
                const active = form.approaches.includes(a.label);
                return (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => toggleApproach(a.label)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors",
                      active
                        ? "bg-brand-500 border-brand-500 text-white"
                        : "bg-white border-gray-200 text-gray-600 hover:border-brand-300"
                    )}>
                    {a.label}
                  </button>
                );
              })}
            </div>
          )}
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Frequência das sessões">
            <SelectField value={form.frequency} onChange={v => set("frequency", v)} options={FREQUENCIES} />
          </Field>
          <Field label="Duração (minutos)">
            <SelectField value={form.duration} onChange={v => set("duration", v)} options={DURATIONS} />
          </Field>
        </div>
      </Section>

      <Section icon={FileText} title="Prontuário inicial">
        <VoiceTextarea label="Demanda principal" required rows={3} value={form.mainDemand} onChange={v => set("mainDemand", v)}
          placeholder="Descreva brevemente o motivo da busca por terapia, queixas principais, contexto..." />
        <VoiceTextarea label="Observações clínicas iniciais" rows={3} value={form.notes} onChange={v => set("notes", v)}
          placeholder="Impressões da triagem, aspectos de personalidade observados, hipóteses iniciais..." />
      </Section>

      <Section icon={AlertTriangle} title="Contato de emergência">
        <VoiceInput label="Nome e telefone" value={form.emergencyContact} onChange={v => set("emergencyContact", v)}
          placeholder="Ex: João Silva (irmão) — (11) 99999-9999" />
        <p className="text-xs text-gray-400 mt-1">Informação confidencial — utilizada apenas em situações de risco iminente.</p>
      </Section>

      <Section icon={Info} title="Sigilo, consentimento e LGPD">
        <div className="space-y-3">
          <Checkbox checked={form.lgpdConsent} onChange={v => setForm(p => ({ ...p, lgpdConsent: v }))}>
            <strong className="text-red-500">*</strong> Confirmo que obtive o{" "}
            <strong>Consentimento Livre e Esclarecido (TCLE)</strong> para armazenamento e uso dos dados, conforme a <strong>LGPD</strong> e a <strong>Res. CFP nº 21/2025</strong>.
          </Checkbox>
        </div>
        {!form.lgpdConsent && (
          <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />O consentimento LGPD é obrigatório para salvar o cadastro.
          </p>
        )}
      </Section>

      {user && <AnamneseLinkCard therapistId={user.id} clients={existingClients} />}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="flex items-center gap-3 pb-6">
        <Link href="/dashboard/clients"
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          Cancelar
        </Link>
        <button onClick={handleSave} disabled={!canSave || saving || saved}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
            saved    ? "bg-green-500 text-white"
            : canSave && !saving ? "bg-brand-500 hover:bg-brand-600 text-white shadow-sm"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}>
          {saved   ? <><CheckCircle2 className="w-4 h-4" /> Salvo! Redirecionando...</>
          : saving  ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
          :           <><Save className="w-4 h-4" /> Salvar cliente</>}
        </button>
      </div>
    </div>
  );
}

/* ── Helpers ── */
const inputCls = "w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent text-gray-800 placeholder-gray-400";

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

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-600">
        <div className="mb-1.5">{label} {required && <span className="text-red-400">*</span>}</div>
        <div className="font-normal normal-case">{children}</div>
      </label>
    </div>
  );
}

function SelectField({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder?: string; options: string[] }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className={inputCls + " appearance-none pr-9 " + (!value ? "text-gray-400" : "text-gray-800")}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
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
