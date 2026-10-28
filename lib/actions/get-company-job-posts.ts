"use server";

import { getPreparedQueries } from "@/lib/db/queries";
import type {
  ApplyMode,
  EmploymentType,
  JobCategory,
  WorkMode,
} from "@/lib/types";

export interface JobPostRow {
  id: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  companyDomain: string;
  jobTitle: string;
  descriptionMarkdown: string;
  estimatedSalary: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  location: string;
  yearsOfExperience: string | null;
  category: JobCategory | null;
  skills: string;
  visaSponsorship: boolean;
  aiBudget: string;
  applyMode: ApplyMode;
  applyUrl: string | null;
  archived: boolean;
  createdAt: string | Date;
}

export async function getJobPostsByCompany(companyId: string): Promise<JobPostRow[]> {
  return getPreparedQueries().jobPostsByCompany.execute({ companyId });
}
