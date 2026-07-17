import { useCallback, useEffect, useState } from "react";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

export type VoiceState = "idle" | "recording" | "unsupported";

/**
 * Hook de ditado por voz para campos de texto, equivalente ao useVoiceInput do web.
 * Usa reconhecimento nativo no iOS/Android e a Web Speech API no navegador.
 */
export function useVoiceInput({ onFinal }: { onFinal: (text: string) => void }) {
  const [state, setState] = useState<VoiceState>("idle");
  const [interimText, setInterimText] = useState("");

  useEffect(() => {
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
    if (state === "unsupported") return;

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
