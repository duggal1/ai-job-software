"use server";

import { generateText } from "@/lib/actions/generate-text";
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

Given the candidate's parsed resume data and the job details, generate TWO things and return ONLY valid JSON:

{
  "noteToFounder": "",
  "recentProjectUrls": ""
}

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
- The best notes sound like: "I've been following [company]'s work in [area], and the [role] immediately caught my attention — it sits right at the intersection of the [challenges] I've been solving and the vision [company] is building."

Rules for recentProjectUrls:
- If the candidate's LinkedIn URL was found, suggest 1-3 relevant project or portfolio URLs based on the resume content
- If no LinkedIn URL was found, return an empty string
- Comma-separated list of URLs`;

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

  const result = await generateText({
    system: SYSTEM_PROMPT,
    prompt,
    temperature: 0.7,
    maxTokens: 2000,
  });

  const cleaned = result.content.replace(/```(?:json)?\s*|\s*```/g, "").trim();
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch {
    return { noteToFounder: "", recentProjectUrls: "" };
  }

  const parsed = z.object({
    noteToFounder: z.string().default(""),
    recentProjectUrls: z.string().default(""),
  }).safeParse(parsedJson);

  if (!parsed.success) return { noteToFounder: "", recentProjectUrls: "" };

  return {
    noteToFounder: parsed.data.noteToFounder,
    recentProjectUrls: parsed.data.recentProjectUrls,
  };
}
