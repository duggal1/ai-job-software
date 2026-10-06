"use server";

import Exa from "exa-js";
import { generateText } from "@/lib/actions/generate-text";
import { z } from "zod";
import { EMPLOYMENT_TYPES, JOB_CATEGORIES, WORK_MODES } from "@/lib/types";

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

async function fetchWebsiteContent(url: string): Promise<string> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return "";
  const exa = new Exa(apiKey);
  try {
    const result = await exa.getContents([url], { text: { maxCharacters: 8000 } });
    const content = result.results?.[0]?.text;
    return content ?? "";
  } catch {
    return "";
  }
}

const SYSTEM_INSTRUCTION = `You are a job post generator. Given clean website content and a role description, generate a job post.

Tone: direct, casual, natural, clean. Write like a real founder at a startup — not a corporate HR department or a hype-driven VC play. No buzzwords ("disrupt", "synergy", "rockstar", "ninja", "crush it", "game-changing", "best in class", "bleeding edge"). No generic startup fluff. Use plain, clear language. The job post should sound like a human wrote it for other humans.

You must return ONLY valid JSON with exactly this structure, no markdown wrapping, no extra text:
{
  "companyName": "The actual company name found in the website content",
  "companyDomain": "The domain extracted from the URL",
  "jobTitle": "A specific, modern job title matching the role",
  "descriptionMarkdown": "A complete job description in clean markdown",
   "estimatedSalary": "Estimated monthly salary range — always per month, never annual. If the user didn't provide one, estimate a fair monthly range.",
  "employmentType": "full-time | part-time | contract | internship",
  "workMode": "remote | hybrid | onsite",
  "yearsOfExperience": "entry | junior | mid | senior | staff | lead",
  "category": "engineering | customer | finance | sales | people | product | growth",
  "skills": "Comma-separated list of 4-8 concrete technologies/frameworks/tools for the role, e.g. \"LangChain, Docker, TypeScript\"",
  "aiBudget": "Monthly AI tooling budget offered to the hire, e.g. \"$500/month\". If not specified, estimate a fair one for the role.",
  "visaSponsorship": "true | false — whether the company sponsors work visas for this role"
}

The descriptionMarkdown must have these sections in order:

## About Us
2–4 sentences describing the company — what it is, its niche, and its massive achievements. At least 20 words. Make it sound like a real company doing impressive work in its space.

## About the Role
Company overview (2-3 sentences from the website content) followed by a straightforward description of what the role involves, the team, and why it matters.

## What You'll Do
Bullet-point list of day-to-day responsibilities.

## Responsibilities
Bullet-point list of must-have qualifications and skills required.

## Tech Stack & Skills
Bullet-point list of technologies, frameworks, and tools used in the role grouped by category (e.g. Languages, Backend, Frontend, AI/ML, Infrastructure, Database).

## Final Note from the Founder
A short, personal closing paragraph from the founder. Direct, casual, honest. No corporate sign-off.

Compensation should be expressed as monthly range (e.g. €3,200 – €5,600/month or $6,000 – $9,000/mo) and included in a salary section within the description.

Rules:
- companyName must be the actual company name from the website content
- jobTitle must be specific and modern
- estimatedSalary must be in MONTHLY format with appropriate currency for the company location
- Use specific, modern technologies relevant to the role
- employmentType and workMode default to "full-time" and "remote" unless specified
- If the user's prompt is vague, generate a complete reasonable job post with modern tech
- Avoid generic hype; prefer specific, concrete details
- The Final Note from the Founder should read like a founder actually wrote it — slightly informal, direct, personal`;


const autofillResponseSchema = z.object({
  companyName: z.string().default(""),
  companyDomain: z.string().optional(),
  jobTitle: z.string().default(""),
  descriptionMarkdown: z.string().default(""),
  estimatedSalary: z.string().default(""),
  employmentType: z.enum(EMPLOYMENT_TYPES).default("full-time"),
  workMode: z.enum(WORK_MODES).default("remote"),
  yearsOfExperience: z.string().default(""),
  category: z.enum(JOB_CATEGORIES).optional(),
  skills: z.string().default(""),
  aiBudget: z.string().default(""),
  visaSponsorship: z
    .union([z.boolean(), z.string()])
    .default(false)
    .transform((v) => v === true || v === "true"),
});

export type AutofillResult = Omit<z.infer<typeof autofillResponseSchema>, "companyDomain"> & {
  companyDomain: string;
};

function parseAutofillResponse(text: string, domain: string): AutofillResult {
  const cleaned = text.replace(/```(?:json)?\s*|\s*```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const candidate = start !== -1 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(candidate);
  } catch {
    throw new Error("Failed to parse response as JSON");
  }
  const parsed = autofillResponseSchema.parse(parsedJson);
  return {
    ...parsed,
    companyDomain: parsed.companyDomain ?? domain,
  };
}

export async function autofillJobPost(rawUrl: string, prompt: string): Promise<AutofillResult> {
  const url = normalizeUrl(rawUrl);
  if (!url) throw new Error("Invalid URL");

  const domain = extractDomain(url);
  const websiteContent = await fetchWebsiteContent(url);

  const userContent = [
    `Company website: ${url}`,
    websiteContent ? `Website content:\n${websiteContent}` : "",
    `Role description: ${prompt}`,
    `Domain: ${domain}`,
  ].filter(Boolean).join("\n\n");

  return autofillWithModels(userContent, domain);
}

async function autofillWithModels(userContent: string, domain: string): Promise<AutofillResult> {
  const result = await generateText({
    system: SYSTEM_INSTRUCTION,
    prompt: userContent,
    temperature: 0.3,
    maxTokens: 8192,
  });

  return parseAutofillResponse(result.content, domain);
}
