// ─── User & Auth ────────────────────────────────────────────────────────────

export type UserRole = "therapist" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
}

// ─── Therapeutic Approaches ─────────────────────────────────────────────────

export type TherapeuticApproach =
  | "psychoanalysis"
  | "cognitive_behavioral"
  | "somatic"
  | "humanistic"
  | "systemic"
  | "jungian"
  | "gestalt"
  | "acceptance_commitment";

export const APPROACH_LABELS: Record<TherapeuticApproach, string> = {
  psychoanalysis: "Psicanálise",
  cognitive_behavioral: "Terapia Cognitivo-Comportamental (TCC)",
  somatic: "Psicologia Somática",
  humanistic: "Humanismo / Abordagem Centrada na Pessoa",
  systemic: "Terapia Sistêmica",
  jungian: "Psicologia Analítica (Junguiana)",
  gestalt: "Gestalt-terapia",
  acceptance_commitment: "ACT (Acceptance and Commitment Therapy)",
};

// ─── Client ──────────────────────────────────────────────────────────────────

export type ClientStatus = "active" | "inactive" | "waitlist";

export interface Client {
  id: string;
  therapistId: string;
  name: string;
  email?: string;
  phone?: string;
  birthDate?: Date;
  status: ClientStatus;
  approach: TherapeuticApproach;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Clinical Evolution ──────────────────────────────────────────────────────

export interface Evolution {
  id: string;
  clientId: string;
  therapistId: string;
  sessionDate: Date;
  content: string;
  hypothesis?: string;
  resources?: string;
  createdAt: Date;
}

// ─── Supervision (AI Chat) ───────────────────────────────────────────────────

export type MessageRole = "user" | "assistant";

export interface SupervisionMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

export interface SupervisionSession {
  id: string;
  therapistId: string;
  clientId?: string;
  approach: TherapeuticApproach;
  title: string;
  messages: SupervisionMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Subscription ────────────────────────────────────────────────────────────

export type PlanType = "trial" | "monthly" | "yearly";
export type SubscriptionStatus = "active" | "canceled" | "expired" | "trial";

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  trialEndsAt?: Date;
  currentPeriodEnd?: Date;
  createdAt: Date;
}

// ─── API Response ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
