# Fly AI — Design System

> Design reference for the Fly AI job platform frontend. Every value below is
> taken from the shipped code — treat this as the spec. When in doubt, copy the
> exact class strings in **§9 Signature Recipes** rather than inventing new ones.

The product is a quiet, editorial, near-monochrome UI built on **warm stone
neutrals** with **sparse, meaning-carrying color accents**, generous whitespace,
and restrained motion. It should read like a well-typeset document, not a
SaaS dashboard.

---

## 1. Principles

1. **Warm neutral first.** Surfaces, text, borders, and the primary button are
   all `stone`/`neutral`. Color is reserved for meaning, never decoration.
2. **Hierarchy without weight.** The interface uses `font-normal` almost everywhere.
   Hierarchy comes from **size, color, and leading** — never from bold headings.
   Bold is avoided deliberately; `font-medium` appears only in the tiny logo,
   labels and a couple of micro-labels.
3. **Tight tracking, airy leading.** Headlines use `tracking-tighter`; body copy
   uses `leading-relaxed`. Big text gets tighter, small text gets looser.
4. **Borders are hairline, surfaces are paper.** Cards are `bg-stone-50` with a
   `border-stone-100`. There are essentially no drop shadows — depth is done
   with the 1px border and occasionally a subtle inset bevel on dark buttons.
5. **Meaning lives in the accent palette.** orange = employment type/action,
   purple = remote, violet = experience, green = success/verified, blue = work
   mode. Reuse these mappings everywhere.
6. **Motion is a whisper.** One shared easing curve, short fades, a single
   staggered hero entrance, and pulse-based loading. Nothing bounces, nothing
   spins except an actual spinner.

---

## 2. Typography

### 2.1 Font families

Declared in `app/layout.tsx`, wired through `app/globals.css`.

| Token | Font | Source | Applied to |
| --- | --- | --- | --- |
| `--font-sans` | **Figtree** | `next/font/google` | `html` (`font-sans`) — the whole product |
| `--font-heading` | `var(--font-sans)` → Figtree | alias | `font-heading` on the hero headline |
| `--font-geist-sans` | Geist Sans | `next/font/google` | declared; available, not the default |
| `--font-mono` / `--font-geist-mono` | **Geist Mono** | `next/font/google` | code, ordered-list counters, IDs, URLs |

- Figtree is loaded with `subsets: ["latin"]` and exposed as `--font-sans`.
- `html` gets `font-sans`, `antialiased`, and both font variables.
- `h-full` on `<html>`, `min-h-full flex flex-col` on `<body>`.

### 2.2 Rendering rules

- **Always antialiased.** `antialiased` on `<html>`; individual headings repeat
  `antialiased` for safety.
- Hero headline additionally sets:
  `[text-rendering:optimizeLegibility] [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale]`.
- Body copy (hero paragraph, description) uses `text-balance` where wrapping
  matters.

### 2.3 Type scale (as used)

| Role | Classes | Notes |
| --- | --- | --- |
| Hero display | `text-6xl md:text-[3.8rem] font-normal leading-[1.05] tracking-tighter` | landing hero only |
| Page display | `text-4xl sm:text-5xl font-normal leading-[1.05] tracking-tighter text-stone-900` | home `<h1>` |
| Page title | `text-2xl font-normal tracking-tight text-stone-900` | jobs, applicants, careers, job detail |
| Section / card title | `text-[15px] font-normal text-stone-900` (or `text-stone-800`) | `<h2>`/`<h3>` in panels and cards |
| Stat number | `text-[22px] tabular-nums tracking-tight text-stone-900` | applicants stat strip |
| Lead paragraph | `text-base leading-relaxed tracking-tight text-stone-500` | under `<h1>` |
| Body / markdown `<p>` | `text-[15px] font-normal leading-relaxed text-stone-600` | rendered job descriptions |
| Form input text | `text-[14px] text-stone-800` | all forms |
| Default UI text | `text-[13px] font-normal` | labels, meta, nav, buttons |
| Micro / meta | `text-[12px] text-stone-400` | timestamps, hints, helper text |
| Error text | `text-[11px] text-orange-600` | inline field errors |
| Badge / chip | `text-[12px]` (pills), `text-[11px]` (careers work-mode) | |

