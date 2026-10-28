"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import Exa from "exa-js";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { companies, jobPosts } from "@/lib/db/schema";
import { bust } from "@/lib/db/memo";
import { publishRealtime } from "@/lib/realtime/bus";
import { generateJson } from "@/lib/actions/generate-text";
import { slugify } from "@/lib/slug";
import {
  EMPLOYEE_COUNTS,
  INDUSTRIES,
  TALENT_NEEDS,
  type EmployeeCount,
  type Industry,
  type TalentNeed,
} from "@/lib/onboarding-options";

export interface OnboardingProfile {
  name: string;
  domain: string;
  employeeCount: EmployeeCount;
  industry: Industry;
  talentNeeds: TalentNeed[];
}

const profileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  domain: z.string().trim().min(1).max(200),
  employeeCount: z.enum(EMPLOYEE_COUNTS),
  industry: z.enum(INDUSTRIES),
  talentNeeds: z.array(z.enum(TALENT_NEEDS)).min(1).max(TALENT_NEEDS.length),
});

export async function saveOnboarding(input: OnboardingProfile) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Complete every step before finishing.",
    );
  }
  const profile = parsed.data;
  const domain = normalizeDomain(profile.domain);
  if (!isDomain(domain)) {
    throw new Error("Enter a valid company domain, e.g. acme.com");
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, session.user.id))
    .limit(1);

  let slug = existing?.slug ?? (await uniqueSlug(slugify(profile.name) || "company", session.user.id));
  if (!slug) slug = await uniqueSlug("company", session.user.id);

  await db.transaction(async (tx) => {
    if (existing) {
      await tx
        .update(companies)
        .set({
          name: profile.name,
          domain,
          employeeCount: profile.employeeCount,
          industry: profile.industry,
          talentNeeds: profile.talentNeeds.join(","),
          onboardedAt: new Date(),
        })
        .where(eq(companies.id, session.user.id));

      if (existing.name !== profile.name || existing.domain !== domain) {
        await tx
          .update(jobPosts)
          .set({ companyName: profile.name, companyDomain: domain })
          .where(eq(jobPosts.companyId, session.user.id));
      }
      return;
    }

    await tx.insert(companies).values({
      id: session.user.id,
      slug,
      name: profile.name,
      domain,
      logoUrl: null,
      employeeCount: profile.employeeCount,
      industry: profile.industry,
      talentNeeds: profile.talentNeeds.join(","),
      onboardedAt: new Date(),
      createdAt: new Date(),
    });
  });

  bust("latestJobs");
  bust("jobs:");
  bust("career:");
  revalidatePath("/", "page");
  revalidatePath("/jobs", "page");
  revalidatePath("/dashboard", "page");
  publishRealtime({ type: "jobs" });

  return { slug, name: profile.name };
}

async function uniqueSlug(base: string, companyId: string): Promise<string> {
  const db = getDb();
  let slug = base;
  for (let i = 1; ; i++) {
    const [taken] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, slug))
      .limit(1);
    if (!taken || taken.id === companyId) return slug;
    slug = `${base}-${i + 1}`;
  }
}

function normalizeDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

function isDomain(value: string): boolean {
  return /^([a-z0-9-]+\.)+[a-z]{2,}$/.test(value);
}

function extractEmail(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim();
}

async function fetchWebsiteContent(domain: string): Promise<string> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return "";
  const exa = new Exa(apiKey);
  try {
    const result = await exa.getContents([`https://${domain}`], {
      text: { maxCharacters: 8_000 },
    });
    return result.results?.[0]?.text ?? "";
  } catch {
    return "";
  }
}

const AUTOFILL_SYSTEM = `You profile a company from its website so a recruiting onboarding form can be pre-filled.

Return:
- companyName: the company's real name, not a tagline or the domain.
- employeeCount: the closest band. If the site does not say, infer conservatively from the company's stage (never inflate).
- industry: the single best match from the allowed list.
- talentNeeds: 1–4 roles this company most plausibly hires, from the allowed list. Prefer engineering roles for technical products; do not list every option.

Use only evidence from the website content. If something is unknown, make the most conservative reasonable choice — never invent awards, funding, or headcount.`;

const autofillJsonSchema = {
  type: "object",
  properties: {
    companyName: { type: "string" },
    employeeCount: { type: "string", enum: [...EMPLOYEE_COUNTS] },
    industry: { type: "string", enum: [...INDUSTRIES] },
    talentNeeds: {
      type: "array",
      items: { type: "string", enum: [...TALENT_NEEDS] },
      minItems: 1,
      maxItems: 4,
    },
  },
  required: ["companyName", "employeeCount", "industry", "talentNeeds"],
  additionalProperties: false,
} as const;

const autofillResultSchema = z.object({
  companyName: z.string(),
  employeeCount: z.string(),
  industry: z.string(),
  talentNeeds: z.array(z.string()),
});

/**
 * AI onboarding: one domain in, the full dropdown-compatible profile out.
 * Every value is clamped to the fixed vocabularies, so the wizard can apply
 * the result directly to its selects.
 */
export async function autofillOnboarding(input: {
  domain: string;
}): Promise<OnboardingProfile> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const domain = normalizeDomain(input.domain);
  if (!isDomain(domain)) {
    throw new Error("Enter a valid company domain, e.g. acme.com");
  }

  const websiteContent = await fetchWebsiteContent(domain);
  const sender = session.user.name?.trim() || "the founder";

  const { data } = await generateJson<unknown>({
    system: AUTOFILL_SYSTEM,
    prompt: [
      `Domain: ${domain}`,
      `Account holder: ${sender} (${extractEmail(session.user.email)})`,
      websiteContent
        ? `Website content:\n${websiteContent}`
        : "Website content could not be fetched. Infer conservatively from the domain only.",
      "",
      `Allowed employee bands: ${EMPLOYEE_COUNTS.join(", ")}`,
      `Allowed industries: ${INDUSTRIES.join(", ")}`,
      `Allowed talent types: ${TALENT_NEEDS.join(", ")}`,
    ].join("\n"),
    temperature: 0.7,
    reasoningEffort: "medium",
    maxTokens: 8_000,
    jsonSchema: {
      name: "company_onboarding",
      description: "A pre-filled company onboarding profile.",
      schema: autofillJsonSchema as unknown as Record<string, unknown>,
    },
  });

  const raw = autofillResultSchema.parse(data);
  const employeeCount = EMPLOYEE_COUNTS.includes(raw.employeeCount as EmployeeCount)
    ? (raw.employeeCount as EmployeeCount)
    : EMPLOYEE_COUNTS[1];
  const industry = INDUSTRIES.includes(raw.industry as Industry)
    ? (raw.industry as Industry)
    : "Other";
  const talentNeeds = [
    ...new Set(
      raw.talentNeeds.filter((value): value is TalentNeed =>
        TALENT_NEEDS.includes(value as TalentNeed),
      ),
    ),
  ].slice(0, 4);

  const fallbackName = domain.split(".")[0] ?? domain;

  return {
    name:
      raw.companyName.trim() ||
      fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
    domain,
    employeeCount,
    industry,
    talentNeeds: talentNeeds.length > 0 ? talentNeeds : ["AI engineering"],
  };
}
