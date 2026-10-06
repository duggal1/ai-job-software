import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Next.js 16 renamed `middleware.ts` → `proxy.ts` (Node.js runtime only).
 * This is the app's network boundary. It runs before every request and is the
 * right place to:
 *   - gate routes that require an authenticated session (redirect to /sign-in)
 *   - make sure the Better Auth API is reachable on the same origin so the
 *     session cookie is first-party (Safari ITP safe) and the Origin header
 *     matches a trusted origin.
 *
 * Auth state is read from the request cookie via `auth.api.getSession`, never
 * from the client — the client's `useSession` is only the optimistic UI layer.
 */

const PUBLIC_PREFIXES = ["/sign-in", "/api/auth", "/_next", "/public"];
const PUBLIC_EXACT = new Set(["/", "/jobs", "/job-post", "/job-post/new"]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) {
    return true;
  }
  // Static assets and images never need auth.
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    /\.(svg|png|jpg|jpeg|gif|ico|webp|css|js|map)(\?.*)?$/.test(pathname)
  ) {
    return true;
  }
  return false;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Auth-required route. Validate the session cookie server-side.
  // If a logged-in user hits /sign-in, send them to the post-job flow.
  const session = await auth.api.getSession({ headers: request.headers });
  if (session?.user) {
    if (pathname === "/sign-in") {
      return NextResponse.redirect(new URL("/job-post/new", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/sign-in") {
    return NextResponse.next();
  }

  // Not authenticated → send to the sign-in page (with a return URL).
  const loginUrl = new URL("/sign-in", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run on every route except static internals and the auth API itself.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};