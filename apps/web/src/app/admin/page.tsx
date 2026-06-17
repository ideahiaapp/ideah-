"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LogOut, TrendingUp, Users, Activity, DollarSign,
  Search, FileDown, ShieldCheck,
  CheckCircle2, AlertTriangle, XCircle, Clock,
  Monitor, Smartphone,
} from "lucide-react";
import { useAdminStore } from "@/store/admin.store";
import {
  mockSales, mockLoginEvents, mockMonthlySales,
  type Plan, type SaleStatus,
} from "@/lib/mock-admin-data";
import { cn } from "@/lib/utils";

/* ─── helpers ─────────────────────────────────── */
const PLAN_LABEL: Record<Plan, string> = {
  trial:  "Trial",
  pro:    "Pro",
  clinic: "Clínica",
};
const PLAN_COLOR: Record<Plan, string> = {
  trial:  "bg-gray-800 text-gray-300 border-gray-700",
  pro:    "bg-brand-900 text-brand-300 border-brand-800",
  clinic: "bg-amber-900 text-amber-300 border-amber-800",
};
const STATUS_CONFIG: Record<SaleStatus, { label: string; icon: React.ElementType; color: string }> = {
  active:    { label: "Ativo",       icon: CheckCircle2,  color: "text-green-400"  },
  cancelled: { label: "Cancelado",   icon: XCircle,       color: "text-red-400"    },
  past_due:  { label: "Inadimplente",icon: AlertTriangle, color: "text-amber-400"  },
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(d);
}