**Rules of thumb:** `tracking-tighter` for ≥24px, `tracking-tight` below that,
no tracking overrides under 15px.

### 2.4 Button typography

The shared `Button` (`components/ui/button.tsx`) base is `text-base font-normal`
with size overrides: `sm → text-sm`, `xs → text-xs`. Product surfaces override it
to `text-[13px]`/`text-[14px]`. **Never bold a button label.**

---

## 3. Color

### 3.1 Base palette — warm neutrals

The UI is overwhelmingly Tailwind **`stone`** (warm gray), with **`neutral`** for
a handful of secondary buttons/inputs and **`zinc`** for a few micro details
(bullets, auth dialog). Keep this warm/cool split consistent.

| Token | Use |
| --- | --- |
| `stone-900` | primary text, primary button fill |
| `stone-800` | emphasized input text, `strong` |
| `stone-700` / `stone-600` | secondary text, labels, markdown body |
| `stone-500` | muted text, metadata, small labels |
| `stone-400` | timestamps, hints, helper text, empty states |
| `stone-300` | shimmer bar, muted separators |
| `stone-200/*` | input borders, skeleton fills, separators |
| `stone-100` / `stone-100/70` | card borders, chip fills, tab backgrounds |
| `stone-50` / `stone-50/80` | card/panel surfaces, input fills |

Opacity modifiers are used liberally for softness: `border-stone-100`,
`border-stone-200/50`, `bg-stone-100/70`, `bg-stone-200/70`, `bg-stone-50/80`.

### 3.2 Accent palette — meaning mapping

| Accent | Meaning | Representative classes |
| --- | --- | --- |
| **Orange** | employment type, destructive/confirm actions, errors, AI | `bg-orange-100/70 text-orange-700` (type badge), `text-orange-600/700` (errors), `border-orange-200/50 bg-orange-50/80 text-orange-700` (error alert) |
| **Purple** | remote work mode | `bg-purple-100/70 text-purple-700`, `bg-purple-500` (remote dot) |
| **Violet** | experience level | `bg-violet-100/70 text-violet-700` |
| **Green** | success, visa sponsorship, "this device" | `bg-green-100/70 text-green-700`, `border-green-200/50 bg-green-50/80 text-green-700` (success alert), `bg-green-600` (live dot) |
| **Blue** | work mode (detail), checked checkboxes | `bg-blue-100/70 text-blue-700`; checkbox `data-[state=checked]:bg-blue-600` |

> **Dial guidance:** the primary action is **not** the theme `--primary` — it is
> always `bg-stone-900`. `orange-600` is the `destructive` button variant in the
> shared Button. Accents appear only as **flat backgrounds at ~70% opacity with
> a 700-shade text**, or as 1.5–2px dots.

### 3.3 Theme tokens (`app/globals.css`, OKLCH)

shadcn/Base UI primitives read these variables. Light `:root` and `.dark` are
both defined. Key values (light):

```
--background: oklch(1 0 0)          --foreground:  oklch(0.145 0 0)
--card:       oklch(1 0 0)          --card-foreground: oklch(0.145 0 0)
--popover:    oklch(1 0 0)          --primary:   oklch(0.205 0 0)
--secondary:  oklch(0.97 0 0)       --muted:     oklch(0.97 0 0)
--muted-foreground: oklch(0.556 0 0)
--border:     oklch(0.922 0 0)      --input:     oklch(0.922 0 0)
--ring:       oklch(0.708 0 0)      --destructive: oklch(0.577 0.245 27.325)
--radius:     0.625rem
--destructive-foreground: var(--color-red-700)
```

Dark mode mirrors these with an inverted ramp (`--background: oklch(0.145 0 0)`,
translucent borders `oklch(1 0 0 / 10%)`, etc.). Registered via
`@custom-variant dark (&:is(.dark *))`.

