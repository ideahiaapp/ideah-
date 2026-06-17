import { supabase } from "@/lib/supabase";
import type { Client, ClientInsert, ClientUpdate } from "@/lib/database.types";

export async function getClients(therapistId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("therapist_id", therapistId)
    .order("name")
    .returns<Client[]>();
  if (error) throw error;
  return data ?? [];
}

export async function getClient(id: string): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single<Client>();
  if (error) throw error;
  return data;
}

export async function createClient(payload: ClientInsert): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert(payload as object)
    .select()
    .single<Client>();
  if (error) throw error;
  return data;
}

export async function updateClient(id: string, payload: ClientUpdate): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update({ ...payload, updated_at: new Date().toISOString() } as object)
    .eq("id", id)
    .select()
    .single<Client>();
  if (error) throw error;
  return data;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}
