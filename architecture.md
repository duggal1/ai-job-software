# Fly AI — Architecture & Product Judgment

Fly AI is a hiring surface for small teams. Candidates browse jobs and apply
without an account. Founders publish roles, watch applications land live, and
contact the right people with an AI draft they edit and approve themselves.

It is **one Next.js application, one Postgres database, one vector index, and
four external services** (Reflection AI, OpenRouter embeddings, Exa, Resend). No
separate API service, no message broker, no client-side database, no design
system framework. The constraints are the architecture.

**The type, in one line:** a server-first modular monolith — React Server
Components stream the UI, Postgres is the single write model, Pinecone is a
derived read model for semantic retrieval, TanStack Query is the client-side
read cache, and SSE is the invalidation bus between them.

Patterns you would recognise:

| Pattern | Where it shows up |
| --- | --- |
| Modular monolith | One deployable; features sliced by `lib/actions/*`, each owning its schemas and cache keys |
| Streaming SSR / server-driven UI | App Router pages, `loading.tsx` skeletons, Suspense boundaries |
| Derived read model | The `jobs` vector index; ids only, truth re-read from Postgres |
| Read-through caching | `lib/db/memo.ts` on the server, TanStack Query on the client |
| Publish / subscribe | `publishRealtime()` → SSE → keyed cache invalidation |
| Backend-for-frontend | `/api/jobs` and `/api/applicants` exist only to feed the client cache |

---

## 1. Shape of the system

The product runs at two speeds, joined by a third, very small plane.

| Plane | What runs there | Who waits | Failure posture |
| --- | --- | --- | --- |
| **Request plane** | Page render, session checks, reads, writes | The person in front of the screen | Must never fail loudly; degrade to a skeleton or a redirect |
| **Intelligence plane** | Embeddings, vector search, LLM extraction and drafting, email | Nobody, or an explicit "Generate" click | Fail soft; fall back to SQL, or to the manual form |
| **Realtime plane** | SSE events after writes | Nobody | Drop the event; the next poll, refetch, or reconnect resyncs |

```
                    ┌──────────────────────────────┐
   request plane →  │  Browser → Proxy → RSC → UI   │
                    └──────────────┬───────────────┘
                                   │ server actions
                    ┌──────────────▼───────────────┐
                    │   Neon Postgres (Drizzle)     │  ← source of truth
                    │ sessions · companies ·        │
                    │ job posts · applicants        │
                    └──────┬───────────────▲───────┘
        text to embed      │               │ top-K ids, then hydrate
                    ┌──────▼──────┐        │
                    │ Embeddings  │        │
                    │ 1024d       │        │
                    └──────┬──────┘        │
                           │ upsert        │
                    ┌──────▼───────────────┴───────┐
                    │   Pinecone · jobs index      │
                    └──────────────────────────────┘
```

Three rules fall out of this picture, and most decisions in the codebase are a
consequence of one of them:

1. **Postgres is the only source of truth.** Pinecone stores ids, vectors, and
   display metadata — never authority. Every search result is re-read from
   Postgres before it reaches a screen.
2. **Nothing slow sits in a render path.** A page never waits on an LLM, an
   embedding call, or an email send.
3. **Writes announce themselves; reads are cached and invalidated.** The UI is
   eventually consistent by design, and the window is measured in milliseconds,
   not minutes.

---

## 2. Stack

| Layer | Choice | Why this one |
| --- | --- | --- |
| Framework | Next.js 16 App Router, React 19 | Server Components remove the "fetch on mount" waterfall; Server Actions remove the hand-written API layer for writes |
| Language | TypeScript, strict | The DB row, the server action input, and the form field are the same shape, checked by the compiler |
| Styling | Tailwind v4, warm stone tokens | One file of decisions; no component library imposing its own look |
| Auth | Better Auth + email OTP | No passwords to store, no OAuth app review, a candidate never needs an account |
| Database | Neon Postgres | Serverless connection story that works from both a Node process and an HTTP runtime |
| ORM | Drizzle | SQL-shaped, typed, prepared statements, real transactions, readable migrations |
| Client cache | TanStack Query v5 | The only place network state lives; Suspense reads, optimistic writes, keyed invalidation |
| Realtime | SSE + in-process bus + watermark poller | One HTTP connection, no extra infrastructure, correct across instances |
| LLM | Reflection AI `Beam-1.0-501B-A23B` | Reasoning model with strict JSON-schema output — the output is data, not prose to parse |
| Embeddings | `liquid/lfm-2.5-embedding-350m` via OpenRouter, 1024 dims | Cheap, fast, good enough for role-level semantic recall |
| Vectors | Pinecone (`jobs` index) | Managed ANN; the search index scales separately from the primary database |
| Email | Resend + React Email | Transactional OTP and founder outreach from one verified sender |
| Files | UploadThing | Resume upload without building signed-URL plumbing |
| PDF | `unpdf` + `react-pdf` | Text extraction on the server; rendering in the browser |

