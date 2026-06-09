"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { aiHeaders } from "@/lib/api-key";
import {
  ArrowLeft,
  Send,
  Loader2,
  Brain,
  Heart,
  Layers,
  Users,
  Zap,
  Activity,
  Circle,
  Compass,
  User,
  AlertCircle,
  Copy,
  Check,
  Mic,
  MicOff,
} from "lucide-react";
import { mockSupervisions, mockClients } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useVoiceInput } from "@/hooks/useVoiceInput";

/* ─── Tipos ─────────────────────────────────────────── */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/* ─── Mapeamentos ─────────────────────────────────────── */
const APPROACH_MAP: Record<string, { label: string; color: string; badgeCls: string; iconBg: string; Icon: React.ElementType }> = {
  PSYCHOANALYSIS:       { label: "Psicanálise",   color: "#7c3aed", badgeCls: "bg-purple-50 text-purple-700 border-purple-200", iconBg: "bg-purple-100 text-purple-600", Icon: Brain },
  COGNITIVE_BEHAVIORAL: { label: "TCC",           color: "#2563eb", badgeCls: "bg-blue-50 text-blue-700 border-blue-200",   iconBg: "bg-blue-100 text-blue-600",   Icon: Layers },
  JUNGIAN:              { label: "Junguiana",      color: "#d97706", badgeCls: "bg-amber-50 text-amber-700 border-amber-200", iconBg: "bg-amber-100 text-amber-600", Icon: Compass },
  HUMANISTIC:           { label: "Humanista",      color: "#16a34a", badgeCls: "bg-green-50 text-green-700 border-green-200", iconBg: "bg-green-100 text-green-600", Icon: Heart },
  SYSTEMIC:             { label: "Sistêmica",      color: "#db2777", badgeCls: "bg-pink-50 text-pink-700 border-pink-200",   iconBg: "bg-pink-100 text-pink-600",   Icon: Users },
  SOMATIC:              { label: "Somática",       color: "#ea580c", badgeCls: "bg-orange-50 text-orange-700 border-orange-200", iconBg: "bg-orange-100 text-orange-600", Icon: Activity },
  GESTALT:              { label: "Gestalt",        color: "#0d9488", badgeCls: "bg-teal-50 text-teal-700 border-teal-200",   iconBg: "bg-teal-100 text-teal-600",   Icon: Circle },
  ACCEPTANCE_COMMITMENT:{ label: "ACT",            color: "#4f46e5", badgeCls: "bg-indigo-50 text-indigo-700 border-indigo-200", iconBg: "bg-indigo-100 text-indigo-600", Icon: Zap },
};

// Mapeia label → key
const LABEL_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(APPROACH_MAP).map(([k, v]) => [v.label, k])
);

/* ─── Markdown simples ────────────────────────────────── */
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-brand-300 pl-3 text-brand-700 italic text-xs my-1">
          {line.slice(2)}
        </blockquote>
      );
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      elements.push(
        <li key={i} className="ml-4 text-sm">
          {formatInline(line.slice(2))}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-1.5" />);
    } else {
      elements.push(
        <p key={i} className="text-sm leading-relaxed">
          {formatInline(line)}
        </p>
      );
    }
  });

  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

