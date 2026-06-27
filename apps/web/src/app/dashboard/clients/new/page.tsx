"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Loader2, CheckCircle2,
  User, Phone, Mail, Heart, FileText,
  ChevronDown, AlertTriangle, Mic, ShieldAlert, Info, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceInput, VoiceTextarea } from "@/components/ui/VoiceField";
import { createClient, generateInitials, generateColor } from "@/lib/db";
import { useAuthStore } from "@/store/auth.store";

const APPROACHES = [
  { value: "PSYCHOANALYSIS",        label: "Psicanálise" },
  { value: "COGNITIVE_BEHAVIORAL",  label: "TCC" },
  { value: "JUNGIAN",               label: "Junguiana" },
  { value: "HUMANISTIC",            label: "Humanista" },
  { value: "SYSTEMIC",              label: "Sistêmica" },
  { value: "SOMATIC",               label: "Somática" },
  { value: "GESTALT",               label: "Gestalt" },
  { value: "ACCEPTANCE_COMMITMENT", label: "ACT" },
];

const PURCHASABLE_BASES = [
  { key: "PSYCHOANALYSIS",       label: "Psicanálise Freudiana" },
  { key: "COGNITIVE_BEHAVIORAL", label: "TCC" },
  { key: "JUNGIAN",              label: "Junguiana" },
  { key: "SOMATIC",              label: "Somática / Corporal" },
  { key: "GESTALT",              label: "Gestalt-terapia" },
  { key: "PSYCHODRAMA",          label: "Psicodrama" },
  { key: "SYSTEMIC",             label: "Constelação Familiar" },
];

const FREQUENCIES = ["Semanal","Quinzenal","Mensal","Sob demanda"];
const DURATIONS   = ["45","50","60","90"];
const REFERRALS   = ["Busca própria","Indicação de paciente","Indicação de médico/psiquiatra","Plataforma online","Redes sociais","Outro"];

