"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, MessageSquare, Clock } from "lucide-react";
import { getClients } from "@/lib/db";
import { useAuthStore } from "@/store/auth.store";
import type { Client } from "@/lib/database.types";
import { HowItWorksTrigger, type HowItWorksContent } from "@/components/dashboard/HowItWorksModal";
import { API_BASE } from "@/lib/api-base";

const ALL_APPROACHES = [
  { value: "PSYCHOANALYSIS",       label: "Psicanálise Freudiana" },
  { value: "COGNITIVE_BEHAVIORAL", label: "TCC" },
  { value: "JUNGIAN",              label: "Junguiana" },
  { value: "SOMATIC",              label: "Somática / Corporal" },
  { value: "TANTRA",               label: "Sexualidade Humana e Tantra" },
  { value: "GESTALT",              label: "Gestalt-terapia" },
  { value: "PSYCHODRAMA",          label: "Psicodrama" },
  { value: "SYSTEMIC",             label: "Constelação Familiar" },
];
function clientApproachLabels(c: Client): string[] {
  if (c.approaches?.length) return c.approaches.map(v => ALL_APPROACHES.find(a => a.value === v)?.label ?? v);
  return c.approach_label ? [c.approach_label] : [];
}

const HOW_IT_WORKS: Record<"supervision" | "client", HowItWorksContent> = {
  supervision: {
    title: "Supervisão clínica",
    subtitle: "Um espaço de reflexão dialógica para investigar seus casos a partir da abordagem teórica escolhida.",
    steps: [
      { title: "Escolha o cliente", desc: "Selecione o caso que deseja supervisionar." },
      { title: "Escolha a abordagem", desc: "Defina a base teórica que orientará a supervisão." },
      { title: "Inicie a reflexão", desc: "Traga suas impressões, dúvidas ou situações da sessão. O Paideia dialogará com você por meio de perguntas e reflexões para apoiar a construção do seu raciocínio clínico." },
    ],
    ctaLabel: "Iniciar supervisão",
    ctaHref: "/dashboard/supervision",
    illustration: "supervision",
  },
  client: {
    title: "Acompanhamento do cliente",
    subtitle: "Organize em um único espaço o cadastro, a anamnese, o prontuário e o histórico do acompanhamento.",
    steps: [
      { title: "Cadastre o cliente", desc: "Informe os dados iniciais e a abordagem terapêutica." },
      { title: "Realize a anamnese", desc: "Preencha a anamnese ou envie um link para que o próprio cliente responda." },
      { title: "Acompanhe o percurso", desc: "Supervisões, evoluções e registros ficam vinculados ao cliente ao longo do acompanhamento." },
    ],
    ctaLabel: "Cadastrar cliente",
    ctaHref: "/dashboard/clients/new",
    illustration: "clients",
  },
};

export default function HomePage() {
  const { user } = useAuthStore();
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = user?.name?.split(" ")[0] ?? "terapeuta";

  const [clients, setClients] = useState<Client[]>([]);
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getClients(user.id).then(setClients).catch(() => {});
  }, [user]);

  useEffect(() => {
    fetch(`${API_BASE}/api/geo`)
      .then(r => r.json())
      .then(d => setCity(d.city ?? null))
      .catch(() => setCity(null));
  }, []);

  const now = new Date();
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(now);
  const day     = now.getDate();
  const month   = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(now);
  const year    = now.getFullYear();
  const rawDateLine = [city, weekday, `${day} de ${month} de ${year}`].filter(Boolean).join(", ");
  const dateLine = rawDateLine.charAt(0).toUpperCase() + rawDateLine.slice(1);

  const activeClients = clients
    .filter(c => c.status === "ACTIVE")
    .sort((a, b) => (b.last_session ?? "").localeCompare(a.last_session ?? ""))
    .slice(0, 5);

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-brand-50/60 px-10 py-10 space-y-10">
      <div>
        <div className="flex items-start justify-between gap-4">
          <p className="text-gray-600 text-sm">{greeting},</p>
          <p className="text-gray-500 text-sm text-right">{dateLine}</p>
        </div>
        <h1 className="font-serif text-5xl text-ink mt-1">{firstName}</h1>
        <p className="text-gray-600 mt-4">Qual caso você quer acompanhar agora?</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center mb-4">
            <MessageSquare className="w-5 h-5 text-white" strokeWidth={1.8} />
          </div>
          <h2 className="font-serif text-xl text-ink">Iniciar supervisão</h2>
          <p className="text-sm text-gray-500 mt-1.5 flex-1">
            Investigue um caso em acompanhamento e aprofunde seu raciocínio clínico.
          </p>
          <div className="mt-5 flex items-center gap-4">
            <Link
              href="/dashboard/supervision"
              className="inline-flex items-center justify-center bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors w-fit"
            >
              Iniciar supervisão
            </Link>
            <HowItWorksTrigger content={HOW_IT_WORKS.supervision} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-brand-600" strokeWidth={1.8} />
          </div>
          <h2 className="font-serif text-xl text-ink">Cadastrar cliente</h2>
          <p className="text-sm text-gray-500 mt-1.5 flex-1">
            Cadastre um novo cliente para iniciar e organizar seu acompanhamento clínico.
          </p>
          <div className="mt-5 flex items-center gap-4">
            <Link
              href="/dashboard/clients/new"
              className="inline-flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors w-fit"
            >
              Cadastrar cliente
            </Link>
            <HowItWorksTrigger content={HOW_IT_WORKS.client} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-serif text-lg text-ink mb-3">Últimos clientes</h3>
        {activeClients.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhum cliente ativo ainda.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
            {activeClients.map(c => (
              <Link
                key={c.id}
                href={`/dashboard/clients/${c.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: c.color ?? "#C2542F" }}
                >
                  {c.initials ?? c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {c.total_sessions} sessões · {clientApproachLabels(c).join(", ")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