---

## 3. The request path

```
Browser → proxy.ts → Server Component → Suspense boundary
        → TanStack Query (cache hit or /api fetch) → Neon Postgres
        → Server Action → auth + zod → Postgres → cache bust → SSE
```

### 3.1 Proxy (`proxy.ts`)

A Next.js 16 proxy runs on the Node runtime and makes one decision per path:

- **Static assets** return immediately, before any auth or DB work.
- **`/sign-in`** redirects a signed-in user to `/dashboard` if they finished
  onboarding, otherwise to `/onboarding`.
- **Company-private routes** (`/dashboard/**`, `/job-post/**`,
  `/company/applicants/**`, private careers cockpits, `/onboarding`) validate
  the session cookie server-side and redirect anonymous visitors to
  `/sign-in?redirect=…`.
- **Everything else is public and never touches the database** — the landing
  page, `/jobs`, job detail, public career pages, and the apply flow.

The onboarding gate lives here, not only in the page, because a page that has a
`loading.tsx` flushes its shell before the server component resolves. A
`redirect()` after that flush cannot be an HTTP 307 — it becomes a streamed
client redirect with a `200`, which looks fine in a browser and wrong
everywhere else. Gating in the proxy keeps it a real `307`.

### 3.2 Server Components and Suspense

Each route has a `loading.tsx` that paints the final layout with neutral
skeletons — not a spinner, not a blank page. The page component awaits only what
it needs to decide what to render (session, ownership), and pushes slower data
behind `<Suspense>` where possible.

`/dashboard` is the clearest example: auth is awaited (it decides the redirect),
then sessions and company data stream in behind boundaries. The shell a person
sees is the real shell, so nothing jumps when data lands.

### 3.3 TanStack Query

The client cache is the only client-side store.

- `QueryClient` defaults: `staleTime: 10s`, `gcTime: 5min`, one retry, refetch
  on focus and reconnect.
- Jobs feeds use `staleTime: 5–10s`, `refetchOnMount: "always"`, and a 30s
  `refetchInterval` as a safety net if SSE is down.
- Reads use `useSuspenseQuery` with server-provided `initialData`, so the first
  paint has content and the cache is hydrated rather than empty.
- Writes are either a `useMutation` with `onMutate` (publishing a job inserts an
  optimistic row at the top of the latest feed and rolls back on error) or a
  `useTransition` around a server action (CRM edits, archive, delete). In both
  cases the server response is the truth.
- Keys are structured (`["jobs", "latest"]`, `["jobs", "filtered", filters]`,
  `["applicants", companyId]`) so an event invalidates exactly one family.

The rule: **if data comes from the network, it lives in TanStack Query.** No
component-local fetch state, no parallel store to keep in sync.

### 3.4 Reads: prepared statements, batching, memo

`lib/db/queries.ts` compiles every hot query once per process with
`.prepare("name")` and executes it with named placeholders. Drizzle keeps the
SQL stable; Postgres keeps the plan.

Two Neon clients exist for two jobs (`lib/db/index.ts`):

- **WebSocket pool** — prepared statements, interactive transactions, the
  normal path. Pool size 5, recycled every 500 uses.
- **HTTP client** — used only for `db.batch([...])`, which sends several
  statements in **one round trip and one transaction**. Job creation commits the
  company row and its first post together this way; two WebSocket round trips
  would double the latency for no benefit.
- **Interactive transactions** (WebSocket) — onboarding updates the company and
  renames its posts atomically; deleting a post removes its applicants first.

