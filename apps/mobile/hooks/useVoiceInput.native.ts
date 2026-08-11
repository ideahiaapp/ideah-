import { useCallback, useEffect, useState } from "react";

export type VoiceState = "idle" | "recording" | "unsupported";

/* eslint-disable @typescript-eslint/no-explicit-any */
type SpeechModule = typeof import("expo-speech-recognition");

let ExpoSpeechRecognitionModule: SpeechModule["ExpoSpeechRecognitionModule"] | null = null;
let useSpeechRecognitionEvent: SpeechModule["useSpeechRecognitionEvent"] = (() => {}) as any;

// O pacote acessa o módulo nativo assim que é importado (require), o que lança
// imediatamente em ambientes sem o módulo nativo compilado (ex.: Expo Go, que só
// embarca os módulos padrão do SDK — expo-speech-recognition exige um dev client
// próprio). Sem esse try/catch em torno do require, o app inteiro quebra ao abrir.
try {
  const mod = require("expo-speech-recognition") as SpeechModule;
  ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
} catch {
  // Módulo nativo indisponível — o hook cai no estado "unsupported" abaixo.
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Hook de ditado por voz para campos de texto, equivalente ao useVoiceInput do web.
 * Usa reconhecimento nativo no iOS/Android e a Web Speech API no navegador.
 */
export function useVoiceInput({ onFinal }: { onFinal: (text: string) => void }) {
  const [state, setState] = useState<VoiceState>(ExpoSpeechRecognitionModule ? "idle" : "unsupported");
  const [interimText, setInterimText] = useState("");

  useEffect(() => {
    if (!ExpoSpeechRecognitionModule) return;
    try {
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        setState("unsupported");
      }
    } catch {
      setState("unsupported");
    }
  }, []);

  useSpeechRecognitionEvent("start", () => setState("recording"));

  useSpeechRecognitionEvent("end", () => {
    setState(prev => (prev === "unsupported" ? prev : "idle"));
    setInterimText("");
  });

  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results[0]?.transcript ?? "";
    if (event.isFinal) {
      if (text.trim()) onFinal(text.trim());
      setInterimText("");
    } else {
      setInterimText(text);
    }
  });

  useSpeechRecognitionEvent("error", () => {
    setState("idle");
    setInterimText("");
  });

  const toggle = useCallback(async () => {
    if (state === "unsupported" || !ExpoSpeechRecognitionModule) return;

    if (state === "recording") {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) return;
      ExpoSpeechRecognitionModule.start({
        lang: "pt-BR",
        interimResults: true,
        continuous: true,
      });
    } catch {
      setState("unsupported");
    }
  }, [state]);

  return { state, interimText, toggle };
}
