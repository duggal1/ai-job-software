export const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "internship"] as const;
export const WORK_MODES = ["remote", "hybrid", "onsite"] as const;
export const JOB_CATEGORIES = ["engineering", "customer", "finance", "sales", "people", "product", "growth"] as const;
export const APPLY_MODES = ["platform", "external"] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type WorkMode = (typeof WORK_MODES)[number];
export type JobCategory = (typeof JOB_CATEGORIES)[number];

export interface Company {
  id: string;
  slug: string;
  name: string;
  domain: string;
  logoUrl?: string;
  createdAt: number;
}

export type ApplyMode = (typeof APPLY_MODES)[number];

export interface JobPost {
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
  yearsOfExperience?: string;
  category?: JobCategory;
  skills: string[];
  visaSponsorship: boolean;
  aiBudget: string;
  applyMode: ApplyMode;
  applyUrl?: string;
  createdAt: number;
}

export interface Applicant {
  id: string;
  jobPostId: string;
  fullName: string;
  email: string;
  phone: string;
  currentLocation: string;
  portfolioUrl: string;
  recentProjectUrls: string;
  linkedinUrl: string;
  githubUrl: string;
  workAuthorized: boolean;
  needsSponsorship: boolean;
  resumeUrl?: string;
  noteToFounder: string;
  resumeFileName: string;
  createdAt: number;
}
