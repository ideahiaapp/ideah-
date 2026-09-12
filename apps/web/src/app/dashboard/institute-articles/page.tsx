"use client";

import { useState, useEffect } from "react";
import {
  Newspaper, Loader2, AlertTriangle, Plus, Pencil, Trash2, ArrowLeft,
  Eye, EyeOff, Save, ExternalLink,
} from "lucide-react";
import { adminHeaders } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import { API_BASE } from "@/lib/api-base";

type ArticleListItem = {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  illustration: string;
  published: boolean;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type ArticleFull = ArticleListItem & { body: string };

const ILLUSTRATIONS: { id: string; label: string }[] = [
  { id: "network", label: "Constelação (rede de pontos)" },
  { id: "path",    label: "Trajetória (círculos crescentes)" },
  { id: "circles", label: "Diálogo (círculos sobrepostos)" },
  { id: "loop",    label: "Laço (troca/retorno)" },
];

const SITE_INSTITUTO_URL = "https://site-instituto-indol.vercel.app";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function emptyDraft(): { title: string; category: string; excerpt: string; body: string; illustration: string; published: boolean } {
  return { title: "", category: "Artigo", excerpt: "", body: "", illustration: "network", published: false };
}

export default function InstituteArticlesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const [view, setView] = useState<"list" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function load() {
    setLoading(true); setError(null);
    adminHeaders().then(headers =>
      fetch(`${API_BASE}/api/admin/institute-articles`, { headers, cache: "no-store" })
        .then(async r => {
          const d = await r.json();
          if (!r.ok) throw new Error(d.error ?? "Erro ao carregar artigos.");
          setArticles(d.articles ?? []);
        })
        .catch(e => setError(e instanceof Error ? e.message : "Erro ao carregar artigos."))
        .finally(() => setLoading(false))
    );
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  function startNew() {
    setEditingId(null);
    setDraft(emptyDraft());
    setSaveError(null);
    setView("edit");
  }

  async function startEdit(id: string) {
    setEditingId(id);
    setSaveError(null);
    setView("edit");
    setDraft(emptyDraft());
    const headers = await adminHeaders();
    const r = await fetch(`${API_BASE}/api/admin/institute-articles/${id}`, { headers, cache: "no-store" });
    const d = await r.json();
    if (r.ok) {
      const a = d.article as ArticleFull;
      setDraft({
        title: a.title, category: a.category, excerpt: a.excerpt,
        body: a.body, illustration: a.illustration, published: a.published,
      });
    } else {
      setSaveError(d.error ?? "Erro ao carregar artigo.");
    }
  }

  async function save(publishOverride?: boolean) {
    if (!draft.title.trim() || !draft.excerpt.trim() || !draft.body.trim()) {
      setSaveError("Preencha título, resumo e texto.");
      return;
    }
    setSaving(true); setSaveError(null);
    const payload = { ...draft, published: publishOverride ?? draft.published };
    const headers = await adminHeaders();
    try {
      const r = editingId
        ? await fetch(`${API_BASE}/api/admin/institute-articles/${editingId}`, {
            method: "PATCH", headers, body: JSON.stringify(payload),
          })
        : await fetch(`${API_BASE}/api/admin/institute-articles`, {
            method: "POST", headers, body: JSON.stringify(payload),
          });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Erro ao salvar.");
      setView("list");
      load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(a: ArticleListItem) {
    const headers = await adminHeaders();
    await fetch(`${API_BASE}/api/admin/institute-articles/${a.id}`, {
      method: "PATCH", headers, body: JSON.stringify({ published: !a.published }),
    });
    load();
  }

  async function remove(a: ArticleListItem) {
    if (!confirm(`Excluir o artigo "${a.title}"? Essa ação não pode ser desfeita.`)) return;
    const headers = await adminHeaders();
    await fetch(`${API_BASE}/api/admin/institute-articles/${a.id}`, { method: "DELETE", headers });
    load();
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <p className="text-gray-600 text-sm">Esta página é restrita a administradores.</p>
      </div>
    );
  }

  if (view === "edit") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para a lista
        </button>

        <div>
          <h1 className="text-xl font-bold text-ink">{editingId ? "Editar artigo" : "Novo artigo"}</h1>
          <p className="text-gray-500 text-sm">Aparece na seção "Publicações Recentes" do site institucional quando publicado.</p>
        </div>

        {saveError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {saveError}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Categoria/tag</label>
              <input
                type="text" value={draft.category}
                onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
                placeholder="Ensaio, Artigo, Revisão..."
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ilustração do card</label>
              <select
                value={draft.illustration}
                onChange={e => setDraft(d => ({ ...d, illustration: e.target.value }))}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300"
              >
                {ILLUSTRATIONS.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Título</label>
            <input
              type="text" value={draft.title}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              placeholder="Título do artigo"
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Resumo (aparece no card, na home)</label>
            <textarea
              value={draft.excerpt} rows={2}
              onChange={e => setDraft(d => ({ ...d, excerpt: e.target.value }))}
              placeholder="Uma ou duas frases resumindo o artigo..."
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Texto completo</label>
            <p className="text-[11px] text-gray-400 mb-1.5">
              Separe parágrafos com uma linha em branco. Pra criar um subtítulo, comece a linha com <code className="bg-gray-100 px-1 rounded">## </code> (ex.: <code className="bg-gray-100 px-1 rounded">## Considerações finais</code>).
            </p>
            <textarea
              value={draft.body} rows={16}
              onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
              placeholder={"## Primeiro subtítulo\n\nPrimeiro parágrafo...\n\nSegundo parágrafo..."}
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 font-mono resize-y"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 px-4 py-2.5 rounded-xl transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar rascunho
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving}
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Salvar e publicar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Newspaper className="w-5 h-5 text-brand-500" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">Artigos do Site Institucional</h1>
            <p className="text-gray-500 text-sm">Publicações Recentes — instituto</p>
          </div>
        </div>
        <button onClick={startNew}
          className="flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-4 py-2.5 rounded-xl transition-colors shadow-sm w-full sm:w-auto">
          <Plus className="w-4 h-4" strokeWidth={2.5} /> Novo artigo
        </button>
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
      ) : articles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Newspaper className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum artigo ainda.</p>
          <p className="text-gray-400 text-sm mt-1">Clique em "Novo artigo" para criar o primeiro.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
          {articles.map(a => (
            <div key={a.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800 truncate">{a.title}</p>
                  {a.published ? (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">Publicado</span>
                  ) : (
                    <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full flex-shrink-0">Rascunho</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {a.category} · {a.published ? `publicado em ${formatDate(a.published_at)}` : `criado em ${formatDate(a.created_at)}`}
                  {a.created_by ? ` · ${a.created_by}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {a.published && (
                  <a href={`${SITE_INSTITUTO_URL}/artigo.html?slug=${a.slug}`} target="_blank" rel="noreferrer"
                    className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Ver no site">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button onClick={() => togglePublished(a)}
                  className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                  title={a.published ? "Despublicar" : "Publicar"}>
                  {a.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => startEdit(a.id)}
                  className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Editar">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(a)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
