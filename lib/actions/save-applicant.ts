"use server";

import { saveApplicant as _saveApplicant, getJobPost } from "@/lib/storage";
import type { Applicant } from "@/lib/types";
import { bust } from "@/lib/db/memo";
import { publishRealtime } from "@/lib/realtime/bus";

export async function saveApplicant(applicant: Applicant) {
  const jobPost = await getJobPost(applicant.jobPostId);
  if (!jobPost) throw new Error("Job post not found");
  await _saveApplicant(applicant);
  bust("applicants:");
  // The recipient's applicants list/detail refreshes over SSE in well under a
  // second — resume included.
  publishRealtime({ type: "applicants", jobPostId: applicant.jobPostId });
  return { id: applicant.id };
}
