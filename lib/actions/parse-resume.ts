"use server";

import { extractPDF } from "@/lib/pdf-extraction";
import { generateJson } from "@/lib/actions/generate-text";
import { z } from "zod";

export interface ParsedResume {
  fullName: string;
  email: string;
  phone: string;
  currentLocation: string;
  portfolioUrl: string;
  recentProjectUrls: string;
  linkedinUrl: string;
  githubUrl: string;
}

const SYSTEM_PROMPT = `You are a resume parser. Given the extracted text from a PDF resume, extract the candidate's details.

Rules:
- fullName: The candidate's full name from the resume.
- email: Email address.
- phone: Phone number in international format when possible.
- currentLocation: Current city and country.
- portfolioUrl: Personal website or portfolio URL.
- recentProjectUrls: Comma-separated list of recent project URLs from the resume (max 3).
- linkedinUrl: LinkedIn profile URL.
- githubUrl: GitHub profile URL.
- Use an empty string for any field that is not present. Never invent data.`;

const resumeSchema = z.object({
  fullName: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  currentLocation: z.string().default(""),
  portfolioUrl: z.string().default(""),
  recentProjectUrls: z.string().default(""),
  linkedinUrl: z.string().default(""),
  githubUrl: z.string().default(""),
});

/** Strict-mode JSON schema — every field required so the model can't omit one. */
const resumeJsonSchema = {
  type: "object",
  properties: {
    fullName: { type: "string" },
    email: { type: "string" },
    phone: { type: "string" },
    currentLocation: { type: "string" },
    portfolioUrl: { type: "string" },
    recentProjectUrls: { type: "string" },
    linkedinUrl: { type: "string" },
    githubUrl: { type: "string" },
  },
  required: [
    "fullName",
    "email",
    "phone",
    "currentLocation",
    "portfolioUrl",
    "recentProjectUrls",
    "linkedinUrl",
    "githubUrl",
  ],
  additionalProperties: false,
} as const;

/** Keep prompts inside the model's comfortable input range. */
const MAX_RESUME_CHARS = 60_000;

export async function parseResume(base64Pdf: string): Promise<ParsedResume> {
  const buffer = Buffer.from(base64Pdf, "base64");
  const extracted = await extractPDF(new Uint8Array(buffer));

  const text = extracted.pages
    .map((page) => page.blocks.map((block) => block.str).join(" "))
    .join("\n\n")
    .slice(0, MAX_RESUME_CHARS);

  if (!text.trim()) {
    throw new Error("No readable text found in this PDF.");
  }

  const { data } = await generateJson<unknown>({
    system: SYSTEM_PROMPT,
    prompt: text,
    temperature: 0.7,
    reasoningEffort: "medium",
    maxTokens: 8_000,
    jsonSchema: {
      name: "parsed_resume",
      description: "Contact and profile fields extracted from a resume PDF.",
      schema: resumeJsonSchema as unknown as Record<string, unknown>,
    },
  });

  return resumeSchema.parse(data);
}
