"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Loader2, CheckCircle2,
  User, Phone, Mail, Heart, FileText,
  ChevronDown, AlertTriangle, Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceInput, VoiceTextarea } from "@/components/ui/VoiceField";

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

const FREQUENCIES = ["Semanal", "Quinzenal", "Mensal", "Sob demanda"];
const DURATIONS   = ["45", "50", "60", "90"];
const REFERRALS   = ["Busca própria", "Indicação de paciente", "Indicação de médico/psiquiatra", "Plataforma online", "Redes sociais", "Outro"];

export default function NewClientPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    occupation: "",
    approach: "",
    frequency: "Semanal",
    duration: "50",
    referral: "",
    mainDemand: "",
    notes: "",
    emergencyContact: "",
  });

  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const canSave = form.name.trim() && form.approach && form.mainDemand.trim();

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    setTimeout(() => router.push("/dashboard/clients"), 1200);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
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

      {/* ── Identificação ── */}
      <Section icon={User} title="Dados pessoais">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <VoiceInput label="Nome completo" required
              value={form.name} onChange={(v) => set("name", v)}
              placeholder="Nome do paciente" />
          </div>
          <Field label="Data de nascimento">
            <input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)}
              className={inputCls} />
          </Field>
          <Field label="E-mail">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={form.email} onChange={(e) => set("email", e.target.value)}
                placeholder="email@exemplo.com" className={inputCls + " pl-9"} />
            </div>
          </Field>
          <Field label="Telefone / WhatsApp">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
                placeholder="(11) 99999-9999" className={inputCls + " pl-9"} />
            </div>
          </Field>
          <VoiceInput label="Profissão / Ocupação"
            value={form.occupation} onChange={(v) => set("occupation", v)}
            placeholder="Ex: Designer, Engenheiro..." />
          <Field label="Como chegou até você">
            <SelectField value={form.referral} onChange={(v) => set("referral", v)}
              placeholder="Selecionar..." options={REFERRALS} />
          </Field>
        </div>
      </Section>

      {/* ── Configuração clínica ── */}
      <Section icon={Heart} title="Configuração clínica">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Abordagem terapêutica" required className="md:col-span-1">
            <SelectField value={form.approach} onChange={(v) => set("approach", v)}
              placeholder="Selecionar..." options={APPROACHES.map((a) => a.label)} />
          </Field>
          <Field label="Frequência das sessões">
            <SelectField value={form.frequency} onChange={(v) => set("frequency", v)}
              options={FREQUENCIES} />
          </Field>
          <Field label="Duração (minutos)">
            <SelectField value={form.duration} onChange={(v) => set("duration", v)}
              options={DURATIONS} />
          </Field>
        </div>
      </Section>

      {/* ── Demanda e prontuário ── */}
      <Section icon={FileText} title="Prontuário inicial">
        <VoiceTextarea label="Demanda principal" required rows={3}
          value={form.mainDemand} onChange={(v) => set("mainDemand", v)}
          placeholder="Descreva brevemente o motivo da busca por terapia, queixas principais, contexto..." />
        <VoiceTextarea label="Observações clínicas iniciais" rows={3}
          value={form.notes} onChange={(v) => set("notes", v)}
          placeholder="Impressões da triagem, aspectos de personalidade observados, hipóteses iniciais..." />
      </Section>

      {/* ── Contato de emergência ── */}
      <Section icon={AlertTriangle} title="Contato de emergência">
        <VoiceInput label="Nome e telefone"
          value={form.emergencyContact} onChange={(v) => set("emergencyContact", v)}
          placeholder="Ex: João Silva (irmão) — (11) 99999-9999" />
        <p className="text-xs text-gray-400 mt-1 flex items-start gap-1">
          <span>Informação confidencial — utilizada apenas em situações de risco.</span>
        </p>
      </Section>

      {/* Aviso LGPD */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 text-xs text-blue-700 leading-relaxed">
        <p className="font-semibold mb-1">📋 Proteção de dados (LGPD)</p>
        Certifique-se de ter obtido o consentimento do paciente para armazenar seus dados.
        Recomendamos o uso de Termo de Consentimento Livre e Esclarecido (TCLE) conforme orientações do CFP.
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3 pb-6">
        <Link href="/dashboard/clients"
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          Cancelar
        </Link>
        <button onClick={handleSave} disabled={!canSave || saving || saved}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
            saved ? "bg-green-500 text-white"
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

/* ── Helpers de estilo ── */
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

function SelectField({ value, onChange, placeholder, options }: {
  value: string; onChange: (v: string) => void; placeholder?: string; options: string[];
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={inputCls + " appearance-none pr-9 " + (!value ? "text-gray-400" : "text-gray-800")}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
