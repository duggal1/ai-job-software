import { describe, expect, test } from "bun:test";
import { slugify } from "@/lib/slug";
import { parseLocation, formatLocation } from "@/lib/location";
import { buildApplicantDays } from "@/lib/applicants-stats";
import { timeAgo } from "@/lib/time-ago";

describe("slugify", () => {
  test("basic", () => {
    expect(slugify("Marcus Webb")).toBe("marcus-webb");
  });
  test("strips special chars", () => {
    expect(slugify("Scale AI, Inc.")).toBe("scale-ai-inc");
  });
});

describe("location", () => {
  test("format then parse roundtrip", () => {
    const loc = formatLocation("Berlin", "DE");
    expect(parseLocation(loc)).toEqual({ city: "Berlin", countryCode: "DE" });
  });
  test("parse invalid", () => {
    expect(parseLocation("Berlin")).toBeNull();
  });
});

describe("buildApplicantDays", () => {
  test("buckets recent applicants and pads empty days", () => {
    const now = new Date();
    const days = buildApplicantDays([{ createdAt: now }, { createdAt: now }], 5);
    expect(days.length).toBe(5);
    expect(days[days.length - 1]?.count).toBe(2);
    expect(days.slice(0, 4).every((d) => d.count === 0)).toBe(true);
  });
});

describe("timeAgo", () => {
  test("just now", () => {
    expect(timeAgo(new Date())).toBe("just now");
  });
  test("minutes", () => {
    expect(timeAgo(new Date(Date.now() - 5 * 60000))).toBe("5m ago");
  });
});
