# Vercel CLI + Neon CLI (HridLink)

Use this guide to wire **Neon Postgres** and **Vercel** from the terminal. Full platform layout (Fly API, secrets, first deploy) stays in [DEPLOY.md](../DEPLOY.md). First-time **live URL + Neon Auth** steps: [DEPLOYED-URL-ONBOARDING.md](./DEPLOYED-URL-ONBOARDING.md).

## Install

```bash
npm i -g vercel neonctl
```

Or run without global install: `npx vercel`, `npx neonctl`.

## Neon CLI (`neonctl`)

### Sign in and pick a project

```bash
neonctl auth
neonctl projects list
neonctl set-context --project-id <your-neon-project-id>
neonctl branches list --project-id <your-neon-project-id>
```

Context is stored under `~/.config/neonctl/context.json` (macOS/Linux) or the equivalent Windows config path for Neon CLI.

### Connection strings for Prisma

HridLink expects **`DATABASE_URL`** (usually **pooled**) and **`DIRECT_URL`** (usually **direct**, for migrations). Copy values that match your Neon dashboard, or generate via CLI:

```bash
# Pooled + Prisma-style query params (typical DATABASE_URL)
neonctl connection-string main --prisma --pooled --project-id <your-neon-project-id>

# Direct / non-pooler URL for DIRECT_URL — use the form Neon documents for
# “direct” or “non-pooled” if your project separates endpoints; otherwise confirm in console.
neonctl connection-string main --project-id <your-neon-project-id>
```

Branch name `main` is an example; use your default branch name from `neonctl branches list`.

### Optional: open `psql` against the branch

```bash
neonctl connection-string main --psql --project-id <your-neon-project-id>
```

### Apply schema and seed (local machine)

With `DATABASE_URL` and `DIRECT_URL` exported or in `.env` / `.env.local`:

```bash
npx prisma migrate deploy
npm run db:seed
```

## Vercel CLI (`vercel`)

### Link the repo and pull env

From the **repository root**:

```bash
vercel login
vercel link
vercel env pull .env.local
```

Review `.env.local` (gitignored). Do **not** commit secrets.

### Run dev using Vercel-stored env

```bash
vercel env run -- npm run dev
```

For the **full stack** (Next + Fly API locally), still follow [DEPLOY.md](../DEPLOY.md) section 3: set `API_UPSTREAM_URL=http://127.0.0.1:8080` and run `npm run dev:stack`.

### Manage remote variables

```bash
vercel env ls
vercel env add <NAME> production
vercel env pull .env.local
```

Use `preview` or `development` instead of `production` when appropriate.

### Deploy

```bash
vercel deploy
vercel deploy --prod
```

## Environment checklist (Vercel)

Align with [DEPLOY.md §2](../DEPLOY.md#2-vercel--ui--auth-proxy):

| Variable | Notes |
|----------|--------|
| `API_UPSTREAM_URL` | **Required** in production: Fly origin, no trailing slash. |
| `INTERNAL_API_SECRET` | Shared with Fly; same value on both sides. |
| `DATABASE_URL`, `DIRECT_URL` | Neon URLs (Prisma on Vercel for role/layout data). |
| `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` | Must match Fly for cookie/session behaviour. |
| `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` | Storage (see app/Fly secrets in DEPLOY). |
| `MSG91_*`, `NEXT_PUBLIC_APP_URL` | WhatsApp + absolute links (optional MSG91 for real sends). |

Fly secrets (including the same `DATABASE_URL`, auth, Supabase, `INTERNAL_API_SECRET`) are set with **`fly secrets`**, not Vercel—see [DEPLOY.md §1](../DEPLOY.md#1-flyio--api).

## PowerShell examples (Windows)

```powershell
cd c:\Users\gengi\Documents\hridlink
neonctl auth
vercel link
vercel env pull .env.local
$env:DATABASE_URL = "<pooled-url>"; $env:DIRECT_URL = "<direct-url>"; npx prisma migrate deploy
```

## CI / non-interactive Vercel

For GitHub Actions or bots, use a Vercel token and `vercel pull` / deploy flags as in [Vercel docs](https://vercel.com/docs/cli/deploy) (`--token`, `--yes`).

## Neon API key instead of browser auth

```bash
neonctl projects list --api-key <neon_api_key>
```

Prefer short-lived keys and CI secrets stores over committing keys to the repo.
