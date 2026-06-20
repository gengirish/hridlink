# Onboard on your deployed URL

Use this when you have a **live Vercel URL** (for example `https://hridlink.vercel.app` or a custom domain) and want auth, API rewrites, and notifications to behave correctly end-to-end.

Pick two values and use them consistently everywhere below:

| Placeholder | Example | Meaning |
|-------------|---------|---------|
| `VERCEL_APP_URL` | `https://hridlink.vercel.app` | Public Next.js site (**no** trailing slash) |
| `FLY_API_URL` | `https://hridlink-api.fly.dev` | Fly API origin (**no** trailing slash) |

## 1. Neon Auth — allow your site origin

In the [Neon Console](https://console.neon.tech) → your project → **Auth** (or Auth configuration for your branch), register **`VERCEL_APP_URL`** as an allowed application / trusted origin / redirect base (exact labels depend on the Neon Auth UI). Sessions and cookies are scoped to that origin; if the production URL is missing here, sign-in can fail or redirect incorrectly.

Also confirm **`NEON_AUTH_BASE_URL`** and **`NEON_AUTH_COOKIE_SECRET`** in Neon’s docs match what you set on Vercel and Fly (same values on both).

## 2. Vercel — environment variables

In the Vercel project → **Settings → Environment Variables** (at least **Production**):

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_APP_URL` | Same as `VERCEL_APP_URL` |
| `API_UPSTREAM_URL` | Same as `FLY_API_URL` |
| `DATABASE_URL`, `DIRECT_URL` | Neon strings for this app’s database |
| `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` | From Neon Auth; secret **identical** to Fly |
| Supabase, MSG91, etc. | As in [.env.example](../.env.example) / [PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md) |

Redeploy after saving (Deployments → … → Redeploy), or push a commit so a new build runs. Production builds **require** `API_UPSTREAM_URL` or `next build` fails.

## 3. Fly — secrets aligned with Vercel

From the repo root:

```bash
fly secrets set --config fly.api.toml \
  NEXT_PUBLIC_APP_URL="VERCEL_APP_URL" \
  NEON_AUTH_BASE_URL="..." \
  NEON_AUTH_COOKIE_SECRET="..." \
  DATABASE_URL="..." \
  DIRECT_URL="..." \
  # … remaining secrets same as DEPLOY.md
```

`NEXT_PUBLIC_APP_URL` must match **`VERCEL_APP_URL`** so links in server-side notifications point at the real site.

Then:

```bash
fly deploy --config fly.api.toml
```

## 4. Database — migrations

If this is a new environment, apply schema from your machine (with `DATABASE_URL` / `DIRECT_URL` pointing at the same Neon branch):

```bash
npx --yes prisma@5.22.0 migrate deploy
```

## 5. First accounts and roles

1. Open **`VERCEL_APP_URL`** in the browser.
2. Go to **Sign up** and create the first user (defaults to **health worker** in the app database after sign-in / sign-up).
3. **Register patient** and **ECG upload** require an active session on that same origin — sign in first if you see “Please sign in as a health worker”.
4. To grant **cardiologist** or **admin** dashboard access, promote the user in Postgres (table `users`, column `role` is an enum). Example by email (adjust email and role):

```sql
UPDATE "users"
SET role = 'CARDIOLOGIST'
WHERE email = 'you@example.com';
```

Valid roles: `HEALTH_WORKER`, `CARDIOLOGIST`, `ADMIN`.

## 6. Smoke test on production

Follow [PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md) → **Post-deploy smoke tests** using **`VERCEL_APP_URL`** only (not the Fly URL in the address bar — cookies must stay on the Vercel host).

Quick checks:

- **`VERCEL_APP_URL/health`** — if you expose Fly health separately, optional; main app is Vercel.
- Sign-in persists when navigating between `/`, `/register`, `/ecg-upload`.
- **`GET /api/patients`** from the browser only works when signed in (same origin rewrite to Fly).

## 7. Custom domain (optional)

If you add a domain in Vercel (e.g. `https://app.hridlink.org`):

1. Set **`NEXT_PUBLIC_APP_URL`** to that canonical URL (Production).
2. Add the same URL in **Neon Auth** allowed origins.
3. Update Fly **`NEXT_PUBLIC_APP_URL`** to match and redeploy Fly.

Preview deployments (`*.vercel.app` per branch) need their own Neon Auth allowlist entries if you test auth on previews; otherwise use **Production** only for demos.

## Related

- [DEPLOY.md](../DEPLOY.md) — Fly launch, full secret list, local stack.
- [PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md) — variable tables and detailed smoke steps.