**Important caveat:** dark-mode is fully wired for the `ui/*` primitives, but
product surfaces (cards, pages, nav, forms) are hard-coded to light `stone`
values and will not invert on their own. Treat dark mode as
primitive-level only until product surfaces are migrated.

---

## 4. Radius, borders, shadows

### 4.1 Radius scale

`--radius: 0.625rem` with derived tokens (`--radius-sm` … `--radius-4xl`).

| Radius | Where |
| --- | --- |
| `rounded-sm` | badges/pills, tiny skeletons |
| `rounded-md` | small logos/avatars (`size-5`), icon buttons, inline links |
| `rounded-lg` | **default** — buttons, cards, inputs, selects, tabs, chips |
| `rounded-xl` | auth dialog, AI autofill dialog, application-received panel, logo dropzone |
| `rounded-2xl` | shared `DialogPopup` |
| `rounded-full` | logo avatar, remote dot, spinner overlay circle, scrollbar thumb |
| `rounded-[.25rem]` | checkbox |

### 4.2 Borders

- Card/panel: `border border-stone-100`.
- Inputs / selects / search: `border border-stone-200/50` or
  `border-stone-200/70`; error/secondary less often `border-stone-200/75`.
- Separators inside panels: `border-t border-stone-200/50`.
- Dashed only for dropzones: `border-2 border-dashed border-stone-200/60`
  (resume) / `border-stone-100` (logo).

### 4.3 Shadows

The product avoids drop shadows. The only recurring shadow is the primary
button's **inset bevel**:

```
shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)]
```

Applied to every dark (`bg-stone-900`) button across the app, including the
navbar "Post Job" pill and page CTAs. Form inputs explicitly set `shadow-none`.
The `ui/*` primitives keep their `shadow-xs/5` ring-based treatment, but product
overrides strip it.

---

## 5. Layout & spacing

### 5.1 Page shells

| Page | Shell |
| --- | --- |
| `/` home | `mx-auto flex w-full max-w-3xl flex-col px-6 pb-24 pt-[10vh]` |
| `/jobs` | `mx-auto w-full max-w-3xl px-6 py-16` |
| Job detail | `mx-auto max-w-xl px-6 py-16` |
| Careers | `mx-auto max-w-3xl px-6 py-16` |
| Applicants | `mx-auto w-full max-w-3xl px-6 py-16` |
| Applicant detail | `mx-auto w-full max-w-xl px-6 py-16` |
| Dashboard | `mx-auto w-full max-w-xl px-6 py-16` |
| Sign-in | `mx-auto flex w-full max-w-xl flex-col items-center px-6 py-24` |
| Post-a-job | `mx-auto max-w-xl px-6 py-16` |
| Talent / apply | `mx-auto max-w-6xl px-6 py-12` |

**Content width is `max-w-3xl` for lists, `max-w-xl` for single-column
detail/forms.** Horizontal gutter is always `px-6`. Vertical rhythm is `py-16`
(interior pages) and `pt-[10vh]` (home).

### 5.2 Stack spacing (recurring)

- List of cards: `flex flex-col gap-3`, list top margin `mt-5` (home) / `mt-10` (jobs).
- Form field groups: `flex flex-col gap-8`, or `gap-12` for the big post form.
- Field internals: `flex flex-col gap-1.5`.
- Card internals: `flex flex-col gap-2`.
- Panel padding: `px-6 py-5` (sections) / `px-6 py-4` (list cards).
- Section spacing on dashboard: stacked panels with `mt-3`.
- Chip rows: `flex flex-wrap gap-2` (tabs/filters) / `gap-1.5` (badges).

### 5.3 Navbar

`sticky top-0 z-50 flex items-center gap-2 px-6 py-3 text-[13px] font-medium`.
It starts transparent and, on scroll past 16px, gains
`bg-stone-50/70 backdrop-blur-lg` (`transition-all`). Scroll listener is passive.
Layout: logo + "Fly AI" (left), "Jobs" link with `ml-4`, actions pushed right
with `ml-auto`.

---

## 6. Core components

### 6.1 Buttons

