"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type VoiceState = "idle" | "recording" | "unsupported";

/* ── Tipos da Web Speech API (não incluídos no lib.dom.d.ts padrão) ── */
interface SpeechRecognitionResultItem { transcript: string; confidence: number; }
interface SpeechRecognitionResult {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionResultItem;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  readonly resultIndex: number;
  [index: number]: SpeechRecognitionResult;
}
interface MySpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface MySpeechRecognitionErrorEvent extends Event { error: string; }
interface MySpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart:  ((this: MySpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: MySpeechRecognition, ev: MySpeechRecognitionEvent) => void) | null;
  onerror:  ((this: MySpeechRecognition, ev: MySpeechRecognitionErrorEvent) => void) | null;
  onend:    ((this: MySpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => MySpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition ||
    null
  );
}

/* ── Hook ─────────────────────────────────────────── */
interface UseVoiceInputOptions {
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  lang?: string;
}

export function useVoiceInput({ onInterim, onFinal, lang = "pt-BR" }: UseVoiceInputOptions) {
  const [state,       setState]   = useState<VoiceState>("idle");
  const [interimText, setInterim] = useState("");
  const recRef                    = useRef<MySpeechRecognition | null>(null);

  useEffect(() => {
    if (!getSpeechRecognition()) setState("unsupported");
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) { setState("unsupported"); return; }

    const rec = new Ctor();
    rec.lang            = lang;
    rec.interimResults  = true;
    rec.continuous      = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => { setState("recording"); setInterim(""); };

    rec.onresult = (ev) => {
      let interim = "";
      let finals  = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) finals += t + " ";
        else interim += t;
      }
      if (finals) { onFinal(finals.trim()); }
      setInterim(interim);
      onInterim?.(interim);
    };

    rec.onerror = (ev) => {
      if (ev.error !== "no-speech") console.warn("Voice error:", ev.error);
      setState("idle"); setInterim("");
    };

    rec.onend = () => { setState("idle"); setInterim(""); };

    recRef.current = rec;
    rec.start();
  }, [lang, onFinal, onInterim]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setState("idle"); setInterim("");
  }, []);

  const toggle = useCallback(() => {
    state === "recording" ? stop() : start();
  }, [state, start, stop]);

  useEffect(() => () => { recRef.current?.abort(); }, []);

  return { state, interimText, toggle, start, stop };
}
