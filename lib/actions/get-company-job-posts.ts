"use server";

import { getPreparedQueries } from "@/lib/db/queries";

export interface JobPostRow {
  id: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  jobTitle: string;
  estimatedSalary: string;
  workMode: string;
  location: string;
  category: string | null;
  createdAt: Date;
}

export async function getJobPostsByCompany(companyId: string): Promise<JobPostRow[]> {
  return getPreparedQueries().jobPostsByCompany.execute({ companyId });
}
