"use client";

import { useState, useEffect, useMemo } from "react";
import { ShieldCheck, Loader2, AlertTriangle, RefreshCw, Search, CheckCircle2, XCircle, Download } from "lucide-react";
import { adminHeaders } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api-base";

type TermAcceptance = {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  accepted: boolean;
  acceptedAt: string | null;
};

type Filter = "all" | "accepted" | "pending";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " às " + new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

async function exportToExcel(rows: TermAcceptance[], termVersion: string) {
  const XLSX = await import("xlsx");
  const sheetRows = rows.map(r => ({
    "Nome":            r.name,
    "E-mail":          r.email,
    "Aceitou o termo": r.accepted ? "Sim" : "Não",
    "Data do aceite":  r.acceptedAt ? formatDate(r.acceptedAt) : "—",
  }));
  const sheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Aceites do termo");
  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `aceites-termo-piloto-v${termVersion}-${today}.xlsx`);
}

export default function TermAcceptancesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [rows,        setRows]        = useState<TermAcceptance[]>([]);
  const [termVersion, setTermVersion] = useState("");
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [search,        setSearch]        = useState("");
  const [filter,        setFilter]        = useState<Filter>("all");

  function load() {
    setLoading(true); setError(null);
    adminHeaders().then(headers =>
      fetch(`${API_BASE}/api/admin/term-acceptances`, { headers, cache: "no-store" })
        .then(async r => {
          const d = await r.json();
          if (!r.ok) throw new Error(d.error ?? "Erro ao carregar aceites.");
          setRows(d.therapists ?? []);
          setTermVersion(d.termVersion ?? "");
        })
        .catch(e => setError(e instanceof Error ? e.message : "Erro ao carregar aceites."))
        .finally(() => setLoading(false))
    );
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (filter === "accepted" && !r.accepted) return false;
      if (filter === "pending" && r.accepted) return false;
      if (q && !r.name.toLowerCase().includes(q) && !r.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, filter]);

  const acceptedCount = rows.filter(r => r.accepted).length;
  const pendingCount = rows.length - acceptedCount;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-brand-500" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">Aceites do Termo do Programa-Piloto</h1>
            <p className="text-gray-500 text-sm">
              {termVersion ? `Versão vigente: ${termVersion}` : "Quem já aceitou e quem ainda está pendente"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={() => exportToExcel(rows, termVersion)} disabled={loading || rows.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-xl transition-colors">
            <Download className="w-3.5 h-3.5" /> Baixar Excel
          </button>
          <button onClick={load} disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-xl transition-colors">
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
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <p className="text-2xl font-bold text-ink">{rows.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Terapeutas no total</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <p className="text-2xl font-bold text-emerald-600">{acceptedCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Aceitaram o termo</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Ainda pendentes</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent"
              />
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
              {([
                { id: "all",      label: "Todos" },
                { id: "accepted", label: "Aceitaram" },
                { id: "pending",  label: "Pendentes" },
              ] as { id: Filter; label: string }[]).map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                    filter === f.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-800"
                  )}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <ShieldCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum terapeuta encontrado.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
              {filtered.map(r => (
                <div key={r.userId} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{r.name}</p>
                    <p className="text-xs text-gray-500 truncate">{r.email}</p>
                  </div>
                  {r.accepted ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aceitou em {formatDate(r.acceptedAt)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full flex-shrink-0">
                      <XCircle className="w-3.5 h-3.5" /> Pendente
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
