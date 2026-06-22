# Production checklist — HridLink

Use this after wiring Vercel and Fly per [DEPLOY.md](../DEPLOY.md). For a step-by-step “go live on `https://…`” playbook (Neon Auth allowlist, `NEXT_PUBLIC_APP_URL`, first accounts), see [DEPLOYED-URL-ONBOARDING.md](./DEPLOYED-URL-ONBOARDING.md).

## Vercel environment variables

| Variable | Notes |
|----------|--------|
| `API_UPSTREAM_URL` | **Required** for production builds. Fly app origin **without** a trailing slash (e.g. `https://hridlink-api.fly.dev`). Build fails if unset. |
| `DATABASE_URL` | Neon pooled connection string. Used by Next (e.g. layouts / Prisma role checks). Must match the DB the API uses. |
| `DIRECT_URL` | Neon direct connection string (migrations / non-pooled). Same branch as `DATABASE_URL`. |
| `NEON_AUTH_BASE_URL` | From Neon Auth configuration. Must match Fly so session validation works when cookies are forwarded. |
| `NEON_AUTH_COOKIE_SECRET` | Long secret (32+ characters). **Must be identical** on Vercel and Fly. |
| `NEXT_PUBLIC_APP_URL` | Public site URL (e.g. `https://your-app.vercel.app`), no trailing slash issues handled in app code where relevant. |
| `MSG91_AUTH_KEY` | MSG91 API auth. |
| `MSG91_CARDIOLOGIST_PHONE` | E.164, e.g. `+91...`. |
| `MSG91_TEMPLATE_ID_CARDIOLOGIST` | WhatsApp template for new ECG alerts. |
| `MSG91_TEMPLATE_ID_HEALTH_WORKER` | WhatsApp template for review notifications. |

`/api/auth/*` stays on Vercel only. Data paths (`/api/patients`, `/api/ecg`, etc.) are rewritten to Fly in production.

## Fly.io secrets (`fly secrets set --config fly.api.toml`)

Set the same logical stack the app expects in production (values must align with Vercel where shared):

| Secret | Notes |
|--------|--------|
| `DATABASE_URL` | Same Neon pooled URL as Vercel. |
| `DIRECT_URL` | Same Neon direct URL (Prisma / migrations from dev or CI also use this). |
| `NEON_AUTH_BASE_URL` | Same as Vercel. |
| `NEON_AUTH_COOKIE_SECRET` | Same as Vercel (cookie sessions must verify on the API). |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token (ECG file storage). Create store in Vercel → Storage → Blob. |
| `MSG91_AUTH_KEY` | Same as Vercel. |
| `MSG91_CARDIOLOGIST_PHONE` | Same as Vercel. |
| `MSG91_TEMPLATE_ID_CARDIOLOGIST` | Same as Vercel. |
| `MSG91_TEMPLATE_ID_HEALTH_WORKER` | Same as Vercel. |
| `NEXT_PUBLIC_APP_URL` | Same canonical app URL as Vercel (links in notifications). |

After changing secrets, redeploy the Fly app if needed so new machines pick them up.

## Post-deploy smoke tests

Run these against the **production** Vercel URL (cookies are host-scoped).

1. **Sign in** — Complete Neon Auth sign-in as a health worker (and separately as cardiologist / admin if you have test accounts). Confirm session persists across navigation.
2. **Register patient** — Create a patient with realistic credentials (name, demographics, phone, etc.) and confirm success (no 401 on `/api/patients`).
3. **Upload ECG** — Attach file, associate with patient, submit; confirm record appears and storage URL is valid.
4. **Cardiologist dashboard** — Sign in as cardiologist; open dashboard, list pending ECGs, open an ECG, submit a finding; confirm status updates.
5. **Admin** — Sign in as admin; open admin stats / tables and confirm aggregates load.

If any step returns **401 Unauthorized**, confirm the user completed sign-in on the same origin and that Neon Auth + cookie secret match across Vercel and Fly.

## API authentication note

**Patient and ECG HTTP APIs require auth cookies.** Health workers (and other roles) must **sign in first** in the browser before calling same-origin `/api/patients`, `/api/ecg`, or related routes; unauthenticated requests are rejected. Plan demos, scripts, and training materials accordingly.
