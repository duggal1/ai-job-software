# Fly AI

An agentic AI job platform — infra, evals, and the people who ship them.

## What it is

Fly AI is a job board for AI engineering work. Companies post roles. Candidates apply. Nothing else is pretending to be a CRM or a recruiting suite.

Two sides of the same product:

- **Companies.** Post jobs, review applicants, manage a public careers page, and keep their own branding. No ATS import, no sales rep, no phone call to get started.
- **Engineers.** Find roles in agent infrastructure, model evals, and the systems around them. Search by skill, location, and experience level.

## Who it's for

Teams building AI products who need to hire. Engineers who want to work on the hard parts of AI systems rather than the wrapper around them.

The site is opinionated on purpose. It does not try to be a general job board with a thousand filters and a salary estimator that guesses. It shows real postings, and it tells you what the company actually needs.

## Tech

- **Next.js 16** — App Router, Turbopack, React 19
- **TypeScript** throughout the app
- **Tailwind CSS 4** for styling
- **better-auth** — sessions, email OTP sign-in, device tracking
- **Drizzle ORM** — all queries run as prepared statements against a Neon serverless Postgres pool
- **Uploadthing** for resume and logo uploads
- **Resend** for transactional email
- **TanStack Query and Form** for client state

## Performance

Read queries are the hot path, so that's what this is built around.

- Every read query is a **prepared statement**. The SQL is built once and reused, so the database driver skips parsing on each call.
- Results are cached for **30 seconds** in a request-scoped store. Repeat visitors see the same page without hitting the database.
- **better-auth** runs its session cookie in compact cache mode. A `get-session` call no longer reaches the database on every request — it reads the cookie and only re-validates when the session changes.
- The Neon pool is configured to reuse connections and rotate them before the serverless driver drops idle sockets.

Measured warm response times on the main routes sit in the tens of milliseconds.

## Getting started

```bash
cp .env.example .env
# fill in DATABASE_URL, BETTER_AUTH_URL, and the provider keys you need
npm install
npm run db:push
npm run dev
```

Open http://localhost:3000.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Bun tests |
| `npm run db:push` | Push the schema to the database |
| `npm run db:generate` | Generate a Drizzle migration |

## Layout

```
app/         Next.js pages and API routes
components/   Reusable UI, shared across pages
lib/          Domain code: auth, db, actions, email, settings
drizzle/      Migrations
scripts/      One-off data scripts
```

## License

MIT