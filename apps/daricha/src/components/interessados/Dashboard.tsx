"use client";

import { useMemo, useState } from "react";
import type { DarichaEvent } from "./types";
import { INVESTMENT_SLIDE_INDEX, SLIDE_META } from "@/lib/slideMeta";

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function Dashboard({ events }: { events: DarichaEvent[] }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    if (!from && !to) return events;
    const fromTime = from ? new Date(from + "T00:00:00").getTime() : -Infinity;
    const toTime = to ? new Date(to + "T23:59:59").getTime() : Infinity;
    return events.filter((e) => {
      const t = new Date(e.created_at).getTime();
      return t >= fromTime && t <= toTime;
    });
  }, [events, from, to]);

  const startedSessions = useMemo(
    () => new Set(filtered.filter((e) => e.event_type === "start").map((e) => e.session_id)),
    [filtered],
  );
  const reachedInvestment = useMemo(
    () =>
      new Set(
        filtered
          .filter((e) => e.event_type === "slide_view" && e.slide_index === INVESTMENT_SLIDE_INDEX)
          .map((e) => e.session_id),
      ),
    [filtered],
  );
  const ctaClicks = useMemo(() => filtered.filter((e) => e.event_type === "cta_click"), [filtered]);

  const rows = [...ctaClicks].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-cream-100/60">De</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-cream-100/20 bg-cream-100/5 px-3 py-2 text-sm text-cream-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-cream-100/60">Até</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-cream-100/20 bg-cream-100/5 px-3 py-2 text-sm text-cream-50"
          />
        </div>
        {(from || to) && (
          <button
            onClick={() => {
              setFrom("");
              setTo("");
            }}
            className="rounded-lg border border-cream-100/20 px-3 py-2 text-sm text-cream-100/70"
          >
            Limpar filtro
          </button>
        )}
        <button
          onClick={() => {
            const today = new Date();
            setFrom(toDateInputValue(today));
            setTo(toDateInputValue(today));
          }}
          className="rounded-lg border border-cream-100/20 px-3 py-2 text-sm text-cream-100/70"
        >
          Hoje
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FunnelCard label="Iniciaram a apresentação" value={startedSessions.size} />
        <FunnelCard label="Chegaram ao investimento" value={reachedInvestment.size} />
        <FunnelCard label='Clicaram em "Quero conhecer"' value={ctaClicks.length} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-cream-100/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-cream-100/5 text-cream-100/60">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Horário</th>
              <th className="px-4 py-3 font-medium">Slide de conversão</th>
              <th className="px-4 py-3 font-medium">Dispositivo</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-cream-100/50">
                  Nenhum interessado no período selecionado.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const date = new Date(row.created_at);
              return (
                <tr key={row.id} className="border-t border-cream-100/10">
                  <td className="px-4 py-3">{row.name || "—"}</td>
                  <td className="px-4 py-3">{date.toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3">{date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="px-4 py-3">{SLIDE_META[row.slide_index]?.label ?? row.slide_id}</td>
                  <td className="px-4 py-3 capitalize">{row.device || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FunnelCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-cream-100/10 bg-cream-100/[0.04] p-5">
      <p className="font-display text-3xl font-medium text-cream-50">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-gold-300">{label}</p>
    </div>
  );
}