On top of that, `lib/db/memo.ts` is a tiny per-instance TTL cache for the
hottest reads: latest jobs (2s), filtered jobs (3s), an applicant list (2s).
Every write calls `bust("jobs:")`-style prefix invalidation, so the same
instance never serves a value it just replaced.

### 3.5 Writes: Server Actions

Every mutation follows the same script:

1. `auth.api.getSession({ headers: await headers() })` — the live session, not a
   value trusted from the client.
2. `zod` parse of the payload. The same schema the form uses.
3. Ownership check in SQL (`where id = ? and company_id = ?`) — the client can
   post any id, so the server re-derives the relationship.
4. The write, batched or transactional when more than one row is involved.
5. `bust(...)` the memo keys, `revalidatePath(...)` where a server-rendered page
   must refresh, and `publishRealtime(...)` for every open tab.
6. Slow, non-critical work goes into `after()` — the response is already on its
   way when the embedding call starts.

---

## 4. Data model

Three product tables plus Better Auth's four. Text ids. Timestamps everywhere.
One soft state (`archived`), no delete graveyard.

```
companies  (id = user id, slug unique, name, domain, logo_url,
            employee_count, industry, talent_needs, onboarded_at, created_at)

job_posts  (id, company_id → companies, denormalised company_name/slug/domain,
            job_title, description_markdown, estimated_salary,
            employment_type, work_mode, location, years_of_experience,
            category, skills, visa_sponsorship, ai_budget, apply_mode,
            apply_url, archived, created_at)

applicants (id, job_post_id → job_posts, full_name, email, phone,
            current_location, portfolio_url, recent_project_urls,
            linkedin_url, github_url, work_authorized, needs_sponsorship,
            note_to_founder, resume_file_name, resume_url, created_at)

user / session / account / verification  ← Better Auth
```

Decisions worth naming:

- **`companies.id = session.user.id`.** One founder, one company. No membership
  table, no role matrix, no tenant switcher. The tenancy boundary is a string
  equality, and every private query is written against it.
- **Denormalised company fields on `job_posts`.** A job card needs the company
  name, slug, domain, and logo. Copying them avoids a join on every public feed
  read; renaming a company updates its posts in the same transaction.
- **`archived boolean` instead of deletion.** Archiving removes a post from
  every public feed (all reads filter `archived = false`), keeps its applicants
  and history, and leaves its vector in Pinecone — the hydrate step filters it
  out, so a stale index can never leak an archived job.
- **Indexes follow the queries**: `(company_id, created_at)` for the CRM,
  `(archived, created_at)` for feeds, `(job_post_id, created_at)` for applicant
  lists, plus a plain `created_at` for watermarks.
- **Text ids** (UUIDs and Better Auth ids) keep ids portable between the auth
  tables, the product tables, and Pinecone.

Migrations are checked-in SQL under `drizzle/`, generated from `lib/db/schema.ts`.
The vector index has its own lifecycle: `scripts/backfill-pinecone.ts` re-embeds
every post in batches of 16.

---

## 5. Search: Postgres as truth, Pinecone as a derived read model

Free-text search is the one place where a second store earns its keep.

### 5.1 Indexing (write side)

When a post is created (`save-job.ts`) or edited (`posts.ts`), the write commits
first. Then, inside `after()`:

