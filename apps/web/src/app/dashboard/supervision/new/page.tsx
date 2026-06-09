"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Brain,
  Heart,
  Layers,
  Users,
  Zap,
  Activity,
  Circle,
  Compass,
} from "lucide-react";
import { mockClients } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { VoiceInput } from "@/components/ui/VoiceField";

interface Approach {
  id: string;
  label: string;
  description: string;
  color: string;
  iconBg: string;
  icon: React.ElementType;
  tags: string[];
}

const APPROACHES: Approach[] = [
  {
    id: "PSYCHOANALYSIS",
    label: "Psicanálise",
    description: "Freud, Lacan, Winnicott — inconsciente, transferência, estrutura clínica",
    color: "border-purple-200 bg-purple-50 hover:border-purple-400",
    iconBg: "bg-purple-100 text-purple-600",
    icon: Brain,
    tags: ["Inconsciente", "Transferência", "Sintoma"],
  },
  {
    id: "COGNITIVE_BEHAVIORAL",
    label: "TCC",
    description: "Beck, Ellis — crenças centrais, pensamentos automáticos, reestruturação cognitiva",
    color: "border-blue-200 bg-blue-50 hover:border-blue-400",
    iconBg: "bg-blue-100 text-blue-600",
    icon: Layers,
    tags: ["Crenças", "Comportamento", "Experimentos"],
  },
  {
    id: "JUNGIAN",
    label: "Junguiana",
    description: "Jung — arquétipos, sombra, self, individuação, inconsciente coletivo",
    color: "border-amber-200 bg-amber-50 hover:border-amber-400",
    iconBg: "bg-amber-100 text-amber-600",
    icon: Compass,
    tags: ["Arquétipos", "Sombra", "Sonhos"],
  },
  {
    id: "HUMANISTIC",
    label: "Humanista",
    description: "Rogers, Maslow, Frankl — autorrealização, empatia, sentido de vida",
    color: "border-green-200 bg-green-50 hover:border-green-400",
    iconBg: "bg-green-100 text-green-600",
    icon: Heart,
    tags: ["Autenticidade", "Presença", "Sentido"],
  },
  {
    id: "SYSTEMIC",
    label: "Sistêmica",
    description: "Minuchin, Bateson — dinâmicas familiares, padrões relacionais, scripts",
    color: "border-pink-200 bg-pink-50 hover:border-pink-400",
    iconBg: "bg-pink-100 text-pink-600",
    icon: Users,
    tags: ["Família", "Padrões", "Vínculos"],
  },
  {
    id: "SOMATIC",
    label: "Somática",
    description: "Levine, van der Kolk — trauma, sistema nervoso, memória corporal",
    color: "border-orange-200 bg-orange-50 hover:border-orange-400",
    iconBg: "bg-orange-100 text-orange-600",
    icon: Activity,
    tags: ["Corpo", "Trauma", "Regulação"],
  },
  {
    id: "GESTALT",
    label: "Gestalt",
    description: "Perls — ciclo de contato, fronteiras, aqui-agora, polaridades",
    color: "border-teal-200 bg-teal-50 hover:border-teal-400",
    iconBg: "bg-teal-100 text-teal-600",
    icon: Circle,
    tags: ["Contato", "Presença", "Necessidades"],
  },
  {
    id: "ACCEPTANCE_COMMITMENT",
    label: "ACT",
    description: "Hayes — desfusão cognitiva, valores, ação comprometida, flexibilidade psicológica",
    color: "border-indigo-200 bg-indigo-50 hover:border-indigo-400",
    iconBg: "bg-indigo-100 text-indigo-600",
    icon: Zap,
    tags: ["Valores", "Aceitação", "Presença"],
  },
];

