import "server-only";

/**
 * Reflection AI client.
 *
 * Everything AI in this app (job autofill, resume parsing, founder notes) goes
 * through Beam on Reflection's OpenAI-compatible endpoint. Beam always reasons,
 * so we pin the effort to `medium` and the sampler to the recommended 0.7 /
 * 0.99. Structured callers pass a JSON schema and get guaranteed JSON back.
 */

const REFLECTION_BASE_URL =
  process.env.REFLECTION_BASE_URL ?? "https://api.reflection.ai/openai/v1";
const REFLECTION_MODEL = "Beam-1.0-501B-A23B";

export type ReasoningEffort = "low" | "medium" | "high" | "xhigh" | "max";

export interface JsonSchemaSpec {
  /** 1–64 ASCII letters, digits, underscores or hyphens. */
  name: string;
  schema: Record<string, unknown>;
  description?: string;
  /** Defaults to true — Reflection strict-mode JSON schema adherence. */
  strict?: boolean;
}

type GenerateTextInput = {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  reasoningEffort?: ReasoningEffort;
  jsonSchema?: JsonSchemaSpec;
};

type GenerateTextResult = {
  content: string;
  reasoning: string | null;
  model: typeof REFLECTION_MODEL;
  finishReason: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    reasoningTokens: number | null;
  } | null;
};

type ChatMessage = { role: "system" | "user"; content: string };

const responseSchema = {
  parse(value: unknown) {
    if (typeof value !== "object" || value === null) {
      throw new Error("Reflection returned an unreadable response.");
    }
    const body = value as {
      choices?: Array<{
        message?: {
          content?: string | null;
          reasoning_content?: string | null;
          refusal?: string | null;
        };
        finish_reason?: string;
      }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
        completion_tokens_details?: { reasoning_tokens?: number };
      };
      error?: { message?: string; code?: string };
    };

    if (body.error?.message) throw new Error(body.error.message);

    const choice = body.choices?.[0];
    const message = choice?.message;
    if (!choice || !message) throw new Error("Reflection returned no completion.");

    const finishReason = choice.finish_reason ?? "stop";
    if (message.refusal) throw new Error(`Reflection refused: ${message.refusal}`);
    if (finishReason === "length") {
      throw new Error(
        "Reflection ran out of output tokens before finishing. Raise max_completion_tokens or lower reasoning effort.",
      );
    }
    if (finishReason === "content_filter") {
      throw new Error("Reflection filtered the response.");
    }

    const content = message.content ?? "";
    if (!content) throw new Error("Reflection returned no text content.");

    return {
      content,
      reasoning: message.reasoning_content ?? null,
      finishReason,
      usage: body.usage
        ? {
            promptTokens: body.usage.prompt_tokens ?? 0,
            completionTokens: body.usage.completion_tokens ?? 0,
            totalTokens: body.usage.total_tokens ?? 0,
            reasoningTokens:
              body.usage.completion_tokens_details?.reasoning_tokens ?? null,
          }
        : null,
    };
  },
};

function getApiKey(): string {
  const key = process.env.REFLECTION_API_KEY;
  if (!key) {
    throw new Error(
      "REFLECTION_API_KEY is not configured. Add it to the environment to enable AI autofill, resume parsing and notes.",
    );
  }
  return key;
}

async function request(body: Record<string, unknown>, signal: AbortSignal) {
  const response = await fetch(`${REFLECTION_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Reflection returned HTTP ${response.status}`;
    try {
      const payload = (await response.json()) as {
        error?: { message?: string; code?: string };
      };
      if (payload.error?.message) message = payload.error.message;
      if (payload.error?.code) message += ` (${payload.error.code})`;
    } catch {
      // keep the status message
    }
    throw new Error(message);
  }

  return responseSchema.parse(await response.json());
}

export async function generateText(
  input: GenerateTextInput,
): Promise<GenerateTextResult> {
  const messages: ChatMessage[] = [];
  if (input.system) messages.push({ role: "system", content: input.system });
  messages.push({ role: "user", content: input.prompt });

  const body: Record<string, unknown> = {
    model: REFLECTION_MODEL,
    messages,
    // Beam's recommended sampling settings.
    temperature: input.temperature ?? 0.7,
    top_p: 0.99,
    // Reasoning tokens count toward this budget, so leave real headroom.
    max_completion_tokens: input.maxTokens ?? 16_000,
    reasoning_effort: input.reasoningEffort ?? "medium",
  };

  if (input.jsonSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: input.jsonSchema.name,
        strict: input.jsonSchema.strict ?? true,
        ...(input.jsonSchema.description
          ? { description: input.jsonSchema.description }
          : {}),
        schema: input.jsonSchema.schema,
      },
    };
  }

  const lastError: Error[] = [];

  // One retry for transient upstream failures (429 / 5xx / socket reset).
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await request(body, AbortSignal.timeout(120_000));
      return { ...result, model: REFLECTION_MODEL };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError.push(err);
      const retryable =
        /HTTP (429|500|502|503|504)/.test(err.message) ||
        /fetch failed|socket|ECONNRESET|timeout/i.test(err.message);
      if (!retryable || attempt === 1) break;
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }

  throw lastError[0] ?? new Error("Reflection request failed.");
}

/**
 * Structured helper — returns parsed JSON plus the raw reasoning, which is
 * useful for server logs when a schema-valid answer is still semantically off.
 */
export async function generateJson<T>(
  input: GenerateTextInput & { jsonSchema: JsonSchemaSpec },
): Promise<{ data: T; reasoning: string | null; usage: GenerateTextResult["usage"] }> {
  const result = await generateText(input);
  let data: T;
  try {
    data = JSON.parse(result.content) as T;
  } catch {
    throw new Error("Reflection returned JSON that could not be parsed.");
  }
  return { data, reasoning: result.reasoning, usage: result.usage };
}
