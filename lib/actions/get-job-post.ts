"use server";

import { getJobPost as _getJobPost } from "@/lib/storage";

export async function getJobPost(id: string) {
  return _getJobPost(id);
}
