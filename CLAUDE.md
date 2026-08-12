# OneLife

Personal daily-life PWA — single user, offline-first, capture-speed is the
whole point. See git history / commit messages for what changed and why;
this file is about how to work in this repo, not a running log.

## Non-negotiable rules

1. RLS enabled with an ownership policy (`auth.uid() = user_id`) on every table, for every operation.
2. Soft delete only — never `DELETE`. Every table has a `deleted boolean`.
3. IndexedDB (Dexie) is the write target. Supabase is the source of truth.
   Treat local storage as a cache iOS may wipe at any time — always pull
   before trusting local state on app open.
4. Every write follows: optimistic local write → outbox row (upserted by
   `(table_name, row_id)`, not appended) → flush.
5. Modular files: one component per file, one concern per module. No
   monolithic files.
6. No new dependency without asking first — this includes routing and
   state-management libraries.

## Stack

- React + Vite + TypeScript, Tailwind CSS (`darkMode: 'media'`, system only — no theme toggle)
- Local data: IndexedDB via Dexie
- Backend: Supabase (Postgres + Auth + RLS), one project, one user
- Hosting: GitHub Pages, static build only. **GitHub never holds app data** —
  it hosts the compiled app shell (deployed via CI on push to `main`). All
  user data lives in Supabase and, offline, in the local Dexie cache. Vite
  `base` MUST equal the exact, case-sensitive GitHub repo name: `/OneLife/`.
- PWA: `vite-plugin-pwa` (app-shell caching only — data lives in Dexie, not the SW cache)
- Testing: Vitest
- No router, no Redux/Zustand/Jotai unless a concrete problem forces it —
  ask first and say what the problem is.

## Cross-device sync

Data syncs between devices exclusively through Supabase — the outbox/pull
layer (Dexie → Supabase) is what makes "I edit on my phone, it shows up on
my laptop" work, not GitHub. To make that feel closer to instant rather
than only updating on the 60s poll/focus/online triggers, the pull layer
also subscribes to Supabase Realtime (Postgres change notifications via
`@supabase/supabase-js`, already a dependency — no new package) and treats
any incoming change event as an extra flush/pull trigger. Realtime is a
convenience nudge on top of the outbox design, not a replacement for it:
polling on focus/interval/online remains the fallback if a Realtime event
is ever missed.

## Design language

Strict black/white/grayscale UI. No accent colors, no theme toggle beyond
following `prefers-color-scheme`. High contrast, generous whitespace, thin
1px dividers instead of shadows/heavy borders. The `area.color` column
still exists in the schema (for a future feature), but v1 screens render
areas as plain text/monochrome — don't wire `color` into any UI without
asking first, since it conflicts with the current design direction.

## Commands

- `npm install`
- `npm run dev` — local dev server
- `npm run build` — production build (also run by CI)
- `npm run preview` — preview the production build locally
- `npm test` — run Vitest once
- `npm run test:watch` — Vitest watch mode
- Deploy: push to `main` → GitHub Actions builds and publishes to Pages automatically. No manual deploy step.

## Conventions

- One component per file. `PascalCase.tsx` for components, `camelCase.ts` for modules.
- Feature-based folders under `src/features/<feature>/` (`api.ts`, `types.ts`, `components/`). Cross-feature shared UI goes in `src/components/`.
- DB row shapes are **snake_case** end-to-end (Postgres column names carried straight into Dexie and TS types) — no camelCase mapping layer.
- Tests co-located as `*.test.ts` next to the module they cover.
- `completed_at` on `task` is set by a Postgres trigger (`set_task_completed_at`), not application code — don't duplicate that logic client-side.
- Conflict resolution is last-write-wins on the **server-assigned** `updated_at` (never the client clock). The client never sets `updated_at` on write.
- Client never sends the `service_role` key anywhere — only the anon key, which is meaningless without RLS.

## Scope

v1 shipped with tasks, Today, habits, and offline sync only. Additions
since are owner-requested, one at a time — don't scaffold "for later".

Still out of scope unless explicitly asked: meals/nutrition, workouts,
goals tracking, journaling/mood, sharing/collaboration, push
notifications, AI features, theming beyond system light/dark.

**Google Calendar (post-v1 addition)**: read-only, on the Agenda tab.
Browser-only OAuth implicit flow (`features/calendar/googleAuth.ts`) — a
plain redirect to accounts.google.com, no SDK script, no server, no new
dependency. Google is the source of truth: calendar data is NEVER written
to Supabase or the outbox (rule 4 governs writes; this feature makes
none). Tokens live ~1h with no refresh token — "Reconnect" is an expected
state, and the last fetch is cached in localStorage for offline viewing.
The OAuth Client ID is user-supplied at runtime (Settings-free, pasted
once on the Agenda tab) and is public by nature — but the token capture
in main.tsx must stay ahead of anything touching location.hash.
