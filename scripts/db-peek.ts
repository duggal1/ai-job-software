import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { companies, jobPosts, applicants } from "@/lib/db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql });

const [c, j, a] = await Promise.all([
  db.select().from(companies),
  db.select().from(jobPosts),
  db.select().from(applicants),
]);

console.log("=== COMPANIES ===");
for (const row of c) console.log(row);

console.log("\n=== JOB POSTS ===");
for (const row of j) console.log(row);

console.log("\n=== APPLICANTS ===");
for (const row of a) console.log(row);
