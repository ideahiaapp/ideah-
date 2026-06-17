export * from "./clients";
export * from "./evolutions";
export * from "./supervisions";
export * from "./sessions";

/* ── Helpers ──────────────────────────────────────────── */
const PALETTE = ["#924B92","#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#14B8A6","#F97316","#06B6D4"];

export function generateInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

export function generateColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h << 5) - h + c.charCodeAt(0);
  return PALETTE[Math.abs(h) % PALETTE.length];
}
