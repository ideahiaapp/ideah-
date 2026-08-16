"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign, Loader2, Check } from "lucide-react";
import { getClients, getSessions } from "@/lib/db";
import { getClinicSettings } from "@/lib/clinic-settings";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/database.types";
import type { SessionWithClient } from "@/lib/db/sessions";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pluralSessions(n: number): string {
  return n === 1 ? "1 sessão" : `${n} sessões`;
}

type MonthBucket = {
  ym: string; label: string; full: string;
  billedCount: number; revenue: number;
};

export default function FaturamentoPage() {
  const { user } = useAuthStore();

  const [clients,  setClients]  = useState<Client[]>([]);
  const [sessions, setSessions] = useState<SessionWithClient[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selectedYms, setSelectedYms] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([getClients(user.id), getSessions(user.id)])
      .then(([c, s]) => { setClients(c); setSessions(s); })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const defaultPrice = getClinicSettings().sessionPrice;
  const billedSessions = useMemo(() => sessions.filter(s => s.status !== "cancelled"), [sessions]);

  const MONTHS: MonthBucket[] = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthSessions = billedSessions.filter(s => s.date.startsWith(ym));
      return {
        ym,
        label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        full:  d.toLocaleDateString("pt-BR", { month: "long" }),
        billedCount: monthSessions.length,
        /* price fica null quando a sessão usa o valor padrão da clínica */
        revenue: monthSessions.reduce((a, s) => a + (s.price ?? defaultPrice), 0),
      };
    });
  }, [billedSessions, defaultPrice]);

  /* Seleciona todos os meses por padrão, assim que carregarem */
  useEffect(() => {
    if (MONTHS.length > 0 && selectedYms.length === 0 && !loading) {
      setSelectedYms(MONTHS.map(m => m.ym));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  function toggleMonth(ym: string) {
    setSelectedYms(prev => prev.includes(ym) ? prev.filter(y => y !== ym) : [...prev, ym]);
  }

  const selectedMonths = MONTHS.filter(m => selectedYms.includes(m.ym));
  const totalRevenue   = selectedMonths.reduce((a, m) => a + m.revenue, 0);
  const totalSessions  = selectedMonths.reduce((a, m) => a + m.billedCount, 0);
  const avgPerSession  = totalSessions > 0 ? totalRevenue / totalSessions : 0;

  const activeClients = clients.filter(c => c.status === "ACTIVE");
  const perClient = useMemo(() => {
    return activeClients.map(c => {
      /* Faturamento vem da Agenda: soma o valor de cada sessão agendada
         (não cancelada) deste cliente, restrito aos meses selecionados. */
      const clientSessions = billedSessions.filter(
        s => s.client_id === c.id && selectedYms.includes(s.date.slice(0, 7))
      );
      const revenue = clientSessions.reduce((a, s) => a + (s.price ?? defaultPrice), 0);
      return { ...c, sessions: clientSessions.length, revenue };
    }).sort((a, b) => b.revenue - a.revenue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClients, billedSessions, selectedYms, defaultPrice]);
  const maxRevenue = Math.max(...perClient.map(c => c.revenue), 1);
  const maxMonthRevenue = Math.max(...MONTHS.map(m => m.revenue), 1);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <Link href="/dashboard/reports" aria-label="Voltar"
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-ink">Faturamento</h1>
          <p className="text-gray-500 text-sm">{formatBRL(totalRevenue)} nos meses selecionados</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total selecionado", value: formatBRL(totalRevenue), sub: pluralSessions(totalSessions) },
          { label: "Meses selecionados", value: String(selectedMonths.length), sub: "de 6 disponíveis" },
          { label: "Valor médio/sessão", value: formatBRL(avgPerSession), sub: "calculado da agenda" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-lg font-bold text-gray-800 mt-0.5">{s.value}</p>
            <p className="text-[10px] text-gray-500">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Meses</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedYms(MONTHS.map(m => m.ym))}
              className="text-[11px] font-medium text-brand-600 hover:text-brand-700">
              Selecionar todos
            </button>
            <button onClick={() => setSelectedYms([])}
              className="text-[11px] font-medium text-gray-400 hover:text-gray-600">
              Limpar
            </button>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">Clique para incluir ou remover um mês do cálculo abaixo.</p>
        <div className="space-y-2">
          {MONTHS.map(m => {
            const selected = selectedYms.includes(m.ym);
            const pct = Math.round(m.revenue / maxMonthRevenue * 100);
            return (
              <button
                key={m.ym}
                onClick={() => toggleMonth(m.ym)}
                className={cn(
                  "w-full text-left rounded-xl p-3 border transition-colors",
                  selected ? "bg-brand-50 border-brand-200" : "bg-gray-50 border-transparent hover:border-gray-200"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn("flex items-center gap-2 text-xs font-semibold capitalize", selected ? "text-brand-700" : "text-gray-500")}>
                    <span className={cn(
                      "w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0",
                      selected ? "border-brand-500 bg-brand-500" : "border-gray-300"
                    )}>
                      {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </span>
                    {m.full}
                  </span>
                  <span className={cn("text-xs font-bold", selected ? "text-brand-700" : "text-gray-500")}>
                    {formatBRL(m.revenue)} · {pluralSessions(m.billedCount)}
                  </span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-100 ml-6">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: selected ? "#C2542F" : "#D1D5DB" }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Por cliente</p>
        <p className="text-[11px] text-gray-400 mb-3">
          {selectedMonths.length === 0
            ? "Selecione ao menos um mês acima para ver o detalhamento por cliente."
            : `Referente a ${selectedMonths.map(m => m.full).join(", ")}.`}
        </p>
        <div className="space-y-3">
          {selectedMonths.length > 0 && perClient.map(c => (
            <div key={c.id}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                  style={{ backgroundColor: c.color ?? "#C2542F" }}>{c.initials ?? c.name[0]}</div>
                <span className="text-xs font-medium text-gray-700 flex-1">{c.name}</span>
                <span className="text-xs font-bold text-gray-600">{formatBRL(c.revenue)} ({pluralSessions(c.sessions)})</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                  style={{ width: `${Math.round(c.revenue / maxRevenue * 100)}%`, backgroundColor: c.color ?? "#C2542F" }} />
              </div>
            </div>
          ))}
          {selectedMonths.length > 0 && perClient.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum cliente ativo</p>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 text-[11px] text-gray-500 leading-relaxed px-1 pb-6">
        <DollarSign className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        Valores calculados a partir do preço de cada sessão agendada (Agenda). Sessões canceladas não são contabilizadas.
      </div>
    </div>
  );
}
