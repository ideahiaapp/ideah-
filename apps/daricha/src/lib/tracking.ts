"use client";

import { supabase } from "@/lib/supabase/client";

const SESSION_KEY = "daricha_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function getDevice(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1100) return "tablet";
  return "desktop";
}

export function getNameFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("nome") || params.get("name") || null;
}

export type EventType = "start" | "slide_view" | "cta_click";

export async function trackEvent(
  eventType: EventType,
  slideIndex: number,
  slideId: string,
) {
  if (!supabase) return;
  try {
    await supabase.from("daricha_events").insert({
      session_id: getSessionId(),
      event_type: eventType,
      slide_index: slideIndex,
      slide_id: slideId,
      url: window.location.href,
      referrer: document.referrer || null,
      device: getDevice(),
      user_agent: navigator.userAgent,
      name: getNameFromUrl(),
    });
  } catch {
    // Falha de tracking nunca deve interromper a experiência do visitante.
  }
}
