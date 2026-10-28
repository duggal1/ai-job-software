import "server-only";

const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

export const EMBEDDING_MODEL = "liquid/lfm-2.5-embedding-350m:free";
export const EMBEDDING_DIM = 1024;
// The model's context window is 512 tokens; keep input comfortably under it.
const MAX_INPUT_CHARS = 1800;

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Add it to the environment to enable semantic search.",
    );
  }
  return key;
}

interface EmbeddingsResponse {
  data?: Array<{ embedding?: number[]; index?: number }>;
  error?: { message?: string };
}

async function request(inputs: string[]): Promise<number[][]> {
  const res = await fetch(`${OPENROUTER_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: inputs.map((t) => t.slice(0, MAX_INPUT_CHARS)),
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `OpenRouter embeddings returned HTTP ${res.status}`;
    try {
      const payload = (await res.json()) as EmbeddingsResponse;
      if (payload.error?.message) message = payload.error.message;
    } catch {
      // keep status message
    }
    throw new Error(message);
  }

  const body = (await res.json()) as EmbeddingsResponse;
  if (body.error?.message) throw new Error(body.error.message);
  const data = body.data ?? [];
  // Preserve input order by index when provided.
  const ordered = [...data].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const vectors = ordered.map((d) => d.embedding ?? []);
  if (vectors.length !== inputs.length) {
    throw new Error("OpenRouter returned an unexpected number of embeddings.");
  }
  return vectors;
}

export async function embedText(text: string): Promise<number[]> {
  const vectors = await request([text]);
  const vector = vectors[0];
  if (!vector) throw new Error("OpenRouter returned no embedding.");
  return vector;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  // Batch in chunks to stay within provider limits.
  const CHUNK = 32;
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += CHUNK) {
    const batch = texts.slice(i, i + CHUNK);
    const vectors = await request(batch);
    out.push(...vectors);
  }
  return out;
}