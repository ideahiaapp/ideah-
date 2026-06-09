import { Users, MessageSquare, FileText, CalendarDays, TrendingUp, Clock, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { mockUser, mockClients, mockSupervisions, mockEvolutions, mockStats } from "@/lib/mock-data";
import { formatDate, formatRelative } from "@/lib/utils";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-ink mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = mockUser.name.split(" ")[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Cabeçalho ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
          </p>
        </div>

        {/* Trial banner */}
        <div className="hidden md:flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-amber-800">Período de trial</p>
            <p className="text-xs text-amber-600 mt-0.5">{mockStats.trialDaysLeft} dias restantes</p>
          </div>
          <Link
            href="/dashboard/subscription"
            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Assinar agora
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Clientes ativos"
          value={mockStats.activeClients}
          sub={`de ${mockStats.totalClients} no total`}
          color="bg-brand-50 text-brand-500"
        />
        <StatCard
          icon={CalendarDays}
          label="Sessões esta semana"
          value={mockStats.sessionsThisWeek}
          sub="↑ 2 em relação à semana passada"
          color="bg-blue-50 text-blue-500"
        />
        <StatCard
          icon={MessageSquare}
          label="Supervisões"
          value={mockStats.supervisionsTotal}
          sub="sessões de supervisão abertas"
          color="bg-purple-50 text-purple-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Evoluções"
          value={mockEvolutions.length}
          sub="registros este mês"
          color="bg-green-50 text-green-500"
        />
      </div>

      {/* ── Ações rápidas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Nova supervisão", href: "/dashboard/supervision/new", icon: MessageSquare, color: "bg-brand-500 hover:bg-brand-600 text-white" },
          { label: "Novo cliente", href: "/dashboard/clients/new", icon: Users, color: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
          { label: "Registrar evolução", href: "/dashboard/evolutions/new", icon: FileText, color: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
          { label: "Ver agenda", href: "/dashboard/schedule", icon: CalendarDays, color: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-colors shadow-sm ${a.color}`}
          >
            <Plus className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
            {a.label}
          </Link>
        ))}
      </div>

      {/* ── Grid principal ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Clientes recentes */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800 text-sm">Clientes recentes</h2>
            <Link href="/dashboard/clients" className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {mockClients.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/clients/${c.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: c.color }}
                >
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.approachLabel} · {c.totalSessions} sessões</p>
                </div>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.status === "ACTIVE" ? "bg-green-400" : "bg-amber-400"}`} />
              </Link>
            ))}
          </div>
        </div>

        {/* Supervisões recentes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800 text-sm">Supervisões recentes</h2>
            <Link href="/dashboard/supervision" className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {mockSupervisions.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/supervision/${s.id}`}
                className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-800 truncate">{s.title}</p>
                    <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      {s.approach}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{s.clientName}</p>
                  <p className="text-xs text-gray-400 truncate mt-1 italic">"{s.lastMessage}"</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">{formatRelative(s.updatedAt)}</p>
                  <p className="text-xs text-gray-300 mt-1">{s.messagesCount} msgs</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* ── Evoluções recentes ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-800 text-sm">Evoluções recentes</h2>
          <Link href="/dashboard/evolutions" className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {mockEvolutions.map((e) => (
            <div key={e.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ backgroundColor: e.color }}
              >
                {e.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-800">{e.clientName}</p>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(e.sessionDate)}
                  </span>
                </div>
                {e.hypothesis && (
                  <p className="text-xs text-brand-600 font-medium mb-1">
                    Hipótese: {e.hypothesis}
                  </p>
                )}
                <p className="text-xs text-gray-500 truncate">{e.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
