import { getPreparedQueries } from "@/lib/db/queries";
import { memo } from "@/lib/db/memo";

export async function getApplicantsByCompany(companyId: string) {
  return memo(`applicants:${companyId}`, 30000, () => getPreparedQueries().applicantsByCompany.execute({ companyId }));
}
