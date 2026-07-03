"use client";

import { useState, useEffect, useRef } from "react";
import { ScrollText, Sparkles, ChevronDown, Loader2, AlertTriangle, Download } from "lucide-react";
import { getClients } from "@/lib/db";
import { aiHeaders } from "@/lib/api-key";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/database.types";

const PERIOD_OPTIONS = [
  { value: "1m",  label: "Último mês" },
  { value: "3m",  label: "Últimos 3 meses" },
  { value: "6m",  label: "Últimos 6 meses" },
  { value: "1y",  label: "Último ano" },
  { value: "all", label: "Todo o período de atendimento" },
];

function MarkdownReport({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("# "))   return <h1  key={i} className="text-xl font-bold text-gray-900 mt-2">{line.slice(2)}</h1>;
        if (line.startsWith("## "))  return <h2  key={i} className="text-base font-bold text-gray-800 mt-5 pb-1 border-b border-gray-100">{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3  key={i} className="text-sm font-semibold text-gray-700 mt-3">{line.slice(4)}</h3>;
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i}>
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
          </p>
        );
      })}
    </div>
  );
}

export default function EvolutionPage() {
  const { user } = useAuthStore();
  const [clients,  setClients]  = useState<Client[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [clientId, setClientId] = useState("");
  const [period,   setPeriod]   = useState("3m");
  const [generating, setGenerating] = useState(false);
  const [report,   setReport]   = useState<{ report: string; clientName: string; sessionCount: number; period: string; dateRange: string } | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    getClients(user.id)
      .then(c => setClients(c))
      .finally(() => setLoading(false));
  }, [user?.id]);

  async function generate() {
    if (!clientId || !user?.id) return;
    setGenerating(true);
    setReport(null);
    setError(null);
    try {
      const res = await fetch("/api/reports/clinical-evolution", {
        method:  "POST",
        headers: await aiHeaders(),
        body:    JSON.stringify({ clientId, therapistId: user.id, period }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar relatório");
      setReport(data);
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setGenerating(false);
    }
  }

  const activeClients = clients.filter(c => c.status === "ACTIVE");

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink">Evolução</h1>
        <p className="text-gray-400 text-sm mt-0.5">Relatório de evolução clínica gerado por IA</p>
      </div>

      {/* Seletor */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <ScrollText className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
          <h3 className="text-sm font-semibold text-gray-800">Gerar relatório de evolução clínica</h3>
          <span className="ml-auto text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full border border-brand-100 font-medium">IA</span>
        </div>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          Selecione um paciente e o período desejado. A IA analisará todas as evoluções e supervisões registradas e gerará um relatório clínico detalhado.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Paciente</label>
            <div className="relative">
              <select
                value={clientId}
                onChange={e => { setClientId(e.target.value); setReport(null); setError(null); }}
                className="w-full appearance-none px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 pr-9 text-gray-800"
              >
                <option value="">Selecionar paciente...</option>
                {activeClients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Período de análise</label>
            <div className="relative">
              <select
                value={period}
                onChange={e => { setPeriod(e.target.value); setReport(null); setError(null); }}
                className="w-full appearance-none px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 pr-9 text-gray-800"
              >
                {PERIOD_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <button
          onClick={generate}
          disabled={!clientId || generating}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all",
            clientId && !generating
              ? "bg-brand-500 hover:bg-brand-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
        >
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando relatório...</>
            : <><Sparkles className="w-4 h-4" /> Gerar relatório</>}
        </button>

        {error && (
          <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Skeleton */}
      {generating && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-gray-100 rounded-lg w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
          <div className="space-y-2 pt-4">
            {[100, 80, 90, 70, 85, 75].map((w, i) => (
              <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      )}

      {/* Relatório */}
      {report && (
        <div ref={reportRef} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div>
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
                <p className="text-sm font-bold text-gray-800">{report.clientName}</p>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {report.period} · {report.sessionCount} sessões analisadas · {report.dateRange}
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>
          </div>

          <div className="px-6 py-5">
            <MarkdownReport text={report.report} />
          </div>

          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-[10px] text-gray-400">
              Relatório gerado por IA com base nos registros clínicos. Não substitui avaliação clínica profissional.
            </p>
          </div>
        </div>
      )}

      {!report && !generating && !error && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <ScrollText className="w-10 h-10 text-gray-200 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-gray-500">Nenhum relatório gerado</p>
          <p className="text-xs text-gray-400 mt-1">Selecione um paciente e o período para gerar o relatório de evolução clínica.</p>
        </div>
      )}
    </div>
  );
}
