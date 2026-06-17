import { supabase } from "@/lib/supabase";
import type { Supervision, SupervisionInsert, SupervisionMessage, SupervisionMessageInsert } from "@/lib/database.types";

export type SupervisionWithClient = Supervision & {
  clients: { name: string; initials: string | null; color: string | null } | null;
};

/* ── Sessões de supervisão ────────────────────────────── */
export async function getSupervisions(therapistId: string): Promise<SupervisionWithClient[]> {
  const { data, error } = await supabase
    .from("supervisions")
    .select("*, clients(name, initials, color)")
    .eq("therapist_id", therapistId)
    .order("updated_at", { ascending: false })
    .returns<SupervisionWithClient[]>();
  if (error) throw error;
  return data ?? [];
}

export async function getSupervisionsByClient(clientId: string): Promise<Supervision[]> {
  const { data, error } = await supabase
    .from("supervisions")
    .select("*")
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false })
    .returns<Supervision[]>();
  if (error) throw error;
  return data ?? [];
}

export async function createSupervision(payload: SupervisionInsert): Promise<Supervision> {
  const { data, error } = await supabase
    .from("supervisions")
    .insert(payload as object)
    .select()
    .single<Supervision>();
  if (error) throw error;
  return data;
}

export async function updateSupervisionTimestamp(id: string, messagesCount: number): Promise<void> {
  const { error } = await supabase
    .from("supervisions")
    .update({ updated_at: new Date().toISOString(), messages_count: messagesCount } as object)
    .eq("id", id);
  if (error) throw error;
}

/* ── Mensagens ────────────────────────────────────────── */
export async function getMessages(supervisionId: string): Promise<SupervisionMessage[]> {
  const { data, error } = await supabase
    .from("supervision_messages")
    .select("*")
    .eq("supervision_id", supervisionId)
    .order("created_at")
    .returns<SupervisionMessage[]>();
  if (error) throw error;
  return data ?? [];
}

export async function addMessage(payload: SupervisionMessageInsert): Promise<SupervisionMessage> {
  const { data, error } = await supabase
    .from("supervision_messages")
    .insert(payload as object)
    .select()
    .single<SupervisionMessage>();
  if (error) throw error;
  return data;
}
