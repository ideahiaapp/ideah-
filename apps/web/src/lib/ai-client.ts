import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

export type AIProvider = "anthropic" | "gemini" | "ollama";

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIClientOptions {
  provider: AIProvider;
  apiKey: string;
}

/* ── Lê provider e key do request ────────────────────── */
export function getAIOptions(req: NextRequest): AIClientOptions {
  const provider = (req.headers.get("x-ai-provider") ?? "anthropic") as AIProvider;

  // Suporta header antigo (x-anthropic-key) e novo (x-ai-key)
  const apiKey =
    req.headers.get("x-ai-key") ||
    req.headers.get("x-anthropic-key") ||
    (provider === "anthropic" ? process.env.ANTHROPIC_API_KEY
      : provider === "gemini" ? process.env.GEMINI_API_KEY
      : "") ||
    "";

  // Ollama não precisa de API key (roda local)
  if (!apiKey && provider !== "ollama") {
    throw new Error(
      "API Key não configurada. Acesse Configurações → API Key para informar sua chave."
    );
  }

  return { provider, apiKey };
}

export interface ChatResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

/** Estimativa grosseira de tokens (~4 caracteres por token) para provedores que não retornam contagem real. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/* ── Chat unificado ───────────────────────────────────── */
export async function chat(options: {
  provider: AIProvider;
  apiKey: string;
  system: string;
  messages: AIMessage[];
  maxTokens?: number;
  model?: string;
}): Promise<ChatResult> {
  const { provider, apiKey, system, messages, maxTokens = 1024 } = options;

  if (provider === "ollama") {
    const ollamaUrl = apiKey || "http://localhost:11434";
    const model = options.model ?? "llama3";
    const body = {
      model,
      messages: [
        { role: "system", content: system },
        ...messages,
      ],
      stream: false,
    };
    // Usa http nativo para evitar headersTimeout do undici
    const ollamaResult = await new Promise<string>((resolve, reject) => {
      const http = require("http");
      const payload = JSON.stringify(body);
      const urlObj = new URL(`${ollamaUrl}/api/chat`);
      const req = http.request({
        hostname: urlObj.hostname,
        port: urlObj.port || 11434,
        path: urlObj.pathname,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) },
        timeout: 600_000,
      }, (res: any) => {
        let data = "";
        res.on("data", (chunk: any) => { data += chunk; });
        res.on("end", () => {
          if (res.statusCode !== 200) reject(new Error(`Ollama error: ${res.statusCode} ${data}`));
          else resolve(data);
        });
      });
      req.on("error", reject);
      req.on("timeout", () => { req.destroy(); reject(new Error("Ollama timeout")); });
      req.write(payload);
      req.end();
    });
    const data = JSON.parse(ollamaResult);
    const text = data.message?.content ?? "";
    return {
      text,
      inputTokens:  data.prompt_eval_count  ?? estimateTokens(system + messages.map(m => m.content).join("")),
      outputTokens: data.eval_count         ?? estimateTokens(text),
    };
  }

  if (provider === "gemini") {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: options.model ?? "gemini-2.0-flash",
      systemInstruction: system,
    });

    // Converte mensagens para formato Gemini
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const chatSession = model.startChat({ history });
    const result = await chatSession.sendMessage(lastMessage.content);
    const text = result.response.text();
    const usage = result.response.usageMetadata;
    return {
      text,
      inputTokens:  usage?.promptTokenCount     ?? estimateTokens(system + messages.map(m => m.content).join("")),
      outputTokens: usage?.candidatesTokenCount ?? estimateTokens(text),
    };
  }

  // Anthropic (padrão)
  const client = new Anthropic({ apiKey, maxRetries: 5 });
  let response;
  try {
    response = await client.messages.create({
      model: options.model ?? "claude-opus-4-5",
      max_tokens: maxTokens,
      system,
      messages,
    });
  } catch (err) {
    throw new Error(friendlyAnthropicError(err));
  }

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Resposta inesperada da API");
  return {
    text: content.text,
    inputTokens:  response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

/** Traduz erros da API da Anthropic em mensagens amigáveis para o usuário final. */
function friendlyAnthropicError(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    const errorType = (err.error as { error?: { type?: string } } | undefined)?.error?.type;

    if (err.status === 529 || errorType === "overloaded_error") {
      return "O serviço de IA está temporariamente sobrecarregado. Aguarde alguns instantes e tente novamente.";
    }
    if (err.status === 429) {
      return "Muitas solicitações em um curto período. Aguarde um instante e tente novamente.";
    }
    if (err.status === 401 || err.status === 403) {
      return "Chave de API inválida ou sem permissão. Verifique em Configurações → API Key.";
    }
    if (err.status && err.status >= 500) {
      return "O serviço de IA está temporariamente indisponível. Tente novamente em instantes.";
    }
  }
  return err instanceof Error ? err.message : "Erro ao comunicar com o serviço de IA.";
}
