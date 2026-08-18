"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart3, Loader2, AlertTriangle, ChevronDown, RefreshCw, Users, Smartphone, Download } from "lucide-react";
import { adminHeaders } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

type SurveyResponse = {
  id: string;
  therapist_name: string | null;
  therapist_email: string | null;
  answers: Record<string, string | string[]>;
  platform: string | null;
  created_at: string;
};

const QUESTION_LABELS: Record<string, string> = {
  q1: "1. Formação/situação profissional",
  q2: "2. Momento da trajetória profissional",
  q3: "3. Realiza atendimentos atualmente?",
  q4: "4. Abordagem/referencial teórico principal",
  q5: "5. Situações vivenciadas antes do Paideia",
  q6: "6. Maior dificuldade diante de um caso não compreendido",
  q7: "7. Frequência de uso do Paideia no teste",
  q8: "8. Atividades para as quais usou o Paideia",
  q9: "9. Quanto ajudou a refletir sobre casos/prática (0-10)",
  q10: "10. Quanto ajudou a relacionar teoria e prática (0-10)",
  q11: "11. O que o Paideia principalmente fazia",
  q12: "12. Perguntas que revelaram aspectos não considerados",
  q13: "13. Compreensão da própria hipótese/possibilidade clínica",
  q14: "14. Modificou compreensão anterior sobre um caso?",
  q14_1: "14.1. O que mudou na compreensão",
  q15: "15. Já usou IA generalista para refletir profissionalmente?",
  q16: "16. Paideia pareceu diferente de uma IA generalista?",
  q17: "17. Principal diferença percebida",
  q18: "18. Informações úteis de visualizar ao longo do tempo",
  q19: "19. Valor de visualizar o próprio aprendizado",
  q20: "20. Registro organizado aumentaria o valor do Paideia?",
  q21: "21. Relevância de um registro/certificação do percurso",
  q22: "22. O que faria se o teste gratuito acabasse hoje",
  q23: "23. Avaliação do preço R$147/mês por abordagem",
  q24: "24. O que faria R$147/mês valer a pena",
  q25: "25. Probabilidade de continuar usando (0-10)",
  q26: "26. Probabilidade de recomendar — NPS (0-10)",
  q27: "27. Parte MAIS valiosa da experiência",
  q28: "28. Parte MENOS útil ou mais frustrante",
  q29: "29. Momento de desconfiança/incompreensão/discordância",
  q30: "30. Uma coisa que mudaria no Paideia",
  q31: "31. Funcionalidade indispensável ainda não encontrada",
  q32: "32. Depoimento em uma ou duas frases",
  q33: "33. Autorização de uso do depoimento",
};

const QUESTION_ORDER = Object.keys(QUESTION_LABELS);

function formatAnswer(v: string | string[] | undefined): string {
  if (v === undefined || v === null || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  return v;
}

async function exportResponsesToExcel(responses: SurveyResponse[]) {
  const XLSX = await import("xlsx");

  const rows = responses.map(r => {
    const row: Record<string, string> = {
      "Nome do terapeuta": r.therapist_name ?? "",
      "E-mail": r.therapist_email ?? "",
      "Plataforma": r.platform ?? "web",
      "Data da resposta": new Date(r.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
    };
    for (const key of QUESTION_ORDER) {
      row[QUESTION_LABELS[key]] = formatAnswer(r.answers[key]);
    }
    return row;
  });

  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Respostas");

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `pesquisa-satisfacao-paideia-${today}.xlsx`);
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function toScale(responses: SurveyResponse[], key: string): number[] {
  return responses
    .map(r => Number(r.answers[key]))
    .filter(n => !Number.isNaN(n));
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">
        <span className="font-medium text-gray-600">{label}</span>{sub ? ` · ${sub}` : ""}
      </p>
    </div>
  );
}

function DistributionBar({ title, responses, questionKey }: { title: string; responses: SurveyResponse[]; questionKey: string }) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of responses) {
      const raw = r.answers[questionKey];
      const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
      for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [responses, questionKey]);

  const total = responses.length || 1;

  if (counts.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm font-bold text-gray-800 mb-3">{title}</p>
      <div className="space-y-2">
        {counts.map(([label, count]) => (
          <div key={label}>
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span className="truncate pr-2">{label}</span>
              <span className="flex-shrink-0 font-semibold">{count}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-400 rounded-full" style={{ width: `${(count / total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResponseRow({ r }: { r: SurveyResponse }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors text-left">
        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform flex-shrink-0", !open && "-rotate-90")} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{r.therapist_name ?? "—"}</p>
          <p className="text-xs text-gray-500 truncate">{r.therapist_email}</p>
        </div>
        <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
          <Smartphone className="w-3 h-3" /> {r.platform ?? "web"}
        </span>
        <span className="text-xs text-gray-400 flex-shrink-0">
          {new Date(r.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
          {QUESTION_ORDER.filter(k => r.answers[k] !== undefined).map(k => (
            <div key={k}>
              <p className="text-xs font-semibold text-gray-500">{QUESTION_LABELS[k]}</p>
              <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap">{formatAnswer(r.answers[k])}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SurveyResultsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true); setError(null);
    adminHeaders().then(headers =>
      fetch("/api/satisfaction-survey", { headers, cache: "no-store" })
        .then(async r => {
          const d = await r.json();
          if (!r.ok) throw new Error(d.error ?? "Erro ao carregar respostas.");
          setResponses(d.responses ?? []);
        })
        .catch(e => setError(e instanceof Error ? e.message : "Erro ao carregar respostas."))
        .finally(() => setLoading(false))
    );
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const nps = useMemo(() => {
    const scores = toScale(responses, "q26");
    if (scores.length === 0) return null;
    const promoters  = scores.filter(s => s >= 9).length;
    const detractors = scores.filter(s => s <= 6).length;
    return Math.round(((promoters - detractors) / scores.length) * 100);
  }, [responses]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <p className="text-gray-600 text-sm">Esta página é restrita a administradores.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-brand-500" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">Resultados da Pesquisa de Satisfação</h1>
            <p className="text-gray-500 text-sm">Respostas agregadas do Formulário de Validação do MVP</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportResponsesToExcel(responses)} disabled={loading || responses.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-xl transition-colors">
            <Download className="w-3.5 h-3.5" /> Baixar Excel
          </button>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-xl transition-colors">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
        </div>
      ) : responses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma resposta registrada ainda.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Respostas" value={String(responses.length)} sub="total" />
            <StatCard label="Reflexão sobre a prática" value={avg(toScale(responses, "q9"))?.toFixed(1) ?? "—"} sub="média 0-10" />
            <StatCard label="Teoria x prática" value={avg(toScale(responses, "q10"))?.toFixed(1) ?? "—"} sub="média 0-10" />
            <StatCard label="NPS" value={nps !== null ? String(nps) : "—"} sub="recomendação" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <DistributionBar title="Formação/situação profissional" responses={responses} questionKey="q1" />
            <DistributionBar title="Frequência de uso no teste" responses={responses} questionKey="q7" />
            <DistributionBar title="Intenção após o período gratuito" responses={responses} questionKey="q22" />
            <DistributionBar title="Percepção do preço (R$147/mês)" responses={responses} questionKey="q23" />
          </div>

          <div>
            <p className="text-sm font-bold text-gray-700 mb-3">Respostas individuais ({responses.length})</p>
            <div className="space-y-3">
              {responses.map(r => <ResponseRow key={r.id} r={r} />)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
