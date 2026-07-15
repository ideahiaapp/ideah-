"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Plus, X, Save, Loader2,
  CheckCircle2, Clock, User, Calendar, FileText,
  MessageSquare, ChevronDown, Trash2,
} from "lucide-react";
import { getClients, getSessions, createSession, updateSession, deleteSession } from "@/lib/db";
import type { SessionWithClient } from "@/lib/db/sessions";
import { useAuthStore } from "@/store/auth.store";
import { getClinicSettings } from "@/lib/clinic-settings";
import type { Client } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import { VoiceTextarea } from "@/components/ui/VoiceField";

type SessionStatus = "confirmed" | "pending" | "cancelled" | "done";

interface ScheduleSession {
  id: string;
  clientId: string;
  clientName: string;
  initials: string;
  color: string;
  date: string;
  startTime: string;
  duration: number;
  status: SessionStatus;
  notes?: string;
  price?: number;
}

function dbToSchedule(s: SessionWithClient): ScheduleSession {
  return {
    id:         s.id,
    clientId:   s.client_id,
    clientName: s.clients?.name ?? "Cliente",
    initials:   s.clients?.initials ?? s.clients?.name?.[0] ?? "?",
    color:      s.clients?.color ?? "#C2542F",
    date:       s.date,
    startTime:  s.start_time.slice(0, 5),
    duration:   s.duration,
    status:     s.status as SessionStatus,
    notes:      s.notes ?? undefined,
    price:      s.price ?? undefined,
  };
}

/* ─── Constantes ─────────────────────────────────── */
const HOUR_START = 7;   // primeira linha visível
const HOUR_END   = 21;  // última linha visível
const HOURS      = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const SLOT_H     = 56;  // px por hora

const STATUS_CONFIG: Record<SessionStatus, { label: string; dot: string; badge: string }> = {
  confirmed: { label: "Confirmada",    dot: "bg-green-400",  badge: "bg-green-50  text-green-700  border-green-200"  },
  pending:   { label: "Pendente",      dot: "bg-amber-400",  badge: "bg-amber-50  text-amber-700  border-amber-200"  },
  cancelled: { label: "Cancelada",     dot: "bg-red-400",    badge: "bg-red-50    text-red-600    border-red-200"    },
  done:      { label: "Realizada",     dot: "bg-gray-300",   badge: "bg-gray-50   text-gray-500   border-gray-200"   },
};

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                   "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

/* ─── Helpers de data ────────────────────────────── */
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();               // 0 = dom
  d.setDate(d.getDate() - day + 1);    // segunda-feira
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function formatDayHeader(date: Date): { weekday: string; day: number; isToday: boolean } {
  const today = new Date();
  return {
    weekday: DAYS_PT[date.getDay()],
    day: date.getDate(),
    isToday: toDateStr(date) === toDateStr(today),
  };
}

/* ─── Google Calendar URL ────────────────────────── */
function buildGoogleCalendarUrl(params: {
  clientName: string;
  date: string;
  startTime: string;
  duration: number;
  notes?: string;
  meetLink?: string;
  clientEmail?: string | null;
}): string {
  const start = params.date.replace(/-/g, "") + "T" + params.startTime.replace(":", "") + "00";
  const endMin = timeToMinutes(params.startTime) + params.duration;
  const endStr = minutesToTime(endMin).replace(":", "") + "00";
  const end = params.date.replace(/-/g, "") + "T" + endStr;
  const details = [
    params.notes || "Sessão registrada via Paideia",
    params.meetLink ? `Link da videochamada: ${params.meetLink}` : "",
  ].filter(Boolean).join("\n\n");
  const search = new URLSearchParams({
    action:  "TEMPLATE",
    text:    `Sessão — ${params.clientName}`,
    dates:   `${start}/${end}`,
    details,
    ...(params.meetLink ? { location: params.meetLink } : {}),
    ...(params.clientEmail ? { add: params.clientEmail } : {}),
  });
  return `https://calendar.google.com/calendar/render?${search.toString()}`;
}

/* ─── WhatsApp: link de envio de agendamento ─────── */
function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