Three tiers, all `rounded-lg`:

| Tier | Recipe |
| --- | --- |
| **Primary (dark)** | `bg-stone-900 text-white` + inset bevel + `hover:bg-stone-950` |
| **Secondary (light)** | `bg-neutral-100 text-neutral-900 hover:bg-neutral-200/70` |
| **Ghost / text link** | `text-stone-500 hover:text-stone-800 hover:underline hover:decoration-dotted` |

Sizes in use: nav pill `px-3 py-1 text-[13px]`; standard `px-6 py-1.5 text-[14px]`;
hero/CTA `px-8 py-1.5 text-[14px]/[15px]`. Home search button is `h-10 px-3 text-[13px]`.

The shared `Button` (`ui/button.tsx`) adds: `relative` positioning, a
`focus-visible:ring-2 ring-ring ring-offset-2`, `disabled:opacity-50`, and a
**loading mode** — see §7.4.

### 6.2 Cards & panels

```
rounded-lg border border-stone-100 bg-stone-50 px-6 py-4   /* list card (JobCard)   */
rounded-lg border border-stone-100 bg-stone-50 px-6 py-5   /* section panel         */
hover:border-stone-200                                      /* interactive card hover */
```

Interactive cards are wrapped in `<Link>` with `group`, and reveal a `Preview →`
affordance that shifts `text-stone-500 → group-hover:text-stone-700`.

### 6.3 Badges / chips

Signature pill: `rounded-sm px-2 py-0.5 text-[12px]`, background at `/70`:

```
stone:  bg-stone-100/70 text-stone-500|600
orange: bg-orange-100/70 text-orange-700   /* employment type */
purple: bg-purple-100/70 text-purple-700   /* remote          */
violet: bg-violet-100/70 text-violet-700   /* experience      */
green:  bg-green-100/70 text-green-700     /* visa/success    */
blue:   bg-blue-100/70 text-blue-700       /* work mode       */
```

Filter/tab chips (jobs filters, dashboard tabs, careers categories) use
`rounded-lg px-4 py-1.5 text-[13px]`, active `bg-stone-300/60 text-stone-900`,
inactive `bg-stone-100/80 text-stone-600 hover:bg-stone-200/65`.

> **Keep the `/70` fill on badges.** A flat `bg-stone-100` with a solid
> `text-stone-500` loses the warm paper feel — always use the translucent fill.

### 6.4 Form controls

- Labels: `text-[13px] font-normal text-stone-600`.
- Product inputs override the `ui/Input` chrome to a soft fill:
  `rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300`.
- The talent apply form uses a borderless fill instead:
  `rounded-lg border-0 bg-stone-100/60 text-[14px] text-stone-800 shadow-none
  focus-visible:ring-1 focus-visible:ring-stone-300`.
- Selects reuse the soft-fill recipe with `h-9` and `text-stone-700`.
- Textareas: same fill, `resize-none`/`resize-y`, `px-3 py-1.5`, `min-h-24` for notes.
- Checkboxes: `size-4 rounded-sm`, checked state `bg-blue-600 border-blue-600`
  in the apply form; the post form uses the native checkbox with `accent-stone-900`.
- Inline errors: `text-[11px] text-orange-600` directly beneath the field;
  errors clear on next change.

**Search input** (`SearchInput`): pill-less rounded field,
`h-10 rounded-lg border border-stone-200/70 bg-stone-50/80 px-4 pr-9 text-[14px]`,
placeholder `placeholder:text-stone-400`, focus `ring-1 ring-stone-300`, with a
custom clear button (inline SVG, `absolute right-2.5`) revealed only when the
field is non-empty. Native `::-webkit-search-cancel-button` is hidden.

---

## 7. Loading states

Loading is treated as a first-class design element. Four patterns, applied by
context:

### 7.1 Structural skeletons (first paint, no data)

`JobsListSkeleton` (`components/jobs-list-skeleton.tsx`) **mirrors the JobCard
layout row-for-row** so nothing shifts when data lands:

