/**
 * Controlled vocabularies for onboarding. These are deliberately fixed:
 * the wizard never accepts free-text for headcount, industry, or talent, so
 * downstream filtering/analytics stays reliable.
 */

export const EMPLOYEE_COUNTS = [
  "1–10",
  "11–50",
  "51–200",
  "201–500",
  "501–1,000",
  "1,001–5,000",
  "5,000+",
] as const;

export const INDUSTRIES = [
  "AI / Machine learning",
  "SaaS",
  "Developer tools",
  "Fintech",
  "E-commerce",
  "Marketplace",
  "Healthcare",
  "Climate / Energy",
  "Education",
  "Cybersecurity",
  "Hardware / Robotics",
  "Agency / Consulting",
  "Media / Entertainment",
  "Other",
] as const;

export const TALENT_NEEDS = [
  "AI engineering",
  "Backend engineering",
  "Frontend engineering",
  "Full-stack engineering",
  "ML research",
  "Data engineering",
  "Infrastructure / DevOps",
  "Product design",
  "Product management",
  "Growth / Marketing",
  "Sales",
  "Customer success",
  "Operations",
  "Finance",
  "People / Recruiting",
] as const;

export type EmployeeCount = (typeof EMPLOYEE_COUNTS)[number];
export type Industry = (typeof INDUSTRIES)[number];
export type TalentNeed = (typeof TALENT_NEEDS)[number];
