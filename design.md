# Design System — Fly AI

A quiet, editorial B2B design language. Warm neutral stone palette, one dark CTA, no decorative color, no heavy type. Everything is `font-normal`, tight tracking, small sizes.

## Stack

- Tailwind CSS v4 (`@import "tailwindcss"` in `app/globals.css`, theme in `@theme inline`)
- shadcn-style UI primitives built on **Base UI** (`@base-ui/react`), style `base-maia`
- Icons: **hugeicons** (`hugeicons-react` / `@hugeicons/react`)
- Motion: `motion/react` with shared presets in `lib/motion/contanier.ts`
- Fonts: Figtree (`--font-sans`), Geist (`--font-geist-sans`), Geist Mono (`--font-geist-mono`) via `next/font/google`

## Color

Light theme only in practice (dark tokens exist in `globals.css` but are not the product surface).

| Token | Value | Use |
|---|---|---|
| `--background` / `--foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | White canvas, near-black text |
| `--primary` | `oklch(0.205 0 0)` | CTA fill |
| `--muted` / `--secondary` / `--accent` | `oklch(0.97 0 0)` | Chip / fill surfaces |
| `--muted-foreground` | `oklch(0.556 0 0)` | Secondary text |
| `--border` / `--input` | `oklch(0.922 0 0)` | Hairlines |
| `--ring` | `oklch(0.708 0 0)` | Focus ring |

In practice the product leans on the **stone** Tailwind ramp: `stone-50` surfaces, `stone-100` fills, `stone-200/50` borders, `stone-300` active chips, `stone-400`–`stone-500` meta text, `stone-800`–`stone-900` headings/CTA.

Accent use (always semantic, never decorative):
- `orange-600` text / `orange-100/70` bg — validation errors and primary accent (AI button icon, destructive role, bookmark saved state)
- `purple-100`/`purple-700` — "Remote" work mode badge
- `blue-100/70`/`blue-700` — employment type badge; `blue-600` checkbox checked state
- `violet-100/70`/`violet-700` — experience badge
- `green-100/70`/`green-700` — success
- `orange-100/70`/`orange-700` — role type badge

## Typography

- Base UI font: Figtree via `--font-sans`; headings use `--font-heading` (same stack).
- Weights: **always `font-normal`** — never bold, never semibold in product UI.
- Tracking: `tracking-tight` on headings, `tracking-tighter` on hero/logo.
- Sizes scale small and deliberate:
  - Hero H1: `text-6xl md:text-[3.8rem] leading-[1.05] tracking-tighter`
  - Page H1: `text-xl` or `text-2xl`, `font-normal tracking-tight text-stone-900`
  - Card title: `text-[15px] font-normal text-stone-900`
  - Body/meta: `text-[14px] text-stone-500`, `text-[13px] text-stone-500`
  - Labels: `text-[13px] font-normal text-stone-600`
  - Errors/captions: `text-[11px] text-orange-600` or `text-[12px] text-stone-500`
  - Code: `font-mono text-[13px]` (Geist Mono), square-ish `rounded` chip on `bg-stone-100`
- Antialiasing utilities on all prominent text: `antialiased` + explicit `[-webkit-font-smoothing:antialiased]`.

## Spacing & Layout

- Page container: `mx-auto max-w-xl px-6 py-16` (form pages), `max-w-3xl` (careers), `max-w-6xl` (talent form).
- Vertical rhythm: sections `gap-8`/`gap-10`/`gap-12`; fields `gap-1.5`; label→control `gap-1.5`.
- Grids: `grid-cols-2 gap-6` for paired fields; `grid-cols-3 gap-6` for role type / category / work mode.
- Radii: `--radius: 0.625rem`; controls and cards `rounded-lg`; dialogs `rounded-xl`; logo avatar `rounded-full`; badges `rounded-sm`; tab chips `rounded-lg`.
- Icons: `size-3.5`–`size-4` inline, `size-5` logo.

## Surfaces

- Page: white with optional full-bleed `hero.avif` background image (`-z-10 object-cover`).
- Elevated container (auth dialog, success card): `bg-zinc-50`/`bg-stone-50`, `rounded-xl`, no shadow.
- Cards/rows: `rounded-lg border border-stone-100 bg-stone-50` with `hover:border-stone-200`.
- Inputs: two treatments — job form uses `border-stone-200/50 bg-stone-50/80`; talent form uses borderless `bg-stone-100/60`. Both `shadow-none focus-visible:ring-1 focus-visible:ring-stone-300`.
- Shadows: almost none. CTA uses an inset hairline trick: `shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)]`.

## Components

### Primary button (CTA)
Everywhere: `rounded-lg bg-stone-900 px-6 py-1.5 text-[14px] font-normal text-white` + inset shadow + `hover:bg-stone-950` (or `hover:underline hover:underline-offset-2`), `disabled:opacity-60`. Rendered via `Button` or raw `<button>`; no green, no gradients.

### Secondary / chip buttons
- Filter tabs: `rounded-lg px-4 py-1.5 text-[13px]`; active `bg-stone-300/60 text-stone-900`, idle `bg-stone-100/80 text-stone-600 hover:bg-stone-200/65`.
- Work-mode toggle: same light treatment, active `bg-stone-900 text-white`.
- Small utility: `text-[12px] text-stone-500 rounded-md px-2 py-1 hover:bg-stone-100 hover:text-stone-700` (copy link / save).
- AI trigger: `border-stone-100 bg-stone-50 text-stone-600 hover:border-stone-200 hover:bg-stone-100/70`, orange icon, underline on hover.

### Inputs / Selects
Label above, `text-[13px] text-stone-600`; control `h-8.5`-style, `rounded-lg`, `text-[14px] text-stone-800`, placeholder `text-stone-400`; focus is a 1px `stone-300` ring — never a fat brand ring. Error text below in `text-[11px] text-orange-600`.

### Checkbox
`size-4 rounded-sm border-stone-300/50`, checked → `border-blue-600 bg-blue-600`.

### Badges (job detail)
`rounded-sm px-2 py-0.5 text-[12px]` with the semantic color pairs above; salary badge is the neutral stone variant.

### Work-mode chip (list row)
`rounded px-1.5 py-0.5 text-[11px] font-medium`; remote = purple, hybrid/on-site = stone.

### Dialogs
- Auth: `bg-zinc-50`, `rounded-xl`, `px-8 py-14`, scale/fade from `data-starting-style:scale-95 opacity-0`, close button top-right ghost icon, trust footer with lock icon, `u` underline on "safe and secure".
- AI autofill: `bg-stone-50 border-stone-200/50`, header title `text-[15px]`.

### OTP input
Six slots, groups of 3 separated by a dash, square slots with the same stone input styling, blink caret animation (`--animate-caret-blink`).

### Markdown
- Renderer: paragraphs `text-[15px] leading-relaxed text-stone-600`; headings descending stone-900→stone-600; lists with square `size-1.25 rounded-[1.5px] bg-zinc-800` bullets or numbered mono chips; code chips `bg-stone-100 rounded px-1.5 py-0.5 font-mono text-[13px]`; blockquote `bg-stone-50/80 rounded-lg px-4 py-3`; links `underline decoration-dotted`; tables wrapped in `border-stone-200/50 rounded-lg`.
- Editor: toolbar strip `bg-neutral-100/60 border-b border-neutral-200/50`, icon toggles `size-3.5`, preview toggle right-aligned, textarea `min-h-32 max-h-80`.

### Upload dropzone
`border-2 border-dashed border-stone-200/60 bg-stone-50/50 rounded-lg`, hover `border-stone-300`, inner "Upload file" dark pill `bg-stone-900 text-white rounded-md`.

### Dashboard (account)
Route: `/dashboard` (dynamic via `headers()` — never `export const dynamic`). Column is `max-w-xl`; sections are `stone-50` cards with `border-stone-100`, stacked at `mt-10` then `mt-3`. Sections in order:
- **Profile** — inline **Name** field + Save dark chip (`bg-stone-900 px-4 py-1 text-[13px]`), email shown as `text-[12px] text-stone-400` below. Real `authClient.updateUser({ name })`. Error/value text below in `text-[11px] text-orange-600`, saved in `text-[11px] text-stone-500`.
- **Active sessions** — rows from the real `session` table via `auth.api.listSessions`, parsed by zod (`SessionRowSchema`), never sending the token to the client. Each row: 32px `rounded-lg bg-stone-100` device icon slot (`size-4` hugeicons — **Apple** icon for macOS/iOS, Android for Android, desktop/mobile otherwise), title `text-[14px] text-stone-800`, sub `text-[12px] text-stone-400` (`device · redacted IP`, always via `redactIp` from `lib/actions/security/client.ts`), right-aligned seen-at in `text-[12px] text-stone-400`. Current device gets a green "This device" chip. "Sign out others" is a dotted-underline `text-[12px]` utility link (real `authClient.revokeSessions()`).
- **Recent activity** — sign-in entries derived from the same real session rows (`Signed in` + device + IP). Same hairline list treatment as sessions.
- **Security and privacy** — hairline list (`border-t border-stone-200/50`), `text-[13px] text-stone-500`. Copy must describe OTP sign-in, never passwords.
- **Sign out** — one dark CTA (the standard chip). **Delete account** — separate card, dotted-underline danger trigger in `text-orange-700`, two-step confirm, real `authClient.deleteUser()` with server-side `beforeDelete` cleanup of companies/job posts/applicants. One dark CTA per view still applies: delete confirm and sign out live in different cards.

### Search input
One relative wrapper per search field. Input is `h-10 w-full rounded-lg border-stone-200/70 bg-stone-50/80 px-4 pr-9 text-[14px]` with the native webkit cancel button hidden. An inline clear button sits at `right-2.5` — a 13px ✕ stroke svg, `text-neutral-900/70`, `cursor-pointer`, hover `bg-stone-200/60 text-neutral-900`. The submit button beside it is a plain dark chip (`h-10 w-fit px-3 py-1 text-[13px]`), never stretched.

### Sign-out state
Account "Sign out" button: the standard dark chip, `disabled:opacity-60`, while pending shows `Signing out…` with no spinner.

### Navbar
Sticky, `px-6 py-3 text-[13px] font-medium text-stone-900`; transparent, gains `bg-stone-50/70 backdrop-blur-lg` after 16px scroll; logo `size-5` + wordmark `text-[17px] tracking-tighter`. Right cluster is `flex items-center gap-2`. **Post Job** is the single dark CTA (`bg-stone-900 px-3 py-1 text-[13px]`). **Dashboard** is a *neutral* chip, not a dark CTA: `bg-neutral-100 px-3 py-1 text-[13px] text-neutral-900 hover:bg-neutral-200/70`, no border. **Applicants** stays a plain neutral-600 link.

### Job list rows
`group rounded-lg border border-stone-100 bg-stone-50 px-6 py-4 hover:border-stone-200`; title `text-[15px]`, meta line `text-[13px] text-stone-500` with `&middot;` separators, flag inline, work-mode chip, right-aligned `timeAgo` in `text-stone-400`; row CTA "Preview →" appears stone-500→stone-700 on hover.

### Success state (application sent)
Centered card `max-w-md rounded-xl bg-stone-50 px-8 py-10 text-center`, company avatar in `size-10 rounded-full bg-stone-100`, title `text-[15px] font-medium`, body `text-[13px] text-stone-500`.

## Motion

- Hero entrance: `container` (staggerChildren 0.15, delayChildren 0.07) → `item` = `{ opacity: 0, y: 6, blur(7px) }` to visible, `duration: 0.8`, `ease: [0.22, 1, 0.36, 1]` (`EASE_LUXE`).
- Dialogs: 200ms scale-95/opacity transitions via `data-starting-style`/`data-ending-style`.
- No parallax, no scroll-jacking; carousel/camera motion absent by design.

## Voice in UI copy

- Headlines: "Job post infrastructure for serious teams" — confident, minimal, no exclamation marks.
- Buttons are plain verbs: "Post a job opening", "Generate job post", "Submit application", "Continue with email".
- Errors lowercase stone/orange, terse: "Enter a valid email address", "No open roles in this category."

## Rules of thumb

1. One dark CTA per view; everything else is stone-100/50 chip or ghost.
2. `font-normal` everywhere; emphasis via size/color, never weight.
3. Borders are 1px `stone-200/50` or `stone-100`; cards never shadowed.
4. Accent color only carries meaning (error = orange, remote = purple, checked = blue).
5. Numbers and timestamps recede: `text-stone-400`/`text-stone-500`, small size.
