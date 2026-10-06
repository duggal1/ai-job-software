"use server";

import { extractPDF } from "@/lib/pdf-extraction";
import { generateText } from "@/lib/actions/generate-text";
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

const SYSTEM_PROMPT = `You are a resume parser. Given the extracted text from a PDF resume, extract the following fields and return ONLY valid JSON, no markdown, no extra text:

{
  "fullName": "",
  "email": "",
  "phone": "",
  "currentLocation": "",
  "portfolioUrl": "",
  "recentProjectUrls": "",
  "linkedinUrl": "",
  "githubUrl": ""
}

Rules:
- fullName: The candidate's full name from the resume
- email: Email address
- phone: Phone number
- currentLocation: Current city and country
- portfolioUrl: Personal website or portfolio URL
- recentProjectUrls: Comma-separated list of recent project URLs from the resume
- linkedinUrl: LinkedIn profile URL
- githubUrl: GitHub profile URL
- If a field is not found, return an empty string for that field
- Return ONLY valid JSON with no surrounding text or markdown formatting`;

export async function parseResume(base64Pdf: string): Promise<ParsedResume> {
  const buffer = Buffer.from(base64Pdf, "base64");
  const extracted = await extractPDF(new Uint8Array(buffer));

  const text = extracted.pages
    .map((page) => page.blocks.map((block) => block.str).join(" "))
    .join("\n\n");

  const result = await generateText({
    system: SYSTEM_PROMPT,
    prompt: text,
    temperature: 0.1,
    maxTokens: 2000,
  });

  const cleaned = result.content.replace(/```(?:json)?\s*|\s*```/g, "").trim();

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse resume data");
  }

  return z.object({
    fullName: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    currentLocation: z.string().default(""),
    portfolioUrl: z.string().default(""),
    recentProjectUrls: z.string().default(""),
    linkedinUrl: z.string().default(""),
    githubUrl: z.string().default(""),
  }).parse(parsedJson);
}
