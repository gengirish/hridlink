# HridLink — System Status & Deep-Dive Analysis

_Generated: 29 June 2026_

---

## Architecture at a Glance

```
Browser
  └── Vercel (Next.js 14 App Router)
        ├── Neon Auth  (/api/auth/*)
        ├── Next.js middleware  (auth gate + X-Internal-Secret injection)
        └── Next rewrites  (/api/patients, /api/ecg, /api/admin → Fly.io)
                └── Fly.io Express API  (hridlink-api.fly.dev)
                      ├── Neon PostgreSQL  (Prisma)
                      └── Vercel Blob  (ECG files)
```

---

## ✅ What Is Working

### Authentication (Neon Auth)
- Email/password sign-in and sign-up flow is fully wired using Neon Auth server SDK.
- Session cookies forwarded correctly from Vercel → Next middleware → Fly (`X-Internal-Secret` + cookie).
- `lib/auth/sync-app-user.ts` — on sign-in, Prisma `User` row is created **or** linked to a pre-seeded row (enables role claim via email, e.g. `dr.cardiac@hridlink.com`).
- `ensureAppUserForNeonUser` on the Fly side handles users who arrive via direct API calls without going through the Next.js sign-in flow.
- Session in-process cache on Fly (`sessionCache`, 5-min TTL) avoids repeated DB lookups per request.
- BOM / zero-width space cleanup in `normalizeAuthEnvString` — robust to copy-paste artefacts in Vercel/Fly env vars.
- Layout/page-level RBAC: `/cardiologist` requires `CARDIOLOGIST`, `/admin` requires `ADMIN`. Unauthenticated users are redirected to `/sign-in`; authenticated users with the wrong role now render a graceful `RoleGate` "Access restricted" screen (`components/role-gate.tsx`) instead of a silent redirect to `/`.

### Middleware
- Auth gate (Neon Auth) for `AUTH_PROTECTED` page routes: `/admin`, `/cardiologist`, `/register`, `/ecg-upload`, `/my-ecgs`, plus the `/api/ecg`, `/api/admin` API routes.
- `X-Internal-Secret` injection for all Fly-proxied paths: `/api/patients`, `/api/patients/:path*`, `/api/ecg`, `/api/ecg/:path*`, `/api/admin/:path*`.
- Both bare paths (e.g. `POST /api/patients`) and sub-paths are covered after the recent matcher fix.

### Patient Registration (`/register`)
- Form validated client-side with Zod + `react-hook-form`.
- Phone normalised to `+91XXXXXXXXXX` E.164 before submission.
- Duplicate phone returns `409` from Fly and shows a toast.
- Success shows inline confirmation + "Upload ECG" shortcut.

### ECG Upload (`/ecg-upload`)
- Step 1: phone lookup → resolves `patientId`.
- Step 2: file picker (image/PDF), optional notes → `multipart/form-data` POST to Fly.
- Fly stores file in Vercel Blob (private), creates `ECGRecord`, fires cardiologist WhatsApp + optional AgentMail email.
- Submit button correctly disabled until both patient and file are selected.
- 25 MB file-size cap enforced in multer.

### Cardiologist Queue (`/cardiologist`)
- SSR pre-fetch via `serverFetchJson` — first paint shows data without a client waterfall.
- Client 30s auto-refresh on PENDING filter, paused when tab is hidden (`visibilitychange`), resumed with an immediate reload when tab returns.
- Per-ECG signed URL fetched lazily on modal open (`GET /api/ecg/:id/signed-file-url`) — avoids N Blob presign calls on every list load.
- Signed URL results cached in-process on Fly (55-min TTL, refreshed before 3600s expiry).
- Finding submission: severity + clinical notes + recommendation sent as PATCH; ECG status updated to `REVIEWED` or `URGENT`; health worker notified via WhatsApp + AgentMail if their email is on record.
- Modal prevents submitting a finding if one already exists (shows "Already reviewed" state).

### Admin Dashboard (`/admin`)
- SSR pre-fetch passes `initialStats` to `AdminDashboard` client component — no loading spinner on first load.
- Stats use a single `groupBy` query for severity counts (was 3 separate `count` calls — now optimised).
- CSV export works client-side (BOM-prefixed for Excel compatibility, `en-IN` locale timestamps).

