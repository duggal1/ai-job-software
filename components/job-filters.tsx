"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/lib/location";
import { EXPERIENCE_LEVELS } from "@/lib/experience";
import { SearchInput } from "@/components/search-input";

const SKILLS = [
  "LangChain",
  "Docker",
  "TypeScript",
  "PyTorch",
  "Next.js",
  "Python",
  "Kubernetes",
  "React",
  "OpenAI",
  "AWS",
];

interface JobFiltersProps {
  q: string;
  country: string;
  experience: string;
  skill: string;
}

export function JobFilters({ q, country, experience, skill }: JobFiltersProps) {
  const router = useRouter();

  function navigate(updates: Partial<JobFiltersProps>) {
    const next = { q, country, experience, skill, ...updates };
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.country) params.set("country", next.country);
    if (next.experience) params.set("experience", next.experience);
    if (next.skill) params.set("skill", next.skill);
    router.push(`/jobs${params.size ? `?${params}` : ""}`);
  }

  const triggerClass =
    "h-9 w-full cursor-pointer rounded-lg border border-stone-200/50 bg-stone-50/80 px-3 text-[13px] text-stone-700 shadow-none before:shadow-none focus-visible:ring-1 focus-visible:ring-stone-300";

  return (
    <div className="mt-8 flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          navigate({ q: String(data.get("q") ?? "") });
        }}
        className="flex items-center gap-2"
      >
        <SearchInput
          name="q"
          defaultValue={q}
          placeholder="Search roles, skills, companies…"
          onClear={() => navigate({ q: "" })}
        />
        <button
          type="submit"
          className="h-10 w-fit cursor-pointer rounded-lg bg-stone-900 px-3 py-1 text-[13px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] hover:bg-stone-950"
        >
          Search
        </button>
      </form>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Select value={country || "all"} onValueChange={(v) => navigate({ country: v === "all" ? "" : v ?? "" })}>
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.flag} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={experience || "all"} onValueChange={(v) => navigate({ experience: v === "all" ? "" : v ?? "" })}>
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder="All experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All experience</SelectItem>
            {EXPERIENCE_LEVELS.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={skill || "all"} onValueChange={(v) => navigate({ skill: v === "all" ? "" : v ?? "" })}>
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder="All skills" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All skills</SelectItem>
            {SKILLS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
