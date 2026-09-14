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

// Erros depois dos quais reiniciar não adianta — o usuário precisa agir.
const FATAL_ERRORS = new Set(["not-allowed", "service-not-allowed", "audio-capture"]);

/* ── Hook ─────────────────────────────────────────── */
interface UseVoiceInputOptions {
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  lang?: string;
}

export function useVoiceInput({ onInterim, onFinal, lang = "pt-BR" }: UseVoiceInputOptions) {
  const [state,       setState]   = useState<VoiceState>("idle");
  const [interimText, setInterim] = useState("");
  const recRef       = useRef<MySpeechRecognition | null>(null);
  // Continua true enquanto o usuário quiser gravar — mesmo que o navegador
  // encerre sozinho o reconhecimento no meio do caminho (ele faz isso a
  // cada poucos segundos de silêncio, mesmo com continuous=true).
  const shouldRunRef = useRef(false);
  const onFinalRef   = useRef(onFinal);
  const onInterimRef = useRef(onInterim);
  const langRef       = useRef(lang);

  useEffect(() => { onFinalRef.current = onFinal; }, [onFinal]);
  useEffect(() => { onInterimRef.current = onInterim; }, [onInterim]);
  useEffect(() => { langRef.current = lang; }, [lang]);

  useEffect(() => {
    if (!getSpeechRecognition()) setState("unsupported");
  }, []);

  const createAndStart = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) { setState("unsupported"); return; }

    const rec = new Ctor();
    rec.lang            = langRef.current;
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
      if (finals) { onFinalRef.current(finals.trim()); }
      setInterim(interim);
      onInterimRef.current?.(interim);
    };

    rec.onerror = (ev) => {
      if (ev.error !== "no-speech") console.warn("Voice error:", ev.error);
      if (FATAL_ERRORS.has(ev.error)) shouldRunRef.current = false;
      // Outros erros (ex.: "no-speech", "aborted") são tratados no onend,
      // que decide se reinicia ou encerra de vez.
    };

    rec.onend = () => {
      // O navegador encerra o reconhecimento sozinho após qualquer pausa
      // curta na fala, mesmo com continuous=true. Reinicia na hora se o
      // usuário ainda não pediu pra parar.
      if (shouldRunRef.current) {
        createAndStart();
      } else {
        setState("idle"); setInterim("");
      }
    };

    recRef.current = rec;
    rec.start();
  }, []);

  const start = useCallback(() => {
    shouldRunRef.current = true;
    createAndStart();
  }, [createAndStart]);

  const stop = useCallback(() => {
    shouldRunRef.current = false;
    recRef.current?.stop();
    setState("idle"); setInterim("");
  }, []);

  const toggle = useCallback(() => {
    state === "recording" ? stop() : start();
  }, [state, start, stop]);

  useEffect(() => () => { shouldRunRef.current = false; recRef.current?.abort(); }, []);

  return { state, interimText, toggle, start, stop };
}