- Meta row: `size-5` logo block, `h-3 w-24` company, `h-3 w-5` flag, `ml-auto h-3 w-12` time.
- Title row: width varies by position — `index % 3 === 0 → w-56`, `=== 1 → w-44`, else `w-64`; plus `h-3 w-14` preview.
- Excerpt: `h-3 w-full` + `h-3 w-2/3`.
- Pills: `h-[22px]` at `w-[72px]/[64px]/[58px]/[80px]`, colored to match real badges (incl. `bg-orange-100/80`, `bg-purple-100/70`).

Tone ladder for shimmer fills (softest = least important):
`bg-stone-200/80 → /70 → /60 → /50 → /40 → bg-stone-100`.

Skeleton container carries `role="status" aria-busy="true"
aria-label="Loading job posts"` and an `sr-only` "Loading job posts…". Extra
skeletons beyond the first get `aria-hidden`.

Default counts: home `5`, `/jobs` `6`.

### 7.2 Background refetch shimmer

When data is already on screen and re-validating (`isFetching`), keep the list
and show a **thin top shimmer**:

```jsx
<div className={`h-0.5 overflow-hidden rounded-full transition-opacity ${isFetching ? "opacity-100" : "opacity-0"}`}>
  <div className="h-full w-1/3 animate-pulse rounded-full bg-stone-300" />
</div>
```

`aria-hidden`. Opacity transition hides it entirely when idle.

### 7.3 Session-pending placeholders

Before the auth session resolves (`isPending`), show neutral pulse pills rather
than flashing logged-out UI:

- Navbar: `h-7 w-20 bg-stone-200/70` + `h-7 w-24 bg-stone-100`, `animate-pulse rounded-lg`.
- Hero CTA: `inline-block h-9 w-44 animate-pulse rounded-lg bg-stone-200/70`.

Both carry `aria-label="Checking sign-in status"`.

### 7.4 Button / action loading

- Shared `Button`: `loading` prop sets `data-loading` (which makes the label
  `text-transparent` via `data-loading:text-transparent`), renders a centered
  `Spinner` overlay (`absolute text-white`), and sets `aria-disabled` + `disabled`.
- Product buttons instead swap the label in place:
  `"Publishing…"`, `"Generating…"`, `"Saving…"`, `"Signing out…"`, `"Deleting…"`,
  `"Creating…"`, `"Submitting…"`, `"Sending code..."`.
- Inline spinners accompany those labels where useful (`<Spinner className="size-3.5" />`).

### 7.5 Spinner

Single source: `components/ui/spinner.tsx` → lucide `Loader2Icon` with
`animate-spin`, `role="status"`, `aria-label="Loading"`. Sized by class
(`size-3.5`, `size-4`, `size-18`). The resume-parsing state uses a bespoke SVG
spinner (circle + arc) instead. `LogoUpload` shows a white/70 overlay with a
`border-2` circular spinner while uploading.

### 7.6 Deferred / dynamic loading

`ResumeViewer` is `next/dynamic` with `ssr:false` and a text fallback
("Loading resume…"), and PDF `<Document loading>` shows "Loading…".

### 7.7 Optimistic UI (perceived instant response)

Heavy actions update state *before* the server confirms, then reconcile:

- **Post job**: optimistic `JobCardData` row injected into `["jobs","latest"]`
  (newest-first, real timestamp) and `saveJob` invalidates `["jobs"]` on settle;
  button reads "Publishing…".
- **Apply**: `useOptimistic` immediately renders the "application sent" panel;
  `saveApplicant` mutation optimistically appends to `["applicants", id]` and
  rolls back on error.
- **Company settings / profile name / sign out / delete**: `useOptimistic` +
  `useTransition`, each with a pending label and a `router.refresh()` on success.
- **TanStack Query defaults** (`QueryProvider`): `staleTime 10s`,
  `gcTime 5min`, `refetchOnWindowFocus`, `refetchOnReconnect`, `retry 1`,
  mutations `retry 0`. Keep feeds fresh so a new post appears without a reload.

### 7.8 Error & empty states

