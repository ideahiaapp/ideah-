"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserPlus, Users, Clock } from "lucide-react";
import { getClients } from "@/lib/db";
import { useAuthStore } from "@/store/auth.store";
import type { Client } from "@/lib/database.types";

export default function HomePage() {
  const { user } = useAuthStore();
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = user?.name?.split(" ")[0] ?? "terapeuta";

  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    if (!user) return;
    getClients(user.id).then(setClients).catch(() => {});
  }, [user]);

  const activeClients = clients
    .filter(c => c.status === "ACTIVE")
    .sort((a, b) => (b.last_session ?? "").localeCompare(a.last_session ?? ""))
    .slice(0, 5);

  return (
    <div className="max-w-3xl mx-auto -m-6 min-h-[calc(100vh-4rem)] bg-brand-50/60 px-6 py-12 space-y-10">
      <div>
        <p className="text-gray-500 text-sm">{greeting},</p>
        <h1 className="font-serif text-5xl text-ink mt-1">{firstName}</h1>
        <p className="text-gray-500 mt-4">Qual caso você quer acompanhar agora?</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center mb-4">
            <UserPlus className="w-5 h-5 text-white" strokeWidth={1.8} />
          </div>
          <h2 className="font-serif text-xl text-ink">Novo cliente</h2>
          <p className="text-sm text-gray-500 mt-1.5 flex-1">
            Envie a anamnese ou cadastre um paciente manualmente.
          </p>
          <Link
            href="/dashboard/clients/new"
            className="mt-5 inline-flex items-center justify-center bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors w-fit"
          >
            Novo cliente
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-brand-600" strokeWidth={1.8} />
          </div>
          <h2 className="font-serif text-xl text-ink">Meus clientes</h2>
          <p className="text-sm text-gray-500 mt-1.5 flex-1">
            Acesse seus pacientes e continue uma evolução clínica.
          </p>
          <Link
            href="/dashboard/clients"
            className="mt-5 inline-flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors w-fit"
          >
            Ver clientes
          </Link>
        </div>
      </div>

      <div>
        <h3 className="font-serif text-lg text-ink mb-3">Últimos clientes</h3>
        {activeClients.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum cliente ativo ainda.</p>
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
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {c.total_sessions} sessões · {c.approach_label}
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