export default function NewClientPage() {
  const router     = useRouter();
  const { user }   = useAuthStore();

  const [form, setForm] = useState({
    name: "", email: "", phone: "", birthDate: "", occupation: "",
    approach: "", frequency: "Semanal", duration: "50", referral: "",
    mainDemand: "", notes: "", emergencyContact: "",
    vulnerability: [] as string[],
    purchasedApproaches: [] as string[],
    lgpdConsent: false, pseudonymized: false,
  });

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const selectedApproach = APPROACHES.find(a => a.label === form.approach);
  const canSave = form.name.trim() && form.approach && form.mainDemand.trim() && form.lgpdConsent;

  function toggleVulnerability(v: string) {
    setForm(p => ({
      ...p,
      vulnerability: p.vulnerability.includes(v)
        ? p.vulnerability.filter(x => x !== v)
        : [...p.vulnerability, v],
    }));
  }

  function toggleBase(key: string) {
    setForm(p => ({
      ...p,
      purchasedApproaches: p.purchasedApproaches.includes(key)
        ? p.purchasedApproaches.filter(k => k !== key)
        : [...p.purchasedApproaches, key],
    }));
  }
  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }));
  }

  async function handleSave() {
    if (!canSave || !user) return;
    setSaving(true); setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (createClient as any)({
        therapist_id:         user.id,
        name:                 form.name.trim(),
        email:                form.email || null,
        phone:                form.phone || null,
        birth_date:           form.birthDate || null,
        occupation:           form.occupation || null,
        approach:             selectedApproach?.value ?? null,
        approach_label:       selectedApproach?.label ?? null,
        status:               "ACTIVE",
        session_frequency:    form.frequency,
        session_duration:     parseInt(form.duration),
        referral:             form.referral || null,
        main_demand:          form.mainDemand.trim() || null,
        notes:                form.notes.trim() || null,
        emergency_contact:    form.emergencyContact.trim() || null,
        initials:             generateInitials(form.name),
        color:                generateColor(form.name),
        total_sessions:       0,
        purchased_approaches: form.purchasedApproaches,
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
        <Link href="/dashboard/clients" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-ink">Novo Cliente</h1>
          <p className="text-gray-500 text-sm">Cadastro e configuração inicial</p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
          <Mic className="w-3.5 h-3.5" />
          Campos aceitam voz
        </div>
      </div>

      <Section icon={User} title="Dados pessoais">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <VoiceInput label="Nome completo" required value={form.name} onChange={v => set("name", v)} placeholder="Nome do paciente" />
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
              <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(11) 99999-9999" className={inputCls + " pl-9"} />
            </div>
          </Field>
          <VoiceInput label="Profissão / Ocupação" value={form.occupation} onChange={v => set("occupation", v)} placeholder="Ex: Designer, Engenheiro..." />
          <Field label="Como chegou até você">
            <SelectField value={form.referral} onChange={v => set("referral", v)} placeholder="Selecionar..." options={REFERRALS} />
          </Field>
        </div>
      </Section>

      <Section icon={Heart} title="Configuração clínica">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Abordagem terapêutica" required className="md:col-span-1">
            <SelectField value={form.approach} onChange={v => set("approach", v)} placeholder="Selecionar..." options={APPROACHES.map(a => a.label)} />
          </Field>
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

      <Section icon={ShieldAlert} title="Situação de vulnerabilidade">
        <p className="text-xs text-gray-500 leading-relaxed mb-3">
          Conforme a <strong>Res. CFP nº 21/2025</strong>, casos envolvendo pessoas em situação de vulnerabilidade requerem atenção ética redobrada. Marque se aplicável:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {["Criança ou adolescente","Idoso(a)","Crise psíquica aguda","Situação de violência","Condição socioeconômica vulnerável","Privação de liberdade","Deficiência / necessidade especial","Outro"].map(v => (
            <button key={v} type="button" onClick={() => toggleVulnerability(v)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium text-left transition-colors",
                form.vulnerability.includes(v) ? "border-amber-400 bg-amber-50 text-amber-800" : "border-gray-200 bg-white text-gray-600 hover:border-amber-200 hover:bg-amber-50/50"
              )}>
              <span className={cn("w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center",
                form.vulnerability.includes(v) ? "border-amber-500 bg-amber-500" : "border-gray-300")}>
                {form.vulnerability.includes(v) && (
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><polyline points="1.5 5 4 7.5 8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </span>
              {v}
            </button>
          ))}
        </div>
        {form.vulnerability.length > 0 && (
          <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
            <span>Este caso está marcado como vulnerabilidade. O IDEAh sinalizará isso durante o raciocínio clínico.</span>
          </div>
        )}
      </Section>

      <Section icon={BookOpen} title="Bases de conhecimento adquiridas">
        <p className="text-xs text-gray-500 leading-relaxed">
          Selecione as abordagens teóricas que este terapeuta adquiriu. Apenas as bases selecionadas estarão disponíveis na supervisão.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
          {PURCHASABLE_BASES.map(b => {
            const on = form.purchasedApproaches.includes(b.key);
            return (
              <button key={b.key} type="button" onClick={() => toggleBase(b.key)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-colors",
                  on ? "border-indigo-400 bg-indigo-50 text-indigo-800" : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/50"
                )}>
                <span className={cn(
                  "w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center",
                  on ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
                )}>
                  {on && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><polyline points="1.5 5 4 7.5 8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </span>
                {b.label}
              </button>
            );
          })}
        </div>
        {form.purchasedApproaches.length === 0 && (
          <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Nenhuma base selecionada — o terapeuta não terá acesso à supervisão por abordagem.
          </p>
        )}
      </Section>

      <Section icon={Info} title="Sigilo, consentimento e LGPD">
        <div className="space-y-3">
          <Checkbox checked={form.pseudonymized} onChange={v => setForm(p => ({ ...p, pseudonymized: v }))}>
            <strong>Pseudonimização ativa</strong> — o nome real da pessoa atendida não será exibido nas interações com a IA.
          </Checkbox>
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
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
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
