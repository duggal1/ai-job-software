import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { emailOTP } from "better-auth/plugins";
import * as schema from "@/lib/db/auth-schema";
import { getDb } from "@/lib/db";
import { applicants, companies, jobPosts } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { sendOtpEmail } from "@/lib/email/email-send";

/**
 * BETTER_AUTH_SECRET is REQUIRED for production.
 *  - Set it in production.env (and any deployed env): `BETTER_AUTH_SECRET=…`
 *  - Generate one with: `openssl rand -base64 32`
 * Without it, sessions cannot be signed/encrypted and every request is
 * effectively anonymous — which is why sign-out / delete-account / login all
 * silently failed.
 */
const secret =
  process.env.BETTER_AUTH_SECRET ||
  // Dev-only fallback so `npm run dev` works out of the box. Never commit a
  // real secret here; this value is intentionally weak and must be overridden
  // in any real environment.
  "dev-only-better-auth-secret-change-me";

export const auth = betterAuth({
  secret,
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema,
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60, // refresh expiry every hour
    freshAge: 60 * 5, // "fresh" session for sensitive ops = 5 min
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minute signed cache cookie
      strategy: "compact", // base64url + HMAC, smallest & fastest
      refreshCache: false,
    },
  },
  user: {
    deleteUser: {
      enabled: true,
      async beforeDelete(user) {
        const db = getDb();
        const posts = await db
          .select({ id: jobPosts.id })
          .from(jobPosts)
          .where(eq(jobPosts.companyId, user.id));
        const postIds = posts.map((p) => p.id);
        if (postIds.length > 0) {
          await db.delete(applicants).where(inArray(applicants.jobPostId, postIds));
          await db.delete(jobPosts).where(inArray(jobPosts.id, postIds));
        }
        await db.delete(companies).where(eq(companies.id, user.id));
      },
    },
  },
  advanced: {
    // Cookies are httpOnly + secure in production automatically. Force secure
    // in dev too so the signed session cookie behaves identically everywhere.
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "flyai",
    crossSubDomainCookies: {
      enabled: false,
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    "http://localhost:3000",
    "https://flyai.opalhq.fun",
  ],
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendOtpEmail({ email, otp, type });
      },
    }),
  ],
});