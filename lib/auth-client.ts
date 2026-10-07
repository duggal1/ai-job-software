import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

/**
 * MUST use the React client (`better-auth/react`), NOT the vanilla
 * `better-auth/client` — only the React build exposes `useSession` /
 * `hydrateSession`. The vanilla client has no hooks at all,
 * which is why `authClient.useSession()` returned undefined and the UI never
 * reflected sign-out / login state.
 *
 * No explicit `baseURL`: same-origin default keeps the session cookie
 * first-party (Safari ITP safe) in dev AND prod. Hardcoding
 * `http://localhost:3000` broke prod cookies. `NEXT_PUBLIC_BETTER_AUTH_URL`
 * is still honored when explicitly set for a split frontend/API setup.
 */
const explicitBaseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

export const authClient = createAuthClient({
  ...(explicitBaseURL ? { baseURL: explicitBaseURL } : {}),
  plugins: [emailOTPClient()],
  sessionOptions: {
    refetchInterval: 0,
    refetchOnWindowFocus: true,
    refetchWhenOffline: false,
  },
  fetchOptions: {
    credentials: "include", // always send cookies to /api/auth/*
  },
});

export type Session = typeof authClient.$Infer.Session;