# Role deep dive - Cardiologist (reviewer)

Post-demo expansion roadmap for the specialist who reads ECGs and submits findings. First demo only needs the existing single-queue flow.

## Today (shipped)

- Pending queue (shared, newest-first) - [app/(protected)/cardiologist/page.tsx](<../app/(protected)/cardiologist/page.tsx>), `GET /api/ecg?status=PENDING`.
- Signed-URL zoom viewer - `GET /api/ecg/:id/signed-file-url` in [api-fly/src/index.ts](../api-fly/src/index.ts).
- Submit finding: severity + clinical notes + recommendation; reviewer attributed - `PATCH /api/ecg/:id/finding`, write-once (409 if exists).
- WhatsApp/email back to the uploading health worker.

## Pain points the code reveals

- Shared queue: two cardiologists can open the same case (no claim/lock).
- Zero prior context: reviews one image with no patient history.
- Findings are free-text only and write-once (no addendum/correction).
- Queue ordered purely by `createdAt` - no urgent-first or wait-time prioritization.
- No way to ask the health worker for a better image or more context.

## Expansion features

### CARD-1 Claim / lock + assignment (high)
- `claimedById` / `claimedAt` on `ECGRecord`; `POST /api/ecg/:id/claim` + `/release`. "Dr. X reviewing" in the queue. Prereq for any multi-reviewer pilot. (Mirrors p1-claim in the main roadmap.)

### CARD-2 Patient history context (high)
- Prior ECGs + findings for the same patient on the review screen - `GET /api/patients/:id/ecgs`. Massively improves read quality.

### CARD-3 Structured finding fields (high, data moat)
- Heart rate, rhythm select, abnormality multi-select alongside free-text. Builds the labeled corpus the YC narrative promises.

### CARD-4 Smart queue ordering (medium)
- Sort by oldest-pending / overdue-first / suspected-urgent; show wait-time and SLA badges per case. Pairs with the SLA work (p1-sla).

### CARD-5 Finding addendum / correction (medium)
- Append-only `FindingAddendum` so corrections never overwrite the audit trail.

### CARD-6 Request better image / more info (medium)
- "Request re-upload" action that notifies the health worker with a reason; case stays pending with a flagged state.

### CARD-7 Quick templates / macros (low)
- Reusable recommendation snippets (e.g., "refer to district hospital today") to cut review time.

### CARD-8 Reviewer productivity view (low)
- Personal stats: cases reviewed, median read time, severity mix - reinforces accountability.

## Suggested order
CARD-1 -> CARD-2 -> CARD-3 -> CARD-4 -> CARD-5 -> CARD-6 -> CARD-7 -> CARD-8
