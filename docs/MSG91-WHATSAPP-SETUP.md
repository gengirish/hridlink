# MSG91 WhatsApp setup — HridLink

HridLink sends WhatsApp alerts when an ECG is uploaded (to the cardiologist) and when a finding is submitted (to the health worker). Without MSG91 secrets, notifications are silently skipped — the API still succeeds.

## Required environment variables

Set on **Fly.io** (and optionally Vercel if you mirror them for docs):

| Variable | Example | Purpose |
|----------|---------|---------|
| `MSG91_AUTH_KEY` | From MSG91 dashboard | API authentication |
| `MSG91_CARDIOLOGIST_PHONE` | `919876543210` | Integrated WhatsApp sender number (no `+`) |
| `MSG91_TEMPLATE_ID_CARDIOLOGIST` | Template name in MSG91 | New ECG alert to cardiologist |
| `MSG91_TEMPLATE_ID_HEALTH_WORKER` | Template name in MSG91 | Finding ready alert to health worker |

Also set `NOTIFY_CARDIOLOGIST_EMAIL` on Fly for email fallback when WhatsApp is down.

## Template body parameters

### Cardiologist (on ECG upload)

Parameters sent in order:

1. Patient name  
2. Patient age  
3. Village  
4. Dashboard link (`{APP_URL}/cardiologist`)

Example approved template text:

> New ECG for {{1}}, age {{2}}, from {{3}}. Review: {{4}}

### Health worker (on finding submit)

Parameters sent in order:

1. Patient name  
2. Severity (`NORMAL` / `WATCH` / `URGENT`)  
3. Recommendation (short action text)

Example approved template text:

> Finding for {{1}}: {{2}}. {{3}}. Open HridLink for full notes.

Clinical notes are included in the **email** copy and on **My ECGs** in-app — WhatsApp templates stay within MSG91 character limits.

## Fly secrets (production)

```bash
fly secrets set \
  MSG91_AUTH_KEY="your-key" \
  MSG91_CARDIOLOGIST_PHONE="919876543210" \
  MSG91_TEMPLATE_ID_CARDIOLOGIST="hridlink_new_ecg" \
  MSG91_TEMPLATE_ID_HEALTH_WORKER="hridlink_finding_ready" \
  --config fly.api.toml
```

Redeploy after setting secrets:

```bash
fly deploy --config fly.api.toml
```

## Smoke test

1. Sign up as health worker with a real mobile number.  
2. Register a patient and upload an ECG.  
3. Confirm cardiologist WhatsApp (or email fallback).  
4. Submit a finding as cardiologist.  
5. Confirm health worker WhatsApp and `/my-ecgs` shows full finding.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| No WhatsApp at all | `MSG91_AUTH_KEY` empty → see Fly logs `[notify] MSG91_AUTH_KEY not set` |
| Cardiologist never pinged | `MSG91_CARDIOLOGIST_PHONE` and template name match MSG91 dashboard |
| Health worker never pinged | User has phone on sign-up; check `users.phone` in DB |
| Template rejected | Parameter count/order must match approved template exactly |
