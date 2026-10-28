"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { bust } from "@/lib/db/memo";
import { applicants, jobPosts } from "@/lib/db/schema";
import { publishRealtime } from "@/lib/realtime/bus";
import { generateJson } from "@/lib/actions/generate-text";
import { embedText } from "@/lib/embeddings";
import { buildJobText, deleteJobVector, upsertJobVector } from "@/lib/pinecone";
import {
  EMPLOYMENT_TYPES,
  JOB_CATEGORIES,
  WORK_MODES,
  APPLY_MODES,
} from "@/lib/types";

const updateSchema = z.object({
  postId: z.string().min(1),
  jobTitle: z.string().trim().min(1, "Job title is required").max(200),
  descriptionMarkdown: z.string().trim().min(1, "Description is required"),
  estimatedSalary: z.string().max(200),
  skills: z.string().max(1_000),
  aiBudget: z.string().max(200),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  workMode: z.enum(WORK_MODES),
  location: z.string().trim().min(1, "Location is required").max(200),
  yearsOfExperience: z.string().max(100).optional(),
  category: z.enum(JOB_CATEGORIES).optional(),
  visaSponsorship: z.boolean(),
  applyMode: z.enum(APPLY_MODES),
  applyUrl: z.string().max(500),
});

export type JobPostUpdateInput = z.input<typeof updateSchema>;

function refreshJobCaches() {
  bust("latestJobs");
  bust("jobs:");
  bust("career:");
  bust("job:");
  revalidatePath("/", "page");
  revalidatePath("/jobs", "page");
  revalidatePath("/dashboard", "page");
  publishRealtime({ type: "jobs" });
}

/** Loads a post and proves the signed-in company owns it. */
async function requireOwnedPost(postId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const db = getDb();
  const [post] = await db
    .select()
    .from(jobPosts)
    .where(and(eq(jobPosts.id, postId), eq(jobPosts.companyId, session.user.id)))
    .limit(1);

  if (!post) throw new Error("Post not found");
  return { session, db, post };
}

export async function updateJobPost(input: JobPostUpdateInput) {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid post");
  }
  const values = parsed.data;
  const { db } = await requireOwnedPost(values.postId);

  await db
    .update(jobPosts)
    .set({
      jobTitle: values.jobTitle,
      descriptionMarkdown: values.descriptionMarkdown,
      estimatedSalary: values.estimatedSalary,
      skills: values.skills,
      aiBudget: values.aiBudget,
      employmentType: values.employmentType,
      workMode: values.workMode,
      location: values.location,
      yearsOfExperience: values.yearsOfExperience || null,
      category: values.category ?? null,
      visaSponsorship: values.visaSponsorship,
      applyMode: values.applyMode,
      applyUrl: values.applyUrl || null,
    })
    .where(eq(jobPosts.id, values.postId));

  refreshJobCaches();

  after(async () => {
    try {
      const vector = await embedText(
        buildJobText({
          jobTitle: values.jobTitle,
          location: values.location,
          category: values.category ?? null,
          skills: values.skills,
          descriptionMarkdown: values.descriptionMarkdown,
          estimatedSalary: values.estimatedSalary,
          workMode: values.workMode,
          employmentType: values.employmentType,
          yearsOfExperience: values.yearsOfExperience,
        }),
      );
      await upsertJobVector(values.postId, vector);
    } catch (error) {
      console.error("[pinecone] failed to re-index job", values.postId, error);
    }
  });

  return { id: values.postId };
}

export async function setPostArchived(input: {
  postId: string;
  archived: boolean;
}) {
  const postId = z.string().min(1).parse(input.postId);
  const archived = z.boolean().parse(input.archived);
  const { db } = await requireOwnedPost(postId);

  await db.update(jobPosts).set({ archived }).where(eq(jobPosts.id, postId));
  refreshJobCaches();
  revalidatePath("/dashboard/post/edit", "page");
  return { id: postId, archived };
}

export async function deleteJobPost(postId: string) {
  const id = z.string().min(1).parse(postId);
  const { db } = await requireOwnedPost(id);

  await db.transaction(async (tx) => {
    await tx.delete(applicants).where(eq(applicants.jobPostId, id));
    await tx.delete(jobPosts).where(eq(jobPosts.id, id));
  });

  refreshJobCaches();

  after(async () => {
    try {
      await deleteJobVector(id);
    } catch (error) {
      console.error("[pinecone] failed to delete job vector", id, error);
    }
  });

  return { id };
}

const aiDraftSchema = z.object({
  jobTitle: z.string().min(1).max(200),
  descriptionMarkdown: z.string().min(1),
  estimatedSalary: z.string().max(200),
  skills: z.string().max(1_000),
  aiBudget: z.string().max(200),
});

const aiDraftJsonSchema = {
  type: "object",
  properties: {
    jobTitle: { type: "string" },
    descriptionMarkdown: { type: "string" },
    estimatedSalary: { type: "string" },
    skills: { type: "string" },
    aiBudget: { type: "string" },
  },
  required: [
    "jobTitle",
    "descriptionMarkdown",
    "estimatedSalary",
    "skills",
    "aiBudget",
  ],
  additionalProperties: false,
} as const;

export interface JobPostAiDraft {
  jobTitle: string;
  descriptionMarkdown: string;
  estimatedSalary: string;
  skills: string;
  aiBudget: string;
}

const AI_SYSTEM = `You are editing an existing job post for a startup. You receive the current post and one instruction from the founder.

Rules:
- Return the COMPLETE updated post fields, not a diff.
- Change only what the instruction asks for. Copy every other field and every other paragraph verbatim.
- Keep the existing markdown section structure and ordering.
- Never invent funding, customers, headcount, salary numbers, or achievements. Preserve existing facts exactly.
- Keep the founder voice: direct, plain, specific, no corporate buzzwords.
- Skills is a comma-separated list of concrete technologies/tools.
- Salary stays in the same format and currency as the current post.`;

/**
 * AI edit is a draft operation: it returns fields for review in the editor
 * and never writes to the database. The user still presses Save.
 */
export async function aiEditJobPost(input: {
  postId: string;
  instruction: string;
  current: JobPostAiDraft;
}): Promise<JobPostAiDraft> {
  const instruction = z
    .string()
    .trim()
    .min(1, "Tell AI what to change")
    .max(2_000)
    .parse(input.instruction);
  const current = aiDraftSchema.parse(input.current);

  const { post } = await requireOwnedPost(input.postId);

  const prompt = [
    `Company: ${post.companyName}`,
    `Role: ${current.jobTitle}`,
    `Location: ${post.location}`,
    `Employment type: ${post.employmentType}`,
    `Work mode: ${post.workMode}`,
    `Experience: ${post.yearsOfExperience ?? "not specified"}`,
    `Category: ${post.category ?? "not specified"}`,
    "",
    "Current post:",
    `Salary: ${current.estimatedSalary}`,
    `Skills: ${current.skills}`,
    `AI budget: ${current.aiBudget}`,
    "",
    "Current description (markdown):",
    current.descriptionMarkdown,
    "",
    `Instruction: ${instruction}`,
  ].join("\n");

  const { data } = await generateJson<unknown>({
    system: AI_SYSTEM,
    prompt,
    temperature: 0.7,
    reasoningEffort: "medium",
    maxTokens: 12_000,
    jsonSchema: {
      name: "job_post_edit",
      description: "The full edited job post.",
      schema: aiDraftJsonSchema as unknown as Record<string, unknown>,
    },
  });

  return aiDraftSchema.parse(data);
}