- Query error card: `mt-5|mt-10 rounded-lg border border-stone-100 bg-stone-50
  px-6 py-8 text-center`, message `text-[13px] text-stone-500`, and a
  `Try again` text button (`text-stone-800 underline underline-offset-4`).
- Empty list: centered `text-[13px] text-stone-400`, `py-8`/`py-12`.
  Copy is specific: "No job posts yet." / "No job posts match these filters."
  / "No open roles in this category." / "No applicants yet."
- Page-level not-found: `py-24 text-center text-[13px] text-stone-400`
  ("Job post not found.", "Page not found.").
- Alerts (`ui/alert.tsx`): success = green, error = orange,
  `rounded-lg border px-3 py-2.5 text-[13px]`, optional icon (`size-4`) +
  `AlertDescription` at `text-[12px] opacity-80`.

---

## 8. Motion

### 8.1 Shared variants (`lib/motion/contanier.ts`)

```ts
EASE_LUXE = [0.22, 1, 0.36, 1];                       // the one easing curve

container = { show: { transition: { staggerChildren: 0.15, delayChildren: 0.07 } } };
item      = {
  hidden: { opacity: 0, y: 6, filter: "blur(7px)" },
  show:   { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE_LUXE } },
};
```

Usage: `Hero` wraps content in `<motion.div initial="hidden" animate="show"
variants={container}>` and each child in `variants={item}` — a soft staggered
**fade-up-from-blur**, ~0.8s per item.

### 8.2 Transitions

- Buttons/links: `transition-all` or `transition-colors`, default duration.
- Dialogs: `transition-[scale,opacity,translate] duration-200 ease-in-out`;
  backdrop `transition-all duration-200`; enter/exit from
  `scale-98`/`opacity-0`/`translate-y-4`.
- Scrollbar thumb: `transition-opacity delay-300`, `delay-0 duration-100` on
  hover/scroll.
- No motion should be added to list reordering or data updates.

### 8.3 Reduced motion

No explicit `prefers-reduced-motion` handling exists yet. Add it when
introducing new animation: gate the hero stagger and any transform with
`useReducedMotion()`.

---

## 9. Signature recipes (copy these)

**Primary dark button**
```txt
cursor-pointer rounded-lg bg-stone-900 px-6 py-1.5 text-[14px] font-normal text-white
shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)]
hover:bg-stone-950 disabled:cursor-not-allowed disabled:opacity-60
```

**Navbar / compact dark pill**
```txt
cursor-pointer rounded-lg bg-stone-900 px-3 py-1 text-[13px] font-normal text-white
shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] hover:bg-stone-950
```

**Secondary light chip-button**
```txt
cursor-pointer rounded-lg bg-neutral-100 px-3 py-1 text-[13px] font-normal text-neutral-900
transition-colors hover:bg-neutral-200/70
```

**Job / applicant list card**
```txt
flex flex-col gap-2 rounded-lg border border-stone-100 bg-stone-50 px-6 py-4
transition-all hover:border-stone-200
```

**Section panel (dashboard)**
```txt
rounded-lg border border-stone-100 bg-stone-50 px-6 py-5
```

**Soft-fill form input**
```txt
rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none
focus-visible:ring-1 focus-visible:ring-stone-300
```

**Filter tab / category chip**
```txt
cursor-pointer rounded-lg px-4 py-1.5 text-[13px] transition-all
/* active   */ bg-stone-300/60 text-stone-900
/* inactive */ bg-stone-100/80 text-stone-600 hover:bg-stone-200/65
```

**Dotted underline link**
```txt
text-[13px] text-stone-500 underline-offset-4 hover:text-stone-800 hover:underline hover:decoration-dotted
```

**Badge**
```txt
rounded-sm bg-stone-100/70 px-2 py-0.5 text-[12px] text-stone-600
```

**Field label / inline error**
```txt
label: text-[13px] font-normal text-stone-600
error: text-[11px] text-orange-600
```

---

## 10. Icons & imagery

