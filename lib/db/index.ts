import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

const globalRef = globalThis as unknown as { __db?: ReturnType<typeof drizzle> };

export function getDb() {
  if (!globalRef.__db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL environment variable is not set");
    const pool = new Pool({
      connectionString: url,
      max: 5,
      maxUses: 500,
      idleTimeoutMillis: 15_000,
      connectionTimeoutMillis: 8_000,
    });
    globalRef.__db = drizzle({ client: pool });
  }
  return globalRef.__db;
}
