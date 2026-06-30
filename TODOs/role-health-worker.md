# Role deep dive - Health Worker (ASHA / ANM / PHC staff)

Post-demo expansion roadmap for the field user who captures ECGs. The first demo only needs the existing loop; everything below is "Demo+1 and beyond."

## Today (shipped)

- Register patient (find-or-create by +91 phone) - [app/(public)/register/page.tsx](<../app/(public)/register/page.tsx>), `POST /api/patients`.
- Upload ECG: search patient by phone, attach image/PDF, optional notes - [app/(public)/ecg-upload/page.tsx](<../app/(public)/ecg-upload/page.tsx>), `POST /api/ecg`.
- My ECGs readback: status + finding with notes - [app/(protected)/my-ecgs/page.tsx](<../app/(protected)/my-ecgs/page.tsx>), `GET /api/ecg/mine`.
- WhatsApp finding alert via MSG91 - [api-fly/src/lib/notify.ts](../api-fly/src/lib/notify.ts).

## Pain points the code reveals

- Capture fails on poor rural connectivity (no offline queue, single XHR POST).
- One photo per ECG; a 12-lead strip is often multiple pages.
- No proof the worker saw/acted on the finding (tracked by hand in the pilot log).
- English-only UI for ASHA/ANM workers.
- No in-field guidance on whether the ECG photo is usable before upload.

## Expansion features

### HW-1 Offline-first capture (high)
- IndexedDB queue + service worker replay on reconnect (PWA already present via `@ducanh2912/next-pwa`).
- "Pending sync" chip per queued ECG; auto-retry with backoff. Directly serves the rural-connectivity premise.

### HW-2 Multi-image + capture quality hints (high)
- Attach multiple pages per ECG (pairs with `EcgAttachment` in the main roadmap).
- Client-side blur/glare/orientation check with a "retake" prompt before upload so cardiologists get usable strips.

### HW-3 Acknowledge / close-the-loop (high)
- "Mark as read / actioned" + free-text outcome (referred, meds, follow-up) on My ECGs -> `acknowledgedAt` + `clinicalAction` on `ECGRecord`.
- Turns the manually-tracked `in_app_readback` / `clinical_action` columns in [docs/PILOT-OPERATING-LOG.md](../docs/PILOT-OPERATING-LOG.md) into data.

### HW-4 Localization (medium)
- Hindi/Telugu first; locale switch persisted per user. Extract strings from register/upload/my-ecgs.

### HW-5 Urgent callback path (medium)
- On an URGENT finding, surface a one-tap "call cardiologist / referral hospital" action + the referral instructions inline.

### HW-6 Patient quick-reuse + recent patients (low)
- Recent-patients list and re-upload-for-same-patient to cut repeat phone lookups in busy camps.

### HW-7 Symptom checklist at capture (low, data moat)
- Structured presenting-symptom checkboxes (chest pain, breathlessness, syncope...) stored with the ECG; improves triage context and labels.

## Suggested order
HW-1 -> HW-3 -> HW-2 -> HW-4 -> HW-5 -> HW-7 -> HW-6