/* ─── Bolha de mensagem ───────────────────────────────── */
function MessageBubble({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  async function copyText() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn("flex gap-3 group", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
        isUser ? "bg-brand-100" : "bg-gray-100"
      )}>
        {isUser
          ? <User className="w-4 h-4 text-brand-600" strokeWidth={1.8} />
          : <Brain className="w-4 h-4 text-gray-500" strokeWidth={1.8} />
        }
      </div>

      {/* Conteúdo */}
      <div className={cn("max-w-[75%] space-y-1", isUser ? "items-end" : "items-start")}>
        <div className={cn(
          "rounded-2xl px-4 py-3 shadow-sm",
          isUser
            ? "bg-brand-500 text-white rounded-tr-sm"
            : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
        )}>
          {isUser
            ? <p className="text-sm leading-relaxed">{message.content}</p>
            : renderMarkdown(message.content)
          }
        </div>

        <div className={cn(
          "flex items-center gap-2 px-1",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="text-xs text-gray-300">
            {new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(message.timestamp)}
          </span>
          {!isUser && (
            <button
              onClick={copyText}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-gray-500"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Página principal ─────────────────────────────────── */
export default function SupervisionChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  // Parâmetros da nova sessão (vindos de /new) ou sessão existente
  const isNew = searchParams.get("isNew") === "1";
  const clientId = searchParams.get("client") || "";
  const approachParam = searchParams.get("approach") || "";
  const titleParam = searchParams.get("title") || "";

  // Se for sessão existente, busca nos mocks
  const existingSession = !isNew
    ? mockSupervisions.find((s) => s.id === params.id)
    : null;

  // Resolve approach key
  const approachKey = isNew
    ? approachParam
    : (existingSession ? LABEL_TO_KEY[existingSession.approach] || "PSYCHOANALYSIS" : "PSYCHOANALYSIS");

  const approachInfo = APPROACH_MAP[approachKey] || APPROACH_MAP.PSYCHOANALYSIS;
  const ApproachIcon = approachInfo.Icon;

  // Resolve cliente
  const clientData = isNew
    ? mockClients.find((c) => c.id === clientId)
    : mockClients.find((c) => c.name === existingSession?.clientName);

  const sessionTitle = isNew
    ? (titleParam || `Supervisão — ${clientData?.name}`)
    : existingSession?.title || "Supervisão";

  // Mensagens
  const [messages, setMessages] = useState<Message[]>(() => {
    if (!isNew && existingSession) {
      // Carregar histórico mock
      return [
        {
          id: "mock-1",
          role: "user",
          content: existingSession.lastMessage || "Gostaria de supervisão sobre este caso.",
          timestamp: new Date(existingSession.updatedAt),
        },
      ];
    }
    return [];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { state: voiceState, interimText, toggle: toggleVoice } = useVoiceInput({
    onFinal: (text) => setInput(prev => prev ? `${prev.trimEnd()} ${text}` : text),
  });
  const isVoiceRecording = voiceState === "recording";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/supervision/chat", {
        method: "POST",
        headers: await aiHeaders(),
        body: JSON.stringify({
          messages: history,
          approach: approachKey,
          clientName: clientData?.name || "paciente",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao consultar o supervisor");
      }

      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, approachKey, clientData]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-full -m-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
        <Link
          href="/dashboard/supervision"
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", approachInfo.iconBg)}>
          <ApproachIcon className="w-5 h-5" strokeWidth={1.8} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{sessionTitle}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {clientData && (
              <>
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                  style={{ backgroundColor: clientData.color }}
                >
                  {clientData.initials[0]}
                </div>
                <span className="text-xs text-gray-400">{clientData.name}</span>
                <span className="text-gray-200">·</span>
              </>
            )}
            <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", approachInfo.badgeCls)}>
              {approachInfo.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-lg flex-shrink-0">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          Supervisor ativo
        </div>
      </div>

      {/* ── Área de mensagens ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-gray-50">
        {/* Mensagem de boas-vindas */}
        {messages.length === 0 && (
          <div className="flex justify-center">
            <div className="max-w-md text-center space-y-3 py-8">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto", approachInfo.iconBg)}>
                <ApproachIcon className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-gray-800">
                Supervisão {approachInfo.label} iniciada
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Apresente o material clínico que deseja explorar. Você pode compartilhar
                fragmentos de sessão, dinâmicas observadas, questões de contratransferência
                ou qualquer conteúdo que queira elaborar teoricamente.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {[
                  "Dinâmicas de transferência",
                  "Resistência do paciente",
                  "Questão de limites",
                  "Material de sonho",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-xs bg-white border border-gray-200 hover:border-brand-300 hover:bg-brand-50 text-gray-600 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-1">
              <Brain className="w-4 h-4 text-gray-500" strokeWidth={1.8} />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Elaborando resposta clínica...</span>
              </div>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Erro ao enviar</p>
              <p className="text-xs mt-0.5 text-red-500">{error}</p>
              {error.includes("API") || error.includes("key") ? (
                <p className="text-xs mt-1 text-red-400">
                  Configure a variável <code className="bg-red-100 px-1 rounded">ANTHROPIC_API_KEY</code> no arquivo{" "}
                  <code className="bg-red-100 px-1 rounded">apps/web/.env.local</code>
                </p>
              ) : null}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="border-t border-gray-100 bg-white px-6 py-4 flex-shrink-0">
        {/* Aviso ético */}
        <p className="text-[10px] text-gray-300 text-center mb-3">
          Esta supervisão levanta hipóteses clínicas e recursos teóricos. Não constitui diagnóstico.
          Julgamento clínico é sempre do terapeuta responsável.
        </p>

        <div className="flex gap-3 items-end">
          <div className={cn(
            "flex-1 border rounded-2xl transition-all overflow-hidden",
            isVoiceRecording
              ? "bg-red-50/40 border-red-300 ring-2 ring-red-100"
              : "bg-gray-50 border-gray-200 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100"
          )}>
            <textarea
              ref={textareaRef}
              value={isVoiceRecording && interimText ? `${input} ${interimText}` : input}
              onChange={(e) => !isVoiceRecording && setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              readOnly={isVoiceRecording}
              placeholder={isVoiceRecording ? "Ouvindo…" : "Descreva o material clínico que deseja supervisionar..."}
              rows={1}
              className={cn(
                "w-full bg-transparent px-4 pt-3 pb-2 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none",
                isVoiceRecording && "italic text-gray-600"
              )}
              style={{ maxHeight: 160 }}
            />
            {/* Preview interim em transcrição */}
            {isVoiceRecording && interimText && (
              <div className="px-4 pb-2">
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                  <p className="text-xs text-red-600 italic">{interimText}</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between px-3 pb-2">
              <span className="text-xs text-gray-300">
                {isVoiceRecording ? "🎙 Gravando — clique no mic para parar" : "Enter para enviar · Shift+Enter para nova linha"}
              </span>
              <span className={cn("text-xs", input.length > 1800 ? "text-red-400" : "text-gray-300")}>
                {input.length}/2000
              </span>
            </div>
          </div>

          {/* Botão mic */}
          {voiceState !== "unsupported" && (
            <button
              type="button"
              onClick={toggleVoice}
              title={isVoiceRecording ? "Parar gravação" : "Falar para transcrever"}
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all border",
                isVoiceRecording
                  ? "bg-red-500 border-red-500 text-white shadow-md shadow-red-200 animate-pulse"
                  : "bg-white border-gray-200 text-gray-400 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50"
              )}
            >
              {isVoiceRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
              input.trim() && !loading
                ? "bg-brand-500 hover:bg-brand-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            )}
          >
            {loading
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Send className="w-5 h-5" strokeWidth={2} />
            }
          </button>
        </div>
      </div>
    </div>
  );
}
