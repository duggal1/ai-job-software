import "server-only";
import { z } from "zod";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_FALLBACK_ORDER = ["apodex/apodex-1.1-mini:free"] as const;

const errorSchema = z.object({
  error: z.object({ message: z.string().optional() }).optional(),
});

type GenerateTextInput = {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
};

type Message = {
  role: "system" | "user";
  content: string;
};

type GenerateTextResult = {
  content: string;
  model: (typeof MODEL_FALLBACK_ORDER)[number];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
};

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured.");
  return key;
}

export async function generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
  const apiKey = getApiKey();
  const messages: Message[] = [];
  if (input.system) messages.push({ role: "system", content: input.system });
  messages.push({ role: "user", content: input.prompt });
  const failures: Error[] = [];

  for (const model of MODEL_FALLBACK_ORDER) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: input.temperature ?? 0.8,
          max_tokens: input.maxTokens ?? 16_000,
          stream: true,
          reasoning: { effort: "none" },
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok || !response.body) {
        let message = `OpenRouter returned HTTP ${response.status}`;
        try {
          const body: unknown = await response.json();
          const providerError = errorSchema.safeParse(body);
          if (providerError.success && providerError.data.error?.message) {
            message = providerError.data.error.message;
          }
        } catch {
          // keep default message
        }
        throw new Error(message);
      }

      const decoder = new TextDecoder();
      const reader = response.body.getReader();
      let buffer = "";
      let content = "";
      let usage: GenerateTextResult["usage"] = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let lineEnd = buffer.indexOf("\n");
          while (lineEnd !== -1) {
            const line = buffer.slice(0, lineEnd).trim();
            buffer = buffer.slice(lineEnd + 1);
            lineEnd = buffer.indexOf("\n");
            if (line.startsWith(":") || !line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const chunk = JSON.parse(data) as {
                choices?: Array<{ delta?: { content?: string | null } }>;
                usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
              };
              const delta = chunk.choices?.[0]?.delta?.content;
              if (typeof delta === "string") content += delta;
              if (chunk.usage) {
                usage = {
                  promptTokens: chunk.usage.prompt_tokens,
                  completionTokens: chunk.usage.completion_tokens,
                  totalTokens: chunk.usage.total_tokens,
                };
              }
            } catch {
              // skip malformed chunk
            }
          }
        }
      } finally {
        reader.cancel().catch(() => undefined);
      }

      if (!content) throw new Error("OpenRouter returned no text content.");

      return {
        content,
        model,
        usage,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.warn(`[generate-text] ${model} failed:`, err.message);
      failures.push(err);
    }
  }

  throw new AggregateError(failures, "All configured OpenRouter models failed.");
}
