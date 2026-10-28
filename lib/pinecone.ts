import "server-only";

const INDEX_NAME = process.env.PINECONE_INDEX_NAME ?? "jobs";
const INDEX_HOST =
  process.env.PINECONE_INDEX_HOST ??
  "jobs-0bs5679.svc.aped-4627-b74a.pinecone.io";

function getApiKey(): string {
  const key = process.env.PINECONE_API_KEY;
  if (!key) {
    throw new Error(
      "PINECONE_API_KEY is not configured. Add it to the environment to enable semantic search.",
    );
  }
  return key;
}

function baseUrl(): string {
  return `https://${INDEX_HOST}`;
}

interface PineconeMatch {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

interface QueryResponse {
  matches?: PineconeMatch[];
  namespace?: string;
}

export interface JobVectorMetadata {
  jobTitle?: string;
  companyName?: string;
  companySlug?: string;
  location?: string;
}

/**
 * Build the text we embed for a job post. Combines the high-signal fields so a
 * free-form query ("ai swe job for usa new york only") can match on title,
 * location, skills, category and description.
 */
export function buildJobText(job: {
  jobTitle?: string;
  companyName?: string;
  location?: string;
  category?: string | null;
  skills?: string | string[];
  descriptionMarkdown?: string;
  estimatedSalary?: string;
  workMode?: string;
  employmentType?: string;
  yearsOfExperience?: string | null;
}): string {
  const skills = Array.isArray(job.skills) ? job.skills.join(", ") : job.skills ?? "";
  const parts = [
    job.jobTitle,
    job.companyName ? `at ${job.companyName}` : "",
    job.location,
    job.category,
    skills,
    job.workMode,
    job.employmentType,
    job.yearsOfExperience ? `${job.yearsOfExperience} years experience` : "",
    job.estimatedSalary,
    job.descriptionMarkdown,
  ];
  return parts.filter(Boolean).join("\n").slice(0, 1800);
}

export async function upsertJobVector(
  id: string,
  values: number[],
  metadata: JobVectorMetadata = {},
): Promise<void> {
  const res = await fetch(`${baseUrl()}/vectors/upsert`, {
    method: "POST",
    headers: {
      "Api-Key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vectors: [{ id, values, metadata }],
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Pinecone upsert failed: ${res.status} ${text}`);
  }
}

export async function queryJobVectors(
  vector: number[],
  topK = 50,
  filter?: Record<string, unknown>,
): Promise<PineconeMatch[]> {
  const body: Record<string, unknown> = {
    vector,
    topK,
    includeMetadata: true,
    includeValues: false,
  };
  if (filter) body.filter = filter;
  const res = await fetch(`${baseUrl()}/query`, {
    method: "POST",
    headers: {
      "Api-Key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Pinecone query failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as QueryResponse;
  return data.matches ?? [];
}

export async function deleteJobVector(id: string): Promise<void> {
  const res = await fetch(`${baseUrl()}/vectors/delete`, {
    method: "POST",
    headers: {
      "Api-Key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids: [id] }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Pinecone delete failed: ${res.status} ${text}`);
  }
}

export { INDEX_NAME };