import { encrypt, decrypt, isEncrypted } from "./crypto";

export type AIProvider = "anthropic" | "gemini";

const STORAGE_KEY     = "ideah_anthropic_api_key"; // mantém compatibilidade
const PROVIDER_KEY    = "ideah_ai_provider";

/* ── Provider ───────────────────────────────────── */

export function getProvider(): AIProvider {
  if (typeof window === "undefined") return "anthropic";
  return (localStorage.getItem(PROVIDER_KEY) as AIProvider) || "anthropic";
}

export function saveProvider(provider: AIProvider): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROVIDER_KEY, provider);
}

/* ── Leitura ────────────────────────────────────── */

export async function getApiKey(): Promise<string> {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return "";
  try {
    if (!isEncrypted(stored)) return stored;
    return await decrypt(stored);
  } catch {
    return "";
  }
}

export function hasApiKey(): boolean {
  if (typeof window === "undefined") return false;
  return (localStorage.getItem(STORAGE_KEY) || "").length > 0;
}

/* ── Escrita ─────────────────────────────────────── */

export async function saveApiKey(key: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!key) { localStorage.removeItem(STORAGE_KEY); return; }
  const encrypted = await encrypt(key);
  localStorage.setItem(STORAGE_KEY, encrypted);
}

export function removeApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/* ── Headers para chamadas de IA ────────────────── */

export async function aiHeaders(): Promise<HeadersInit> {
  const key      = await getApiKey();
  const provider = getProvider();
  return {
    "Content-Type": "application/json",
    ...(key ? {
      "x-ai-key":       key,
      "x-ai-provider":  provider,
      // Mantém compatibilidade com código legado
      "x-anthropic-key": key,
    } : {}),
  };
}

/* ── Utilitário visual ───────────────────────────── */

export function maskApiKey(plainKey: string): string {
  if (!plainKey || plainKey.length < 10) return "••••••••••••••••";
  const prefix = plainKey.slice(0, 10);
  const suffix = plainKey.slice(-4);
  const dots   = "•".repeat(Math.max(16, plainKey.length - 14));
  return `${prefix}${dots}${suffix}`;
}

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  anthropic: "Anthropic (Claude)",
  gemini:    "Google Gemini",
};

export const PROVIDER_KEY_HINTS: Record<AIProvider, string> = {
  anthropic: "sk-ant-api03-...",
  gemini:    "AIza...",
};

export const PROVIDER_LINKS: Record<AIProvider, string> = {
  anthropic: "https://console.anthropic.com/",
  gemini:    "https://aistudio.google.com/app/apikey",
};
