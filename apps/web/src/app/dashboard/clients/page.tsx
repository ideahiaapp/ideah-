"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus, Search, Users, Clock,
  ChevronRight, UserCheck, UserX, Hourglass,
} from "lucide-react";
import { mockClients } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type StatusFilter = "ALL" | "ACTIVE" | "WAITLIST" | "INACTIVE";

const STATUS_CONFIG = {
  ACTIVE:   { label: "Ativo",       dot: "bg-green-400",  badge: "bg-green-50 text-green-700 border-green-200" },
  WAITLIST: { label: "Lista de espera", dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  INACTIVE: { label: "Inativo",     dot: "bg-gray-300",   badge: "bg-gray-50 text-gray-500 border-gray-200" },
};

const APPROACH_COLORS: Record<string, string> = {
  "Psicanálise":  "bg-purple-50 text-purple-700",
  "TCC":          "bg-blue-50 text-blue-700",
  "Junguiana":    "bg-amber-50 text-amber-700",
  "Humanista":    "bg-green-50 text-green-700",
  "Sistêmica":    "bg-pink-50 text-pink-700",
  "Somática":     "bg-orange-50 text-orange-700",
  "Gestalt":      "bg-teal-50 text-teal-700",
  "ACT":          "bg-indigo-50 text-indigo-700",
};

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const counts = {
    ALL:      mockClients.length,
    ACTIVE:   mockClients.filter((c) => c.status === "ACTIVE").length,
    WAITLIST: mockClients.filter((c) => c.status === "WAITLIST").length,
    INACTIVE: mockClients.filter((c) => c.status === "INACTIVE").length,
  };

  const filtered = mockClients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.approachLabel.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie seus pacientes e prontuários</p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Novo cliente
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: UserCheck, label: "Ativos",           value: counts.ACTIVE,   color: "bg-green-50 text-green-600" },
          { icon: Hourglass, label: "Lista de espera",  value: counts.WAITLIST, color: "bg-amber-50 text-amber-600" },
          { icon: Users,     label: "Total de clientes",value: counts.ALL,      color: "bg-brand-50 text-brand-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", s.color)}>
              <s.icon className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Busca + filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou abordagem..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent"
          />
        </div>

        {/* Filtros de status */}
        <div className="flex gap-2">
          {(["ALL", "ACTIVE", "WAITLIST"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                statusFilter === s
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              {s === "ALL" ? `Todos (${counts.ALL})` : s === "ACTIVE" ? `Ativos (${counts.ACTIVE})` : `Espera (${counts.WAITLIST})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela / Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <UserX className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum cliente encontrado</p>
          <p className="text-gray-400 text-sm mt-1">Tente outra busca ou cadastre um novo cliente</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Cabeçalho da tabela — visível em desktop */}
          <div className="hidden md:grid grid-cols-[2fr_1.2fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-gray-50 bg-gray-50/60">
            {["Paciente", "Abordagem", "Sessões", "Última sessão", ""].map((h) => (
              <p key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</p>
            ))}
          </div>

          <div className="divide-y divide-gray-50">
            {filtered.map((client) => {
              const status = STATUS_CONFIG[client.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.INACTIVE;
              const approachColor = APPROACH_COLORS[client.approachLabel] || "bg-gray-50 text-gray-600";

              return (
                <Link
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                  className="flex md:grid md:grid-cols-[2fr_1.2fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-gray-50 transition-colors group"
                >
                  {/* Paciente */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: client.color }}
                    >
                      {client.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
                      <p className="text-xs text-gray-400 truncate">{client.email}</p>
                    </div>
                    {/* Status dot */}
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0 hidden md:block", status.dot)} title={status.label} />
                  </div>

                  {/* Abordagem */}
                  <div className="hidden md:flex">
                    <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", approachColor)}>
                      {client.approachLabel}
                    </span>
                  </div>

                  {/* Sessões */}
                  <div className="hidden md:block">
                    <p className="text-sm font-semibold text-gray-800">{client.totalSessions}</p>
                    <p className="text-xs text-gray-400">{client.sessionFrequency}</p>
                  </div>

                  {/* Última sessão */}
                  <div className="hidden md:block">
                    {client.lastSession ? (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {formatDate(client.lastSession)}
                      </div>
                    ) : (
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", status.badge)}>
                        {status.label}
                      </span>
                    )}
                  </div>

                  {/* Seta */}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-400 transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