export default function NewSupervisionPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedApproach, setSelectedApproach] = useState<string>("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const canContinue = selectedClient !== "" && step === 1;
  const canStart = selectedApproach !== "" && step === 2;

  function handleStart() {
    if (!selectedClient || !selectedApproach) return;
    setLoading(true);

    // Gerar ID mock para a nova sessão
    const newId = `new-${Date.now()}`;

    // Passar dados via query para a página de chat
    const params = new URLSearchParams({
      client: selectedClient,
      approach: selectedApproach,
      title: title || `Supervisão — ${mockClients.find((c) => c.id === selectedClient)?.name}`,
      isNew: "1",
    });

    router.push(`/dashboard/supervision/${newId}?${params.toString()}`);
  }

  const selectedClientData = mockClients.find((c) => c.id === selectedClient);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/supervision"
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-ink">Nova Supervisão</h1>
          <p className="text-gray-500 text-sm">
            {step === 1 ? "Selecione o cliente" : "Escolha a abordagem teórica"}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        {[1, 2].map((n) => (
          <div key={n} className="flex items-center gap-3 flex-1">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                step >= n
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-400"
              )}
            >
              {n}
            </div>
            <span className={cn("text-xs font-medium", step >= n ? "text-brand-600" : "text-gray-400")}>
              {n === 1 ? "Paciente" : "Abordagem"}
            </span>
            {n < 2 && (
              <div className={cn("flex-1 h-0.5 rounded", step > n ? "bg-brand-300" : "bg-gray-100")} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Selecionar cliente */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-700">
              Para qual paciente é esta supervisão?
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {mockClients.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left",
                  selectedClient === client.id && "bg-brand-50 hover:bg-brand-50"
                )}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: client.color }}
                >
                  {client.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{client.name}</p>
                  <p className="text-xs text-gray-400">{client.approachLabel} · {client.totalSessions} sessões</p>
                </div>
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors",
                    selectedClient === client.id
                      ? "border-brand-500 bg-brand-500"
                      : "border-gray-300"
                  )}
                >
                  {selectedClient === client.id && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Selecionar abordagem */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Cliente selecionado */}
          {selectedClientData && (
            <div className="flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: selectedClientData.color }}
              >
                {selectedClientData.initials}
              </div>
              <p className="text-sm font-medium text-brand-700">{selectedClientData.name}</p>
              <button
                onClick={() => setStep(1)}
                className="ml-auto text-xs text-brand-500 hover:text-brand-700 font-medium"
              >
                Alterar
              </button>
            </div>
          )}

          {/* Título opcional */}
          <VoiceInput
            label="Título da supervisão"
            hint="Opcional — ajuda a identificar a sessão depois"
            value={title}
            onChange={setTitle}
            placeholder="Ex: Questão de limites na relação terapêutica"
          />

          {/* Grid de abordagens */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-3">
              Qual referencial teórico deseja consultar?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {APPROACHES.map((approach) => {
                const Icon = approach.icon;
                const selected = selectedApproach === approach.id;
                return (
                  <button
                    key={approach.id}
                    onClick={() => setSelectedApproach(approach.id)}
                    className={cn(
                      "text-left p-4 rounded-xl border-2 transition-all",
                      selected
                        ? "border-brand-400 bg-brand-50 shadow-sm"
                        : approach.color
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", approach.iconBg)}>
                      <Icon className="w-4 h-4" strokeWidth={1.8} />
                    </div>
                    <p className="text-sm font-bold text-gray-800 mb-0.5">{approach.label}</p>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                      {approach.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {approach.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-white/70 text-gray-500 px-1.5 py-0.5 rounded-md border border-gray-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Botão de ação */}
      <div className="flex gap-3">
        {step === 2 && (
          <button
            onClick={() => setStep(1)}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Voltar
          </button>
        )}
        {step === 1 ? (
          <button
            onClick={() => setStep(2)}
            disabled={!canContinue}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors",
              canContinue
                ? "bg-brand-500 hover:bg-brand-600 text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            Continuar
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={!canStart || loading}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors",
              canStart && !loading
                ? "bg-brand-500 hover:bg-brand-600 text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Iniciar supervisão <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
