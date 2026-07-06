import { createClient } from "@supabase/supabase-js";

const DEFAULT_LIMITS: Record<string, number> = {
  trial:  200_000,
  pro:    2_000_000,
  clinic: 8_000_000,
};

export class UsageLimitError extends Error {}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function monthStartIso(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Soma de tokens (input + output) usados pelo terapeuta no mês corrente. */
export async function getMonthlyUsage(therapistId: string): Promise<number> {
  const supabase = serviceClient();
  const { data } = await supabase
    .from("ai_usage_log")
    .select("input_tokens, output_tokens")
    .eq("therapist_id", therapistId)
    .gte("created_at", monthStartIso()) as { data: Array<{ input_tokens: number; output_tokens: number }> | null };

  return (data ?? []).reduce((acc, r) => acc + r.input_tokens + r.output_tokens, 0);
}

/** Limite mensal de tokens do plano do terapeuta (configurável via plan_limits). */
export async function getPlanLimit(therapistId: string): Promise<{ plan: string; limit: number }> {
  const supabase = serviceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", therapistId)
    .single() as { data: { plan: string } | null };
  const plan = profile?.plan ?? "trial";

  const { data: limitRow } = await supabase
    .from("plan_limits")
    .select("monthly_token_limit")
    .eq("plan", plan)
    .single() as { data: { monthly_token_limit: number } | null };

  const limit = limitRow?.monthly_token_limit ?? DEFAULT_LIMITS[plan] ?? DEFAULT_LIMITS.trial;
  return { plan, limit };
}

/** Lança UsageLimitError se o terapeuta já atingiu a cota mensal de tokens do plano. */
export async function assertUnderUsageLimit(therapistId: string): Promise<void> {
  const [{ limit }, used] = await Promise.all([
    getPlanLimit(therapistId),
    getMonthlyUsage(therapistId),
  ]);

  if (used >= limit) {
    throw new UsageLimitError(
      `Limite mensal de uso de IA atingido (${limit.toLocaleString("pt-BR")} tokens). Faça upgrade do seu plano para continuar.`
    );
  }
}

/** Registra o consumo de tokens de uma chamada de IA. */
export async function logAiUsage(params: {
  therapistId: string;
  provider: string;
  model?: string;
  feature: string;
  inputTokens: number;
  outputTokens: number;
}): Promise<void> {
  const supabase = serviceClient();
  await supabase.from("ai_usage_log").insert({
    therapist_id: params.therapistId,
    provider:     params.provider,
    model:        params.model ?? null,
    feature:      params.feature,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
  } as object);
}
