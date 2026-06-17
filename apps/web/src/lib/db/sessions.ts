import { supabase } from "@/lib/supabase";
import type { Session, SessionInsert, SessionUpdate } from "@/lib/database.types";

export type SessionWithClient = Session & {
  clients: { name: string; initials: string | null; color: string | null } | null;
};

export async function getSessions(therapistId: string): Promise<SessionWithClient[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*, clients(name, initials, color)")
    .eq("therapist_id", therapistId)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .returns<SessionWithClient[]>();
  if (error) throw error;
  return data ?? [];
}

export async function createSession(payload: SessionInsert): Promise<SessionWithClient> {
  const { data, error } = await supabase
    .from("sessions")
    .insert(payload as object)
    .select("*, clients(name, initials, color)")
    .single<SessionWithClient>();
  if (error) throw error;
  return data;
}

export async function updateSession(id: string, payload: SessionUpdate): Promise<Session> {
  const { data, error } = await supabase
    .from("sessions")
    .update({ ...payload, updated_at: new Date().toISOString() } as object)
    .eq("id", id)
    .select()
    .single<Session>();
  if (error) throw error;
  return data;
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) throw error;
}
