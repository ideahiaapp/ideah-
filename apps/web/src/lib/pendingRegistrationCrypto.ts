import crypto from "crypto";

// Criptografia server-side (AES-256-GCM) da senha escolhida no cadastro, guardada
// temporariamente em `pending_registrations` até o pagamento ser confirmado.
// Usa SUPABASE_SERVICE_ROLE_KEY como segredo — nunca exposto ao cliente.
const SECRET = process.env.PENDING_REGISTRATION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
const PBKDF2_ITER = 310_000;

function deriveKey(salt: Buffer): Buffer {
  if (!SECRET) throw new Error("PENDING_REGISTRATION_SECRET (ou SUPABASE_SERVICE_ROLE_KEY) não configurada.");
  return crypto.pbkdf2Sync(SECRET, salt, PBKDF2_ITER, 32, "sha256");
}

export function encryptPending(plaintext: string): string {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveKey(salt);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [salt, iv, tag, encrypted].map(b => b.toString("base64")).join(".");
}

export function decryptPending(stored: string): string {
  const parts = stored.split(".");
  if (parts.length !== 4) throw new Error("Formato de dado cifrado inválido.");
  const [saltB64, ivB64, tagB64, dataB64] = parts;
  const salt = Buffer.from(saltB64, "base64");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const key = deriveKey(salt);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