/* ─── KPI card ────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub: string;
  icon: React.ElementType; accent: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-start gap-4">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", accent)}>
        <Icon className="w-5 h-5" strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-2xl font-black text-white leading-none">{value}</p>
        <p className="text-xs font-semibold text-gray-400 mt-1">{label}</p>
        <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

/* ─── Barra do gráfico ────────────────────────── */
function BarChart() {
  const max = Math.max(...mockMonthlySales.map(m => m.revenue), 1);
  return (
    <div className="flex items-end gap-3 h-28 w-full">
      {mockMonthlySales.map(m => (
        <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full relative flex items-end" style={{ height: "88px" }}>
            <div
              className="w-full rounded-t-lg bg-brand-600 hover:bg-brand-500 transition-colors cursor-default"
              style={{ height: `${Math.max((m.revenue / max) * 88, 4)}px` }}
              title={`${m.month}: ${fmt(m.revenue)} · ${m.sales} venda${m.sales !== 1 ? "s" : ""}`}
            />
          </div>
          <span className="text-[10px] text-gray-500 font-medium">{m.month}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Página principal ────────────────────────── */
type TabAdmin = "vendas" | "logins";

export default function AdminPage() {
  const router = useRouter();
  const { email, isAdmin, logout } = useAdminStore();
  const [tab,    setTab]    = useState<TabAdmin>("vendas");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<Plan | "all">("all");

  /* Guarda auth */
  useEffect(() => {
    if (!isAdmin) router.replace("/admin/login");
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  /* KPIs */
  const activeSales   = mockSales.filter(s => s.status === "active" && s.plan !== "trial");
  const mrr           = activeSales.reduce((acc, s) => acc + s.value, 0);
  const totalRevenue  = mockSales.reduce((acc, s) => acc + s.total, 0);
  const totalUsers    = mockSales.length;
  const trialCount    = mockSales.filter(s => s.plan === "trial").length;

  /* Filtros vendas */
  const filteredSales = mockSales.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    const matchP = planFilter === "all" || s.plan === planFilter;
    return matchQ && matchP;
  });

  /* Filtros logins */
  const filteredLogins = mockLoginEvents.filter(l => {
    const q = search.toLowerCase();
    return !q || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q);
  });

  function handleLogout() {
    logout();
    router.replace("/admin/login");
  }

  function exportCSV() {
    const headers = ["Nome", "E-mail", "Plano", "Cobrança", "Valor/mês", "Total pago", "Status", "Canal", "Cadastro", "Último login", "Logins"];
    const rows = mockSales.map(s => [
      s.name, s.email,
      PLAN_LABEL[s.plan], s.billing === "monthly" ? "Mensal" : "Anual",
      s.value.toFixed(2), s.total.toFixed(2),
      STATUS_CONFIG[s.status].label, s.source,
      s.createdAt.toLocaleDateString("pt-BR"),
      s.lastLogin ? s.lastLogin.toLocaleString("pt-BR") : "—",
      s.loginCount,
    ]);
    const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `ideah-vendas-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Header admin ── */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image src="/ideah-logo.png" alt="IDEAH" width={90} height={30} className="brightness-0 invert opacity-80" />
          <div className="w-px h-6 bg-gray-800" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-semibold text-gray-300">Painel Administrativo</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-1.5 border border-gray-700">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-400 font-medium">{email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-xl hover:bg-red-950/40 border border-transparent hover:border-red-900"
          >
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── KPIs ── */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Visão geral</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              icon={DollarSign} accent="bg-green-900/60 text-green-400"
              label="MRR" value={fmt(mrr)}
              sub={`${activeSales.length} assinantes pagantes`}
            />
            <KpiCard
              icon={TrendingUp} accent="bg-brand-900/60 text-brand-400"
              label="Receita total" value={fmt(totalRevenue)}
              sub="acumulado desde o início"
            />
            <KpiCard
              icon={Users} accent="bg-purple-900/60 text-purple-400"
              label="Usuários cadastrados" value={String(totalUsers)}
              sub={`${trialCount} em trial agora`}
            />
            <KpiCard
              icon={Activity} accent="bg-amber-900/60 text-amber-400"
              label="Logins (hoje)" value={String(mockLoginEvents.filter(l => l.at.toDateString() === new Date().toDateString()).length)}
              sub={`${mockLoginEvents.length} registrados`}
            />
          </div>
        </div>

        {/* ── Gráfico receita mensal ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-bold text-white">Receita por mês</p>
              <p className="text-xs text-gray-500 mt-0.5">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>Total: <strong className="text-white">{fmt(mockMonthlySales.reduce((a,m)=>a+m.revenue,0))}</strong></span>
            </div>
          </div>
          <BarChart />
        </div>

        {/* ── Tabs + filtros ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-900 border border-gray-800 p-1 rounded-xl w-fit">
              {([["vendas", "Compradores"], ["logins", "Logins recentes"]] as [TabAdmin, string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    tab === id ? "bg-brand-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Controles */}
            <div className="flex items-center gap-3 flex-wrap">
              {tab === "vendas" && (
                <>
                  <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
                    {([["all","Todos"],["trial","Trial"],["pro","Pro"],["clinic","Clínica"]] as [Plan|"all",string][]).map(([v,l]) => (
                      <button
                        key={v}
                        onClick={() => setPlanFilter(v)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          planFilter === v ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
                        )}
                      >{l}</button>
                    ))}
                  </div>
                  <button
                    onClick={exportCSV}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-medium text-gray-300 transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Exportar CSV
                  </button>
                </>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar nome ou e-mail..."
                  className="pl-8 pr-4 py-2 text-xs bg-gray-800 border border-gray-700 rounded-xl text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-500 w-52"
                />
              </div>
            </div>
          </div>

          {/* ── Tabela compradores ── */}
          {tab === "vendas" && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-950/50">
                      {["Comprador", "Plano", "Cobrança", "Valor/mês", "Total pago", "Canal", "Status", "Último login"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {filteredSales.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-10 text-gray-600 text-sm">Nenhum resultado</td></tr>
                    ) : filteredSales.map(s => {
                      const st = STATUS_CONFIG[s.status];
                      const StIcon = st.icon;
                      return (
                        <tr key={s.id} className="hover:bg-gray-800/40 transition-colors">
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-white text-sm">{s.name}</p>
                            <p className="text-xs text-gray-500">{s.email}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full border font-semibold", PLAN_COLOR[s.plan])}>
                              {PLAN_LABEL[s.plan]}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-400">
                            {s.billing === "monthly" ? "Mensal" : "Anual"}
                          </td>
                          <td className="px-4 py-3.5 text-sm font-semibold text-white whitespace-nowrap">
                            {s.value > 0 ? fmt(s.value) : <span className="text-gray-600">—</span>}
                          </td>
                          <td className="px-4 py-3.5 text-sm font-bold text-green-400 whitespace-nowrap">
                            {s.total > 0 ? fmt(s.total) : <span className="text-gray-600">—</span>}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-500">{s.source}</td>
                          <td className="px-4 py-3.5">
                            <div className={cn("flex items-center gap-1.5 text-xs font-medium", st.color)}>
                              <StIcon className="w-3.5 h-3.5" strokeWidth={2} />
                              {st.label}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                            {fmtDate(s.lastLogin)}
                            <p className="text-gray-700 mt-0.5">{s.loginCount} logins</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-600">
                <span>{filteredSales.length} registro{filteredSales.length !== 1 ? "s" : ""}</span>
                <span>
                  Receita filtrada:{" "}
                  <strong className="text-gray-400">
                    {fmt(filteredSales.filter(s=>s.status==="active").reduce((a,s)=>a+s.value,0))} / mês
                  </strong>
                </span>
              </div>
            </div>
          )}

          {/* ── Tabela logins ── */}
          {tab === "logins" && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-950/50">
                      {["Usuário", "Plano", "Data e hora", "Dispositivo"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {filteredLogins.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-10 text-gray-600 text-sm">Nenhum resultado</td></tr>
                    ) : filteredLogins.map(l => (
                      <tr key={l.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-white">{l.name}</p>
                          <p className="text-xs text-gray-500">{l.email}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full border font-semibold", PLAN_COLOR[l.plan])}>
                            {PLAN_LABEL[l.plan]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-300">
                            <Clock className="w-3.5 h-3.5 text-gray-600" />
                            {fmtDate(l.at)}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            {l.device.includes("iPhone") || l.device.includes("Android")
                              ? <Smartphone className="w-3.5 h-3.5" />
                              : <Monitor className="w-3.5 h-3.5" />
                            }
                            {l.device}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-600">
                {filteredLogins.length} evento{filteredLogins.length !== 1 ? "s" : ""} de login registrado{filteredLogins.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}
        </div>

        {/* ── Rodapé ── */}
        <div className="text-center text-xs text-gray-700 py-4">
          ideah Admin · Dados mock — conecte ao banco de dados para dados reais
        </div>
      </main>
    </div>
  );
}