function buildSessionMessage(params: {
  clientName: string;
  date: string;
  startTime: string;
  duration: number;
  meetLink?: string;
}): string {
  const dateFmt = params.date.split("-").reverse().join("/");
  const endTime = minutesToTime(timeToMinutes(params.startTime) + params.duration);
  const firstName = params.clientName.split(" ")[0];
  let msg = `Olá, ${firstName}! Confirmando sua sessão:\n📅 ${dateFmt}\n🕐 ${params.startTime} às ${endTime}`;
  if (params.meetLink) msg += `\n🔗 Link da videochamada: ${params.meetLink}`;
  return msg;
}

/* ─── Ícone Google Calendar ──────────────────────── */
function GoogleCalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="white" stroke="#dadce0" strokeWidth="1.5"/>
      <rect x="3" y="3" width="18" height="5" rx="2" fill="#4285F4"/>
      <rect x="3" y="6" width="18" height="2" fill="#4285F4"/>
      <path d="M8 13h2v2H8zm3 0h2v2h-2zm3 0h2v2h-2zM8 16h2v2H8zm3 0h2v2h-2z" fill="#4285F4"/>
      <rect x="8" y="1" width="2" height="4" rx="1" fill="#4285F4"/>
      <rect x="14" y="1" width="2" height="4" rx="1" fill="#4285F4"/>
    </svg>
  );
}

/* ─── Ícone Google Meet ──────────────────────────── */
function GoogleMeetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8v8a2 2 0 002 2h7V6H5a2 2 0 00-2 2z" fill="#00AC47"/>
      <path d="M12 6v12l4-3V9l-4-3z" fill="#00832D"/>
      <path d="M16 9l5-3.6v13.2L16 15V9z" fill="#00AC47"/>
    </svg>
  );
}

/* ─── Ícone WhatsApp ─────────────────────────────── */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5.05-1.36A10 10 0 1012 2z" fill="#25D366"/>
      <path d="M9.1 7.2c-.2-.44-.4-.45-.6-.46h-.5c-.18 0-.46.07-.7.33-.24.26-.92.9-.92 2.2 0 1.3.94 2.55 1.07 2.73.13.18 1.83 2.9 4.5 3.96 2.23.88 2.68.7 3.16.66.48-.04 1.55-.63 1.77-1.24.22-.61.22-1.13.15-1.24-.07-.11-.24-.18-.5-.31-.26-.13-1.55-.77-1.79-.85-.24-.09-.42-.13-.59.13-.18.26-.68.85-.83 1.02-.15.18-.31.2-.57.07-.26-.13-1.09-.4-2.08-1.29-.77-.68-1.29-1.53-1.44-1.79-.15-.26-.02-.4.11-.53.12-.12.26-.31.4-.46.13-.15.17-.26.26-.44.09-.18.04-.33-.02-.46-.07-.13-.58-1.44-.81-1.98z" fill="white"/>
    </svg>
  );
}

/* ─── Modal de sessão ────────────────────────────── */
interface ModalState {
  mode: "create" | "view";
  session?: ScheduleSession;
  date?: string;
  startTime?: string;
}

