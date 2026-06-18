---
name: zod-validators
description: >-
  Zod validation for HridLink — patient/ECG/finding schemas, Indian mobile
  (+91), Aadhaar last-4, and shared types. Use when adding API bodies, forms
  with react-hook-form, or Express route validation on Fly.
---

# Zod — HridLink

Package: `zod` (v3). Prefer **one source of truth** for shapes shared between Next and Fly.

## Where schemas live

- **Next app:** `lib/validators.ts` — used by client forms (`zodResolver`) and any server-side checks.
- **Fly API:** `api-fly/src/lib/validators.ts` — parse `req.body` at route entry with `.safeParse()`.

When you change a field (e.g. `submitFindingSchema`), update **both** files or extract a shared package later if duplication becomes painful.

## Domain schemas (reference)

- **Patient:** `fullName`, `age`, `gender`, `village`, `district`, `aadhaarLast4` (exactly 4 digits), `phone` as E.164 Indian mobile `^\+91[6-9]\d{9}$`.
- **ECG create:** `patientId` (cuid), `fileUrl` (URL), optional `healthWorkerNotes`.
- **Cardiologist finding:** `severity` enum, `clinicalNotes`, `recommendation` with min/max lengths.

Export inferred types alongside schemas:

```typescript
export type SubmitFindingInput = z.infer<typeof submitFindingSchema>;
```

## Patterns

- At HTTP boundaries: `schema.safeParse(body)` — return `422` with the first issue message on failure (see Fly handlers).
- In React Hook Form: `resolver: zodResolver(mySchema)` and keep default values aligned with optional fields.
- Do not widen regexes for phone/Aadhaar without product sign-off — they encode program rules.

## API response shape (Fly / Next consumers)

Many routes return `{ success, data?, error? }`. When adding new endpoints, keep error payloads consistent with existing `ApiResponse` usage in the app.
