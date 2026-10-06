import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL environment variable is not set");

export default defineConfig({
  out: "./drizzle",
  schema: ["./lib/db/schema.ts", "./lib/db/auth-schema.ts"],
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
