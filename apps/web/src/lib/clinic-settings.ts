const KEY = "ideah_clinic_settings";

export interface ClinicSettings {
  sessionPrice:    number;   // valor por sessão em R$
  sessionDuration: number;   // duração padrão em minutos
  workDays:        string[]; // ex: ["Segunda","Terça","Quarta","Quinta","Sexta"]
  workStart:       string;   // "08:00"
  workEnd:         string;   // "18:00"
}

const DEFAULTS: ClinicSettings = {
  sessionPrice:    180,
  sessionDuration: 50,
  workDays:        ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
  workStart:       "08:00",
  workEnd:         "18:00",
};

export function getClinicSettings(): ClinicSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveClinicSettings(s: Partial<ClinicSettings>): void {
  if (typeof window === "undefined") return;
  const current = getClinicSettings();
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...s }));
}
