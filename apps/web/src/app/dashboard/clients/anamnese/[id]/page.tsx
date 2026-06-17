"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Loader2, CheckCircle2,
  Heart, FileText,
  ChevronDown, AlertTriangle, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient, generateInitials, generateColor } from "@/lib/db";
import { useAuthStore } from "@/store/auth.store";

/* ── Tipos ── */
interface Anamnese {
  id: string; therapist_id: string;
  name: string; email: string; phone: string | null; cpf: string | null;
  birth_date: string | null; emergency_contact: string | null;
  how_found: string | null; accepts_email: boolean;
  conditions: string[]; latex_allergy: boolean;
  oil_allergy: string | null; medication: string | null;
  emotional_state: string | null; body_pain: string | null;
  intention: string | null; sexual_discomfort: string | null;
  consent_nudity: boolean; consent_touch: boolean;
  consent_therapeutic: boolean; consent_payment: boolean;
  status: string; created_at: string;
}

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

const inputCls = "w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent text-gray-800 placeholder-gray-400";

/* ── Helpers de UI ── */
function Section({ icon: Icon, title, children, accent }: {
  icon: React.ElementType; title: string; children: React.ReactNode; accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={cn("flex items-center gap-2.5 px-5 py-4 border-b border-gray-50", accent ?? "bg-gray-50/50")}>
        <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
        </div>
        <p className="text-sm font-semibold text-gray-700">{title}</p>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  );
}

function SelectField({ value, onChange, placeholder, options }: {
  value: string; onChange: (v: string) => void; placeholder?: string; options: string[];
}) {
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


/* ── Página ── */
export default function AnamneseReviewPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { user } = useAuthStore();

  const [anamnese, setAnamnese] = useState<Anamnese | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({
    approach: "", frequency: "Semanal", duration: "50",
    mainDemand: "", notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/anamnese/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.anamnese) {
          setAnamnese(d.anamnese);
          if (d.anamnese.intention) {
            setForm(prev => ({ ...prev, mainDemand: d.anamnese.intention }));
          }
        } else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const selectedApproach = APPROACHES.find(a => a.label === form.approach);
  const canSave = form.approach;

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }));
  }

  async function handleSave() {
    if (!canSave || !user || !anamnese) return;
    setSaving(true); setError(null);
    try {
      await createClient({
        therapist_id:      user.id,
        name:              anamnese.name,
        email:             anamnese.email || null,
        phone:             anamnese.phone || null,
        birth_date:        anamnese.birth_date || null,
        occupation:        null,
        approach:          selectedApproach?.value ?? null,
        approach_label:    selectedApproach?.label ?? null,
        status:            "ACTIVE",
        session_frequency: form.frequency,
        session_duration:  parseInt(form.duration),
        referral:          anamnese.how_found || null,
        main_demand:       form.mainDemand.trim() || anamnese.intention || null,
        notes:             form.notes.trim() || null,
        emergency_contact: anamnese.emergency_contact || null,
        initials:          generateInitials(anamnese.name),
        color:             generateColor(anamnese.name),
        total_sessions:    0,
      });

      await fetch(`/api/anamnese/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      });

      setSaved(true);
      setTimeout(() => router.push("/dashboard/clients"), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="max-w-3xl mx-auto text-center py-20">
      <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" strokeWidth={1.5} />
      <p className="text-gray-600 font-medium">Anamnese não encontrada.</p>
      <Link href="/dashboard/clients" className="mt-4 inline-block text-sm text-brand-500 underline">Voltar</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/clients" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-ink">Anamnese — {anamnese?.name}</h1>
          <p className="text-gray-500 text-sm">Revise os dados e salve para aceitar o cliente</p>
        </div>
      </div>

      {/* Dados da anamnese — leitura */}
      <Section icon={ClipboardList} title="Dados preenchidos pelo paciente" accent="bg-amber-50/60">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReadOnly label="Nome" value={anamnese?.name} />
          <ReadOnly label="E-mail" value={anamnese?.email} />
          <ReadOnly label="Telefone" value={anamnese?.phone} />
          <ReadOnly label="CPF" value={anamnese?.cpf} />
          <ReadOnly label="Data de nascimento"
            value={anamnese?.birth_date ? new Date(anamnese.birth_date).toLocaleDateString("pt-BR") : null} />
          <ReadOnly label="Contato de emergência" value={anamnese?.emergency_contact} />
          <ReadOnly label="Como chegou" value={anamnese?.how_found} />
        </div>

        {anamnese?.conditions && anamnese.conditions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1.5">Condições de saúde</p>
            <div className="flex flex-wrap gap-1.5">
              {anamnese.conditions.map(c => (
                <span key={c} className="text-xs bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-full">{c}</span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReadOnly label="Medicamentos" value={anamnese?.medication} />
          <ReadOnly label="Alergia a óleos" value={anamnese?.oil_allergy} />
          {anamnese?.latex_allergy && (
            <div><p className="text-xs font-semibold text-red-400">Alergia a latex</p></div>
          )}
          <ReadOnly label="Estado emocional" value={anamnese?.emotional_state} />
          <ReadOnly label="Dor no corpo" value={anamnese?.body_pain} />
          <ReadOnly label="Incômodo sexual" value={anamnese?.sexual_discomfort} />
        </div>

        {anamnese?.intention && (
          <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-brand-600 mb-1">Intenção da sessão</p>
            <p className="text-sm text-brand-900 italic">"{anamnese.intention}"</p>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1.5">Consentimentos</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Nudez",        ok: anamnese?.consent_nudity },
              { label: "Toque",        ok: anamnese?.consent_touch },
              { label: "Terapêutico",  ok: anamnese?.consent_therapeutic },
              { label: "Pagamento",    ok: anamnese?.consent_payment },
            ].map(({ label, ok }) => (
              <span key={label} className={cn("text-xs px-2.5 py-1 rounded-full border font-medium",
                ok ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-400 border-gray-200")}>
                {ok ? "✓" : "✗"} {label}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* Campos do terapeuta */}
      <Section icon={Heart} title="Configuração clínica">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Abordagem terapêutica *" className="md:col-span-1">
            <SelectField value={form.approach} onChange={v => set("approach", v)}
              placeholder="Selecionar..." options={APPROACHES.map(a => a.label)} />
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
        <Field label="Demanda principal">
          <textarea rows={3} value={form.mainDemand}
            onChange={e => set("mainDemand", e.target.value)}
            placeholder="Contextualize a demanda clínica do paciente..."
            className={inputCls + " resize-none"} />
        </Field>
        <Field label="Observações clínicas iniciais">
          <textarea rows={3} value={form.notes}
            onChange={e => set("notes", e.target.value)}
            placeholder="Impressões da triagem, hipóteses iniciais..."
            className={inputCls + " resize-none"} />
        </Field>
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
            saved ? "bg-green-500 text-white"
            : canSave && !saving ? "bg-brand-500 hover:bg-brand-600 text-white shadow-sm"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}>
          {saved   ? <><CheckCircle2 className="w-4 h-4" /> Cliente aceito! Redirecionando...</>
          : saving  ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
          :           <><Save className="w-4 h-4" /> Aceitar e salvar cliente</>}
        </button>
      </div>
    </div>
  );
}
