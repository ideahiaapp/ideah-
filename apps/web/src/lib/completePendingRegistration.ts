import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptPending } from "@/lib/pendingRegistrationCrypto";

interface PendingRegistrationRow {
  id: string;
  email: string;
  name: string;
  password_encrypted: string;
  approaches: string[] | null;
  status: string;
}

/**
 * Cria a conta de verdade no Supabase a partir de um cadastro pendente
 * (senha descriptografada, abordagens vinculadas) e marca o pendente como concluído.
 * Usado tanto pelo webhook da Greenn quanto pela rota de bypass temporária.
 */
export async function completePendingRegistration(supabase: SupabaseClient, pending: PendingRegistrationRow) {
  const password = decryptPending(pending.password_encrypted);

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: pending.email,
    password,
    email_confirm: true,
    user_metadata: { name: pending.name },
  });

  if (createErr || !created.user) {
    throw new Error(createErr?.message ?? "Erro ao criar conta.");
  }

  // Sem isso o AuthGuard bloqueia o login (checa /api/auth/verify, que exige
  // uma linha em therapist_profiles) — é o mesmo passo que /api/auth/register-profile
  // faz no cadastro direto (mobile).
  await supabase
    .from("therapist_profiles")
    .upsert({ user_id: created.user.id, email: pending.email });

  if (pending.approaches?.length) {
    await supabase.from("therapist_approaches").insert(
      pending.approaches.map((approach: string) => ({ therapist_id: created.user.id, approach }))
    );
  }

  // Mantém o registro (auditoria) mas remove a senha cifrada e marca como concluído.
  await supabase
    .from("pending_registrations")
    .update({ status: "completed", password_encrypted: "" })
    .eq("id", pending.id);

  return { userId: created.user.id };
}
