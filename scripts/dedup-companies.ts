import { getDb } from "@/lib/db";
import { companies, jobPosts } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

const db = getDb();

async function main() {
  const all = await db.select().from(companies);

  const slugMap = new Map<string, typeof all>();
  for (const c of all) {
    const list = slugMap.get(c.slug) ?? [];
    list.push(c);
    slugMap.set(c.slug, list);
  }

  for (const [slug, list] of slugMap) {
    if (list.length <= 1) continue;
    console.log(`Duplicate slug: "${slug}" — ${list.length} records`);

    const [keep, ...remove] = list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    if (!keep) continue;
    const removeIds = remove.map((c) => c.id);

    console.log(`  Keeping: ${keep.id} (created ${keep.createdAt.toISOString()})`);
    console.log(`  Merging: ${removeIds.join(", ")}`);

    await db.update(jobPosts)
      .set({ companyId: keep.id })
      .where(inArray(jobPosts.companyId, removeIds));

    for (const id of removeIds) {
      await db.delete(companies).where(eq(companies.id, id));
    }

    console.log(`  Done — moved ${removeIds.length} company's posts to ${keep.id}`);
  }

  console.log("Cleanup complete.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
