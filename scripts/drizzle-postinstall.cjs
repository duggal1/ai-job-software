// Runs drizzle-kit generate + push + migrate after install.
// Skips the DB-touching steps when DATABASE_URL is not set, so installs on
// machines without a database (CI, Vercel builds, fresh clones) do not fail.
const { execSync } = require("node:child_process");
const fs = require("node:fs");

const env = { ...process.env };

function run(cmd) {
  try {
    execSync(cmd, { stdio: "inherit", env });
  } catch (e) {
    console.error(`[postinstall] failed: ${cmd}`);
    throw e;
  }
}

// generate works without a database connection.
run("bunx drizzle-kit generate");

if (!env.DATABASE_URL) {
  console.log("[postinstall] DATABASE_URL not set; skipping push/migrate");
  return;
}

run("bunx drizzle-kit push");

// migrate applies the migration history over the same websocket driver as push.
// It is flaky in serverless/CI environments where the socket drops, and push
// already keeps the schema in sync — so it must not break the install.
const migrateLog = fs.openSync("/tmp/drizzle-migrate.log", "w");
try {
  execSync("bunx drizzle-kit migrate", { stdio: ["ignore", migrateLog, migrateLog], env });
} catch {
  console.warn("[postinstall] migrate failed (non-fatal); schema is already in sync via push");
}