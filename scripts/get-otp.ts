import { getDb } from "@/lib/db";
import { verification } from "@/lib/db/auth-schema";
import { desc, like } from "drizzle-orm";

const emailArg = process.argv[2];
const db = getDb();

let rows;
if (emailArg) {
  rows = await db
    .select()
    .from(verification)
    .where(like(verification.identifier, `%${emailArg}`))
    .orderBy(desc(verification.createdAt))
    .limit(5);
} else {
  rows = await db.select().from(verification).orderBy(desc(verification.createdAt)).limit(5);
}

const valid = rows.find((r) => r.value && new Date(r.expiresAt) > new Date());
for (const r of rows) {
  console.log({
    identifier: r.identifier,
    value: r.value,
    expiresAt: r.expiresAt,
    expired: new Date(r.expiresAt) < new Date(),
  });
}
if (valid) console.log("VALID_OTP=" + valid.value);
else console.log("NO_VALID_OTP");