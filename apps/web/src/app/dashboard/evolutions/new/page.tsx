"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { aiHeaders } from "@/lib/api-key";
import {
  ArrowLeft, Sparkles, Loader2, Save, ChevronDown,
  AlertCircle, CheckCircle2, User, Calendar, FileText,
  Lightbulb, Target, Mic,
} from "lucide-react";
import { mockClients } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { VoiceTextarea, VoiceInput } from "@/components/ui/VoiceField";

const MOOD_OPTIONS = [
  { value: 1, label: "Muito difícil", emoji: "😟", color: "border-red-300 bg-red-50 text-red-700" },
  { value: 2, label: "Difícil",       emoji: "😕", color: "border-orange-300 bg-orange-50 text-orange-700" },
  { value: 3, label: "Neutro",        emoji: "😐", color: "border-yellow-300 bg-yellow-50 text-yellow-700" },
  { value: 4, label: "Produtivo",     emoji: "🙂", color: "border-green-300 bg-green-50 text-green-700" },
  { value: 5, label: "Excelente",     emoji: "😊", color: "border-emerald-300 bg-emerald-50 text-emerald-700" },
];

interface AISuggestion {
  hypothesis: string;
  elaboration: string;
  attentionPoints: string[];
  nextSessionIdeas: string[];
}