function SessionModal({
  state,
  clients,
  therapistId,
  onClose,
  onCreate,
  onStatusChange,
  onDelete,
}: {
  state: ModalState;
  clients: Client[];
  therapistId: string;
  onClose: () => void;
  onCreate: (s: ScheduleSession) => void;
  onStatusChange: (id: string, status: SessionStatus) => void;
  onDelete: (id: string) => void;
}) {
  const clinicCfg = getClinicSettings();
  const [form, setForm] = useState({
    clientId:        "",
    date:            state.date || toDateStr(new Date()),
    startTime:       state.startTime || "09:00",
    duration:        clinicCfg.sessionDuration,
    status:          "confirmed" as SessionStatus,
    notes:           "",
    price:           clinicCfg.sessionPrice,
    addToCalendar:   true,
  });
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
  const [deleting,    setDeleting]    = useState(false);
  const [meetLink,    setMeetLink]    = useState("");
  const [createdInfo, setCreatedInfo] = useState<{ clientName: string; phone: string | null } | null>(null);

  const isView   = state.mode === "view";
  const session  = state.session;
  const client   = isView
    ? clients.find(c => c.id === session?.clientId)
    : clients.find(c => c.id === form.clientId);

  const canSave  = !isView && form.clientId && form.date && form.startTime;
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, []);

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      const c = clients.find(c => c.id === form.clientId)!;
      const defaultPrice = getClinicSettings().sessionPrice;
      const saved = await createSession({
        therapist_id: therapistId,
        client_id:    form.clientId,
        date:         form.date,
        start_time:   form.startTime,
        duration:     form.duration,
        status:       form.status,
        notes:        form.notes || null,
        price:        form.price !== defaultPrice ? form.price : null,
      });
      onCreate(dbToSchedule({ ...saved, clients: { name: c.name, initials: c.initials, color: c.color } }));
      setSaved(true);
      setCreatedInfo({ clientName: c.name, phone: c.phone });
      if (form.addToCalendar) {
        setCalendarUrl(buildGoogleCalendarUrl({
          clientName:  c.name,
          date:        form.date,
          startTime:   form.startTime,
          duration:    form.duration,
          notes:       form.notes || undefined,
          meetLink:    meetLink || undefined,
          clientEmail: c.email,
        }));
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao salvar sessão");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!state.session || !confirm("Excluir esta sessão?")) return;
    setDeleting(true);
    try {
      await deleteSession(state.session.id);
      onDelete(state.session.id);
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir");
    } finally {
      setDeleting(false);
    }
  }

  async function handleStatusChange(id: string, status: SessionStatus) {
    await updateSession(id, { status });
    onStatusChange(id, status);
  }

  // Calcula horário de término
  const endTime = minutesToTime(timeToMinutes(
    isView ? session!.startTime : form.startTime
  ) + (isView ? session!.duration : form.duration));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={isView && session ? `Sessão de ${session.clientName}` : "Nova sessão"} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden focus:outline-none max-h-[90vh] my-auto flex flex-col">
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ backgroundColor: isView && session ? session.color + "18" : "#FDF1ED" }}
        >
          <div className="flex items-center gap-3">
            {isView && session ? (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
                style={{ backgroundColor: session.color }}
              >
                {session.initials}
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                <Plus className="w-5 h-5 text-brand-600" />
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-gray-900">
                {isView ? session!.clientName : "Nova sessão"}
              </p>
              {isView && session && (
                <p className="text-xs text-gray-500">
                  {session.date.split("-").reverse().join("/")} · {session.startTime}–{endTime}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="p-1.5 hover:bg-black/5 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* ── Modo visualização ── */}
          {isView && session && (
            <>
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Status</span>
                <div className="flex gap-2">
                  {(["confirmed","pending","cancelled","done"] as SessionStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(session.id, s)}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full border font-medium transition-all",
                        session.status === s
                          ? STATUS_CONFIG[s].badge + " scale-105 shadow-sm"
                          : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detalhes */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                {[
                  { icon: Calendar, label: "Data",    value: session.date.split("-").reverse().join("/") },
                  { icon: Clock,    label: "Horário", value: `${session.startTime} – ${endTime} (${session.duration}min)` },
                  { icon: User,     label: "Cliente", value: session.clientName },
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-3">
                    <r.icon className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={1.8} />
                    <span className="text-xs text-gray-500 w-14 flex-shrink-0">{r.label}</span>
                    <span className="text-xs font-medium text-gray-800">{r.value}</span>
                  </div>
                ))}
                {/* Valor — mostra sempre: customizado em destaque, padrão em cinza */}
                <div className="flex items-center gap-3">
                  <span className="text-lg leading-none flex-shrink-0 w-4 text-center text-gray-400">$</span>
                  <span className="text-xs text-gray-500 w-14 flex-shrink-0">Valor</span>
                  {session.price != null ? (
                    <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      R$ {session.price.toLocaleString("pt-BR")} <span className="font-normal text-green-600">(personalizado)</span>
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">
                      R$ {getClinicSettings().sessionPrice.toLocaleString("pt-BR")} <span className="text-gray-400">(padrão)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Notas */}
              {session.notes && (
                <div className="text-xs text-gray-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  {session.notes}
                </div>
              )}

              {/* Ações rápidas */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href={`/dashboard/supervision?client=${session.clientId}`}
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Registrar evolução
                </Link>
                <Link
                  href={`/dashboard/supervision?client=${session.clientId}`}
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Supervisionar
                </Link>
              </div>

              {/* Excluir sessão */}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 border border-red-100 transition-colors"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Excluir sessão
              </button>

              {/* Link do Google Meet */}
              <div className="space-y-1.5">
                <label htmlFor="meet-link-input" className="block text-xs font-semibold text-gray-600">Link da videochamada (opcional)</label>
                <div className="flex gap-2">
                  <input
                    id="meet-link-input"
                    type="text"
                    value={meetLink}
                    onChange={e => setMeetLink(e.target.value)}
                    placeholder="Cole aqui o link gerado pelo Meet"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 text-gray-800"
                  />
                  <a
                    href="https://meet.google.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-green-200 hover:text-green-700 transition-colors flex-shrink-0"
                  >
                    <GoogleMeetIcon className="w-4 h-4" />
                    Gerar
                  </a>
                </div>
              </div>

              {/* Google Calendar */}
              <a
                href={buildGoogleCalendarUrl({
                  clientName:  session.clientName,
                  date:        session.date,
                  startTime:   session.startTime,
                  duration:    session.duration,
                  notes:       session.notes,
                  meetLink:    meetLink || undefined,
                  clientEmail: client?.email,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
              >
                <GoogleCalendarIcon className="w-4 h-4" />
                Adicionar ao Google Calendar
              </a>

              {/* WhatsApp */}
              {client?.phone ? (
                <a
                  href={buildWhatsAppUrl(client.phone, buildSessionMessage({
                    clientName: session.clientName,
                    date:       session.date,
                    startTime:  session.startTime,
                    duration:   session.duration,
                    meetLink:   meetLink || undefined,
                  }))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  Enviar agendamento via WhatsApp
                </a>
              ) : (
                <p className="text-[11px] text-gray-400 text-center">
                  Cadastre o telefone do cliente para enviar o agendamento via WhatsApp.
                </p>
              )}
            </>
          )}

          {/* ── Modo criação ── */}
          {!isView && (
            <>
              {/* Cliente */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Cliente <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.clientId}
                    onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}
                    className="w-full appearance-none px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 pr-9 text-gray-800"
                  >
                    <option value="">Selecionar cliente...</option>
                    {clients.filter(c => c.status !== "WAITLIST").map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Data e hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Data</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Início</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 text-gray-800"
                  />
                </div>
              </div>

              {/* Duração e status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Duração</label>
                  <div className="relative">
                    <select
                      value={form.duration}
                      onChange={e => setForm(p => ({ ...p, duration: Number(e.target.value) }))}
                      className="w-full appearance-none px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 pr-9 text-gray-800"
                    >
                      {[30,45,50,60,90].map(d => (
                        <option key={d} value={d}>{d} minutos</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                  <div className="relative">
                    <select
                      value={form.status}
                      onChange={e => setForm(p => ({ ...p, status: e.target.value as SessionStatus }))}
                      className="w-full appearance-none px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 pr-9 text-gray-800"
                    >
                      <option value="confirmed">Confirmada</option>
                      <option value="pending">Pendente</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Preview horário */}
              {form.startTime && (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-2.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {form.startTime} – {minutesToTime(timeToMinutes(form.startTime) + form.duration)}
                  {client && (
                    <span className="ml-auto font-medium" style={{ color: client.color ?? undefined }}>
                      {client.name.split(" ")[0]}
                    </span>
                  )}
                </div>
              )}

              {/* Valor da sessão */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Valor da sessão
                  <span className="ml-1.5 text-gray-400 font-normal">
                    (padrão: R$ {clinicCfg.sessionPrice})
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">R$</span>
                  <input
                    type="number" min={0} step={10}
                    value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 text-gray-800"
                  />
                </div>
                {form.price !== clinicCfg.sessionPrice && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    ⚠ Valor personalizado para esta sessão
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, price: clinicCfg.sessionPrice }))}
                      className="underline hover:text-amber-700 ml-1"
                    >
                      Restaurar padrão
                    </button>
                  </p>
                )}
              </div>

              {/* Observação */}
              <VoiceTextarea
                label="Observação (opcional)"
                value={form.notes}
                onChange={v => setForm(p => ({ ...p, notes: v }))}
                placeholder="Ex: retorno após férias, sessão de avaliação..."
                rows={2}
              />

              {!createdInfo && (
                <>
                  {/* Link do Google Meet */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-600">Link da videochamada (opcional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={meetLink}
                        onChange={e => setMeetLink(e.target.value)}
                        placeholder="Cole aqui o link gerado pelo Meet"
                        className="flex-1 px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 text-gray-800"
                      />
                      <a
                        href="https://meet.google.com/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-green-200 hover:text-green-700 transition-colors flex-shrink-0"
                      >
                        <GoogleMeetIcon className="w-4 h-4" />
                        Gerar
                      </a>
                    </div>
                  </div>

                  {/* Google Calendar */}
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div
                      onClick={() => setForm(p => ({ ...p, addToCalendar: !p.addToCalendar }))}
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                        form.addToCalendar ? "border-blue-500 bg-blue-500" : "border-gray-300 hover:border-blue-300"
                      )}
                    >
                      {form.addToCalendar && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <polyline points="1.5 5 4 7.5 8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <GoogleCalendarIcon className="w-4 h-4" />
                      <span className="text-sm text-gray-700">Adicionar ao Google Calendar</span>
                    </div>
                  </label>
                </>
              )}

              {/* Botão salvar */}
              {!createdInfo ? (
                <button
                  onClick={handleSave}
                  disabled={!canSave || saving || saved}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    saved ? "bg-green-500 text-white"
                      : canSave && !saving ? "bg-brand-500 hover:bg-brand-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {saved   ? <><CheckCircle2 className="w-4 h-4" /> Sessão criada!</>
                   : saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                   :          <><Save className="w-4 h-4" /> Marcar sessão</>}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <p className="text-sm font-semibold text-green-700">Sessão criada!</p>
                  </div>

                  {calendarUrl && (
                    <a
                      href={calendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-white border-2 border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                    >
                      <GoogleCalendarIcon className="w-4 h-4" />
                      Abrir no Google Calendar
                    </a>
                  )}

                  {createdInfo.phone ? (
                    <a
                      href={buildWhatsAppUrl(createdInfo.phone, buildSessionMessage({
                        clientName: createdInfo.clientName,
                        date:       form.date,
                        startTime:  form.startTime,
                        duration:   form.duration,
                        meetLink:   meetLink || undefined,
                      }))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                      Enviar agendamento via WhatsApp
                    </a>
                  ) : (
                    <p className="text-[11px] text-gray-400 text-center">
                      Cadastre o telefone do cliente para enviar o agendamento via WhatsApp.
                    </p>
                  )}

                  <button
                    onClick={onClose}
                    className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Bloco de sessão no grid ─────────────────────── */
function SessionBlock({
  session,
  onClick,
}: {
  session: ScheduleSession;
  onClick: () => void;
}) {
  const startMin  = timeToMinutes(session.startTime) - HOUR_START * 60;
  const topPx     = (startMin / 60) * SLOT_H;
  const heightPx  = Math.max((session.duration / 60) * SLOT_H - 4, 24);
  const endTime   = minutesToTime(timeToMinutes(session.startTime) + session.duration);
  const isCancelled = session.status === "cancelled";
  const isDone      = session.status === "done";

  return (
    <div
      onClick={onClick}
      className={cn(
        "absolute left-1 right-1 rounded-xl px-2 py-1.5 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md select-none overflow-hidden",
        isCancelled && "opacity-50",
        isDone && "opacity-70",
      )}
      style={{
        top:             topPx + 1,
        height:          heightPx,
        backgroundColor: session.color + "22",
        borderLeft:      `3px solid ${session.color}`,
      }}
    >
      <p
        className="text-xs font-bold truncate leading-tight"
        style={{ color: session.color }}
      >
        {session.clientName.split(" ")[0]}
      </p>
      {heightPx > 36 && (
        <p className="text-[10px] leading-tight mt-0.5" style={{ color: session.color + "bb" }}>
          {session.startTime}–{endTime}
        </p>
      )}
      {isCancelled && (
        <p className="text-[9px] font-semibold text-red-500 mt-0.5">CANCELADA</p>
      )}
    </div>
  );
}

/* ─── Página principal ───────────────────────────── */
export default function SchedulePage() {
  const { user } = useAuthStore();
  const today    = new Date();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [sessions,  setSessions]  = useState<ScheduleSession[]>([]);
  const [modal,     setModal]     = useState<ModalState | null>(null);
  const [clients,   setClients]   = useState<Client[]>([]);

  useEffect(() => {
    if (!user) return;
    getClients(user.id).then(setClients).catch(() => {});
    getSessions(user.id).then(rows => setSessions(rows.map(dbToSchedule))).catch(() => {});
  }, [user]);

  // 5 dias úteis: seg → sex
  const weekDays = useMemo(
    () => Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const monthLabel = useMemo(() => {
    const months = new Set(weekDays.map(d => d.getMonth()));
    if (months.size === 1) {
      return `${MONTHS_PT[weekDays[0].getMonth()]} ${weekDays[0].getFullYear()}`;
    }
    return `${MONTHS_PT[weekDays[0].getMonth()]} – ${MONTHS_PT[weekDays[4].getMonth()]} ${weekDays[4].getFullYear()}`;
  }, [weekDays]);

  // Sessões agrupadas por dia
  const sessionsByDay = useMemo(() => {
    const map: Record<string, ScheduleSession[]> = {};
    for (const day of weekDays) {
      const key = toDateStr(day);
      map[key] = sessions.filter(s => s.date === key);
    }
    return map;
  }, [weekDays, sessions]);

  // Próxima sessão
  const nextSession = useMemo(() => {
    const now = new Date();
    const nowStr = toDateStr(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return sessions
      .filter(s => s.status !== "cancelled" && s.status !== "done")
      .filter(s => {
        if (s.date > nowStr) return true;
        if (s.date === nowStr) return timeToMinutes(s.startTime) > nowMin;
        return false;
      })
      .sort((a, b) => {
        const da = a.date + a.startTime;
        const db = b.date + b.startTime;
        return da < db ? -1 : 1;
      })[0] ?? null;
  }, [sessions]);

  // Clique em horário vazio
  function handleSlotClick(date: Date, hour: number) {
    const hh = hour.toString().padStart(2, "0");
    setModal({ mode: "create", date: toDateStr(date), startTime: `${hh}:00` });
  }

  // Clique em sessão existente
  function handleSessionClick(session: ScheduleSession) {
    setModal({ mode: "view", session });
  }

  const handleCreate = useCallback((session: ScheduleSession) => {
    setSessions(prev => [...prev, session]);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleStatusChange = useCallback((id: string, status: SessionStatus) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    setModal(prev => prev?.session ? { ...prev, session: { ...prev.session, status } } : prev);
  }, []);

  // Hoje na view
  const todayStr = toDateStr(today);
  const todayHour = today.getHours();

  return (
    <div className="flex flex-col h-full -m-6 overflow-hidden">

      {/* ── Topbar da agenda ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-ink">Agenda</h1>

          {/* Navegação de semana */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setWeekStart(d => addDays(d, -7))}
              aria-label="Semana anterior"
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-gray-500"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setWeekStart(startOfWeek(today))}
              className="px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-white rounded-lg transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={() => setWeekStart(d => addDays(d, 7))}
              aria-label="Próxima semana"
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-gray-500"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-sm font-semibold text-gray-600 hidden sm:block">{monthLabel}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Próxima sessão */}
          {nextSession && (
            <button
              onClick={() => handleSessionClick(nextSession)}
              className="hidden md:flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-xl px-3 py-2 text-xs hover:bg-brand-100 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse flex-shrink-0" />
              <span className="text-brand-700 font-medium">
                Próxima: <strong>{nextSession.clientName.split(" ")[0]}</strong>
                {" · "}{nextSession.date === todayStr ? "hoje" : nextSession.date.split("-").reverse().join("/")}
                {" "}{nextSession.startTime}
              </span>
            </button>
          )}

          <button
            onClick={() => setModal({ mode: "create" })}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nova sessão
          </button>
        </div>
      </div>

      {/* ── Grid da semana ── */}
      <div className="flex-1 overflow-auto bg-gray-50" tabIndex={0} aria-label="Grade semanal de sessões">
        <div className="min-w-[640px]">

          {/* Cabeçalho dos dias */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100 grid grid-cols-[56px_repeat(5,1fr)] shadow-sm">
            <div className="border-r border-gray-100" /> {/* coluna de horas */}
            {weekDays.map((day) => {
              const { weekday, day: dayNum, isToday } = formatDayHeader(day);
              const daySessions = sessionsByDay[toDateStr(day)] || [];
              const confirmedCount = daySessions.filter(s => s.status === "confirmed").length;
              return (
                <div
                  key={toDateStr(day)}
                  className={cn(
                    "py-3 text-center border-r border-gray-100 last:border-r-0",
                    isToday && "bg-brand-50"
                  )}
                >
                  <p className={cn("text-xs font-medium", isToday ? "text-brand-500" : "text-gray-500")}>
                    {weekday}
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-0.5">
                    <p className={cn(
                      "text-lg font-bold leading-none",
                      isToday ? "text-brand-600" : "text-gray-800"
                    )}>
                      {dayNum}
                    </p>
                    {confirmedCount > 0 && (
                      <span className={cn(
                        "text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center",
                        isToday ? "bg-brand-500 text-white" : "bg-gray-200 text-gray-600"
                      )}>
                        {confirmedCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Linhas de hora */}
          <div className="grid grid-cols-[56px_repeat(5,1fr)]">
            {/* Coluna de horas */}
            <div className="border-r border-gray-100">
              {HOURS.map(h => (
                <div
                  key={h}
                  className="border-b border-gray-100 flex items-start justify-end pr-2 pt-1"
                  style={{ height: SLOT_H }}
                >
                  <span className="text-[10px] text-gray-600 font-medium leading-none">
                    {h.toString().padStart(2, "0")}h
                  </span>
                </div>
              ))}
            </div>

            {/* Colunas dos dias */}
            {weekDays.map((day) => {
              const dateStr   = toDateStr(day);
              const daySess   = sessionsByDay[dateStr] || [];
              const isToday   = dateStr === todayStr;

              return (
                <div
                  key={dateStr}
                  className={cn("relative border-r border-gray-100 last:border-r-0", isToday && "bg-brand-50/30")}
                  style={{ height: HOURS.length * SLOT_H }}
                >
                  {/* Linhas de hora clicáveis */}
                  {HOURS.map(h => (
                    <div
                      key={h}
                      onClick={() => handleSlotClick(day, h)}
                      className="absolute left-0 right-0 border-b border-gray-100 hover:bg-brand-50/60 cursor-pointer transition-colors group"
                      style={{ top: (h - HOUR_START) * SLOT_H, height: SLOT_H }}
                    >
                      {/* Hint de + ao hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1">
                        <Plus className="w-3 h-3 text-brand-400" />
                      </div>
                    </div>
                  ))}

                  {/* Linha de "agora" */}
                  {isToday && todayHour >= HOUR_START && todayHour < HOUR_END && (
                    <div
                      className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                      style={{ top: (today.getHours() * 60 + today.getMinutes() - HOUR_START * 60) / 60 * SLOT_H }}
                    >
                      <div className="w-2 h-2 rounded-full bg-brand-500 -ml-1 flex-shrink-0" />
                      <div className="flex-1 h-px bg-brand-400" />
                    </div>
                  )}

                  {/* Blocos de sessão */}
                  {daySess.map(s => (
                    <SessionBlock
                      key={s.id}
                      session={s}
                      onClick={() => handleSessionClick(s)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Legenda de status ── */}
      <div className="flex items-center gap-4 px-6 py-2.5 bg-white border-t border-gray-100 flex-shrink-0 overflow-x-auto" tabIndex={0} aria-label="Legenda de status das sessões">
        {(Object.entries(STATUS_CONFIG) as [SessionStatus, typeof STATUS_CONFIG[SessionStatus]][]).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5 flex-shrink-0">
            <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
            <span className="text-xs text-gray-500">{cfg.label}</span>
          </div>
        ))}
        <span className="ml-auto text-xs text-gray-500 flex-shrink-0 hidden sm:block">
          Clique em qualquer horário para marcar uma sessão
        </span>
      </div>

      {/* ── Modal ── */}
      {modal && user && (
        <SessionModal
          state={modal}
          clients={clients}
          therapistId={user.id}
          onClose={() => setModal(null)}
          onCreate={handleCreate}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
