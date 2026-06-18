---
name: nextjs-app-router
description: >-
  Next.js 14 App Router conventions for HridLink — route groups, Neon Auth
  middleware, server actions (useFormState), and API rewrites to the Fly
  backend. Use when adding routes, layouts, auth gates, or debugging
  same-origin API proxying.
---

# Next.js 14 App Router — HridLink

Stack: Next `14.2.x`, App Router, Neon Auth (`@neondatabase/auth`), Prisma (API on Fly), PWA (`@ducanh2912/next-pwa`).

## Route layout

```
app/
├── layout.tsx                 # Root layout
├── (public)/                  # Unauthenticated flows (register, ECG upload, etc.)
├── (protected)/               # Role UI (admin, cardiologist) — still gated in middleware
│   ├── admin/
│   └── cardiologist/
├── sign-in/, sign-up/         # Email auth + server actions
└── api/auth/[...path]/        # Neon Auth handler only — data APIs are not here
```

## Data API surface

Browser calls **same-origin** paths under `/api/patients`, `/api/ecg`, `/api/admin/stats`, etc. Next.js **rewrites** them to `API_UPSTREAM_URL` (Fly Express app in `api-fly/`). See `next.config.mjs` `rewrites()`.

- Do not add `app/api/.../route.ts` for those resources unless you intentionally change architecture.
- Local full stack: `npm run dev:stack` (Next + `api-fly` dev server); ensure `API_UPSTREAM_URL` matches the API port (e.g. `http://127.0.0.1:8080`).

## Auth and middleware

- Server helper: `@/lib/auth/server` (`auth`, `auth.middleware`).
- `middleware.ts` uses `auth.middleware({ loginUrl: "/sign-in" })` with a **narrow** `config.matcher` for protected paths (e.g. `/admin`, `/cardiologist`, selected `/api/*` routes). Public marketing and registration flows stay outside the matcher unless you expand it.

## Server actions

- Actions live next to pages (e.g. `app/sign-in/actions.ts`) with `"use server"`.
- Forms use `useFormState` from `react-dom` and `form action={formAction}` for email sign-in / sign-up.
- For domain mutations that hit Fly, prefer `fetch` to `/api/...` from client components (cookies forwarded) or extend the API layer on Fly — keep validation aligned with `lib/validators.ts` / `api-fly/src/lib/validators.ts`.

## Conventions

- Components: `PascalCase.tsx`; hooks: `use*.ts`; shared libs under `lib/`.
- Use `next/link` and `next/navigation` (`redirect`, `useRouter`) per App Router docs.
