import { getPreparedQueries } from "@/lib/db/queries";

export async function getApplicant(applicantId: string) {
  const rows = await getPreparedQueries().applicantDetail.execute({ applicantId });
  return rows[0] ?? null;
}
