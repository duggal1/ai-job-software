"use server";

import { saveApplicant as _saveApplicant, getJobPost } from "@/lib/storage";
import type { Applicant } from "@/lib/types";
import { bust } from "@/lib/db/memo";

export async function saveApplicant(applicant: Applicant) {
  const jobPost = await getJobPost(applicant.jobPostId);
  if (!jobPost) throw new Error("Job post not found");
  await _saveApplicant(applicant);
  bust("applicants:");
}
