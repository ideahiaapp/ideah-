"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  User,
  FileText,
  Lightbulb,
  Target,
  Sparkles,
  Pencil,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { mockEvolutions } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const MOOD_LABELS: Record<number, { label: string; color: string; emoji: string }> = {
  1: { label: "Muito difícil", color: "text-red-600 bg-red-50 border-red-200", emoji: "😟" },
  2: { label: "Difícil",       color: "text-orange-600 bg-orange-50 border-orange-200", emoji: "😕" },
  3: { label: "Neutro",        color: "text-yellow-700 bg-yellow-50 border-yellow-200", emoji: "😐" },
  4: { label: "Produtivo",     color: "text-green-600 bg-green-50 border-green-200", emoji: "🙂" },
  5: { label: "Excelente",     color: "text-emerald-600 bg-emerald-50 border-emerald-200", emoji: "😊" },
};

export default function EvolutionDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const ev = mockEvolutions.find((e) => e.id === id);

  if (!ev) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-gray-400 mb-4">Evolução não encontrada.</p>
        <Link href="/dashboard/evolutions" className="text-brand-500 hover:underline text-sm font-medium">
          ← Voltar para evoluções
        </Link>
      </div>
    );
  }

  const mood = MOOD_LABELS[ev.mood] || MOOD_LABELS[3];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-ink">Evolução Clínica</h1>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {formatDate(ev.sessionDate)} · Sessão #{ev.sessionNumber} · {ev.approachLabel}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
          <button className="p-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card de identidade */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: ev.color }}
            >
              {ev.initials}
            </div>
            <div>
              <p className="font-bold text-gray-900">{ev.clientName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{ev.approachLabel} · sessão #{ev.sessionNumber}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className={cn("text-xs px-3 py-1 rounded-full border font-medium flex items-center gap-1", mood.color)}>
              <span>{mood.emoji}</span> {mood.label}
            </span>
            <Link
              href={`/dashboard/supervision/new?clientId=${ev.clientId}`}
              className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-700 font-medium"
            >
              <MessageSquare className="w-3 h-3" />
              Abrir supervisão deste caso
            </Link>
          </div>
        </div>
      </div>

      {/* Conteúdo da sessão */}
      <InfoSection icon={FileText} title="O que aconteceu na sessão">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ev.content}</p>
      </InfoSection>

      {/* Hipótese + intervenções */}
      <div className="grid md:grid-cols-2 gap-4">
        <InfoSection icon={Lightbulb} title="Hipótese clínica">
          {ev.hypothesis ? (
            <p className="text-sm font-semibold text-brand-700">{ev.hypothesis}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Não registrada</p>
          )}
        </InfoSection>

        <InfoSection icon={Target} title="Plano para próxima sessão">
          {ev.nextSessionPlan ? (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ev.nextSessionPlan}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Não registrado</p>
          )}
        </InfoSection>
      </div>

      {/* Intervenções */}
      {ev.interventions && (
        <InfoSection icon={User} title="Intervenções realizadas">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ev.interventions}</p>
        </InfoSection>
      )}

      {/* Hipótese IA */}
      {ev.aiHypothesis && (
        <div className="bg-gradient-to-br from-purple-50 to-brand-50 border border-purple-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-600" strokeWidth={1.8} />
            </div>
            <p className="text-sm font-bold text-purple-800">Hipótese gerada pela IA</p>
            <span className="ml-auto text-xs text-purple-400 bg-purple-100 px-2 py-0.5 rounded-full">
              Somente para reflexão
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{ev.aiHypothesis}</p>
        </div>
      )}

      {/* Botão nova supervisão contextualizada */}
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-800">Quer aprofundar este caso?</p>
          <p className="text-xs text-brand-600 mt-0.5">
            Abra uma supervisão dialógica com base nesta evolução.
          </p>
        </div>
        <Link
          href={`/dashboard/supervision/new`}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          Supervisionar
        </Link>
      </div>
    </div>
  );
}

function InfoSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
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
