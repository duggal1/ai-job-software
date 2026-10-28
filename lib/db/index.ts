import { Pool, neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";

type PooledDb = ReturnType<typeof drizzle>;
type HttpDb = ReturnType<typeof drizzleHttp>;

const globalRef = globalThis as unknown as {
  __db?: PooledDb;
  __httpDb?: HttpDb;
};

/**
 * Pooled, WebSocket-backed client.
 *
 * Used for prepared statements and interactive transactions. Prepared
 * statements are compiled once per process and reused across requests.
 */
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

/**
 * HTTP client used only for `db.batch([...])`.
 *
 * Neon's HTTP batch is transactional and sends every statement in one round
 * trip — ideal for "company + job post" or "company + counts" writes/reads
 * where two sequential WebSocket round trips would double latency.
 */
export function getHttpDb() {
  if (!globalRef.__httpDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL environment variable is not set");
    globalRef.__httpDb = drizzleHttp({ client: neon(url) });
  }
  return globalRef.__httpDb;
}