export default function NewEvolutionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    clientId:       searchParams.get("clientId") ?? "",
    sessionDate:    new Date().toISOString().split("T")[0],
    content:        "",
    hypothesis:     "",
    interventions:  "",
    nextSessionPlan:"",
    mood:           0,
  });

  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiError,      setAiError]      = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);

  const selectedClient = mockClients.find(c => c.id === form.clientId);
  const canSuggest = form.content.trim().length >= 50;
  const canSave    = form.clientId && form.content.trim().length >= 20 && form.mood > 0;

  function set(field: string, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function suggestWithAI() {
    if (!canSuggest) return;
    setAiLoading(true); setAiError(null); setAiSuggestion(null);
    try {
      const res = await fetch("/api/evolutions/suggest", {
        method: "POST",
        headers: await aiHeaders(),
        body: JSON.stringify({
          content:    form.content,
          approach:   selectedClient?.approachLabel,
          clientName: selectedClient?.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na IA");
      setAiSuggestion(data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setAiLoading(false);
    }
  }

  function applyAISuggestion() {
    if (!aiSuggestion) return;
    set("hypothesis", aiSuggestion.hypothesis);
    if (!form.nextSessionPlan && aiSuggestion.nextSessionIdeas.length > 0)
      set("nextSessionPlan", aiSuggestion.nextSessionIdeas.join("\n"));
    setAiSuggestion(null);
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false); setSaved(true);
    setTimeout(() => router.push("/dashboard/evolutions"), 1200);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/evolutions"
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-ink">Nova Evolução</h1>
          <p className="text-gray-500 text-sm">Registro clínico pós-sessão</p>
        </div>
        {/* Aviso de voz */}
        <div className="ml-auto hidden sm:flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
          <Mic className="w-3.5 h-3.5" />
          Todos os campos aceitam voz
        </div>
      </div>

      {/* ── BLOCO 1: Identificação ── */}
      <Section icon={User} title="Identificação">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Paciente <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select value={form.clientId} onChange={e => set("clientId", e.target.value)}
                className="w-full appearance-none px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 pr-10 text-gray-800">
                <option value="">Selecionar paciente...</option>
                {mockClients.filter(c => c.status !== "WAITLIST").map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.approachLabel}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Data da sessão <span className="text-red-400">*</span>
              </span>
            </label>
            <input type="date" value={form.sessionDate}
              onChange={e => set("sessionDate", e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 text-gray-800" />
          </div>
        </div>

        {/* Tom */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-600 mb-2">
            Tom geral da sessão <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {MOOD_OPTIONS.map(m => (
              <button key={m.value} onClick={() => set("mood", m.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all",
                  form.mood === m.value ? m.color + " shadow-sm scale-105" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                )}>
                <span>{m.emoji}</span>{m.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ── BLOCO 2: Conteúdo da sessão ── */}
      <Section icon={FileText} title="Conteúdo da sessão">

        <VoiceTextarea
          label="O que aconteceu"
          required
          hint={
            form.content.length < 50
              ? `${50 - form.content.length} caracteres para habilitar sugestão IA · ${form.content.length} digitados`
              : `${form.content.length} caracteres`
          }
          value={form.content}
          onChange={v => set("content", v)}
          placeholder="Descreva os temas trazidos pelo paciente, dinâmicas observadas, momentos significativos, falas relevantes..."
          rows={5}
        />

        {/* Botão sugerir IA */}
        <button onClick={suggestWithAI} disabled={!canSuggest || aiLoading}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border-2",
            canSuggest && !aiLoading
              ? "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-400"
              : "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
          )}>
          {aiLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando sessão com IA...</>
            : <><Sparkles className="w-4 h-4" /> Sugerir hipótese com IA</>}
        </button>

        {/* Erro IA */}
        {aiError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Erro na sugestão</p>
              <p className="text-red-500 mt-0.5">{aiError}</p>
              {(aiError.includes("API") || aiError.includes("key") || aiError.includes("configurad")) && (
                <p className="text-red-400 mt-1">
                  Configure sua chave em <strong>Configurações → API Key</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Card sugestão IA */}
        {aiSuggestion && (
          <div className="bg-gradient-to-br from-purple-50 to-brand-50 border border-purple-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <p className="text-sm font-bold text-purple-800">Sugestão da IA</p>
              <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Hipótese clínica</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">{aiSuggestion.hypothesis}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{aiSuggestion.elaboration}</p>
            </div>
            {aiSuggestion.attentionPoints?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-purple-700 mb-1.5">Pontos de atenção:</p>
                <ul className="space-y-1">
                  {aiSuggestion.attentionPoints.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1 flex-shrink-0" />{p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {aiSuggestion.nextSessionIdeas?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-purple-700 mb-1.5">Ideias para próxima sessão:</p>
                <ul className="space-y-1">
                  {aiSuggestion.nextSessionIdeas.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1 flex-shrink-0" />{p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={applyAISuggestion}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                Usar esta sugestão
              </button>
              <button onClick={() => setAiSuggestion(null)}
                className="px-4 text-xs text-gray-500 hover:text-gray-700 font-medium">
                Descartar
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* ── BLOCO 3: Hipóteses e intervenções ── */}
      <Section icon={Lightbulb} title="Hipóteses clínicas">
        <VoiceInput
          label="Hipótese principal"
          hint="Sua interpretação clínica — pode ser preenchida pela IA ou digitada/ditada"
          value={form.hypothesis}
          onChange={v => set("hypothesis", v)}
          placeholder="Ex: Luto complicado com traços melancólicos"
        />
        <VoiceTextarea
          label="Intervenções realizadas"
          value={form.interventions}
          onChange={v => set("interventions", v)}
          placeholder="O que você fez/disse na sessão? Técnicas utilizadas, perguntas feitas..."
          rows={3}
        />
      </Section>

      {/* ── BLOCO 4: Plano ── */}
      <Section icon={Target} title="Plano para próxima sessão">
        <VoiceTextarea
          label="O que retomar ou explorar"
          value={form.nextSessionPlan}
          onChange={v => set("nextSessionPlan", v)}
          placeholder="Pontos a retomar, temas a explorar, tarefas combinadas..."
          rows={3}
        />
      </Section>

      {/* ── Salvar ── */}
      <div className="flex items-center gap-3 pb-6">
        <Link href="/dashboard/evolutions"
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
           : saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
           :          <><Save className="w-4 h-4" /> Salvar evolução</>}
        </button>
      </div>
    </div>
  );
}

/* ── Componentes auxiliares ── */
function Section({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
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
