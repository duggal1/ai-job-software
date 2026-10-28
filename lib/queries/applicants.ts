"use client";

import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import type { Applicant } from "@/lib/types";

export const applicantKeys = {
  all: ["applicants"] as const,
  list: (companyId: string) => [...applicantKeys.all, "list", companyId] as const,
  detail: (applicantId: string) => [...applicantKeys.all, "detail", applicantId] as const,
};

export interface ApplicantListRow {
  applicant: Applicant;
  jobTitle: string;
  companySlug: string;
}

export interface ApplicantDetailData {
  applicant: Applicant;
  jobTitle: string;
  companyName: string;
  companyId: string;
}

type RawApplicant = Omit<Applicant, "createdAt"> & { createdAt: string | number | Date };
type RawRow = Omit<ApplicantListRow, "applicant"> & { applicant: RawApplicant };
type RawDetail = Omit<ApplicantDetailData, "applicant"> & { applicant: RawApplicant };

function toMillis(value: string | number | Date): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return new Date(value).getTime();
}

function normalizeApplicant(applicant: RawApplicant): Applicant {
  return {
    ...applicant,
    createdAt: toMillis(applicant.createdAt),
    phone: applicant.phone ?? "",
    resumeUrl: applicant.resumeUrl ?? undefined,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
}

export function applicantsListOptions(
  companyId: string,
  initialData?: ApplicantListRow[],
) {
  return queryOptions({
    queryKey: applicantKeys.list(companyId),
    queryFn: async (): Promise<ApplicantListRow[]> => {
      const rows = await fetchJson<RawRow[]>("/api/applicants");
      return rows.map((row) => ({
        ...row,
        applicant: normalizeApplicant(row.applicant),
      }));
    },
    // Realtime invalidation is the primary path; this is the safety net.
    staleTime: 5_000,
    refetchInterval: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    ...(initialData ? { initialData } : {}),
  });
}

export function applicantDetailOptions(
  applicantId: string,
  initialData?: ApplicantDetailData,
) {
  return queryOptions({
    queryKey: applicantKeys.detail(applicantId),
    queryFn: async (): Promise<ApplicantDetailData> => {
      const row = await fetchJson<RawDetail>(`/api/applicants/${applicantId}`);
      return { ...row, applicant: normalizeApplicant(row.applicant) };
    },
    staleTime: 5_000,
    refetchInterval: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    ...(initialData ? { initialData } : {}),
  });
}

export function useApplicants(companyId: string, initialData?: ApplicantListRow[]) {
  return useSuspenseQuery(applicantsListOptions(companyId, initialData));
}

export function useApplicant(applicantId: string, initialData?: ApplicantDetailData) {
  return useSuspenseQuery(applicantDetailOptions(applicantId, initialData));
}
