"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getHttpDb } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { getApplicant } from "@/lib/actions/get-applicant";
import { generateJson } from "@/lib/actions/generate-text";
import { sendOutreachEmail } from "@/lib/email/email-send";

export interface OutreachDraft {
  subject: string;
  body: string;
}

const draftInputSchema = z.object({
  applicantId: z.string().min(1),
  intent: z.string().min(1, "Tell us what you want to say first").max(4_000),
  currentDraft: z
    .object({
      subject: z.string().max(200),
      body: z.string().max(12_000),
    })
    .nullish(),
  instruction: z.string().max(2_000).nullish(),
});

const outreachSchema = z.object({
  subject: z.string().min(1).max(160),
  body: z.string().min(1).max(8_000),
});

/** Strict-mode schema — every property required, no extra keys. */
const outreachJsonSchema = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
  },
  required: ["subject", "body"],
  additionalProperties: false,
} as const;

const SYSTEM = `You write short, personal outreach emails from a startup founder to a candidate who applied to their job.

Voice: direct, warm, human, specific. No corporate HR language, no hype, no buzzwords, no "I hope this email finds you well". Write like an actual person who read the application.

Hard rules:
- Subject: 3–9 words, specific, no clickbait, no emoji.
- Body: 70–170 words. Plain text only — no markdown, no bullet symbols, no headers. Separate paragraphs with a blank line, including the sign-off.
- Open with why their application stood out, referencing their actual background when it is available.
- State what the company is and what the role is, in one clear sentence.
- End with one concrete next step (a short call, a question, or asking for availability).
- Include a simple sign-off with the sender's first name and the company name.
- Never invent achievements, funding, salary numbers, or facts that were not provided.
- If the sender gave a rough instruction, turn it into polished prose without adding new claims.`;

function extractEmail(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim();
}

function cleanText(value: string): string {
  return value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

async function loadOutreachContext(applicantId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const [data, companyRows] = await Promise.all([
    getApplicant(applicantId),
    getHttpDb()
      .select()
      .from(companies)
      .where(eq(companies.id, session.user.id))
      .limit(1),
  ]);

  if (!data || data.companyId !== session.user.id) {
    throw new Error("Applicant not found");
  }

  return {
    session,
    data,
    company: companyRows[0] ?? null,
  };
}

/**
 * Drafts (or refines) an outreach email with Reflection.
 *
 * The caller can pass `currentDraft` + `instruction` to iterate: the model
 * rewrites the existing draft instead of starting over, preserving whatever
 * the user already edited.
 */
export async function draftOutreach(input: {
  applicantId: string;
  intent: string;
  currentDraft?: OutreachDraft | null;
  instruction?: string | null;
}): Promise<OutreachDraft> {
  const parsed = draftInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { session, data, company } = await loadOutreachContext(
    parsed.data.applicantId,
  );
  const { applicant, jobTitle } = data;

  const companyProfile = [
    `Company: ${company?.name ?? data.companyName}`,
    company?.domain ? `Website: ${company.domain}` : "",
    company?.employeeCount ? `Team size: ${company.employeeCount}` : "",
    company?.industry ? `Industry: ${company.industry}` : "",
    company?.talentNeeds ? `Hiring for: ${company.talentNeeds}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const applicantProfile = [
    `Name: ${applicant.fullName}`,
    `Role applied for: ${jobTitle}`,
    applicant.currentLocation ? `Location: ${applicant.currentLocation}` : "",
    applicant.noteToFounder ? `Note to founder: ${applicant.noteToFounder}` : "",
    applicant.portfolioUrl ? `Portfolio: ${applicant.portfolioUrl}` : "",
    applicant.linkedinUrl ? `LinkedIn: ${applicant.linkedinUrl}` : "",
    applicant.githubUrl ? `GitHub: ${applicant.githubUrl}` : "",
    applicant.recentProjectUrls
      ? `Recent projects: ${applicant.recentProjectUrls}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const sender = session.user.name?.trim() || "The founder";

  const prompt = [
    companyProfile,
    "",
    "Candidate:",
    applicantProfile,
    "",
    `Sender: ${sender} (${extractEmail(session.user.email)})`,
    "",
    `What the sender wants to say:`,
    parsed.data.intent.trim(),
    parsed.data.currentDraft
      ? [
          "",
          "Current draft (rewrite this — keep anything the sender changed unless the instruction says otherwise):",
          `Subject: ${parsed.data.currentDraft.subject}`,
          "",
          parsed.data.currentDraft.body,
        ].join("\n")
      : "",
    parsed.data.instruction
      ? ["", `Revision instruction: ${parsed.data.instruction.trim()}`].join("\n")
      : "",
  ]
    .filter((part) => part !== "")
    .join("\n");

  const { data: draft } = await generateJson<unknown>({
    system: SYSTEM,
    prompt,
    temperature: 0.7,
    reasoningEffort: "medium",
    maxTokens: 6_000,
    jsonSchema: {
      name: "outreach_email",
      description: "A ready-to-send candidate outreach email.",
      schema: outreachJsonSchema as unknown as Record<string, unknown>,
    },
  });

  const result = outreachSchema.parse(draft);
  return {
    subject: cleanText(result.subject),
    body: cleanText(result.body),
  };
}

/**
 * Sends the reviewed draft through Resend. Ownership is re-checked here,
 * because the client can post any applicant id.
 */
export async function sendOutreach(input: {
  applicantId: string;
  subject: string;
  body: string;
}): Promise<{ id: string | null }> {
  const subject = input.subject.trim();
  const body = input.body.trim();
  const parsed = outreachSchema.safeParse({ subject, body });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid email");
  }

  const { session, data, company } = await loadOutreachContext(input.applicantId);
  const to = data.applicant.email.trim();
  if (!z.email().safeParse(to).success) {
    throw new Error("This applicant does not have a valid email address.");
  }

  return sendOutreachEmail({
    to,
    subject,
    body,
    companyName: company?.name ?? data.companyName,
    companyDomain: company?.domain ?? null,
    replyTo: extractEmail(session.user.email),
  });
}
