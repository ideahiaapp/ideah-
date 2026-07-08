"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { cn, maskCpf, maskPhone } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, Loader2, ChevronDown } from "lucide-react";
import Image from "next/image";
import { TemplateFormSection, serializeTemplateForm } from "@/components/ui/TemplateFormSection";

const HOW_FOUND_OPTIONS = [
  "Indicação de amigo(a)", "Redes sociais", "Google", "Evento ou palestra",
  "Outro profissional de saúde", "Outro",
];

const APPROACH_LABELS: Record<string, string> = {
  PSYCHOANALYSIS: "Psicanálise Freudiana",
  COGNITIVE_BEHAVIORAL: "TCC",
  JUNGIAN: "Junguiana",
  SOMATIC: "Somática / Corporal",
  TANTRA: "Sexualidade Humana e Tantra",
  GESTALT: "Gestalt-terapia",
  PSYCHODRAMA: "Psicodrama",
  SYSTEMIC: "Constelação Familiar",
};

const inputCls = "w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent placeholder-gray-400";

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-gray-700">
        <div className="mb-1.5">{label} {required && <span className="text-red-400">*</span>}</div>
        <div className="font-normal">{children}</div>
      </label>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
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

export default function PreencherAnamnesePage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const clientId     = params.clientId as string;
  const approach     = searchParams.get("approach") ?? "";

  const templateRef = useRef<HTMLDivElement>(null);

  const [therapistName,   setTherapistName]   = useState("");
  const [loadingClient,   setLoadingClient]   = useState(true);
  const [notFound,        setNotFound]        = useState(false);
  const [templateHtml,    setTemplateHtml]    = useState<string | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const [submitted,   setSubmitted]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", birth_date: "", cpf: "",
    emergency_contact: "", how_found: "", accepts_email: true,
    conditions: [] as string[],
    latex_allergy: false, oil_allergy: "", medication: "",
    emotional_state: "", body_pain: "", intention: "", sexual_discomfort: "",
    consent_nudity: false, consent_touch: false,
    consent_therapeutic: false, consent_payment: false,
  });

  useEffect(() => {
    fetch(`/api/anamnese/client-public/${clientId}`)
      .then(r => r.json())
      .then(d => {
        if (d.client) {
          setTherapistName(d.therapistName ?? "");
          setForm(prev => ({
            ...prev,
            name:       d.client.name  ?? "",
            email:      d.client.email ?? "",
            phone:      d.client.phone ?? "",
            birth_date: d.client.birth_date ? d.client.birth_date.split("T")[0] : "",
          }));
        } else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingClient(false));
  }, [clientId]);

  useEffect(() => {
    if (!approach) return;
    setLoadingTemplate(true);
    fetch(`/api/anamnese-templates/${approach}`, { cache: "no-store" })
      .then(r => r.json())
      .then(d => setTemplateHtml(d.content ?? null))
      .catch(() => setTemplateHtml(null))
      .finally(() => setLoadingTemplate(false));
  }, [approach]);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  const hasTemplate = !!templateHtml;
  const isSomatic   = approach === "SOMATIC" || !approach;

  const commonValid =
    form.name.trim() && form.email.trim() && form.phone.trim() &&
    form.cpf.trim() && form.birth_date && form.emergency_contact.trim() && form.how_found;

  const somaticValid = hasTemplate ? true :
    form.oil_allergy.trim() && form.medication.trim() &&
    form.emotional_state.trim() && form.body_pain.trim() &&
    form.intention.trim() && form.sexual_discomfort.trim() &&
    form.conditions.length > 0 &&
    form.consent_nudity && form.consent_touch &&
    form.consent_therapeutic && form.consent_payment;

  const canSubmit = commonValid && somaticValid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true); setSubmitError(null);
    try {
      const templateAnswers = templateRef.current
        ? serializeTemplateForm(templateRef.current)
        : undefined;

      const res = await fetch(`/api/anamnese/client-public/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          approach: approach || undefined,
          template_answers: templateAnswers,
        }),
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

  if (loadingClient) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-purple-50 to-pink-50 px-4">
      <AlertTriangle className="w-12 h-12 text-amber-400" strokeWidth={1.5} />
      <h1 className="text-xl font-bold text-gray-700">Link inválido</h1>
      <p className="text-gray-500 text-sm text-center">Este link de anamnese não existe ou foi desativado.</p>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-purple-50 to-pink-50 px-4">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-green-500" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">Anamnese enviada!</h1>
        <p className="text-gray-500 mt-2 max-w-sm leading-relaxed">
          Obrigado, <strong>{form.name}</strong>. Suas informações foram recebidas.
        </p>
      </div>
    </div>
  );

  const CONDITIONS = [
    "Gravidez", "Diabetes", "Problemas cardíacos", "Cirurgia recente",
    "Limitação física", "Convulsão ou epilepsia",
    "IST (Infecções Sexualmente Transmissíveis)", "Depressão",
    "Ansiedade", "Síndrome do pânico", "Nenhuma das anteriores",
  ];

  const CONSENTS = [
    { key: "consent_nudity"      as const, title: "Nudez",                   text: "Tenho ciência que serei convidado(a) a me despir completamente e que essa nudez é consensual e opcional." },
    { key: "consent_touch"       as const, title: "Toques",                  text: "Tenho ciência de que na sessão poderão haver toques na pele, genitais (externos/internos), uso de vibrador externo e estímulo do prazer, sempre com consentimento do cliente." },
    { key: "consent_therapeutic" as const, title: "Trabalho Terapêutico",    text: "Estou ciente que o trabalho é 100% terapêutico e educativo, não há interação sexual, os toques são sempre unilaterais, durante todo o tempo o terapeuta fica vestido e os toques genitais são realizados com luvas." },
    { key: "consent_payment"     as const, title: "Pagamento e compromisso", text: "Realizarei o pagamento de 50% do valor da sessão via Pix e enviarei o comprovante. Prazo de desmarcação: até 24h antes. Chave Pix: elimarcia.philos@gmail.com (Nubank — Elimárcia Aguiar Leite)." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col items-center gap-3">
          <Image src="/paideia-icon.svg" alt="Paideia" width={72} height={72} className="rounded-2xl" />
          <span className="text-2xl font-bold text-purple-800">{therapistName}</span>
          {approach && APPROACH_LABELS[approach] && (
            <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
              {APPROACH_LABELS[approach]}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        <Section title="Dados pessoais">
          <p className="text-xs text-gray-400 -mt-2">Estes dados já vêm preenchidos com o que está no seu cadastro. Corrija aqui caso haja algum erro.</p>
          <Field label="Nome completo" required>
            <input type="text" value={form.name} onChange={e => set("name", e.target.value)} className={inputCls} placeholder="Seu nome completo" />
          </Field>
          <Field label="Email" required>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inputCls} placeholder="seu@email.com" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Celular" required>
              <input type="tel" value={form.phone} onChange={e => set("phone", maskPhone(e.target.value))} className={inputCls} placeholder="(11) 99999-9999" />
            </Field>
            <Field label="Data de nascimento" required>
              <input type="date" value={form.birth_date} onChange={e => set("birth_date", e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="CPF" required>
              <input type="text" value={form.cpf} onChange={e => set("cpf", maskCpf(e.target.value))} className={inputCls} placeholder="000.000.000-00" />
            </Field>
            <Field label="Contato de emergência" required>
              <input type="text" value={form.emergency_contact} onChange={e => set("emergency_contact", e.target.value)} className={inputCls} placeholder="Nome e telefone" />
            </Field>
          </div>
          <Field label="Como chegou até mim" required>
            <div className="relative">
              <select value={form.how_found} onChange={e => set("how_found", e.target.value)} className={inputCls + " appearance-none pr-9"}>
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
                  <input type="radio" checked={form.accepts_email === v} onChange={() => set("accepts_email", v)} className="accent-purple-600" />
                  <span className="text-sm">{v ? "Sim" : "Não"}</span>
                </label>
              ))}
            </div>
          </Field>
        </Section>

        {/* Template dinâmico */}
        {approach && (
          loadingTemplate ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : templateHtml ? (
            <div ref={templateRef}>
              <TemplateFormSection html={templateHtml} />
            </div>
          ) : (
            <Section title="Informações clínicas">
              <Field label="Estado emocional" required>
                <textarea value={form.emotional_state} onChange={e => set("emotional_state", e.target.value)} className={inputCls + " resize-none"} rows={3} placeholder="Como está se sentindo emocionalmente" />
              </Field>
              <Field label="Dor no corpo" required>
                <textarea value={form.body_pain} onChange={e => set("body_pain", e.target.value)} className={inputCls + " resize-none"} rows={2} placeholder="Descreva ou escreva 'Não'" />
              </Field>
              <Field label="Intenção com a sessão" required>
                <textarea value={form.intention} onChange={e => set("intention", e.target.value)} className={inputCls + " resize-none"} rows={3} placeholder="O que busca alcançar/superar?" />
              </Field>
              <Field label="Incômodo na vida sexual" required>
                <textarea value={form.sexual_discomfort} onChange={e => set("sexual_discomfort", e.target.value)} className={inputCls + " resize-none"} rows={2} placeholder="Compartilhe ou escreva 'Não'" />
              </Field>
            </Section>
          )
        )}

        {/* Saúde e consentimentos — apenas para Somática */}
        {isSomatic && (
          <>
            <Section title="Saúde">
              <Field label="Condições de saúde" required>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {CONDITIONS.map(c => (
                    <label key={c} className="flex items-center gap-2.5 cursor-pointer group">
                      <div onClick={() => setForm(p => ({
                        ...p,
                        conditions: p.conditions.includes(c)
                          ? p.conditions.filter(x => x !== c)
                          : [...p.conditions, c],
                      }))}
                        className={cn(
                          "w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                          form.conditions.includes(c) ? "border-purple-500 bg-purple-500" : "border-gray-300 group-hover:border-purple-300"
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
              <Field label="Alergia a látex?">
                <div className="flex gap-4">
                  {[true, false].map(v => (
                    <label key={String(v)} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={form.latex_allergy === v} onChange={() => set("latex_allergy", v)} className="accent-purple-600" />
                      <span className="text-sm">{v ? "Sim" : "Não"}</span>
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Alergia a óleos de massagem?" required>
                <input type="text" value={form.oil_allergy} onChange={e => set("oil_allergy", e.target.value)} className={inputCls} placeholder="Descreva ou escreva 'Não'" />
              </Field>
              <Field label="Medicamentos em uso?" required>
                <textarea value={form.medication} onChange={e => set("medication", e.target.value)} className={inputCls + " resize-none"} rows={2} placeholder="Descreva ou escreva 'Não'" />
              </Field>
              <Field label="Estado emocional" required>
                <textarea value={form.emotional_state} onChange={e => set("emotional_state", e.target.value)} className={inputCls + " resize-none"} rows={3} placeholder="Como está se sentindo emocionalmente" />
              </Field>
              <Field label="Dor no corpo" required>
                <textarea value={form.body_pain} onChange={e => set("body_pain", e.target.value)} className={inputCls + " resize-none"} rows={2} placeholder="Descreva ou escreva 'Não'" />
              </Field>
              <Field label="Intenção com a sessão" required>
                <textarea value={form.intention} onChange={e => set("intention", e.target.value)} className={inputCls + " resize-none"} rows={3} placeholder="O que busca alcançar/superar?" />
              </Field>
              <Field label="Incômodo na vida sexual" required>
                <textarea value={form.sexual_discomfort} onChange={e => set("sexual_discomfort", e.target.value)} className={inputCls + " resize-none"} rows={2} placeholder="Compartilhe ou escreva 'Não'" />
              </Field>
            </Section>

            <Section title="Termos e consentimentos">
              <div className="space-y-4">
                {CONSENTS.map(item => (
                  <label key={item.key}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors",
                      form[item.key] ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-200"
                    )}>
                    <div onClick={() => set(item.key, !form[item.key])}
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
          </>
        )}

        {submitError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />{submitError}
          </div>
        )}

        {!canSubmit && (
          <p className="text-xs text-gray-400 text-center">
            Preencha todos os campos obrigatórios (*) para enviar.
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
            ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Enviando...</span>
            : "Enviar anamnese"}
        </button>

        <p className="text-xs text-gray-400 text-center pb-8">
          Suas informações são confidenciais e protegidas de acordo com a LGPD.
        </p>
      </form>
    </div>
  );
}
