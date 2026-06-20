# HridLink MVP — Cursor Scaffold Prompt

> **Implementation:** This codebase uses **Neon Auth** (sessions on Vercel) and a **Fly.io** data API reached via same-origin rewrites — not Clerk. For deployment wiring and environment variables see [DEPLOY.md](DEPLOY.md); for production verification steps see [docs/PRODUCTION-CHECKLIST.md](docs/PRODUCTION-CHECKLIST.md); for going live on your real Vercel URL (Neon Auth allowlist, `NEXT_PUBLIC_APP_URL`, first users) see [docs/DEPLOYED-URL-ONBOARDING.md](docs/DEPLOYED-URL-ONBOARDING.md).

> **Product:** HridLink — Rural Cardiac Telemedicine Pilot  
> **By:** IntelliForge Digital Services, Hyderabad  
> **Version:** v1.0 · 18/06/2026

---

## Cursor Prompt

```
You are building HridLink, a rural cardiac telemedicine pilot app for IntelliForge Digital Services.

## Stack
- Next.js 14 App Router
- Prisma + Supabase (PostgreSQL)
- Clerk authentication
- Tailwind CSS
- MSG91 for WhatsApp notifications
- TypeScript throughout
- Monorepo under @intelliforge/* conventions
- Money as integer paise, dates DD/MM/YYYY IST, phones E.164
- ApiResponse<T> envelope on all API routes
- Zod on all inputs
- No TODOs in output files

## What to build
A 4-screen MVP with the following flows:

### Screen 1 — Patient Registration
- Fields: full name, age, gender, village, district, Aadhaar last 4 digits, phone (E.164)
- Prisma model: Patient
- On submit: create patient record, return patient ID

### Screen 2 — ECG Upload
- Select existing patient by phone number search
- Upload ECG image or PDF (Supabase Storage bucket: ecg-uploads)
- Fields: upload file, notes from health worker (optional)
- Prisma model: ECGRecord (patientId, fileUrl, healthWorkerNotes, status: PENDING | REVIEWED | URGENT, createdAt)
- On submit: save record, trigger WhatsApp notification to cardiologist via MSG91
  with patient name, age, village and a link to the dashboard

### Screen 3 — Cardiologist Dashboard
- Protected route (Clerk role: CARDIOLOGIST)
- List all ECGRecords with status PENDING, sorted by createdAt desc
- Each row shows: patient name, age, village, upload time, link to view ECG file
- Click row → open ECG in modal/new tab + finding form
- Finding form fields: severity (NORMAL | WATCH | URGENT), clinical notes (textarea),
  recommendation (free text)
- On submit: update ECGRecord status, create Finding record, trigger WhatsApp to the
  health worker's registered phone with severity + recommendation in plain language

### Screen 4 — Admin Dashboard
- Protected route (Clerk role: ADMIN)
- Summary stats: total patients, total ECGs, breakdown by severity (NORMAL / WATCH / URGENT)
- Table of all ECGRecords with patient name, village, severity,
  response time (createdAt to finding createdAt in minutes)
- Export to CSV button

## Prisma Schema
Generate complete schema with these models:
- Patient
- ECGRecord
- Finding
- User (synced from Clerk, with role enum: HEALTH_WORKER | CARDIOLOGIST | ADMIN)

## API Routes (App Router)
- POST /api/patients              — create patient
- GET  /api/patients?phone=       — search patient by phone
- POST /api/ecg                   — create ECG record + trigger WhatsApp
- GET  /api/ecg                   — list ECGs (filtered by status for cardiologist)
- PATCH /api/ecg/[id]/finding     — submit finding + trigger WhatsApp
- GET  /api/admin/stats           — summary stats for admin dashboard

## Notifications
- Use MSG91 WhatsApp template API
- Two templates:
  1. TO_CARDIOLOGIST: "New ECG uploaded for {patient_name}, {age}y, {village}. Review: {dashboard_link}"
  2. TO_HEALTH_WORKER: "ECG reviewed for {patient_name}. Severity: {severity}. Recommendation: {recommendation}"
- Put notification logic in /lib/notify.ts with sendToCardiologist() and sendToHealthWorker() functions
- Cardiologist phone and dashboard URL from environment variables

## Environment Variables needed
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
MSG91_AUTH_KEY
MSG91_CARDIOLOGIST_PHONE
MSG91_TEMPLATE_ID_CARDIOLOGIST
MSG91_TEMPLATE_ID_HEALTH_WORKER
NEXT_PUBLIC_APP_URL

## File structure
app/
  (public)/
    register/page.tsx
    ecg-upload/page.tsx
  (protected)/
    cardiologist/page.tsx
    admin/page.tsx
  api/
    patients/route.ts
    ecg/route.ts
    ecg/[id]/finding/route.ts
    admin/stats/route.ts
lib/
  notify.ts
  prisma.ts
prisma/
  schema.prisma
  seed.ts

## Seed file
Create 2 test patients, 3 ECG records (1 PENDING, 1 WATCH, 1 URGENT),
1 cardiologist user, 1 admin user

## Conventions
- All API responses use ApiResponse<T> = { success: boolean; data?: T; error?: string }
- Zod schemas in /lib/validators.ts for all POST/PATCH inputs
- No any types
- No TODOs
- Tailwind only, no external UI library
- Mobile-first layout (health workers use phones in the field)
```

---

## Post-Scaffold Manual Steps

| Step | Action |
|------|--------|
| 1 | Create Supabase project → set `ecg-uploads` bucket to **public read** |
| 2 | Set up Clerk → create two roles: `CARDIOLOGIST` and `ADMIN` |
| 3 | Register two MSG91 WhatsApp templates (copy below) |
| 4 | Run `prisma migrate dev` then `prisma db seed` |
| 5 | Deploy to Vercel (web) — no worker needed for MVP |

---

## MSG91 WhatsApp Template Copy

**Template 1 — TO_CARDIOLOGIST**
```
New ECG uploaded for {{patient_name}}, {{age}}y, {{village}}.
Please review: {{dashboard_link}}
— HridLink
```

**Template 2 — TO_HEALTH_WORKER**
```
ECG reviewed for {{patient_name}}.
Severity: {{severity}}
Recommendation: {{recommendation}}
— HridLink Cardiologist
```

---

## Pilot Success Metrics to Track

1. **Response time** — ECG upload timestamp → cardiologist finding timestamp (target: under 2 hours)
2. **Severity rate** — % of ECGs flagged as WATCH or URGENT (baseline unknown, expect 15–25%)
3. **Referral follow-through** — % of URGENT cases where patient reaches a hospital (manual tracking for now)

---

## Budget Estimate

| Item | Cost |
|------|------|
| AliveCor Kardia device | ₹18,000 |
| Clerk (free tier) | ₹0 |
| Supabase (free tier) | ₹0 |
| MSG91 WhatsApp (50 pilots) | ~₹500 |
| Domain hridlink.com | ~₹800/yr |
| Dev time (1 dev, 2 weeks) | ₹40,000–60,000 |
| **Total** | **~₹60,000–80,000** |

---

*HridLink · IntelliForge Digital Services · Kondapur, Hyderabad · hridlink.com*  
*BuildwithAiGiri · gen.girish@gmail.com*
