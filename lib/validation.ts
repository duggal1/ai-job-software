import * as z from "zod";
import {
  APPLY_MODES,
  EMPLOYMENT_TYPES,
  JOB_CATEGORIES,
  WORK_MODES,
} from "@/lib/types";

export const applyFormSchema = z.object({
  fullName: z.string().min(1, { error: "Name is required", abort: true }),
  email: z.email("Enter a valid email"),
  phone: z.string().optional(),
  currentLocation: z.string(),
  portfolioUrl: z.string(),
  recentProjectUrls: z.string(),
  linkedinUrl: z.string(),
  githubUrl: z.string(),
  workAuthorized: z.boolean(),
  needsSponsorship: z.boolean(),
  noteToFounder: z.string(),
});

export type ApplyFormData = z.infer<typeof applyFormSchema>;

export const jobPostSchema = z.object({
  companyName: z.string().min(1, { error: "Company name is required", abort: true }),
  companyDomain: z.string().min(1, { error: "Domain is required", abort: true }),
  jobTitle: z.string().min(1, { error: "Job title is required", abort: true }),
  descriptionMarkdown: z.string().min(1, { error: "Description is required", abort: true }),
  estimatedSalary: z.string(),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  workMode: z.enum(WORK_MODES),
  location: z.string().min(1, { error: "Location is required", abort: true }),
  yearsOfExperience: z.string().optional(),
  category: z.enum(JOB_CATEGORIES).optional(),
  skills: z.string(),
  visaSponsorship: z.boolean(),
  aiBudget: z.string(),
  applyMode: z.enum(APPLY_MODES),
  applyUrl: z.string(),
});

export type JobPostFormData = z.infer<typeof jobPostSchema>;

export const emailSchema = z.object({
  email: z.email("Enter a valid email"),
});

export type EmailData = z.infer<typeof emailSchema>;

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, { error: "Code must be 6 digits", abort: true })
    .regex(/^\d+$/, { error: "Code must be numbers" }),
});

export type OtpData = z.infer<typeof otpSchema>;

export { EMPLOYMENT_TYPES, WORK_MODES, JOB_CATEGORIES };
