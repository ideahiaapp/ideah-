import { supabase } from "@/lib/supabase";
import type { Evolution, EvolutionInsert, EvolutionUpdate } from "@/lib/database.types";

export type EvolutionWithClient = Evolution & {
  clients: { name: string; initials: string | null; color: string | null; approach_label: string | null } | null;
};

export async function getEvolutions(therapistId: string): Promise<EvolutionWithClient[]> {
  const { data, error } = await supabase
    .from("evolutions")
    .select("*, clients(name, initials, color, approach_label)")
    .eq("therapist_id", therapistId)
    .order("session_date", { ascending: false })
    .returns<EvolutionWithClient[]>();
  if (error) throw error;
  return data ?? [];
}

export async function getEvolutionsByClient(clientId: string): Promise<Evolution[]> {
  const { data, error } = await supabase
    .from("evolutions")
    .select("*")
    .eq("client_id", clientId)
    .order("session_date", { ascending: false })
    .returns<Evolution[]>();
  if (error) throw error;
  return data ?? [];
}

export async function getEvolution(id: string): Promise<EvolutionWithClient> {
  const { data, error } = await supabase
    .from("evolutions")
    .select("*, clients(name, initials, color, approach_label)")
    .eq("id", id)
    .single<EvolutionWithClient>();
  if (error) throw error;
  return data;
}

export async function createEvolution(payload: EvolutionInsert): Promise<Evolution> {
  const { data, error } = await supabase
    .from("evolutions")
    .insert(payload as object)
    .select()
    .single<Evolution>();
  if (error) throw error;
  return data;
}

export async function updateEvolution(id: string, payload: EvolutionUpdate): Promise<Evolution> {
  const { data, error } = await supabase
    .from("evolutions")
    .update({ ...payload, updated_at: new Date().toISOString() } as object)
    .eq("id", id)
    .select()
    .single<Evolution>();
  if (error) throw error;
  return data;
}

export async function deleteEvolution(id: string): Promise<void> {
  const { error } = await supabase.from("evolutions").delete().eq("id", id);
  if (error) throw error;
}
