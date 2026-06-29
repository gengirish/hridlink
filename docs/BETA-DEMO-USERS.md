# Beta demo users — HridLink

Pre-configured pilot accounts for demos and beta testers on **https://hridlink.vercel.app**.

## One-time setup (already run on production DB)

```bash
npm run db:seed-beta
```

This is **idempotent** — safe to re-run. It upserts users, demo patients, and sample ECGs without deleting existing data.

## Sign in credentials

| Role | Email | Password | After sign-up |
|------|-------|----------|---------------|
| Health worker | `hw@hridlink.com` | `HridLinkDemo2026!` | [My ECGs](https://hridlink.vercel.app/my-ecgs) |
| Cardiologist | `dr.cardiac@hridlink.com` | `HridLinkDemo2026!` | [Cardiologist queue](https://hridlink.vercel.app/cardiologist) |
| Admin | `admin@hridlink.com` | `HridLinkDemo2026!` | [Admin dashboard](https://hridlink.vercel.app/admin) |

### First visit

1. Open [Sign up](https://hridlink.vercel.app/sign-up) (not sign-in) for each account **once**.
2. Use the email and password above. Health worker sign-up requires mobile `9876543212`.
3. On sign-up, the app links your Neon Auth account to the pre-seeded role row.
4. Subsequent visits: use [Sign in](https://hridlink.vercel.app/sign-in).

If an email was already registered with a different password, use sign-in with that password or reset via Neon Auth.

## Demo patients (pre-loaded)

Use these phone numbers on **Upload ECG** to find patients instantly:

| Patient | Phone (10-digit) | Village |
|---------|------------------|---------|
| Ramanna Goud | `9876543210` | Kothapally |
| Sarojamma Reddy | `9876543211` | Bommalaramaram |

Seed data includes:
- 1 **pending** ECG (Ramanna — for cardiologist demo)
- 1 **reviewed** ECG with finding (Ramanna)
- 1 **urgent** ECG with finding (Sarojamma)

## 5-minute demo script

Use **three browser profiles** (or incognito windows):

1. **Health worker** (`hw@hridlink.com`): Register a new patient → upload ECG photo → open My ECGs.
2. **Cardiologist** (`dr.cardiac@hridlink.com`): Open queue → review pending case → submit URGENT finding.
3. **Health worker** (same session): Refresh My ECGs — finding appears with notes.
4. **Admin** (`admin@hridlink.com`): Check median response time → export CSV.

Full walkthrough: [https://hridlink.vercel.app/demo](https://hridlink.vercel.app/demo)

## Onboarding real beta users (not demo emails)

For real pilot staff:

1. They sign up with their own email at `/sign-up` (mobile required).
2. Admin opens **Admin → Team** and promotes to Cardiologist or Admin.
3. Track cases in [PILOT-OPERATING-LOG.md](./PILOT-OPERATING-LOG.md).

Do **not** share `HridLinkDemo2026!` with production pilot staff — they choose their own passwords.

## Re-seed demo data

```bash
NEXT_PUBLIC_APP_URL=https://hridlink.vercel.app npm run db:seed-beta
```

## Related

- [MSG91-WHATSAPP-SETUP.md](./MSG91-WHATSAPP-SETUP.md) — enable WhatsApp alerts
- [DEPLOYED-URL-ONBOARDING.md](./DEPLOYED-URL-ONBOARDING.md) — production env setup
