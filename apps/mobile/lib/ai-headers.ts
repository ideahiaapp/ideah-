import { supabase } from "./supabase";
import { secureStorage } from "./secure-storage";

const API_KEY_STORE = "ideah_anthropic_api_key";

/** Monta os headers para chamadas às rotas de IA do backend web, incluindo a API key salva localmente. */
export async function aiHeaders(): Promise<Record<string, string>> {
  const apiKey = (await secureStorage.getItem(API_KEY_STORE)) ?? "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["x-ai-key"] = apiKey;
    headers["x-ai-provider"] = "anthropic";
    headers["x-anthropic-key"] = apiKey;
  }
  return headers;
}

/** Monta os headers com o token de sessão Supabase, para rotas autenticadas (ex.: certificado, admin). */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
