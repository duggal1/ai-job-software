import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { emailOTP } from "better-auth/plugins";
import * as schema from "@/lib/db/auth-schema";
import { getDb } from "@/lib/db";
import { applicants, companies, jobPosts } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { sendOtpEmail } from "@/lib/email/email-send";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema,
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
      strategy: "compact",
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
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendOtpEmail({ email, otp, type });
      },
    }),
  ],
});
