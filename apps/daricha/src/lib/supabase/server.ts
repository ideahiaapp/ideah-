import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente com service role — só usado em server components/route handlers,
// nunca enviado ao navegador. Serve exclusivamente o painel /interessados.
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
