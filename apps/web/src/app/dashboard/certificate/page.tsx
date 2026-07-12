"use client";

import { useState, useEffect } from "react";
import { Award, ChevronDown, Loader2, AlertTriangle, Clock, FileText } from "lucide-react";
import { adminHeaders } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

const APPROACH_LABELS: Record<string, string> = {
  PSYCHOANALYSIS: "Psicanálise Freudiana", COGNITIVE_BEHAVIORAL: "TCC",
  JUNGIAN: "Junguiana", SOMATIC: "Somática / Corporal", TANTRA: "Sexualidade Humana e Tantra",
  GESTALT: "Gestalt-terapia", PSYCHODRAMA: "Psicodrama", SYSTEMIC: "Constelação Familiar",
  NAO_INFORMADO: "Não informada",
};

const PERIOD_OPTIONS = [
  { value: "1m", label: "1 mês" },
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "1y", label: "1 ano" },
];

const REPORT_TYPE_OPTIONS = [
  { value: "sintetico",  label: "Sintético" },
  { value: "detalhado",  label: "Detalhado" },
];

type Therapist = { userId: string; email: string; name: string };

type SynthesisRow = { approach: string; totalSeconds: number; count: number };

type DetailedEvolution = {
  id: string; clientName: string; sessionDate: string; sessionTime: string | null;
  approach: string | null; durationSeconds: number | null;
  content: string; hypothesis: string | null; nextSessionPlan: string | null;
};

type CertificateReport = {
  therapist: { id: string; name: string; email: string };
  period: { start: string; end: string };
  synthesis: SynthesisRow[];
  totalSeconds: number;
  totalSessions: number;
  evolutions?: DetailedEvolution[];
};

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");
}

function SelectField({ label, value, onChange, options, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label} <span className="text-red-500">*</span></label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none px-4 py-2.5 pr-9 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 text-gray-800"
        >
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>
    </div>
  );
}

export default function CertificatePage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loadingTherapists, setLoadingTherapists] = useState(true);

  const [therapistId, setTherapistId] = useState("");
  const [period,      setPeriod]      = useState("");
  const [reportType,  setReportType]  = useState("");

  const [report,  setReport]  = useState<CertificateReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      // Não-admin só gera o próprio certificado — combobox com uma única opção, já selecionada.
      if (user) {
        setTherapists([{ userId: user.id, name: user.name, email: user.email }]);
        setTherapistId(user.id);
      }
      setLoadingTherapists(false);
      return;
    }
    adminHeaders().then(headers =>
      fetch("/api/admin/therapists", { headers })
        .then(r => r.json())
        .then(d => setTherapists(Array.isArray(d) ? d : []))
        .catch(() => setError("Não foi possível carregar a lista de terapeutas."))
        .finally(() => setLoadingTherapists(false))
    );
  }, [isAdmin, user]);

  const canGenerate = !!therapistId && !!period && !!reportType;

  async function handleGenerate() {
    if (!canGenerate) return;
    setLoading(true); setError(null); setReport(null);
    try {
      const headers = await adminHeaders();
      const params = new URLSearchParams({ therapistId, period, reportType });
      const res = await fetch(`/api/certificate?${params}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar certificado.");
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar certificado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
          <Award className="w-5 h-5 text-brand-500" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">Certificado de Supervisão</h1>
          <p className="text-gray-500 text-sm">Relatório de horas de supervisão por abordagem teórica</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField
            label="Terapeuta"
            value={therapistId}
            onChange={setTherapistId}
            placeholder={loadingTherapists ? "Carregando…" : "Selecionar..."}
            options={therapists.map(t => ({ value: t.userId, label: `${t.name} (${t.email})` }))}
          />
          <SelectField
            label="Período"
            value={period}
            onChange={setPeriod}
            placeholder="Selecionar..."
            options={PERIOD_OPTIONS}
          />
          <SelectField
            label="Tipo de relatório"
            value={reportType}
            onChange={setReportType}
            placeholder="Selecionar..."
            options={REPORT_TYPE_OPTIONS}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!canGenerate || loading}
          className={cn(
            "mt-5 w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors",
            canGenerate && !loading
              ? "bg-brand-500 hover:bg-brand-600 text-white"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</> : <><Award className="w-4 h-4" /> Gerar certificado</>}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Relatório */}
      {report && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Terapeuta</p>
            <p className="text-base font-bold text-gray-900">{report.therapist.name}</p>
            <p className="text-sm text-gray-500">{report.therapist.email}</p>
            <p className="text-xs text-gray-500 mt-2">
              Período: {fmtDate(report.period.start)} a {fmtDate(report.period.end)}
            </p>
          </div>

          {/* Síntese */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-brand-500" />
              <p className="text-sm font-bold text-gray-800">Tempo de supervisão por abordagem</p>
            </div>

            {report.synthesis.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Nenhuma supervisão registrada neste período.</p>
            ) : (
              <div className="space-y-1.5">
                {report.synthesis.map(row => (
                  <div key={row.approach} className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50">
                    <span className="text-sm font-medium text-gray-700">{APPROACH_LABELS[row.approach] ?? row.approach}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">{row.count} sessão(ões)</span>
                      <span className="text-sm font-bold text-brand-700 tabular-nums">{formatDuration(row.totalSeconds)}</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-brand-50 border border-brand-100 mt-2">
                  <span className="text-sm font-bold text-brand-800">Total geral</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-brand-600">{report.totalSessions} sessão(ões)</span>
                    <span className="text-sm font-bold text-brand-800 tabular-nums">{formatDuration(report.totalSeconds)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Detalhado */}
          {report.evolutions && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-bold text-gray-800">Supervisões realizadas no período</p>
              </div>

              {report.evolutions.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Nenhuma supervisão registrada neste período.</p>
              ) : (
                <div className="space-y-3">
                  {report.evolutions.map(ev => (
                    <div key={ev.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-800">{ev.clientName}</span>
                        <span className="text-xs text-gray-500">
                          {fmtDate(ev.sessionDate)}{ev.sessionTime && ` às ${ev.sessionTime.slice(0, 5)} h`}
                        </span>
                        {ev.approach && (
                          <span className="text-[10px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            {APPROACH_LABELS[ev.approach] ?? ev.approach}
                          </span>
                        )}
                        {ev.durationSeconds != null && (
                          <span className="text-[10px] font-semibold text-brand-600 tabular-nums">
                            {formatDuration(ev.durationSeconds)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{ev.content}</p>
                      {ev.hypothesis && (
                        <p className="text-xs text-gray-600 mt-2"><strong>Hipótese clínica:</strong> {ev.hypothesis}</p>
                      )}
                      {ev.nextSessionPlan && (
                        <p className="text-xs text-gray-600 mt-1"><strong>Plano para próxima sessão:</strong> {ev.nextSessionPlan}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