### API Layer (Fly.io)
- `X-Internal-Secret` check on all non-`/health` routes — unauthenticated requests from the public internet return `403`.
- Prisma `$transaction` for atomic list + count queries.
- `GET /api/ecg/:id/signed-file-url` — dedicated endpoint for lazy signing with cache.
- `PATCH /api/ecg/:id/finding` — guards against duplicate findings (`409`), updates ECG status, sends notifications (non-fatal errors logged but don't fail the request).
- `AbortSignal.timeout(10_000)` on all MSG91 fetch calls — prevents hangs.
- `AbortSignal.timeout(8000)` on `get-session` Neon call.

### Notifications
- MSG91 WhatsApp: gracefully skipped when `MSG91_AUTH_KEY` is empty (logs a warning).
- AgentMail email: gracefully skipped when `AGENTMAIL_API_KEY` is absent; auto-creates inbox on first use.
- Both channels are **non-fatal** — API request succeeds even if notifications fail.

### Data Model
- All core relations present: `User → ECGRecord (uploadedBy)`, `Patient → ECGRecord`, `ECGRecord → Finding` (1-to-1).
- Compound index on `[status, createdAt]` supports efficient PENDING-first pagination.
- `onDelete: Cascade` on Finding → ECGRecord and ECGRecord → Patient.
- `storagePath` nullable on `ECGRecord` — back-compat with seed rows and legacy path-only records.

### PWA
- Service worker generated and registered in production via `@ducanh2912/next-pwa`.
- Disabled in development.
- Web app manifest served at `/manifest.webmanifest` (verified by E2E test).

### E2E Tests
- 11 test files covering: home, navigation, public routes, auth pages, protected route redirects, ECG upload (8 scenarios including mocked API), register, demo, manifest, and sign-in/up HTML validation.
- All public-page tests and route-redirect tests run without a real database (mocked API routes).
- `PLAYWRIGHT_SKIP_WEB_SERVER` supported for CI.

### Demo Guide (`/demo`)
- Static page explains the 3-role flow (health worker, cardiologist, admin).
- Email → role mapping documented clearly for onboarding.

### Deployment
- Fly deploys from `fly.api.toml` (Singapore region, 512 MB RAM).
- Auto-stop/auto-start machines configured (cost-efficient for pilot).
- Vercel production rewrite table covers all data paths.
- Both `npm run build` in `api-fly` and root Next.js build pass cleanly (`tsc --noEmit` clean on both).

---

## ❌ What Is Not Working / Broken / Gaps

### 1. WhatsApp Notifications — Not Configured in Production
**Severity: High**

`.env.local` has `MSG91_AUTH_KEY=` (empty), and the Fly secrets set during deploy don't include these values in the repo. No WhatsApp message is sent after ECG upload or finding submission. The pilot's primary real-time alert channel is silently no-oping.

**What needs to happen:** Set `MSG91_AUTH_KEY`, `MSG91_CARDIOLOGIST_PHONE`, `MSG91_TEMPLATE_ID_CARDIOLOGIST`, and `MSG91_TEMPLATE_ID_HEALTH_WORKER` as Fly secrets. WhatsApp templates must be pre-approved in MSG91.

---

### 2. Role-Upgrade UI — RESOLVED (with caveats)
**Severity: Resolved**

The admin dashboard now has a **Team** tab (`app/(protected)/admin/admin-dashboard.tsx`) that lists all users (name, email, phone, role, joined date) with a role `<select>` per row. Changing it calls `PATCH /api/admin/users/:id/role`, which validates the new role against the `UserRole` enum, updates the Prisma `User`, and is admin-gated on the Fly side. Health workers can now be promoted to cardiologist or admin from the UI — no Prisma Studio / SQL required.

**Stale-role caveat is fixed:** the Fly role handler calls `invalidateSessionCacheByAuthUserId(user.authUserId)` immediately after the update, so the new role takes effect on the user's very next API request rather than after the ~5-minute session-cache TTL. (Note: this in-process cache is per-machine — in a multi-machine Fly deployment other machines would still honor their own TTL. Acceptable for the single auto-start-machine pilot.)

**Remaining gaps:**
- There is no guard against demoting the **last admin** or against an admin **demoting themselves** — an admin could lock everyone (or themselves) out of the admin panel.
- No confirmation step on role change.

---

### 3. Health Worker Phone at Sign-Up — RESOLVED (for the sign-up path)
**Severity: Low**

The sign-up form (`app/sign-up/sign-up-form.tsx`) now collects a mobile number, and `app/sign-up/actions.ts` **requires** it: the action rejects an empty value ("Mobile number is required for WhatsApp finding alerts."), normalizes it to E.164 (`+91XXXXXXXXXX`) via `normalizeIndianPhone`, validates `^\+91[6-9]\d{9}$`, and stores it on the Prisma `User.phone` after sign-up. So any health worker who registers through the form will have a phone on record for WhatsApp finding notifications.

**Remaining gap:** phone is only collected on the Next.js sign-up form path. Users provisioned by other routes — the Fly-side `ensureAppUserForNeonUser`, or pre-seeded role rows claimed by email in `syncAppUserFromSession` — are created without a phone and have no in-app UI to add one later. For those accounts, `sendToHealthWorker` still hits `ecgRecord.uploadedBy?.phone == null` and logs:

```
[notify] ECG {id} has no uploadedBy phone — health worker not notified
```

---

### 4. `register` and `ecg-upload` Auth Gate — RESOLVED
**Severity: Resolved**

`/register`, `/ecg-upload` (and `/my-ecgs`) are now in the `AUTH_PROTECTED` list in `middleware.ts` and are covered by the middleware `matcher`. Unauthenticated users hitting these pages are redirected to `/sign-in` (via `auth.middleware({ loginUrl: "/sign-in" })`) on page load, instead of filling the whole form and only failing at submission time.

**Note:** the route files still live under `app/(public)/`, so that folder name is now a misnomer — these pages are no longer public.

---

### 5. Seed ECGRecords Use Public URLs (Not Blob `storagePath`)
**Severity: Low-Medium**

`prisma/seed.ts` creates ECG records with `fileUrl` pointing to `${APP_URL}/samples/ecg-sample.svg` and no `storagePath`. The `getCachedEcgListFileUrl` function handles this via the `__unsigned_as_is__` path, so the list still works. However:
- `GET /api/ecg/:id/signed-file-url` returns the raw public SVG URL for seed records.
- The `/cardiologist` modal fetches this endpoint — it will render the sample SVG, which is fine for demo but does not exercise the signing path.
- If the sample SVG path is not present in `public/samples/`, the modal shows a broken image.

**Action:** Verify `public/samples/ecg-sample.svg` exists; add it if missing.

---

### 6. `ECGRecord.fileUrl` Is a `storagePath` Placeholder Post-Upload
**Severity: Low-Medium**

In `POST /api/ecg`:
```ts
fileUrl: storagePath, // placeholder; signed URLs generated on read
```
`fileUrl` is set to the Blob pathname (e.g. `clhpatientid/1719000000000.jpg`), not a real URL. This is intentional (signing on read), but it means any consumer that reads `fileUrl` directly — including old rows, direct DB queries, or future integrations — will get a non-URL string. The column name `fileUrl` is misleading.

---

### 7. Admin Stats Endpoint Is Not Cached — Hits DB on Every Visit
**Severity: Low**

`GET /api/admin/stats?limit=200` runs four Prisma queries on every page load. The SSR pre-fetch means this also fires on every server render of `/admin`. There is no short-term cache (e.g. 30-second Redis or in-process TTL). For a pilot with low data volumes this is acceptable, but it will degrade with growth.

---

### 8. No Pagination UI in Cardiologist Queue or Admin Table
**Severity: Low**

- Cardiologist queue: hardcoded `limit=50`. If there are >50 pending ECGs, the overflow is silently truncated.
- Admin table: hardcoded `limit=200`. There is no "load more" or pager.

Both are acceptable for early pilot, but need attention before scaling.

---

### 9. ECG Upload Page — No Progress Indicator for Large Files
**Severity: Low**

The upload uses a plain `fetch()` POST. Large files (photos up to 25 MB) show only "Uploading…" on the button with no progress bar or estimated time. On mobile networks in rural areas this can feel like a hang.

---

### 10. `app/sign-up` — No Sign-Up Flow for Cardiologist Validation
**Severity: Low**

The demo relies on signing up with a specific email to claim a role. There is no email domain restriction, invite code, or validation. Anyone can claim `dr.cardiac@hridlink.com` if the seeded user has not yet signed up. After first claim the `authUserId` is linked, so subsequent attempts are rejected by the unique constraint — but there is no explicit guard or messaging.

---

### 11. `lib/server-data.ts` — Relies on `x-forwarded-host` / `host` Header
**Severity: Low**

`serverFetchJson` builds the base URL from `x-forwarded-host` or `host`. On Vercel this works. In local `dev:stack` (running both Next.js and Fly separately) this will call `http://localhost:3000/api/…`, which will not proxy to Fly because the rewrite is skipped when `API_UPSTREAM_URL` is unset. **Admin and cardiologist pages show empty data locally unless `dev:stack` is running and `API_UPSTREAM_URL` is set.**

---

### 12. Missing E2E Coverage for Protected Workflows
**Severity: Low**

All E2E tests that touch `/register`, `/ecg-upload`, and `/cardiologist` mock the API. There are no integration-level tests that:
- Sign in with test credentials and register a real patient.
- Upload a real ECG file end-to-end.
- Submit a finding as a cardiologist.

This means E2E catches UI regressions but not API contract breaks.

---

## Environment Variable Checklist

| Variable | Vercel | Fly | Status |
|---|---|---|---|
| `NEON_AUTH_BASE_URL` | ✅ required | ✅ required | Set both |
| `NEON_AUTH_COOKIE_SECRET` | ✅ required | ✅ required | Set both |
| `DATABASE_URL` | ✅ required | ✅ required | Set both |
| `DIRECT_URL` | ✅ (layouts) | ✅ | Set both |
| `API_UPSTREAM_URL` | ✅ production | N/A | Must be Fly URL |
| `INTERNAL_API_SECRET` | ✅ required | ✅ required | Must match |
| `BLOB_READ_WRITE_TOKEN` | N/A | ✅ required | Fly only — Vercel Blob ECG storage |
| `MSG91_AUTH_KEY` | N/A | ⚠️ empty | **Not set** |
| `MSG91_CARDIOLOGIST_PHONE` | N/A | ⚠️ empty | **Not set** |
| `MSG91_TEMPLATE_ID_CARDIOLOGIST` | N/A | ⚠️ empty | **Not set** |
| `MSG91_TEMPLATE_ID_HEALTH_WORKER` | N/A | ⚠️ empty | **Not set** |
| `NEXT_PUBLIC_APP_URL` | ✅ | ✅ | Set both |
| `AGENTMAIL_API_KEY` | N/A | ✅ | Set on Fly |
| `NOTIFY_CARDIOLOGIST_EMAIL` | N/A | ✅ optional | Set on Fly |

---

## Legacy Supabase ECG files

ECG rows uploaded before this migration store a pathname in `storagePath` (e.g. `patientId/1719000000000.jpg`). Those files still live in Supabase until you copy them into your Vercel Blob store at the **same pathname**, or users re-upload. Seed/demo rows that use a public `fileUrl` (sample SVG) are unchanged.

---

## Priority Fix List

| # | Issue | Effort |
|---|---|---|
| 1 | Set MSG91 secrets on Fly — WhatsApp alerts broken | 15 min |
| 2 | Add favicon/PWA app icons (currently 404 — `/icon-192x192.png`, `/icon-512x512.png`, `/apple-touch-icon.png` referenced in `layout.tsx`/`manifest.ts` but absent from `public/`) | 30 min |
| 3 | Guard role PATCH against demoting the last admin / self-demotion | 1 h |
| 4 | Add pagination UI (cardiologist queue `limit=50`, admin table `limit=200`) | 2–3 h |
| 5 | Add upload progress indicator for ECG files | 1 h |
| 6 | Add a UI path for users without a phone (other than the sign-up form) to add one | 1–2 h |
