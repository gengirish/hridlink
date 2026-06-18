# Deploy HridLink (Vercel UI + Fly.io API)

The Next.js app keeps **Neon Auth** on Vercel (`/api/auth/*`, middleware, sign-in pages). All **data** HTTP handlers run on **Fly.io** and are reached through **Vercel rewrites** so the browser still calls same-origin `/api/...` (cookies work).

## 1. Fly.io — API

From the **repository root**:

```bash
cd /path/to/hridlink
fly launch --no-deploy --config fly.api.toml --name hridlink-api --region sin
```

Edit `fly.api.toml` if you change the app name.

Set secrets (use your real values):

```bash
fly secrets set --config fly.api.toml \
  DATABASE_URL="postgresql://...pooler...?sslmode=require" \
  DIRECT_URL="postgresql://...direct...?sslmode=require" \
  NEON_AUTH_BASE_URL="https://....neonauth...." \
  NEON_AUTH_COOKIE_SECRET="(32+ chars, same as Vercel)" \
  NEXT_PUBLIC_SUPABASE_URL="https://....supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="..." \
  MSG91_AUTH_KEY="..." \
  MSG91_CARDIOLOGIST_PHONE="+91..." \
  MSG91_TEMPLATE_ID_CARDIOLOGIST="..." \
  MSG91_TEMPLATE_ID_HEALTH_WORKER="..." \
  NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

Deploy:

```bash
fly deploy --config fly.api.toml
```

Note the app URL, e.g. `https://hridlink-api.fly.dev`.

### Migrations

Run Prisma migrations against Neon from your machine (or CI), not necessarily on Fly:

```bash
npx prisma migrate deploy
```

(`DATABASE_URL` / `DIRECT_URL` in `.env`.)

## 2. Vercel — UI + auth proxy

Import the GitHub repo (or link CLI). Set environment variables:

| Variable | Purpose |
|----------|---------|
| `API_UPSTREAM_URL` | Fly app origin **without** trailing slash, e.g. `https://hridlink-api.fly.dev` |
| `DATABASE_URL`, `DIRECT_URL` | Same Neon URLs (layouts use Prisma for role checks) |
| `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` | Neon Auth (must match Fly for session cookies forwarded to `/get-session`) |
| `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` | Storage (browser + server components if any) |
| `MSG91_*`, `NEXT_PUBLIC_APP_URL` | Notifications + links |

`next.config.mjs` rewrites these paths to Fly when `API_UPSTREAM_URL` is set:

- `/api/patients`
- `/api/ecg`
- `/api/ecg/:id/finding`
- `/api/admin/stats`

`/api/auth/*` stays on Vercel.

## 3. Local full stack

Terminal 1 — API:

```bash
cd api-fly
npm install
npm run dev
```

Terminal 2 — Next (`.env.local`):

```
API_UPSTREAM_URL=http://127.0.0.1:8080
```

```bash
npm run dev
```

Or use `npm run dev:stack` from the repo root after installing root `concurrently`.

## 4. Optional hardening

- Restrict Fly app to Vercel egress IPs (advanced) or use a shared `X-Internal-Secret` header from Vercel rewrites (would require a small custom proxy instead of bare rewrites).
