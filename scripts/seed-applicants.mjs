import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const posts = await sql`SELECT id, job_title, created_at FROM job_posts ORDER BY created_at DESC LIMIT 5`;
if (posts.length === 0) { console.log("no posts"); process.exit(0); }

const names = [
  ["Marcus Webb", "Austin, TX"], ["Emily Chen", "San Francisco, CA"], ["Tyler Brooks", "New York, NY"],
  ["Sarah Miller", "Seattle, WA"], ["James Carter", "Chicago, IL"], ["Olivia Davis", "Denver, CO"],
  ["Daniel Kim", "Boston, MA"], ["Rachel Foster", "Los Angeles, CA"], ["Andrew Nguyen", "Portland, OR"],
  ["Megan Ortiz", "San Diego, CA"], ["Chris Sullivan", "Nashville, TN"], ["Laura Thompson", "Atlanta, GA"],
  ["Brandon Lee", "Miami, FL"], ["Jessica Adams", "Dallas, TX"], ["Nathan Wright", "San Jose, CA"],
  ["Hannah Patel", "Phoenix, AZ"], ["Kevin Ross", "Minneapolis, MN"], ["Amanda Scott", "Raleigh, NC"],
  ["Ryan Mitchell", "Philadelphia, PA"], ["Brittany King", "Charlotte, NC"], ["Jason Cole", "Austin, TX"],
  ["Ashley Morgan", "San Francisco, CA"], ["Eric Grant", "New York, NY"], ["Nicole Reyes", "Seattle, WA"],
];

const notes = [
  "I've shipped three production LLM features at my last two startups, including a retrieval system serving 10M queries/day. Really like what you're building with the eval pipeline.",
  "I lead applied AI at a Series B startup — RAG, fine-tuning, agents trapped in LangChain. Looking for infra work that matters.",
  "I built eval infra for a previous CTO — golden datasets, LLM-as-a-judge, CI regression gates. Would love to bring that muscle here.",
  "I've been shipping agentic systems for 3 years. Most excited about your multi-agent research work.",
  "I read your founder's posts on compositional evals — wrote a similar harness last year. Happy to share.",
  "Six years, frontier evals + agentic infra. Python/Docker/Kubernetes daily tools.",
];

let i = 0;
for (const [name, location] of names) {
  const post = posts[i % posts.length];
  const daysAgo = (i * 0.6) % 14;
  const created = new Date(Date.now() - daysAgo * 86400000 - Math.random() * 3600000);
  const handle = name.toLowerCase().replace(/[^a-z]+/g, "");
  await sql`
    INSERT INTO applicants (id, job_post_id, full_name, email, phone, current_location, portfolio_url, recent_project_urls, linkedin_url, github_url, work_authorized, needs_sponsorship, note_to_founder, resume_file_name, created_at)
    VALUES (${crypto.randomUUID()}, ${post.id}, ${name}, ${handle + "@gmail.com"}, ${"+1 555 " + String(100 + (i * 37) % 900) + " 0" + (1000 + i)}, ${location}, ${handle + ".dev"}, ${"github.com/" + handle + "/agent-eval-harness"}, ${"linkedin.com/in/" + handle}, ${"github.com/" + handle}, true, ${i % 4 === 0}, ${notes[i % notes.length]}, ${handle + "_resume.pdf"}, ${created})
  `;
  i++;
}
console.log("seeded", i, "applicants across", posts.length, "posts");
