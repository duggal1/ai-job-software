# Fly AI

An agentic AI job platform — infra, evals, and the people who ship them.

Built as a personal learning space for strengthening practical software engineering skills in React, Next.js, TypeScript, and modern AI-focused tooling.

## Tech

- **Next.js 16** (App Router, Turbopack, React 19)
- **TypeScript** + **Tailwind CSS 4**
- **better-auth** (sessions, email OTP, device tracking)
- **Drizzle ORM** (prepared statements, Neon serverless pool)
- **Uploadthing** for file uploads, **Resend** for email
- **TanStack Query / Form** for client state

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

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Bun tests |
| `npm run db:push` | Push schema to the database |
| `npm run db:generate` | Generate Drizzle migrations |

## Performance notes

- `better-auth` session cookie cache (`strategy: "compact"`) avoids a DB hit on every `get-session` request.
- All read queries go through **prepared statements**, cached for 30s in a request-scoped memo store.
- The Neon pool reuses connections and rotates them before the serverless driver drops idle sockets.

## License

MIT