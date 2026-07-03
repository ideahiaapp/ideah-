"use client";

import { useId } from "react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Botão de microfone standalone ────────────────── */
interface MicButtonProps {
  /** Chamado com o trecho final transcrito — deve ser appendado ao campo pelo pai */
  onTranscript: (text: string) => void;
  /** Se true, botão fica menor (para inputs de linha única) */
  compact?: boolean;
  className?: string;
}

export function MicButton({ onTranscript, compact = false, className }: MicButtonProps) {
  const { state, toggle } = useVoiceInput({
    onFinal: onTranscript,
  });

  if (state === "unsupported") return null;

  const isRecording = state === "recording";

  return (
    <button
      type="button"
      onClick={toggle}
      title={isRecording ? "Parar gravação" : "Falar para transcrever"}
      className={cn(
        "flex-shrink-0 rounded-xl transition-all border font-medium",
        compact ? "p-2" : "p-2.5",
        isRecording
          ? "bg-red-500 border-red-500 text-white shadow-md shadow-red-200 animate-pulse"
          : "bg-white border-gray-200 text-gray-400 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50",
        className
      )}
    >
      {isRecording
        ? <MicOff className={cn(compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
        : <Mic    className={cn(compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
      }
    </button>
  );
}

/* ── Wrapper para textarea com microfone ───────────── */
interface VoiceTextareaProps {
  label: string;
  hint?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function VoiceTextarea({
  label, hint, required, value, onChange, placeholder, rows = 4,
}: VoiceTextareaProps) {
  const { state, interimText, toggle } = useVoiceInput({
    onFinal: (text) => {
      // Append: adiciona espaço se já há conteúdo
      onChange(value ? `${value.trimEnd()} ${text}` : text);
    },
  });

  const isRecording = state === "recording";
  const inputId = useId();

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={inputId} className="text-xs font-semibold text-gray-600">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {state !== "unsupported" && (
          <button
            type="button"
            onClick={toggle}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition-all",
              isRecording
                ? "bg-red-500 border-red-500 text-white shadow-sm"
                : "bg-white border-gray-200 text-gray-400 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50"
            )}
          >
            {isRecording
              ? <><MicOff className="w-3 h-3" /> Parar</>
              : <><Mic    className="w-3 h-3" /> Falar</>
            }
          </button>
        )}
      </div>

      {/* Área de texto com indicador de gravação */}
      <div className={cn(
        "relative rounded-xl border transition-all",
        isRecording
          ? "border-red-300 ring-2 ring-red-100 bg-red-50/30"
          : "border-gray-200 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100 bg-white"
      )}>
        <textarea
          id={inputId}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-4 py-3 text-sm bg-transparent resize-none focus:outline-none text-gray-800 placeholder-gray-400 leading-relaxed"
        />

        {/* Transcrição ao vivo (texto interim) */}
        {isRecording && (
          <div className="px-4 pb-2">
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0 animate-pulse" />
              <p className="text-xs text-red-600 italic leading-relaxed min-h-[16px]">
                {interimText || "Ouvindo…"}
              </p>
            </div>
          </div>
        )}

        {/* Indicador de gravação no canto */}
        {isRecording && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            REC
          </div>
        )}
      </div>

      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

/* ── Wrapper para input linha única com microfone ── */
interface VoiceInputProps {
  label: string;
  hint?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function VoiceInput({
  label, hint, required, value, onChange, placeholder,
}: VoiceInputProps) {
  // Uma única instância do hook — compartilhada pelo input e pelo botão
  const { state, interimText, toggle } = useVoiceInput({
    onFinal: (text) => {
      onChange(value ? `${value.trimEnd()} ${text}` : text);
    },
  });

  const isRecording = state === "recording";
  const inputId = useId();

  return (
    <div>
      <label htmlFor={inputId} className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="flex gap-2">
        <div className={cn(
          "flex-1 relative rounded-xl border transition-all overflow-hidden",
          isRecording
            ? "border-red-300 ring-2 ring-red-100"
            : "border-gray-200 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100"
        )}>
          <input
            id={inputId}
            type="text"
            value={isRecording && interimText ? `${value} ${interimText}` : value}
            onChange={e => !isRecording && onChange(e.target.value)}
            placeholder={isRecording ? "Ouvindo…" : placeholder}
            readOnly={isRecording}
            className={cn(
              "w-full px-4 py-2.5 text-sm bg-white focus:outline-none text-gray-800 placeholder-gray-400",
              isRecording && "bg-red-50/30 text-gray-600 italic"
            )}
          />
          {isRecording && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
              REC
            </div>
          )}
        </div>
        {state !== "unsupported" && (
          <button
            type="button"
            onClick={toggle}
            title={isRecording ? "Parar gravação" : "Falar para transcrever"}
            className={cn(
              "flex-shrink-0 p-2 rounded-xl transition-all border font-medium",
              isRecording
                ? "bg-red-500 border-red-500 text-white shadow-md shadow-red-200 animate-pulse"
                : "bg-white border-gray-200 text-gray-400 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50"
            )}
          >
            {isRecording
              ? <MicOff className="w-3.5 h-3.5" />
              : <Mic    className="w-3.5 h-3.5" />
            }
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
