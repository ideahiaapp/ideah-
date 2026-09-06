export type DarichaEvent = {
  id: string;
  created_at: string;
  session_id: string;
  event_type: "start" | "slide_view" | "cta_click";
  slide_index: number;
  slide_id: string;
  device: string | null;
  name: string | null;
};
