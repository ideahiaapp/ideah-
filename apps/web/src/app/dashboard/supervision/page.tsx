"use client";

import Link from "next/link";
import { MessageSquare, Plus, Search, Clock, ChevronRight, BookOpen } from "lucide-react";
import { mockSupervisions } from "@/lib/mock-data";
import { formatRelative } from "@/lib/utils";

const APPROACH_COLORS: Record<string, string> = {
  "Psicanálise": "bg-purple-50 text-purple-700 border-purple-100",
  "TCC": "bg-blue-50 text-blue-700 border-blue-100",
  "Junguiana": "bg-amber-50 text-amber-700 border-amber-100",
  "Humanista": "bg-green-50 text-green-700 border-green-100",
  "Sistêmica": "bg-pink-50 text-pink-700 border-pink-100",
  "Somática": "bg-orange-50 text-orange-700 border-orange-100",
  "Gestalt": "bg-teal-50 text-teal-700 border-teal-100",
  "ACT": "bg-indigo-50 text-indigo-700 border-indigo-100",
};

export default function SupervisionListPage() {
  const approachColor = (approach: string) =>
    APPROACH_COLORS[approach] || "bg-gray-50 text-gray-700 border-gray-100";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Supervisão Clínica</h1>
          <p className="text-gray-500 text-sm mt-1">
            Dialogues com referenciais teóricos para aprofundar sua prática
          </p>
        </div>
        <Link
          href="/dashboard/supervision/new"
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nova supervisão
        </Link>
      </div>

      {/* Banner informativo */}
      <div className="bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-100 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 text-brand-600" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-800">O que é a Supervisão Dialógica?</p>
          <p className="text-xs text-brand-600 mt-1 leading-relaxed">
            Aqui você conversa com IA treinada em diferentes referenciais teóricos para levantar
            hipóteses clínicas, explorar dinâmicas e ampliar recursos — sem diagnósticos ou
            rotulações. É uma ferramenta de reflexão para o <strong>seu</strong> desenvolvimento clínico.
          </p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar supervisões..."
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent"
        />
      </div>

      {/* Lista de supervisões */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">
            {mockSupervisions.length} supervisões
          </p>
          <select className="text-xs text-gray-500 bg-transparent border-none focus:outline-none cursor-pointer">
            <option>Mais recentes</option>
            <option>Mais antigas</option>
            <option>Por abordagem</option>
          </select>
        </div>

        <div className="divide-y divide-gray-50">
          {mockSupervisions.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/supervision/${s.id}`}
              className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
            >
              {/* Ícone */}
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-brand-100 transition-colors">
                <MessageSquare className="w-5 h-5 text-brand-500" strokeWidth={1.8} />
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">{s.title}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border flex-shrink-0 ${approachColor(s.approach)}`}
                  >
                    {s.approach}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1.5">{s.clientName}</p>
                <p className="text-xs text-gray-400 truncate italic">"{s.lastMessage}"</p>
              </div>

              {/* Meta */}
              <div className="flex-shrink-0 text-right flex flex-col items-end gap-2">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {formatRelative(s.updatedAt)}
                </div>
                <span className="text-xs text-gray-300">{s.messagesCount} msgs</span>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA vazia caso não haja supervisões */}
      {mockSupervisions.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-brand-300" strokeWidth={1.5} />
          </div>
          <h3 className="text-gray-700 font-semibold mb-2">Nenhuma supervisão ainda</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
            Comece uma nova supervisão dialógica para explorar um caso clínico com suporte teórico.
          </p>
          <Link
            href="/dashboard/supervision/new"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova supervisão
          </Link>
        </div>
      )}
    </div>
  );
}
