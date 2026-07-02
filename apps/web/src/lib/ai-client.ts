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

/* ── Chat unificado ───────────────────────────────────── */
export async function chat(options: {
  provider: AIProvider;
  apiKey: string;
  system: string;
  messages: AIMessage[];
  maxTokens?: number;
  model?: string;
}): Promise<string> {
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
    return data.message?.content ?? "";
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
    return result.response.text();
  }

  // Anthropic (padrão)
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: options.model ?? "claude-opus-4-5",
    max_tokens: maxTokens,
    system,
    messages,
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Resposta inesperada da API");
  return content.text;
}
