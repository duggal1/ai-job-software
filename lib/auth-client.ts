import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

/**
 * MUST use the React client (`better-auth/react`), NOT the vanilla
 * `better-auth/client` — only the React build exposes `useSession` /
 * `hydrateSession` / `useSession`. The vanilla client has no hooks at all,
 * which is why `authClient.useSession()` returned undefined and the UI never
 * reflected sign-out / login state.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
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