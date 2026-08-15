"use client";

import { useState, useEffect } from "react";
import { Award, ChevronDown, Loader2, AlertTriangle, Sparkles, Download } from "lucide-react";
import { adminHeaders } from "@/lib/supabase";
import { aiHeaders } from "@/lib/api-key";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { CertificateTemplate, CertificateBackTemplate } from "@/components/certificate/CertificateTemplate";
import { HowItWorksTrigger, type HowItWorksContent } from "@/components/dashboard/HowItWorksModal";

const CERTIFICATE_HOW_IT_WORKS: HowItWorksContent = {
  title: "Certificado de Supervisão",
  subtitle: "Emite o certificado de Formação Clínica Continuada com base nas horas de supervisão realizadas no sistema.",
  steps: [
    { title: "Selecione o período", desc: "1 mês, 3 meses, 6 meses ou 1 ano." },
    { title: "Gere o certificado", desc: "Um certificado é criado para cada abordagem teórica usada em supervisões dentro do período." },
    { title: "Baixe em PDF", desc: "Use \"Baixar PDF\" e escolha \"Salvar como PDF\" na janela de impressão do navegador." },
  ],
};

// Tolerante a maiúsculas/minúsculas, acentos opcionais e prefixo markdown (#, ##, **) antes do marcador,
// já que o texto vem de uma IA e não reproduz o marcador sempre 100% literal.
const BACK_MARKER_RE = /[#*\s]*informa[cç][oõ]es\s+do\s+verso\s+do\s+certificado[:*#\s]*/i;

/** Separa o texto gerado pela IA em frente/verso a partir do marcador combinado no prompt. */
function splitCertificateText(text: string): { front: string; back: string | null } {
  const match = BACK_MARKER_RE.exec(text);
  if (!match) return { front: text.trim(), back: null };
  const front = text.slice(0, match.index).trim();
  const back = text.slice(match.index + match[0].length).trim();
  return { front, back: back || null };
}

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
  certificateText?: string;
};

function CertificateMarkdown({ text }: { text: string }) {
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

/** Formato compacto para o certificado ("2h30", "45min", "0h") — evita arredondar minutos reais para "0h". */
function formatHoursLabel(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h === 0 && m === 0) return "0h";
  if (h === 0) return `${m}min`;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
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

  const canGenerate = !!therapistId && !!period;

  const { front: frontText, back: backText } = report?.certificateText
    ? splitCertificateText(report.certificateText)
    : { front: "", back: null };

  async function handleGenerate() {
    if (!canGenerate) return;
    setLoading(true); setError(null); setReport(null);
    try {
      const headers = { ...(await adminHeaders()), ...(await aiHeaders()) };
      const params = new URLSearchParams({ therapistId, period, reportType: "detalhado" });
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
    <div className="max-w-4xl mx-auto flex flex-col gap-6 print:max-w-none print:m-0 print:gap-0">
      <div className="print-hide flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
          <Award className="w-5 h-5 text-brand-500" strokeWidth={1.8} />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-ink">Certificado de Supervisão</h1>
            <HowItWorksTrigger content={CERTIFICATE_HOW_IT_WORKS} />
          </div>
          <p className="text-gray-500 text-sm">Relatório de horas de supervisão por abordagem teórica</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="print-hide bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="print-hide flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Certificados (um por abordagem/teoria supervisionada — layout para impressão/PDF) */}
      {report && report.synthesis.length > 0 && (
        <div className="flex flex-col gap-6 print:gap-0">
          <div className="print-hide flex items-center justify-end">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 px-3.5 py-2 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar PDF{report.synthesis.length > 1 ? "s" : ""}
            </button>
          </div>
          {report.synthesis.map(row => (
            <div key={row.approach} className="flex flex-col gap-6 print:gap-0">
              <CertificateTemplate
                therapistName={report.therapist.name}
                approachLabel={APPROACH_LABELS[row.approach] ?? row.approach}
                periodLabel={`${fmtDate(report.period.start)} a ${fmtDate(report.period.end)}`}
                totalHoursLabel={formatHoursLabel(row.totalSeconds)}
                totalSessions={row.count}
              />
              {backText && <CertificateBackTemplate text={backText} />}
            </div>
          ))}
        </div>
      )}

      {/* Relatório */}
      {report && (
        <div className="print-hide bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Terapeuta</p>
            <p className="text-base font-bold text-gray-900">{report.therapist.name}</p>
            <p className="text-sm text-gray-500">{report.therapist.email}</p>
            <p className="text-xs text-gray-500 mt-2">
              Período: {fmtDate(report.period.start)} a {fmtDate(report.period.end)}
            </p>
          </div>

          {/* Certificado gerado por IA */}
          {frontText && (
            <div className="border-b border-gray-100 pb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <p className="text-sm font-bold text-gray-800">Certificado</p>
                <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full border border-brand-100 font-medium">IA</span>
              </div>
              <CertificateMarkdown text={frontText} />
            </div>
          )}

        </div>
      )}
    </div>
  );
}
