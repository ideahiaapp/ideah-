"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, Briefcase, Clock, Calendar, FileText,
  MessageSquare, Plus, ChevronRight, Pencil, Sparkles, Target,
  UserCheck, Hourglass, Activity, Loader2,
} from "lucide-react";
import { getClient, getEvolutionsByClient, getSupervisionsByClient } from "@/lib/db";
import { formatDate, cn } from "@/lib/utils";
import type { Client, Evolution, Supervision } from "@/lib/database.types";

type Tab = "prontuario" | "evolucoes" | "supervisoes";

const STATUS_CONFIG = {
  ACTIVE:   { label: "Ativo",           badge: "bg-green-50 text-green-700 border-green-200",  icon: UserCheck },
  WAITLIST: { label: "Lista de espera", badge: "bg-amber-50 text-amber-700 border-amber-200",  icon: Hourglass },
  INACTIVE: { label: "Inativo",         badge: "bg-gray-50  text-gray-500  border-gray-200",   icon: Activity  },
};

function calcAge(dateStr: string) {
  const birth = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function ClientDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [tab, setTab] = useState<Tab>("prontuario");

  const [client,      setClient]      = useState<Client | null>(null);
  const [evolutions,  setEvolutions]  = useState<Evolution[]>([]);
  const [supervisions,setSupervisions]= useState<Supervision[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getClient(id),
      getEvolutionsByClient(id),
      getSupervisionsByClient(id),
    ])
      .then(([c, evs, svs]) => { setClient(c); setEvolutions(evs); setSupervisions(svs); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
    </div>
  );

  if (error || !client) return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <p className="text-gray-400 mb-4">{error ?? "Cliente não encontrado."}</p>
      <Link href="/dashboard/clients" className="text-brand-500 hover:underline text-sm font-medium">
        ← Voltar para clientes
      </Link>
    </div>
  );

  const status     = STATUS_CONFIG[client.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.INACTIVE;
  const StatusIcon = status.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-ink">{client.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{client.approach_label} · {client.total_sessions} sessões</p>
          </div>
        </div>
        <Link href={`/dashboard/clients/${client.id}/edit`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          <Pencil className="w-3.5 h-3.5" /> Editar
        </Link>
      </div>

      {/* Card de identidade */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-sm"
            style={{ backgroundColor: client.color ?? "#924B92" }}>
            {client.initials ?? client.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <h2 className="text-lg font-bold text-gray-900">{client.name}</h2>
              <span className={cn("flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium", status.badge)}>
                <StatusIcon className="w-3 h-3" strokeWidth={2} />
                {status.label}
              </span>
              <span className="text-xs bg-brand-50 text-brand-600 px-2.5 py-1 rounded-full font-medium border border-brand-100">
                {client.approach_label}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {client.email      && <InfoItem icon={Mail}     label="E-mail"      value={client.email} />}
              {client.phone      && <InfoItem icon={Phone}    label="Telefone"    value={client.phone} />}
              {client.occupation && <InfoItem icon={Briefcase}label="Profissão"   value={client.occupation} />}
              {client.birth_date && <InfoItem icon={Calendar} label="Idade"       value={`${calcAge(client.birth_date)} anos (${formatDate(new Date(client.birth_date))})`} />}
              {client.start_date && <InfoItem icon={Clock}    label="Desde"       value={formatDate(new Date(client.start_date))} />}
              {client.session_frequency && <InfoItem icon={Activity} label="Frequência" value={`${client.session_frequency} · ${client.session_duration}min`} />}
            </div>
          </div>
        </div>

        {client.next_session && (
          <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-brand-500" strokeWidth={1.8} />
              </div>
              <span className="text-gray-500">Próxima sessão:</span>
              <span className="font-semibold text-gray-800">{formatDate(new Date(client.next_session))}</span>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/evolutions/new?clientId=${client.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Nova evolução
              </Link>
              <Link href={`/dashboard/supervision?client=${client.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 border border-brand-200 text-xs font-semibold text-brand-700 transition-colors">
                <Sparkles className="w-3.5 h-3.5" /> Supervisionar
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { id: "prontuario",  label: "Prontuário",                              icon: FileText      },
          { id: "evolucoes",   label: `Evoluções (${evolutions.length})`,        icon: Target        },
          { id: "supervisoes", label: `Supervisões (${supervisions.length})`,    icon: MessageSquare },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === t.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            )}>
            <t.icon className="w-3.5 h-3.5" strokeWidth={1.8} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Prontuário */}
      {tab === "prontuario" && (
        <div className="space-y-4">
          <ProntuarioSection title="Demanda principal" icon={Target}>
            <p className="text-sm text-gray-700 leading-relaxed">
              {client.main_demand || <span className="text-gray-400 italic">Não registrado</span>}
            </p>
          </ProntuarioSection>
          <ProntuarioSection title="Observações clínicas" icon={FileText}>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {client.notes || <span className="text-gray-400 italic">Sem observações registradas</span>}
            </p>
          </ProntuarioSection>
          {client.referral && (
            <ProntuarioSection title="Como chegou até você" icon={Activity}>
              <p className="text-sm text-gray-700">{client.referral}</p>
            </ProntuarioSection>
          )}
          {client.emergency_contact && (
            <ProntuarioSection title="Contato de emergência" icon={Phone}>
              <p className="text-sm text-gray-700">{client.emergency_contact}</p>
            </ProntuarioSection>
          )}
        </div>
      )}

      {/* Tab: Evoluções */}
      {tab === "evolucoes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{evolutions.length} evoluções registradas</p>
            <Link href={`/dashboard/evolutions/new?clientId=${client.id}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:text-brand-700">
              <Plus className="w-3.5 h-3.5" /> Nova evolução
            </Link>
          </div>
          {evolutions.length === 0 ? (
            <EmptyState icon={FileText} text="Nenhuma evolução registrada para este cliente." />
          ) : (
            evolutions.map(ev => (
              <Link key={ev.id} href={`/dashboard/evolutions/${ev.id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-brand-200 hover:shadow-md transition-all p-5 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(new Date(ev.session_date))}
                      </span>
                      {ev.session_number && <>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">Sessão #{ev.session_number}</span>
                      </>}
                    </div>
                    {ev.hypothesis && <p className="text-sm font-semibold text-brand-600 mb-1">{ev.hypothesis}</p>}
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{ev.content}</p>
                    {ev.ai_hypothesis && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-purple-500">
                        <Sparkles className="w-3 h-3" /> Hipótese IA
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-400 flex-shrink-0 mt-1 transition-colors" />
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Tab: Supervisões */}
      {tab === "supervisoes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{supervisions.length} supervisões sobre este caso</p>
            <Link href={`/dashboard/supervision?client=${client.id}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:text-brand-700">
              <Plus className="w-3.5 h-3.5" /> Nova supervisão
            </Link>
          </div>
          {supervisions.length === 0 ? (
            <EmptyState icon={MessageSquare} text="Nenhuma supervisão sobre este caso ainda." />
          ) : (
            supervisions.map(sv => (
              <Link key={sv.id} href={`/dashboard/supervision`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-brand-200 hover:shadow-md transition-all p-5 group">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-800 truncate">{sv.title}</p>
                      <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0 border border-brand-100">
                        {sv.approach}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{formatDate(new Date(sv.updated_at))}</p>
                    <p className="text-xs text-gray-300 mt-1">{sv.messages_count} msgs</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={1.8} />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-xs font-medium text-gray-700 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function ProntuarioSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
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

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
      <Icon className="w-8 h-8 text-gray-200 mx-auto mb-3" strokeWidth={1.5} />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}
