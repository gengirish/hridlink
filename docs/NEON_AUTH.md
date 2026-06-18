# Neon Auth (Better Auth on Neon)

This app uses [Neon Auth](https://neon.com/docs/auth/overview) via `@neondatabase/auth`: a managed auth service with users and sessions stored in your Neon Postgres `neon_auth` schema, and APIs compatible with [Better Auth](https://www.better-auth.com/).

## 1. Enable Auth in Neon

In the Neon Console: **Project → Branch → Auth → Configuration**. Copy the **Auth URL**.

## 2. Environment variables

Add to `.env` / `.env.local` (see `.env.example`):

| Variable | Description |
|----------|-------------|
| `NEON_AUTH_BASE_URL` | Auth URL from the console (must include branch path, e.g. `.../neondb/auth`). |
| `NEON_AUTH_COOKIE_SECRET` | At least 32 characters; used to sign session cache cookies. Generate with `openssl rand -base64 32`. |

## 3. App wiring (already in repo)

- `lib/auth/server.ts` — `createNeonAuth()`
- `app/api/auth/[...path]/route.ts` — proxies auth to Neon
- `middleware.ts` — session gate for `/admin`, `/cardiologist`, `/api/admin`, `/api/ecg/:id/finding`
- `app/sign-in`, `app/sign-up` — email/password via server actions
- `lib/auth/client.ts` — `createAuthClient()` for client-side calls if you extend the UI

## 4. Roles (Prisma `users`)

App roles (`ADMIN`, `CARDIOLOGIST`, …) live in the Prisma `User` model. The field **`authUserId`** maps to the existing DB column `clerkUserId` — set `authUserId` to the Neon Auth user id (`session.user.id`) for each staff row (or match on `email`).

## 5. Next.js version note

`@neondatabase/auth` declares an optional peer of **Next.js ≥ 16**; this project uses **Next 14** with `.npmrc` **`legacy-peer-deps=true`** so installs succeed. If you hit runtime issues, upgrade Next or follow Neon’s [Next.js quick start](https://neon.com/docs/auth/quick-start/nextjs-api-only).

## 6. Optional: AI / MCP setup

Neon documents `npx neonctl@latest init` for MCP and agent skills to provision auth — see [Set up with your AI editor](https://neon.com/docs/auth/overview#set-up-with-your-ai-editor).
