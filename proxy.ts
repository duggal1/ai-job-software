import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { companies } from "@/lib/db/schema";

/**
 * Network boundary (Next.js 16 `proxy.ts`, Node.js runtime).
 *
 * Multitenant rule: **job seekers never sign in.** Viewing jobs, searching,
 * reading career pages, and applying (including resume upload) are fully
 * public. Only **company** flows require a session: posting jobs, the
 * dashboard, applicant management, and the private careers cockpit.
 *
 * Design:
 * - Public routes return WITHOUT touching the database (no getSession call),
 *   so anonymous browsing is fast and can never 500/redirect on auth.
 * - Company-private routes validate the session cookie server-side and
 *   redirect anonymous users to /sign-in with a return URL.
 * - Every private page ALSO guards itself with `redirect("/sign-in")`
 *   (defense in depth), so a proxy misconfiguration can never leak data.
 */

const SIGN_IN_PATH = "/sign-in";
const POST_LOGIN_PATH = "/onboarding";
const ONBOARDING_PATH = "/onboarding";

/**
 * Routes that are useless until onboarding is finished. Gating them here (not
 * only in the page) means the redirect is a real 307 instead of a streamed
 * client redirect, so there is no flash of the dashboard shell.
 */
function needsOnboarding(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/job-post" ||
    pathname.startsWith("/job-post/")
  );
}

/** Cached per request; a missing company row means "not onboarded". */
async function isOnboarded(userId: string): Promise<boolean> {
  try {
    const [row] = await getDb()
      .select({ onboardedAt: companies.onboardedAt })
      .from(companies)
      .where(eq(companies.id, userId))
      .limit(1);
    return Boolean(row?.onboardedAt);
  } catch {
    // Never lock someone out because of a transient DB hiccup; the page-level
    // guard still runs.
    return true;
  }
}

/**
 * Company-private routes. Checked BEFORE the public `/company/` prefix:
 * - /dashboard (account, sessions, company settings)
 * - /company/applicants/** (applicant management)
 * - /company/**\/careers/p (private posting cockpit)
 * - /job-post/** (all posting flows; pages self-guard too)
 */
function isCompanyPrivate(pathname: string): boolean {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return true;
  }
  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
    return true;
  }
  if (pathname.startsWith("/company/applicants")) {
    return true;
  }
  if (pathname.endsWith("/careers/p") || pathname.includes("/careers/p/")) {
    return true;
  }
  if (pathname === "/job-post" || pathname.startsWith("/job-post/")) {
    return true;
  }
  return false;
}

/** Static assets and framework internals never need auth or a DB lookup. */
function isStaticAsset(pathname: string): boolean {
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/public/")) return true;
  return /\.(svg|png|jpg|jpeg|gif|ico|webp|css|js|map|txt|xml)(\?.*)?$/.test(
    pathname,
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Logged-in companies never need the sign-in page.
  if (pathname === SIGN_IN_PATH) {
    const existing = await auth.api.getSession({ headers: request.headers });
    if (existing?.user) {
      const destination = (await isOnboarded(existing.user.id))
        ? "/dashboard"
        : POST_LOGIN_PATH;
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.next();
  }

  // Company-private route (checked before the public /company/ prefix).
  if (isCompanyPrivate(pathname)) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user) {
      if (needsOnboarding(pathname) && !(await isOnboarded(session.user.id))) {
        return NextResponse.redirect(new URL(ONBOARDING_PATH, request.url));
      }
      return NextResponse.next();
    }
    const loginUrl = new URL(SIGN_IN_PATH, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Everything else is public: landing, /jobs, job detail, careers,
  // apply forms, and the public JSON/upload APIs. No session lookup.
  // (Company-private paths already returned above.)
  return NextResponse.next();
}

export const config = {
  // Run on every route except static internals and the auth API itself.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
