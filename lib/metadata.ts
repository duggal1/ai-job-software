import type { Metadata } from "next";

export const siteMetadata: Metadata = {
  title: {
    default: "Fly AI",
    template: "%s | Fly AI",
  },
  description: "Fly AI — the agentic AI engineering job platform. Find AI infra and eval roles, or the engineers to build them.",
  icons: {
    icon: "/favicon.svg",
  },
};
