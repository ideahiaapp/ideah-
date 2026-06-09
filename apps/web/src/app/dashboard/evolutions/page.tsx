"use client";

import Link from "next/link";
import { Plus, Search, FileText, Clock, ChevronRight, Sparkles, Filter } from "lucide-react";
import { mockEvolutions } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { useState } from "react";
import { cn } from "@/lib/utils";

const MOOD_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Muito difícil", color: "text-red-500 bg-red-50 border-red-100" },
  2: { label: "Difícil", color: "text-orange-500 bg-orange-50 border-orange-100" },
  3: { label: "Neutro", color: "text-yellow-600 bg-yellow-50 border-yellow-100" },
  4: { label: "Produtivo", color: "text-green-600 bg-green-50 border-green-100" },
  5: { label: "Excelente", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
};

export default function EvolutionsPage() {
  const [search, setSearch] = useState("");

  const filtered = mockEvolutions.filter(
    (e) =>
      e.clientName.toLowerCase().includes(search.toLowerCase()) ||
      e.hypothesis.toLowerCase().includes(search.toLowerCase()) ||
      e.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Evoluções</h1>
          <p className="text-gray-500 text-sm mt-1">
            Registros clínicos pós-sessão com suporte de IA
          </p>
        </div>
        <Link
          href="/dashboard/evolutions/new"
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nova evolução
        </Link>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Este mês", value: mockEvolutions.length, sub: "registros" },
          { label: "Com hipótese IA", value: mockEvolutions.filter((e) => e.aiHypothesis).length, sub: "geradas" },
          { label: "Clientes cobertos", value: new Set(mockEvolutions.map((e) => e.clientId)).size, sub: "neste mês" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-2xl font-bold text-ink">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              <span className="font-medium text-gray-600">{s.label}</span> · {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Busca e filtro */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, hipótese ou conteúdo..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filtrar
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-gray-300" strokeWidth={1.5} />
            </div>
            <p className="text-gray-500 font-medium">Nenhuma evolução encontrada</p>
            <p className="text-gray-400 text-sm mt-1">Tente outra busca ou crie um novo registro</p>
          </div>
        ) : (
          filtered.map((ev) => {
            const mood = MOOD_LABELS[ev.mood] || MOOD_LABELS[3];
            return (
              <Link
                key={ev.id}
                href={`/dashboard/evolutions/${ev.id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-brand-200 hover:shadow-md transition-all group"
              >
                <div className="p-5">
                  {/* Topo */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: ev.color }}
                      >
                        {ev.initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{ev.clientName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(ev.sessionDate)}
                          </span>
                          <span className="text-gray-200">·</span>
                          <span className="text-xs text-gray-400">Sessão #{ev.sessionNumber}</span>
                          <span className="text-gray-200">·</span>
                          <span className="text-xs text-gray-400">{ev.approachLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", mood.color)}>
                        {mood.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-400 transition-colors" />
                    </div>
                  </div>

                  {/* Hipótese */}
                  {ev.hypothesis && (
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-xs font-semibold text-brand-600 flex-shrink-0 mt-0.5">Hipótese:</span>
                      <span className="text-xs font-medium text-brand-700">{ev.hypothesis}</span>
                    </div>
                  )}

                  {/* Preview conteúdo */}
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{ev.content}</p>

                  {/* Badge IA */}
                  {ev.aiHypothesis && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-purple-500">
                      <Sparkles className="w-3 h-3" />
                      <span>Hipótese IA gerada</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
