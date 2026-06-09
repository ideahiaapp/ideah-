/**
 * Criptografia AES-256-GCM via Web Crypto API (nativa — zero dependências).
 *
 * Fluxo:
 *  1. Na primeira vez, gera um salt aleatório (16 bytes) e salva no localStorage.
 *  2. Deriva uma chave AES-256 via PBKDF2(passphrase + salt, 310.000 iter, SHA-256).
 *  3. Cifra o valor com AES-GCM + IV aleatório (12 bytes).
 *  4. Armazena: base64(salt) + "." + base64(iv) + "." + base64(ciphertext).
 *
 * Quando o banco chegar: a mesma lógica roda no servidor com Node.js crypto.subtle
 * (disponível desde Node 18) — só muda onde o salt fica guardado (coluna na DB).
 */

const APP_PASSPHRASE = "ideah-supervisao-clinica-v1"; // fixo no código
const SALT_KEY       = "ideah_enc_salt";               // chave do salt no localStorage
const PBKDF2_ITER    = 310_000;                        // recomendação OWASP 2024

/* ── Helpers base64 ──────────────────────────────── */
function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes));
}

function fromB64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/* ── Salt por dispositivo ────────────────────────── */
function getOrCreateSalt(): Uint8Array {
  const stored = localStorage.getItem(SALT_KEY);
  if (stored) return fromB64(stored);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(SALT_KEY, toB64(salt));
  return salt;
}

/* ── Derivação de chave ──────────────────────────── */
async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const enc     = new TextEncoder();
  const keyMat  = await crypto.subtle.importKey(
    "raw",
    enc.encode(APP_PASSPHRASE),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITER, hash: "SHA-256" },
    keyMat,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/* ── API pública ─────────────────────────────────── */

/**
 * Cifra um texto plano.
 * Retorna string no formato: "<salt_b64>.<iv_b64>.<cipher_b64>"
 */
export async function encrypt(plaintext: string): Promise<string> {
  const salt = getOrCreateSalt();
  const key  = await deriveKey(salt);
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const enc  = new TextEncoder();

  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext),
  );

  return [toB64(salt), toB64(iv), toB64(cipherBuf)].join(".");
}

/**
 * Decifra um valor no formato "<salt_b64>.<iv_b64>.<cipher_b64>".
 * Retorna o texto original, ou lança erro se o valor estiver corrompido.
 */
export async function decrypt(stored: string): Promise<string> {
  const parts = stored.split(".");
  if (parts.length !== 3) throw new Error("Formato de dado cifrado inválido.");

  const [saltB64, ivB64, cipherB64] = parts;
  const salt   = fromB64(saltB64);
  const iv     = fromB64(ivB64);
  const cipher = fromB64(cipherB64);

  const key    = await deriveKey(salt);

  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    cipher.buffer as ArrayBuffer,
  );

  return new TextDecoder().decode(plainBuf);
}

/**
 * Retorna true se a string parecer um valor cifrado pelo nosso esquema.
 * (não valida criptograficamente — só verifica o formato)
 */
export function isEncrypted(value: string): boolean {
  return value.split(".").length === 3 && value.length > 60;
}
