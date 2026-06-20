# Deploy HridLink (Vercel UI + Fly.io API)

**First time wiring your live Vercel URL?** Follow [docs/DEPLOYED-URL-ONBOARDING.md](docs/DEPLOYED-URL-ONBOARDING.md) (Neon Auth origin, `NEXT_PUBLIC_APP_URL`, redeploys, first user, role promotion).

The Next.js app keeps **Neon Auth** on Vercel (`/api/auth/*`, middleware, sign-in pages). **All data HTTP handlers live only on Fly.io** — there are no duplicate `app/api/patients` or `app/api/ecg` routes in Next. Traffic is proxied with **rewrites** so the browser still calls same-origin `/api/...` (cookies forwarded to Fly).

## 1. Fly.io — API

From the **repository root**:

```bash
cd /path/to/hridlink
fly launch --no-deploy --config fly.api.toml --name hridlink-api --region sin
```

Edit `fly.api.toml` if you change the app name.

Set secrets (use your real values):

```bash
# Generate a strong shared secret: openssl rand -hex 32
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
  NEXT_PUBLIC_APP_URL="https://your-app.vercel.app" \
  INTERNAL_API_SECRET="<same 32-char hex as Vercel INTERNAL_API_SECRET>" \
  AGENTMAIL_API_KEY="..." \
  NOTIFY_CARDIOLOGIST_EMAIL="optional@example.com"
```

Optional AgentMail tuning (defaults shown; omit if fine):

```bash
fly secrets set --config fly.api.toml \
  AGENTMAIL_DOMAIN="agentmail.to" \
  AGENTMAIL_INBOX_USERNAME="noreply" \
  AGENTMAIL_INBOX_ID=""
```

See [docs/AGENTMAIL.md](docs/AGENTMAIL.md) for behaviour (cardiologist alert email, health-worker finding email when the uploader has an email on file).

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
| `API_UPSTREAM_URL` | **Required** in production. Fly origin without trailing slash, e.g. `https://hridlink-api.fly.dev` |
| `INTERNAL_API_SECRET` | **Required** in production. 32-char hex shared with Fly — middleware injects `X-Internal-Secret` header; Fly rejects any request missing it. Generate: `openssl rand -hex 32` |
| `DATABASE_URL`, `DIRECT_URL` | Neon DB URLs (layouts use Prisma for role checks) |
| `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` | Neon Auth (must match Fly for session cookie forwarding) |
| `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` | Storage |
| `MSG91_*`, `NEXT_PUBLIC_APP_URL` | WhatsApp notifications + deep-link URLs (email uses AgentMail on **Fly** only — see [docs/AGENTMAIL.md](docs/AGENTMAIL.md)) |

`next.config.mjs` always rewrites these paths to `API_UPSTREAM_URL` in production; in local dev, set the variable or rewrites are skipped and those URLs **404** (by design — no silent fallback to a local Prisma API in Next).

- `/api/patients`
- `/api/ecg`
- `/api/ecg/:id/finding`
- `/api/admin/stats`

`/api/auth/*` stays on Vercel only.

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

Use **`npm run dev:stack`** from the repo root (starts Next + `api-fly`). Set `API_UPSTREAM_URL=http://127.0.0.1:8080` in `.env.local` or export it in the shell so rewrites hit local Fly API. For local **AgentMail** tests, set `AGENTMAIL_*` (and optionally `NOTIFY_CARDIOLOGIST_EMAIL`) in the shell or an `api-fly` env file — see [docs/AGENTMAIL.md](docs/AGENTMAIL.md).

## 4. Optional hardening

- Restrict Fly app to Vercel egress IPs (advanced) or use a shared `X-Internal-Secret` header from Vercel rewrites (would require a small custom proxy instead of bare rewrites).

## 5. E2E (Playwright)

```bash
npm run test:e2e:install   # Chromium (first time)
npm run test:e2e           # starts `npm run dev:stack` (Next + local Fly API) unless skipped
```

See `tests/e2e/README.md`. Default suite **mocks `/api/*`** so it does not require a live Neon/Supabase; the dev server still runs with rewrites to `http://127.0.0.1:8080` by default.
