import { getDb } from "@/lib/db";
import { jobPosts, companies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { embedTexts } from "@/lib/embeddings";
import { upsertJobVector, buildJobText } from "@/lib/pinecone";

async function main() {
  const db = getDb();
  const rows = await db
    .select({
      id: jobPosts.id,
      companyId: jobPosts.companyId,
      companyName: jobPosts.companyName,
      companySlug: jobPosts.companySlug,
      jobTitle: jobPosts.jobTitle,
      descriptionMarkdown: jobPosts.descriptionMarkdown,
      estimatedSalary: jobPosts.estimatedSalary,
      workMode: jobPosts.workMode,
      employmentType: jobPosts.employmentType,
      location: jobPosts.location,
      yearsOfExperience: jobPosts.yearsOfExperience,
      category: jobPosts.category,
      skills: jobPosts.skills,
    })
    .from(jobPosts);

  console.log(`Found ${rows.length} job posts to index.`);

  const BATCH = 16;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const texts = batch.map((r) =>
      buildJobText({
        jobTitle: r.jobTitle,
        companyName: r.companyName,
        location: r.location,
        category: r.category,
        skills: r.skills,
        descriptionMarkdown: r.descriptionMarkdown,
        estimatedSalary: r.estimatedSalary,
        workMode: r.workMode,
        employmentType: r.employmentType,
        yearsOfExperience: r.yearsOfExperience,
      }),
    );
    const vectors = await embedTexts(texts);
    if (vectors.length !== texts.length) throw new Error("embedding count mismatch");
    await Promise.all(
      batch.map((r, idx) =>
        upsertJobVector(r.id, vectors[idx]!, {
          jobTitle: r.jobTitle,
          companyName: r.companyName,
          companySlug: r.companySlug,
          location: r.location,
        }),
      ),
    );
    console.log(`Indexed ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});