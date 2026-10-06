import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: ["./lib/db/schema.ts", "./lib/db/auth-schema.ts"],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
});
