import { getPreparedQueries } from "@/lib/db/queries";
import { getDb } from "@/lib/db";
import { memo } from "@/lib/db/memo";
import { embedText } from "@/lib/embeddings";
import { queryJobVectors } from "@/lib/pinecone";
import { jobPosts, companies } from "@/lib/db/schema";
import { inArray, eq, and } from "drizzle-orm";

export interface JobFilters {
  q?: string;
  country?: string;
  experience?: string;
  skill?: string;
}

export async function getFilteredJobs(filters: JobFilters) {
  const key = `jobs:${filters.q ?? ""}|${filters.country ?? ""}|${filters.experience ?? ""}|${filters.skill ?? ""}`;
  return memo(key, 3000, async () => {
    const q = (filters.q ?? "").trim();
    const country = (filters.country ?? "").trim();
    const experience = (filters.experience ?? "").trim();
    const skill = (filters.skill ?? "").trim();

    // No free-text query: keep the fast, structured SQL path.
    if (!q) {
      const rows = await getPreparedQueries().filteredJobs.execute({
        q: "",
        country,
        experience,
        skill,
      });
      return rows.map((row) => ({
        ...row,
        descriptionMarkdown: row.descriptionMarkdown.slice(0, 400),
      }));
    }

    // Semantic path: embed the query, ask Pinecone for the nearest job posts,
    // then hydrate + filter them from Postgres.
    try {
      const vector = await embedText(q);
      const matches = await queryJobVectors(vector, 20);
      // Only keep genuinely relevant matches: absolute floor + relative gap.
      const bestScore = matches.length ? (matches[0]?.score ?? 0) : 0;
      const relevant = matches.filter(
        (m) => m.score >= 0.3 && m.score >= bestScore - 0.12,
      );
      const scoreMap = new Map(relevant.map((m) => [m.id, m.score]));
      const ids = relevant.map((m) => m.id);
      if (ids.length === 0) {
        // Legitimate "no match" — do not fall back to fuzzy SQL.
        return [];
      }

      const db = getDb();
      const rows = await db
        .select({
          id: jobPosts.id,
          companyId: jobPosts.companyId,
          companyName: jobPosts.companyName,
          companySlug: jobPosts.companySlug,
          jobTitle: jobPosts.jobTitle,
          descriptionMarkdown: jobPosts.descriptionMarkdown,
          estimatedSalary: jobPosts.estimatedSalary,
          workMode: jobPosts.workMode,
          employmentType: jobPosts.employmentType,
          location: jobPosts.location,
          yearsOfExperience: jobPosts.yearsOfExperience,
          category: jobPosts.category,
          skills: jobPosts.skills,
          visaSponsorship: jobPosts.visaSponsorship,
          aiBudget: jobPosts.aiBudget,
          applyMode: jobPosts.applyMode,
          createdAt: jobPosts.createdAt,
          logoUrl: companies.logoUrl,
        })
        .from(jobPosts)
        .leftJoin(companies, eq(jobPosts.companyId, companies.id))
        .where(and(inArray(jobPosts.id, ids), eq(jobPosts.archived, false)));

      const upperCountry = country.toUpperCase();
      let filtered = rows.filter((row) => {
        if (country) {
          const loc = (row.location ?? "").toUpperCase();
          if (!loc.includes(upperCountry)) return false;
        }
        if (experience && row.yearsOfExperience !== experience) return false;
        if (skill) {
          const skills = (row.skills ?? "").toLowerCase();
          if (!skills.includes(skill.toLowerCase())) return false;
        }
        return true;
      });

      // Free-text location awareness: if the query names a city/country that
      // appears in some results, restrict to those so "new york only" doesn't
      // drag in unrelated locations.
      const qLower = q.toLowerCase();
      const citiesInQuery = filtered
        .map((r) => ((r.location ?? "").split(",")[0] ?? "").trim().toLowerCase())
        .filter((c) => c && qLower.includes(c));
      const citySet = new Set(citiesInQuery);
      if (citySet.size > 0) {
        filtered = filtered.filter((r) => {
          const city = ((r.location ?? "").split(",")[0] ?? "").trim().toLowerCase();
          return citySet.has(city);
        });
      } else {
        const codesInQuery = filtered
          .map((r) => ((r.location ?? "").split(",")[1] ?? "").trim().toLowerCase())
          .filter((c) => c && qLower.includes(c));
        const codeSet = new Set(codesInQuery);
        if (codeSet.size > 0) {
          filtered = filtered.filter((r) => {
            const code = ((r.location ?? "").split(",")[1] ?? "").trim().toLowerCase();
            return codeSet.has(code);
          });
        }
      }

      filtered.sort(
        (a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0),
      );

      return filtered.map((row) => ({
        ...row,
        descriptionMarkdown: (row.descriptionMarkdown ?? "").slice(0, 400),
      }));
    } catch (error) {
      console.error("[semantic-search] failed, falling back to SQL", error);
    }

    // Fallback to the original ILIKE-based search.
    const rows = await getPreparedQueries().filteredJobs.execute({
      q,
      country,
      experience,
      skill,
    });
    return rows.map((row) => ({
      ...row,
      descriptionMarkdown: row.descriptionMarkdown.slice(0, 400),
    }));
  });
}