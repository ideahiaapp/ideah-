"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Clock, User, FileText, Lightbulb, Target,
  Sparkles, Pencil, Trash2, MessageSquare, Download, Loader2,
} from "lucide-react";
import { getEvolution } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { EvolutionWithClient } from "@/lib/db/evolutions";

const MOOD_LABELS: Record<number, { label: string; color: string; emoji: string }> = {
  1: { label: "Muito difícil", color: "text-red-600 bg-red-50 border-red-200",     emoji: "😟" },
  2: { label: "Difícil",       color: "text-orange-600 bg-orange-50 border-orange-200", emoji: "😕" },
  3: { label: "Neutro",        color: "text-yellow-700 bg-yellow-50 border-yellow-200", emoji: "😐" },
  4: { label: "Produtivo",     color: "text-green-600 bg-green-50 border-green-200",  emoji: "🙂" },
  5: { label: "Excelente",     color: "text-emerald-600 bg-emerald-50 border-emerald-200", emoji: "😊" },
};

function exportPdf(ev: EvolutionWithClient, mood: { label: string; emoji: string }) {
  const date      = new Date(ev.session_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const logoUrl   = `${window.location.origin}/ideah-logo.png`;
  const client    = ev.clients;
  const clientName = client?.name ?? "Cliente";
  const initials   = client?.initials ?? clientName[0];
  const color      = client?.color ?? "#924B92";
  const approach   = client?.approach_label ?? "";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Evolução — ${clientName} — ${date}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;color:#1a1a1a;padding:32px 48px;font-size:13px;line-height:1.6}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #924B92;padding-bottom:16px;margin-bottom:24px}
    .logo img{height:36px;display:block}
    .logo span{font-weight:400;color:#888;font-size:13px;display:block;margin-top:4px}
    .meta{text-align:right;color:#666;font-size:12px}
    .client-row{display:flex;align-items:center;gap:12px;background:#f9f0f9;border-radius:12px;padding:14px 18px;margin-bottom:20px}
    .avatar{width:44px;height:44px;border-radius:50%;background:${color};color:#fff;font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .client-name{font-weight:700;font-size:15px}
    .client-sub{color:#666;font-size:12px;margin-top:2px}
    .mood{margin-left:auto;font-size:12px;background:#fff;border:1px solid #e5e7eb;padding:4px 12px;border-radius:20px}
    .section{margin-bottom:18px;break-inside:avoid}
    .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#924B92;border-bottom:1px solid #f0e6f0;padding-bottom:5px;margin-bottom:10px}
    .section-body{color:#2d2d2d;white-space:pre-wrap}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px}
    .ai-box{background:#f5f0ff;border:1px solid #d8c8ff;border-radius:8px;padding:14px;break-inside:avoid}
    .ai-title{font-weight:700;color:#6d28d9;font-size:12px;margin-bottom:6px}
    .footer{margin-top:32px;border-top:1px solid #eee;padding-top:12px;font-size:10px;color:#aaa;display:flex;justify-content:space-between}
  </style>
</head>
<body>
  <div class="header">
    <div class="logo"><img src="${logoUrl}" alt="IDEAH"/><span>Evolução Clínica</span></div>
    <div class="meta">
      ${date}<br/>
      ${ev.session_number ? `Sessão nº ${ev.session_number} · ` : ""}${approach}<br/>
      Gerado em ${new Date().toLocaleDateString("pt-BR")}
    </div>
  </div>
  <div class="client-row">
    <div class="avatar">${initials}</div>
    <div>
      <div class="client-name">${clientName}</div>
      <div class="client-sub">${approach}${ev.session_number ? ` · Sessão #${ev.session_number}` : ""}</div>
    </div>
    <div class="mood">${mood.emoji} ${mood.label}</div>
  </div>
  <div class="section">
    <div class="section-title">O que aconteceu na sessão</div>
    <div class="section-body">${ev.content}</div>
  </div>
  <div class="grid">
    <div class="section">
      <div class="section-title">Hipótese clínica</div>
      <div class="section-body">${ev.hypothesis || "Não registrada"}</div>
    </div>
    <div class="section">
      <div class="section-title">Plano para próxima sessão</div>
      <div class="section-body">${ev.next_session_plan || "Não registrado"}</div>
    </div>
  </div>
  ${ev.interventions ? `<div class="section"><div class="section-title">Intervenções realizadas</div><div class="section-body">${ev.interventions}</div></div>` : ""}
  ${ev.ai_hypothesis ? `<div class="ai-box"><div class="ai-title">Hipótese gerada pela IA — somente para reflexão</div><div>${ev.ai_hypothesis}</div></div>` : ""}
  <div class="footer">
    <span>ideah · Copiloto de raciocínio clínico</span>
    <span>Res. CFP nº 21/2025 · LGPD · Sigilo profissional</span>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.print(); };
}

export default function EvolutionDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [ev,      setEv]      = useState<EvolutionWithClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    getEvolution(id)
      .then(setEv)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
    </div>
  );

  if (error || !ev) return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <p className="text-gray-400 mb-4">{error ?? "Evolução não encontrada."}</p>
      <Link href="/dashboard/evolutions" className="text-brand-500 hover:underline text-sm font-medium">
        ← Voltar para evoluções
      </Link>
    </div>
  );

  const mood   = MOOD_LABELS[ev.mood ?? 3] ?? MOOD_LABELS[3];
  const client = ev.clients;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-ink">Evolução Clínica</h1>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {formatDate(new Date(ev.session_date))}
              {ev.session_number && ` · Sessão #${ev.session_number}`}
              {client?.approach_label && ` · ${client.approach_label}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportPdf(ev, mood)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-200 bg-brand-50 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors">
            <Download className="w-3.5 h-3.5" /> Exportar PDF
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
          <button className="p-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: client?.color ?? "#924B92" }}>
              {client?.initials ?? client?.name?.[0] ?? "?"}
            </div>
            <div>
              <p className="font-bold text-gray-900">{client?.name ?? "Cliente"}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {client?.approach_label}{ev.session_number ? ` · sessão #${ev.session_number}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={cn("text-xs px-3 py-1 rounded-full border font-medium flex items-center gap-1", mood.color)}>
              <span>{mood.emoji}</span> {mood.label}
            </span>
            <Link href={`/dashboard/supervision?client=${ev.client_id}`}
              className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-700 font-medium">
              <MessageSquare className="w-3 h-3" /> Abrir supervisão deste caso
            </Link>
          </div>
        </div>
      </div>

      <InfoSection icon={FileText} title="O que aconteceu na sessão">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ev.content}</p>
      </InfoSection>

      <div className="grid md:grid-cols-2 gap-4">
        <InfoSection icon={Lightbulb} title="Hipótese clínica">
          {ev.hypothesis
            ? <p className="text-sm font-semibold text-brand-700">{ev.hypothesis}</p>
            : <p className="text-sm text-gray-400 italic">Não registrada</p>}
        </InfoSection>
        <InfoSection icon={Target} title="Plano para próxima sessão">
          {ev.next_session_plan
            ? <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ev.next_session_plan}</p>
            : <p className="text-sm text-gray-400 italic">Não registrado</p>}
        </InfoSection>
      </div>

      {ev.interventions && (
        <InfoSection icon={User} title="Intervenções realizadas">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ev.interventions}</p>
        </InfoSection>
      )}

      {ev.ai_hypothesis && (
        <div className="bg-gradient-to-br from-purple-50 to-brand-50 border border-purple-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-600" strokeWidth={1.8} />
            </div>
            <p className="text-sm font-bold text-purple-800">Hipótese gerada pela IA</p>
            <span className="ml-auto text-xs text-purple-400 bg-purple-100 px-2 py-0.5 rounded-full">Somente para reflexão</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{ev.ai_hypothesis}</p>
        </div>
      )}

      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-800">Quer aprofundar este caso?</p>
          <p className="text-xs text-brand-600 mt-0.5">Abra uma supervisão dialógica com base nesta evolução.</p>
        </div>
        <Link href={`/dashboard/supervision?client=${ev.client_id}`}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0">
          <MessageSquare className="w-4 h-4" /> Supervisionar
        </Link>
      </div>
    </div>
  );
}

function InfoSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
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
