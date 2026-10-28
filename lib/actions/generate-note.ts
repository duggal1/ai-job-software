"use server";

import { generateJson } from "@/lib/actions/generate-text";
import { z } from "zod";

export interface NoteInput {
  fullName: string;
  email: string;
  phone: string;
  currentLocation: string;
  portfolioUrl: string;
  recentProjectUrls: string;
  linkedinUrl: string;
  githubUrl: string;
  jobTitle: string;
  companyName: string;
}

export interface NoteResult {
  noteToFounder: string;
  recentProjectUrls: string;
}

const SYSTEM_PROMPT = `You are writing a short note to a startup founder — you ARE the candidate, not a career coach helping them.

Given the candidate's parsed resume data and the job details, generate TWO things:

Rules for noteToFounder:
- Write in FIRST PERSON. You are the candidate. Use "I", "my", "me".
- 50 to 200 words max
- Extremely natural, human, conversational tone — read it aloud and make sure it sounds like a real person wrote it, not a marketer or AI
- Sell yourself to the founder: why should they hire you? What makes you exceptionally valuable to their specific company?
- Reference real numbers, metrics, and proof points from the resume (e.g. "grew revenue 40%", "shipped 3 products", "led a team of 12", "built a system handling 10M requests/day")
- Mention portfolio URLs, GitHub, or project URLs naturally in context (e.g. "At jasoncameron.dev and through my recent work...")
- Mention the company name and role naturally — show you understand what they're building
- Do not use buzzwords ("synergy", "leverage", "passionate", "results-driven", "proven track record", "game-changer")
- Do not start with "Dear" or end with "Sincerely" — just the body
- Do not explain what you're doing ("I'm writing to apply for...", "I'd like to express my interest..."). Just start talking about the work.

Rules for recentProjectUrls:
- If the candidate supplied project, portfolio, LinkedIn or GitHub URLs, choose 1-3 relevant ones
- If none exist, return an empty string
- Comma-separated list of URLs, nothing else`;

const noteJsonSchema = {
  type: "object",
  properties: {
    noteToFounder: { type: "string" },
    recentProjectUrls: { type: "string" },
  },
  required: ["noteToFounder", "recentProjectUrls"],
  additionalProperties: false,
} as const;

const noteSchema = z.object({
  noteToFounder: z.string().default(""),
  recentProjectUrls: z.string().default(""),
});

export async function generateNote(input: NoteInput): Promise<NoteResult> {
  const prompt = [
    `Candidate name: ${input.fullName}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone}`,
    `Location: ${input.currentLocation}`,
    `Portfolio: ${input.portfolioUrl}`,
    `Recent projects: ${input.recentProjectUrls}`,
    `LinkedIn: ${input.linkedinUrl}`,
    `GitHub: ${input.githubUrl}`,
    `Applying for: ${input.jobTitle} at ${input.companyName}`,
  ].join("\n");

  try {
    const { data } = await generateJson<unknown>({
      system: SYSTEM_PROMPT,
      prompt,
      temperature: 0.7,
      reasoningEffort: "medium",
      maxTokens: 8_000,
      jsonSchema: {
        name: "founder_note",
        description: "A first-person note to the founder plus project links.",
        schema: noteJsonSchema as unknown as Record<string, unknown>,
      },
    });
    return noteSchema.parse(data);
  } catch (error) {
    // A missing note must never block an application.
    console.warn("[generate-note] failed:", error);
    return { noteToFounder: "", recentProjectUrls: "" };
  }
}
