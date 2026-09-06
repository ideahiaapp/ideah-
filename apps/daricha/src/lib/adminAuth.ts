import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "da_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12h

function secret() {
  return process.env.INTERESSADOS_COOKIE_SECRET || "";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createAdminCookieValue(): { value: string; maxAge: number } {
  const issuedAt = Date.now().toString();
  const signature = sign(issuedAt);
  return { value: `${issuedAt}.${signature}`, maxAge: MAX_AGE_SECONDS };
}

export function isValidAdminCookie(value: string | undefined): boolean {
  if (!value || !secret()) return false;
  const [issuedAt, signature] = value.split(".");
  if (!issuedAt || !signature) return false;

  const expected = sign(issuedAt);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;

  const age = Date.now() - Number(issuedAt);
  return age >= 0 && age <= MAX_AGE_SECONDS * 1000;
}

export function checkPassword(candidate: string): boolean {
  const real = process.env.INTERESSADOS_PASSWORD || "";
  if (!real) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(real);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export { COOKIE_NAME };