1. `buildJobText()` flattens title, company, location, category, skills, work
   mode, employment type, experience, salary, and description into one string,
   capped at 1,800 characters (the embedding model's context is 512 tokens).
2. `embedText()` calls OpenRouter for a 1024-dimension vector.
3. `upsertJobVector()` writes `{ id, values, metadata }` into the `jobs` index.

Deleting a post deletes its vector in `after()` as well. Archiving does not —
hydration is the filter.

### 5.2 Query (read side)

`getFilteredJobs()` picks a path based on the input:

- **No free-text query** → one prepared SQL statement with the structured
  filters. No embedding call, no vector round trip.
- **Free text** → embed the query, ask Pinecone for the top 20, keep matches
  with `score ≥ 0.3` **and** within `0.12` of the best score (an absolute floor
  plus a relative gap — this kills the long tail of vaguely related roles), then
  hydrate those ids from Postgres with `archived = false`.

Once hydrated, the structured filters (country, experience, skill) are applied
to the real rows, followed by a location pass: if the query names a city or
country that appears in the results, results outside it are dropped. This is how
"ai swe job for usa new york only" behaves like a person meant it, without
teaching the embedding model geography.

Finally the rows are ordered by vector score, truncated descriptions are
returned, and the whole thing is memoised for 3 seconds under a key built from
every filter.

**Failure is designed in:** if embedding or Pinecone throws, the function logs
and falls back to the original `ILIKE` query. A legitimate "no match" returns an
empty list instead of degrading to fuzzy SQL. Search never 500s because the
vector store is down.

---

## 6. The intelligence plane

### 6.1 Reflection AI — `lib/actions/generate-text.ts`

All generation goes through one client:

- Model `Beam-1.0-501B-A23B` on the OpenAI-compatible endpoint
  `https://api.reflection.ai/openai/v1`.
- `temperature: 0.7`, `reasoning_effort: "medium"`, explicit token ceilings.
- Structured callers pass a **strict JSON schema** (`required` for every
  property, `additionalProperties: false`), then re-validate with `zod`.
- Refusals, content filters, truncation (`finish_reason: "length"`), and
  provider errors are turned into readable errors, never into half-parsed prose.

What it powers:

| Feature | Input | Output |
| --- | --- | --- |
| Job post autofill | A rough role description | Title, description, salary, skills, category, apply mode |
| Resume parsing | PDF text from `unpdf` | Name, email, phone, location, links — empty strings when absent |
| Founder note | Applicant + role | A short note in the founder's voice |
| Outreach drafts | Applicant, company, intent | Subject + body, refinable with an instruction |
| Onboarding autofill | Domain + Exa website text | Company name, headcount band, industry, talent needs |
| Post AI edit | Existing post + instruction | Edited title and markdown body |

The important part is not the prompt — it is the **contract**. Every consumer
receives a typed object or an error. Nothing downstream parses free text.

### 6.2 Embeddings — `lib/embeddings.ts`

- Model `liquid/lfm-2.5-embedding-350m:free` via OpenRouter, 1024 dimensions.
- Inputs are truncated to 1,800 characters to stay inside the model's 512-token
  context.
- `embedTexts()` batches 32 inputs per request and preserves provider order via
  the `index` field.
- `cache: "no-store"` — vectors are a projection, not a cache to serve stale.

Embeddings are currently **job-side only**: they power search recall. Candidate
vectors (candidate ↔ job matching) are the obvious next use of the same
pipeline — the applicant row and its stored resume already provide the raw
material.

### 6.3 Pinecone — `lib/pinecone.ts`

- One index (`jobs`), host and key from the environment.
- `upsertJobVector(id, values, metadata)` where metadata is
  `jobTitle`, `companyName`, `companySlug`, `location` — enough to render or
  filter without a database hit, never enough to be authoritative.
- `queryJobVectors(vector, topK = 50, filter?)` returns ids, scores, metadata.
- `deleteJobVector(id)` on hard delete.

Why a separate index instead of `pgvector`:

- ANN work stays off the primary database's CPU and connection pool.
- The index can be rebuilt, resized, or replaced without a migration on the
  transactional schema.
- Postgres remains the only store that can answer "what is true", which makes
  the dual-write tolerable: a missing vector only costs recall, a stale vector
  is filtered out during hydration.

### 6.4 Exa — `lib/actions/onboarding.ts`

Onboarding sends the domain to Exa for up to 8,000 characters of live website
text. That text becomes evidence for Reflection, whose output schema is
constrained to the exact dropdown vocabularies (`EMPLOYEE_COUNTS`,
`INDUSTRIES`, `TALENT_NEEDS`). The server then clamps every value again, dedupes
talent needs, and caps them at four.

The product promise is narrow and honest: **one domain in, four dropdown-safe
answers out.** If Exa or the model fails, the wizard is still a three-step form.

### 6.5 Resend — `lib/email/`

Two transactional emails, one verified sender:

- **OTP** for sign-in (`otp.tsx`).
- **Outreach** from founder to candidate (`outreach.tsx`) — an inline-styled
  card with the company favicon, the AI body split into paragraphs, the
  subject as preview text, and the founder's address as `replyTo`.

`sendOutreachEmail` keeps the verified `RESEND_EMAIL_FROM` address and changes
only the display name to the company, so a new customer never has to configure
DNS before their first email. The send path re-checks that the applicant belongs
to the signed-in founder's posts, so a forged id cannot email a stranger.

---

## 7. Realtime: events in, cache out

`lib/realtime/bus.ts` has two jobs:

1. **Wake local listeners immediately.** `publishRealtime()` is called at the
   end of every write action. Subscribers are SSE connections on the same
   process.
2. **Catch everything else.** A 2.5-second poller compares two cheap watermarks
   (`count(*)`, `max(created_at)` for jobs and applicants). A change emits the
   same event, so a write handled by instance B still reaches a browser
   connected to instance A.

`/api/realtime` is a `ReadableStream` of `text/event-stream`: an initial
`ready`, then tiny JSON events, plus a comment every 20 seconds so proxies do
not reap an idle connection.

On the client, `RealtimeProvider`:

- Holds one `EventSource` per tab.
- `jobs` → invalidate `["jobs"]`; `applicants` → invalidate `["applicants"]`.
- Coalesces bursts of applicant events into one read of `/api/applicants`, then
  compares the newest id against a baseline and raises a top-right toast only
  for genuinely new candidates (never for the backlog on first load).
- On reconnect, does one full invalidation and re-baselines instead of firing a
  toast per missed row.

Why SSE instead of WebSockets or a hosted pub/sub: the traffic is one-way, the
payload is a few bytes, `EventSource` reconnects on its own, and there is no
extra service to operate. The watermark poller is the price of horizontal
scaling, and it is a price worth paying at this size.

---

## 8. Auth, tenancy, and trust boundaries

- Better Auth with the email-OTP plugin; sessions last 7 days, signed with
  `BETTER_AUTH_SECRET`, cookie prefix `flyai`.
- The proxy is the network boundary; every private page also guards itself with
  `redirect("/sign-in")`. Defense in depth, not redundancy for its own sake.
- Every server action re-reads the session and re-checks ownership in SQL. The
  client is never trusted with a company id, an applicant id, or a post id.
- Public by design: browsing, job detail, career pages, applying, resume upload.
  A candidate never creates an account, which removes the largest drop-off in
  every hiring funnel.
- Onboarding is mandatory for company routes: `companies.onboarded_at` is the
  single flag, checked in the proxy and again in the page.

---

## 9. Why this is fast

Speed here is mostly the absence of work, not clever work.

| Mechanism | Effect |
| --- | --- |
| Server Components + `loading.tsx` | The real layout paints before data resolves; no client fetch waterfall |
| `useSuspenseQuery` + `initialData` | First paint has data; no empty-state flash |
| Prepared statements | Query planning happens once, not per request |
| Neon HTTP batch | Multi-row writes are one round trip and one transaction |
| Per-instance memo (2–3s) | The hottest feeds skip Postgres entirely under load |
| TanStack cache + keyed invalidation | Navigation reuses data; only the affected list refetches |
| SSE | No polling loop per tab, no websocket server; updates in well under a second locally |
| Precomputed vectors | Search is one embed + one ANN query + one SQL hydrate, not a table scan with `ILIKE` |
| `after()` for embeddings | The founder's save returns before the vector is written |
| AI only on explicit actions | Page renders never wait on a model |
| Archived as a column | Hiding a post is an `UPDATE`, not a cascade or a cache purge |

The cost of a public job feed request is one indexed query. The cost of a
semantic search is three network calls, two of them to services that scale
independently. The cost of a dashboard render is a session lookup and a batched
read.

---

## 10. Product judgment: why it is this minimal

The interface is deliberately quiet. Warm stone surfaces, hairline borders, one
accent color per meaning, `font-normal` almost everywhere, and whitespace doing
the work that chrome usually does. That is not a stylistic preference layered on
top of the architecture — it is the same judgment applied to the screen.

### 10.1 Every screen has one job

- **Landing** — a headline, one search field, and a thin row of example
  filters. Search is the only primary action; the product is legible in three
  seconds.
- **Jobs** — a list, a search field, three filters. No saved searches, no
  alerts, no "recommended for you" carousel competing with the list.
- **Job detail** — the role, the company, one apply action.
- **Apply** — one form, resume upload that pre-fills itself, submit.
- **Dashboard** — four tabs (Account, Company, Posts, Sessions). The CRM is a
  tab, not a second application with its own navigation.
- **Applicant** — the person, their links, their resume, one contact button.

A screen with two equally weighted primary actions is a screen that has not
decided what it is for. There are none here.

### 10.2 Bloat is a tax paid on every visit

Every additional panel, badge, chart, and settings toggle is:

- another thing to read before the real task,
- another state to keep consistent,
- another surface that can be empty or wrong,
- another reason the page needs more data, and therefore more latency.

So the dashboard shows open posts as a number beside a label, not a KPI wall. The
posts CRM is a list with inline status and actions, not a kanban board with
drag state to persist. Notifications are one toast, top right, with one action —
not an inbox. Sessions are a table you rarely open, hidden behind a tab.

None of this is feature poverty. Archiving, editing, AI rewriting, deleting,
drafting, refining, and sending all exist. They appear **where the decision is
made**, not in a global menu that asks the user to remember where things live.

### 10.3 Constraints make the data good

Onboarding asks three questions and refuses free text for headcount, industry,
and talent needs:

- Fixed vocabularies mean every company is comparable and filterable.
- The AI autofill is constrained to those same enums, then clamped server-side,
  so "Series B, ~120 people" becomes a band, not a sentence nobody can query.
- Three steps is short enough to finish on a phone and long enough to make the
  first job post, the first outreach draft, and future matching materially
  better.

This is product judgment expressed as schema: **ask once, in a shape the system
can use, and never ask again.**

### 10.4 AI is a draft, never an author

- Autofill fills fields the founder can see and edit.
- Resume parsing pre-fills an application the candidate submits.
- Outreach drafting produces a subject and a body the founder reviews, refines,
  and explicitly sends.
- Post editing proposes a title and body that are saved only when the founder
  clicks save.

There is no "AI published a job" path and no "AI emailed a candidate" path. The
human decision is drawn on the architecture diagram as a dot on the node,
because it is a structural property, not a disclaimer.

### 10.5 Feedback is small and immediate

- Skeletons match the final layout, so the page does not reflow.
- The search button shows a tiny pixel loader in its prefix — the pending state
  lives inside the control the person just pressed.
- A save lands you back on the thing you were editing, or updates the row in
  place — never behind a confirmation modal.
- New applicants arrive as a top-right toast with a direct link, and the list
  has already been invalidated underneath it.
- Empty states are sentences, not illustrations.

The interface never celebrates itself. It gets out of the way and shows the
consequence of the action.

---

## 11. Software-building judgment

**Boring technology, one deployable.** A modular monolith on Next.js is enough
for this product. A separate API service, a queue, and a websocket tier would
add three failure modes and three deploy pipelines to save nothing that the
current traffic justifies.

**Vertical slices.** Every feature owns its page, its server action, its zod
schema, its query, and its cache key. `posts.ts` is the whole CRM server
surface. `outreach.ts` is the whole outreach server surface. You can read a
feature top to bottom without walking a framework.

**One source of truth, then derive.** Pinecone is a projection. The memo cache
is a projection. The TanStack cache is a projection. Each one is allowed to be
stale, each one has an invalidation path, and none of them may contradict
Postgres.

**Fail soft at the edges.** Semantic search falls back to SQL. AI editing leaves
the manual form intact. A failed vector upsert is logged and repaired by the
backfill script. A dropped SSE connection reconnects and resyncs. The only hard
failures are the ones a person can act on: not signed in, not your post, invalid
input.

**Validate at every boundary.** `zod` at the action, strict JSON schema at the
model, clamping after the model, ownership checks in SQL. Types are not a
substitute for validation — the client, the model, and the database are all
untrusted until proven otherwise.

**Keep the slow things out of the request.** `after()` for embeddings, explicit
pending states for generation, and a realtime event instead of a blocking
refresh. If a feature cannot be made fast, it is made asynchronous and honest
about it.

**Design and architecture share one vocabulary.** Stone, hairline, 400 weight,
one accent. Prepared statements, one database, small events, typed outputs. The
same restraint in both places is why the product feels coherent.

---

## 12. Trade-offs we accepted

| Decision | Alternative | What we gave up / why it is fine |
| --- | --- | --- |
| One Postgres, one app | Microservices, separate search service | Vertical scaling limits; operationally trivial at this stage |
| Pinecone as a derived index | `pgvector` inside Postgres | Dual-write complexity; mitigated by hydrating ids from Postgres |
| SSE + 2.5s watermark poll | Redis pub/sub, Pusher, WebSockets | Up to ~2.5s cross-instance latency; local writes are immediate |
| Per-instance memo cache | Redis | Duplicate reads across instances; TTL is 2–3s |
| `after()` for vector writes | Durable queue with retries | A failed upsert is not retried automatically; backfill exists |
| No candidate accounts | Full applicant profiles | No candidate-side history; the apply funnel stays frictionless |
| Email OTP only | Passwords, OAuth | Slower repeat sign-in; no credential storage |
| AI on explicit actions | AI-first flows | One extra click; the human stays accountable |
| Archived instead of deleted | Hard delete everywhere | Rows accumulate; history and applicants are preserved |
| Inline-styled email | Design-system components | Some duplication; email clients demand it |

---

## 13. Known limits and the next honest steps

1. **Cross-instance realtime is poll-backed.** Replace the watermark poller with
   Postgres `LISTEN/NOTIFY` or a small Redis pub/sub when the deployment runs
   more than a couple of instances.
2. **Embeddings are job-side only.** Candidate vectors and a re-rank step are the
   natural next move; the resume text and the job text already exist.
3. **No embedding versioning.** Changing `EMBEDDING_MODEL` or its dimensions
   requires a full re-index into a new namespace/index; there is no shadow
   index yet.
4. **No retry queue for vector writes.** A transient OpenRouter or Pinecone
   failure is logged, and the manual backfill repairs it.
5. **No rate limiting on AI routes.** Cost is bounded by prompt and token caps,
   not by per-user quotas.
6. **No AI evaluation harness.** Correctness rests on JSON schemas, zod, and
   review by the founder. A small golden set per feature would make regressions
   visible.
7. **Single region.** Neon and Pinecone latency are fine where they are close;
   a global audience would want read replicas or edge caching for public feeds.
8. **Search quality is threshold-tuned.** `0.3` and `0.12` are reasonable, not
   proven; they should be revisited with real queries.

---

## 14. Operating notes

```bash
bun install
bun run dev            # local
bunx tsc --noEmit      # types
bun run lint           # eslint
bun run build          # production build
bun test               # unit tests
bunx drizzle-kit generate   # new migration from schema.ts
bunx drizzle-kit migrate    # apply
bun --env-file=.env scripts/backfill-pinecone.ts   # rebuild the index
```

Environment:

```
DATABASE_URL
BETTER_AUTH_SECRET, BETTER_AUTH_URL
REFLECTION_API_KEY, REFLECTION_BASE_URL (optional)
OPENROUTER_API_KEY, OPENROUTER_BASE_URL (optional)
PINECONE_API_KEY, PINECONE_INDEX_NAME, PINECONE_INDEX_HOST
EXA_API_KEY
RESEND_API_KEY, RESEND_EMAIL_FROM
UPLOADTHING_TOKEN
```

---

## 15. File map

```
app/
  page.tsx                     landing, search
  jobs/                        public search + filters
  job-post/                    create, review, publish
  company/[id]/[slug]/         public company page, careers, private cockpit
  company/applicants/          applicant board + detail
  dashboard/                   account, company, posts CRM, sessions
  dashboard/post/edit/[slug]/  manual + AI post editing
  onboarding/                  three-step wizard
  api/jobs                     JSON feed for TanStack Query
  api/applicants               live applicant feed
  api/realtime                 SSE stream

proxy.ts                       auth + onboarding boundary
lib/db/                        schema, clients, prepared queries, memo
lib/actions/                   every mutation and read that needs a session
lib/embeddings.ts              OpenRouter embeddings (1024d)
lib/pinecone.ts                jobs index, upsert / query / delete
lib/realtime/bus.ts            in-process bus + watermark poller
lib/queries/                   client query options and keys
lib/email/                     OTP and outreach templates, Resend sender
components/                    minimal, stone-toned UI
drizzle/                       versioned SQL migrations
architecture.tsx               the diagram this document describes
```