- **Primary icon set:** Hugeicons (`hugeicons-react` +
  `@hugeicons/core-free-icons` via `HugeiconsIcon`). Used for arrows, upload,
  bookmark, link, markdown toolbar, device icons, Apple Intelligence.
- **Secondary:** lucide (`Loader2Icon` for the `Spinner`); local inline SVGs for
  the search clear button, checkbox check, dialog close, Apple logo, and the
  back chevron.
- Sizes: `size-3.5` (in-control), `size-4` (standard), `size-4.5`
  (primitive default → `size-4` on `sm`).
- **Imagery:** company logos render `rounded-md` at `size-5` in cards and
  `rounded-lg` at `size-10`/`size-12` on detail/careers pages; the logo upload
  avatar is `rounded-full size-14`. All marked `alt=""` when decorative.
- **Flags:** US uses `/usa.svg`; other countries use emoji regional indicators
  (`String.fromCodePoint(0x1f1e6 + …)`).
- Brand mark: `/logo.svg` in navbar (`size-5`), auth dialog (`22×22`), favicon
  `/favicon.svg`.

---

## 11. Accessibility & semantics

- **Roles/labels on non-obvious regions:** `role="status"` + `aria-busy` on
  skeletons, `role="img"` + `aria-label` on the chart, `role="alert"` on session
  load failure, `aria-label` on icon-only buttons.
- **Landmarks:** dashboard sections use `<section aria-label="…">`; tablists use
  `role="tablist"`/`role="tab"` + `aria-selected`.
- **Focus:** every interactive element has a visible
  `focus-visible:ring-*` (`ring-stone-300` on product controls, `ring-ring` on
  primitives) with `ring-offset`.
- **Keyboard:** dropzones are `role="button" tabIndex={0}` with an Enter/Space
  handler; dialogs trap focus via Base UI.
- **Screen-reader-only text** (`sr-only`) is used inside skeletons.
- **Hydration:** timestamps and relative times use `suppressHydrationWarning`.
- Icon-only controls always get an `aria-label`; decorative icons get
  `aria-hidden`.

---

## 12. Component inventory

**Primitives (`components/ui/*`, Base UI + shadcn "base-maia"):** `button`,
`spinner`, `dialog`, `select`, `input`, `input-group`, `textarea`, `label`,
`checkbox`, `toggle`, `toggle-group`, `otp-field`, `dropdown` (menu),
`scroll-area`, `separator`, `alert`.

**Product components (`components/*`):** `navbar`, `job-card`,
`latest-jobs-list`, `filtered-jobs-list`, `jobs-list-skeleton`, `search-input`,
`job-filters`, `job-post-form`, `job-post-detail`, `talent-form`,
`markdown-editor`, `markdown-renderer`, `logo-upload`, `ai-autofill-dialog`,
`auth-dialog`, `sign-in-client`, `dashboard-tabs`, `company-settings`,
`profile-name-form`, `sessions-table`, `activity-table`, `applicants-chart`,
`resume-viewer`, `delete-account`, `sign-out-button`,
`revoke-other-sessions-button`, `apple-logo`, `query-provider`,
`landing/hero`.

---

## 13. Do / Don't

**Do**
- Use `font-normal` and let size/color carry hierarchy.
- Reach for `stone` + hairline borders + `/70`-opacity accent fills.
- Mirror real layout in skeletons; vary widths so they don't look robotic.
- Swap button labels to a present-progress word ("Publishing…", "Saving…") and
  wire the optimistic update before the request resolves.
- Keep every list/feed query fresh (`staleTime 10s`) and invalidate on write.
- Use the one easing curve `[0.22, 1, 0.36, 1]` if you animate.

**Don't**
- Don't introduce drop shadows, gradients, or heavy borders.
- Don't use the theme `--primary` for product CTAs — the dark button is
  `bg-stone-900`.
- Don't bold headings or buttons; don't mix accent colors outside their meaning.
- Don't leave a bare spinner where a layout-matched skeleton is expected.
- Don't pulse a whole list on background refetch — use the thin top shimmer and
  keep content visible.
- Don't assume dark mode covers product surfaces; primitives only today.
