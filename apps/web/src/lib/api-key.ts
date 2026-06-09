/**
 * Gerencia a API Key da Anthropic.
 *
 * Armazenamento: localStorage com criptografia AES-256-GCM.
 * Quando o banco vier: mesma interface, só muda o provider de persistência.
 *
 * O valor em localStorage NUNCA é texto plano — sempre cifrado.
 * Em trânsito (header x-anthropic-key) também vai mascarado na UI, mas
 * a rota de API recebe o valor original decifrado.
 */

import { encrypt, decrypt, isEncrypted } from "./crypto";

const STORAGE_KEY = "ideah_anthropic_api_key";

/* ── Leitura (async — precisa decifrar) ─────────── */

/** Retorna a API key decifrada, ou "" se não houver. */
export async function getApiKey(): Promise<string> {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return "";

  try {
    // Compatibilidade: se ainda for texto plano (migração), retorna direto
    if (!isEncrypted(stored)) return stored;
    return await decrypt(stored);
  } catch {
    return "";
  }
}

/** Retorna true se houver uma chave salva (sem decifrar). */
export function hasApiKey(): boolean {
  if (typeof window === "undefined") return false;
  return (localStorage.getItem(STORAGE_KEY) || "").length > 0;
}

/* ── Escrita (async — precisa cifrar) ───────────── */

/** Cifra e salva a API key. */
export async function saveApiKey(key: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!key) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  const encrypted = await encrypt(key);
  localStorage.setItem(STORAGE_KEY, encrypted);
}

/** Remove a chave salva. */
export function removeApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/* ── Headers para chamadas de IA ────────────────── */

/**
 * Monta os headers com a chave decifrada para as chamadas às rotas de IA.
 * Use `await aiHeaders()` antes do fetch.
 */
export async function aiHeaders(): Promise<HeadersInit> {
  const key = await getApiKey();
  return {
    "Content-Type": "application/json",
    ...(key ? { "x-anthropic-key": key } : {}),
  };
}

/* ── Utilitário visual ───────────────────────────── */

/**
 * Retorna uma versão mascarada da chave para exibir na UI.
 * Ex: "sk-ant-api03-••••••••••••••••••••••••1a2b"
 */
export function maskApiKey(plainKey: string): string {
  if (!plainKey || plainKey.length < 10) return "••••••••••••••••";
  const prefix = plainKey.slice(0, 14);   // "sk-ant-api03-A"
  const suffix = plainKey.slice(-4);       // últimos 4 chars
  const dots   = "•".repeat(Math.max(20, plainKey.length - 18));
  return `${prefix}${dots}${suffix}`;
}
