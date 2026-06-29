# YC application narrative — HridLink

Use this as the source of truth for YC form answers, demo script, and investor one-pagers.

## One-liner

**HridLink helps rural health workers get cardiologist-reviewed ECG findings in minutes, with WhatsApp delivery and an audit trail for every case.**

## Problem

Rural India captures millions of ECGs far from cardiologists. Today the handoff is broken: photos over WhatsApp, lost threads, no response-time accountability, and no structured readback for ASHA/ANM workers who started the case.

Delayed cardiac decisions kill. The bottleneck is not capture — it is **routing, review, and closure**.

## Solution

HridLink is the operating system for rural ECG triage:

1. **Capture** — Health worker registers patient and uploads ECG photo/PDF from the field (PWA-friendly).
2. **Route** — Cardiologist gets WhatsApp + queue alert; pending-first dashboard with zoom viewer.
3. **Review** — Structured finding: severity, clinical notes, recommendation; reviewer attribution stored.
4. **Close the loop** — Health worker gets WhatsApp + **My ECGs** in-app readback with full notes.
5. **Measure** — Admin dashboard: median response time, completion rate, severity mix, CSV export for district reporting.

## Why now

- Smartphone penetration + WhatsApp ubiquity in rural health workflows  
- Neon/Vercel/Fly stack makes PHI-aware pilots cheap to run  
- Every reviewed ECG creates labeled workflow data for future triage automation  

## Traction to show YC (30-day sprint targets)

| Signal | Target |
|--------|--------|
| Health workers actively uploading | 2–3 |
| Cardiologists reviewing | 1–3 |
| ECGs through full loop | 30–100 |
| Median upload → finding time | Visible on admin dashboard; aim < 60 min |
| User quotes | 3–5 specific quotes (see PILOT-OPERATING-LOG.md) |

## Business model (wedge first)

**Phase 1 — Pilot:** Per-clinic or per-district SaaS for ECG triage workflow + reporting.  
**Phase 2 — Network:** Cardiologist marketplace / on-call routing across regions.  
**Phase 3 — Data moat:** Triage suggestions and QA from labeled ECG + finding corpus.

Do **not** lead with AI diagnosis in the YC application until you have volume. Lead with workflow + speed + audit trail.

## Moat

- **Workflow lock-in:** Health workers and cardiologists co-trained on one loop  
- **Labeled data:** Every case = ECG image + severity + notes + recommendation + response time  
- **India-specific:** +91 phones, village/district fields, WhatsApp-native alerts, DPDP-aware pilot design  

## Competition

| Alternative | Weakness |
|-------------|----------|
| Raw WhatsApp | No queue, no audit, no metrics |
| Hospital EMR | Too heavy for PHC / field workers |
| Consumer telehealth | Not built for ECG triage + rural async workflow |

## Team / founder-market fit

Emphasize: India rural health exposure, ability to run concierge pilots on the ground, and full-stack ownership of the loop (this repo: Next.js + Fly + Neon + MSG91).

## Demo script (3 minutes)

1. **30s — Problem:** Village ECG, cardiologist hours away, WhatsApp chaos.  
2. **60s — Worker flow:** Sign up → register patient → upload ECG (show progress bar).  
3. **60s — Cardiologist:** Queue → zoom viewer → URGENT finding → reviewer name saved.  
4. **30s — Closure:** My ECGs shows full finding; admin shows median response + CSV export.

## What we are not (yet)

- Not a general EMR or hospital management suite  
- Not AI-first diagnosis without labeled volume  
- Not multi-specialty telemedicine  

## Application answers (draft)

**What is your company going to make?**  
Software that turns a rural ECG photo into a cardiologist decision in minutes — with WhatsApp alerts, in-app readback for health workers, and pilot metrics for district health offices.

**How do you know people need this?**  
[Insert pilot quotes and case counts from PILOT-OPERATING-LOG.md]

**Who are your competitors?**  
WhatsApp groups and legacy EMRs — neither gives structured triage, response-time SLAs, or health-worker closure.

**How will you make money?**  
B2B SaaS per clinic/district for the triage workflow; later routing fees and analytics.

## Links

- Live app: `{NEXT_PUBLIC_APP_URL}`  
- Demo guide: `/demo`  
- Pilot log template: [PILOT-OPERATING-LOG.md](./PILOT-OPERATING-LOG.md)  
- WhatsApp setup: [MSG91-WHATSAPP-SETUP.md](./MSG91-WHATSAPP-SETUP.md)  
