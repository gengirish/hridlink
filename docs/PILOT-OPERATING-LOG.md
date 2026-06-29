# Pilot operating log — HridLink

Use this spreadsheet-style log during a concierge pilot. One row per ECG case. Export admin CSV weekly and merge with this log for YC / investor evidence.

## Case log columns

| Column | What to record |
|--------|----------------|
| `case_id` | ECG record ID from admin export |
| `date` | Upload date (IST) |
| `health_worker` | Name + phone |
| `location` | Village / district / clinic |
| `patient` | First name + age (no full PHI in shared decks) |
| `upload_time` | Timestamp |
| `review_time` | Finding submitted timestamp |
| `response_minutes` | review_time − upload_time |
| `severity` | NORMAL / WATCH / URGENT |
| `whatsapp_worker` | Y / N — did health worker get WhatsApp? |
| `in_app_readback` | Y / N — did they open My ECGs? |
| `clinical_action` | What happened next (referral, meds, follow-up) |
| `quote` | One sentence from health worker or cardiologist |
| `blocker` | Anything that failed (network, template, role, etc.) |

## Weekly pilot summary (fill every Friday)

| Metric | Target (30-day sprint) | This week |
|--------|------------------------|-----------|
| Active health workers | 2–3 | |
| Active cardiologists | 1–3 | |
| ECGs uploaded | 30–100 total | |
| Median response time | < 60 min | From admin dashboard |
| Completion rate | > 80% | From admin dashboard |
| Urgent cases | track count | From admin dashboard |
| WhatsApp delivery rate | > 90% | Manual spot-check |

## User quote bank

Collect 3–5 quotes before applying to YC:

1. **Health worker pain (before):**  
   _"Before HridLink, we …"_

2. **Health worker outcome (after):**  
   _"Now we get findings in …"_

3. **Cardiologist trust:**  
   _"The queue / viewer / audit trail lets me …"_

4. **Admin / district ops:**  
   _"We can report response times and severity mix …"_

## Pilot onboarding checklist

- [ ] MSG91 secrets set per [MSG91-WHATSAPP-SETUP.md](./MSG91-WHATSAPP-SETUP.md)
- [ ] 2–3 health workers signed up with real mobile numbers
- [ ] Cardiologist promoted via Admin → Team (or seeded email)
- [ ] End-to-end smoke: register → upload → review → My ECGs
- [ ] Admin CSV exported with reviewer columns
- [ ] One-page consent blurb shown at patient registration (future: in-app)

## Sample row

```
case_id: clx…
date: 29 Jun 2026
health_worker: Lakshmi (+9198…)
location: Kothapally, Yadadri
patient: Ramanna, 58
upload_time: 09:14 IST
review_time: 09:41 IST
response_minutes: 27
severity: URGENT
whatsapp_worker: Y
in_app_readback: Y
clinical_action: Referred to district hospital same day
quote: "Got the urgent finding on WhatsApp before the patient left the PHC."
blocker: none
```
