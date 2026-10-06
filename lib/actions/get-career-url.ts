"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPreparedQueries } from "@/lib/db/queries";

export async function getCareerUrl(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return "/sign-in";

  const rows = await getPreparedQueries().jobPostsByCompany.execute({ companyId: session.user.id });
  const post = rows[0];
  if (post) return `/company/${post.id}/${post.companySlug}/careers/p`;

  return "/job-post/new";
}
