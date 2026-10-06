"use server";

import { getCompany as _getCompany } from "@/lib/storage";

export async function getCompany(id: string) {
  return _getCompany(id);
}
