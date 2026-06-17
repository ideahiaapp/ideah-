"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, AlertTriangle, Loader2, ChevronDown,
} from "lucide-react";
import Image from "next/image";

/* ─── Tipos ───────────────────────────────────────── */
type Therapist = { id: string; name: string; email: string };

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

const inputCls = "w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent placeholder-gray-400";
const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className={labelCls}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-purple-800 pb-2 border-b border-purple-100">{title}</h2>
      {children}
    </div>
  );
}

/* ─── Página ──────────────────────────────────────── */
export default function AnamnesePage() {
  const params = useParams();
  const therapistId = params.therapistId as string;

  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [loadingTherapist, setLoadingTherapist] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "", name: "", phone: "", cpf: "",
    birth_date: "", emergency_contact: "",
    how_found: "", accepts_email: true,
    conditions: [] as string[],
    latex_allergy: false, oil_allergy: "", medication: "",
    emotional_state: "", body_pain: "", intention: "", sexual_discomfort: "",
    consent_nudity: false, consent_touch: false,
    consent_therapeutic: false, consent_payment: false,
  });

  useEffect(() => {
    fetch(`/api/anamnese/therapist/${therapistId}`)
      .then(r => r.json())
      .then(d => {
        if (d.therapist) setTherapist(d.therapist);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingTherapist(false));
  }, [therapistId]);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function toggleCondition(c: string) {
    setForm(prev => ({
      ...prev,
      conditions: prev.conditions.includes(c)
        ? prev.conditions.filter(x => x !== c)
        : [...prev.conditions, c],
    }));
  }

  const canSubmit =
    form.name && form.email && form.intention &&
    form.consent_nudity && form.consent_touch &&
    form.consent_therapeutic && form.consent_payment;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/anamnese/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ therapistId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Loading ── */
  if (loadingTherapist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  /* ── Not found ── */
  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-purple-50 to-pink-50 px-4">
        <AlertTriangle className="w-12 h-12 text-amber-400" strokeWidth={1.5} />
        <h1 className="text-xl font-bold text-gray-700">Link inválido</h1>
        <p className="text-gray-500 text-sm text-center">Este link de anamnese não existe ou foi desativado.</p>
      </div>
    );
  }

  /* ── Sucesso ── */
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-purple-50 to-pink-50 px-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-500" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Anamnese enviada!</h1>
          <p className="text-gray-500 mt-2 max-w-sm leading-relaxed">
            Obrigado, <strong>{form.name}</strong>. Suas informações foram recebidas e
            {" "}<strong>{therapist?.name}</strong> entrará em contato em breve.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 max-w-sm text-center">
          <p className="text-sm font-semibold text-amber-800">Próximo passo</p>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            Realize o pagamento de 50% do valor via Pix para confirmar sua sessão.<br />
            <strong>Chave Pix:</strong> elimarcia.philos@gmail.com (Nubank — Elimárcia Aguiar Leite)
          </p>
        </div>
      </div>
    );
  }

  /* ── Formulário ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col items-center gap-3">
          <Image src="/ideah-logo.png" alt="IDEAh" width={72} height={72} className="rounded-2xl" />
          <span className="text-2xl font-bold text-purple-800">{therapist?.name}</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* Dados pessoais */}
        <Section title="Dados pessoais">
          <Field label="Nome completo" required>
            <input type="text" value={form.name} onChange={e => set("name", e.target.value)}
              className={inputCls} placeholder="Seu nome completo" />
          </Field>
          <Field label="Email" required>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
              className={inputCls} placeholder="seu@email.com" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Celular">
              <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                className={inputCls} placeholder="(11) 99999-9999" />
            </Field>
            <Field label="CPF">
              <input type="text" value={form.cpf} onChange={e => set("cpf", e.target.value)}
                className={inputCls} placeholder="000.000.000-00" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Data de nascimento">
              <input type="date" value={form.birth_date} onChange={e => set("birth_date", e.target.value)}
                className={inputCls} />
            </Field>
            <Field label="Contato de emergência">
              <input type="text" value={form.emergency_contact} onChange={e => set("emergency_contact", e.target.value)}
                className={inputCls} placeholder="Nome e telefone" />
            </Field>
          </div>
          <Field label="Como chegou até mim">
            <div className="relative">
              <select value={form.how_found} onChange={e => set("how_found", e.target.value)}
                className={inputCls + " appearance-none pr-9"}>
                <option value="">Selecione uma opção</option>
                {HOW_FOUND_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </Field>
          <Field label="Aceita receber emails">
            <div className="flex gap-4">
              {[true, false].map(v => (
                <label key={String(v)} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={form.accepts_email === v}
                    onChange={() => set("accepts_email", v)}
                    className="accent-purple-600" />
                  <span className="text-sm">{v ? "Sim" : "Não"}</span>
                </label>
              ))}
            </div>
          </Field>
        </Section>

        {/* Saúde */}
        <Section title="Saúde">
          <Field label="Marque as condições que você apresenta">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {CONDITIONS.map(c => (
                <label key={c} className="flex items-center gap-2.5 cursor-pointer group">
                  <div onClick={() => toggleCondition(c)}
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                      form.conditions.includes(c)
                        ? "border-purple-500 bg-purple-500"
                        : "border-gray-300 group-hover:border-purple-300"
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
          </Field>
          <Field label="Tem alergia a látex?">
            <div className="flex gap-4">
              {[true, false].map(v => (
                <label key={String(v)} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={form.latex_allergy === v}
                    onChange={() => set("latex_allergy", v)}
                    className="accent-purple-600" />
                  <span className="text-sm">{v ? "Sim" : "Não"}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Tem alergia a algum óleo de massagem? Qual?">
            <input type="text" value={form.oil_allergy} onChange={e => set("oil_allergy", e.target.value)}
              className={inputCls} placeholder="Descreva se houver" />
          </Field>
          <Field label="Toma algum medicamento? Se sim, qual o motivo?">
            <textarea value={form.medication} onChange={e => set("medication", e.target.value)}
              className={inputCls + " resize-none"} rows={2} placeholder="Descreva se houver" />
          </Field>
        </Section>

        {/* Estado emocional */}
        <Section title="Estado emocional e intenção">
          <Field label="Emocionalmente, como você está agora?">
            <textarea value={form.emotional_state} onChange={e => set("emotional_state", e.target.value)}
              className={inputCls + " resize-none"} rows={3}
              placeholder="Compartilhe como está se sentindo emocionalmente" />
          </Field>
          <Field label="Alguma dor no corpo que esteja lhe incomodando ou que seja recorrente? Se sim, onde?">
            <textarea value={form.body_pain} onChange={e => set("body_pain", e.target.value)}
              className={inputCls + " resize-none"} rows={2} placeholder="Descreva se houver" />
          </Field>
          <Field label="Qual sua intenção com essa sessão? O que busca alcançar/superar?" required>
            <textarea value={form.intention} onChange={e => set("intention", e.target.value)}
              className={inputCls + " resize-none"} rows={4}
              placeholder="Compartilhe sua intenção para esta sessão..." />
          </Field>
          <Field label="Você tem algum incômodo na sua vida sexual?">
            <textarea value={form.sexual_discomfort} onChange={e => set("sexual_discomfort", e.target.value)}
              className={inputCls + " resize-none"} rows={2} placeholder="Compartilhe se desejar" />
          </Field>
        </Section>

        {/* Consentimentos */}
        <Section title="Termos e consentimentos">
          <div className="space-y-4">
            {[
              {
                key: "consent_nudity" as const,
                title: "Nudez",
                text: "Tenho ciência que serei convidado(a) a me despir completamente e que essa nudez é consensual e opcional.",
              },
              {
                key: "consent_touch" as const,
                title: "Toques",
                text: "Tenho ciência de que na sessão poderão haver toques na pele, genitais (externos/internos), uso de vibrador externo e estímulo do prazer, sempre com consentimento do cliente.",
              },
              {
                key: "consent_therapeutic" as const,
                title: "Trabalho Terapêutico",
                text: "Estou ciente que o trabalho é 100% terapêutico e educativo, não há interação sexual, os toques são sempre unilaterais (do terapeuta/educador para o cliente), durante todo o tempo da sessão o terapeuta/educador fica vestido e os toques genitais são realizados com uso de luvas.",
              },
              {
                key: "consent_payment" as const,
                title: "Pagamento e compromisso",
                text: "Para expressar compromisso consigo mesmo no processo terapêutico, realizarei o pagamento de 50% do valor da sessão via Pix e enviarei o comprovante. Estou ciente que o prazo de desmarcação é de até 24 horas antes da sessão. Chave Pix: elimarcia.philos@gmail.com (Nubank — Elimárcia Aguiar Leite).",
              },
            ].map(item => (
              <label key={item.key}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors",
                  form[item.key]
                    ? "border-purple-400 bg-purple-50"
                    : "border-gray-200 hover:border-purple-200"
                )}>
                <div
                  onClick={() => set(item.key, !form[item.key])}
                  className={cn(
                    "w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors",
                    form[item.key] ? "border-purple-500 bg-purple-500" : "border-gray-300"
                  )}>
                  {form[item.key] && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <polyline points="1.5 5 4 7.5 8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.title} — Sim, estou ciente</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.text}</p>
                </div>
              </label>
            ))}
          </div>
        </Section>

        {/* Submit */}
        {submitError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        {!canSubmit && (
          <p className="text-xs text-gray-400 text-center">
            Preencha todos os campos obrigatórios (*) e confirme todos os termos para enviar.
          </p>
        )}

        <button type="submit" disabled={!canSubmit || submitting}
          className={cn(
            "w-full py-4 rounded-2xl text-base font-bold transition-all",
            canSubmit && !submitting
              ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}>
          {submitting
            ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</span>
            : "Enviar anamnese"}
        </button>

        <p className="text-xs text-gray-400 text-center pb-8">
          Suas informações são confidenciais e protegidas de acordo com a LGPD.
        </p>
      </form>
    </div>
  );
}
