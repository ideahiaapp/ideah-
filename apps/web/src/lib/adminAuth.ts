import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export class AdminAuthError extends Error {}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Verifica o token de sessão Supabase (Authorization: Bearer <access_token>)
 * e confirma que o e-mail do usuário autenticado está na tabela `admins`.
 * Lança AdminAuthError se o token for inválido ou o usuário não for admin.
 */
export async function requireAdmin(req: NextRequest): Promise<string> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new AdminAuthError("Acesso negado.");

  const supabase = serviceClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user?.email) throw new AdminAuthError("Acesso negado.");

  const email = userData.user.email.toLowerCase().trim();
  const { data: adminRow } = await supabase
    .from("admins")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (!adminRow) throw new AdminAuthError("Acesso negado.");
  return email;
}
