# Role deep dive - Admin (district / clinic operator)

Post-demo expansion roadmap for the operator who reports metrics and manages staff. First demo only needs the existing stats + team screens.

## Today (shipped)

- Stats dashboard: totals, pending/reviewed, completion rate, median response, severity mix, recent records - [app/(protected)/admin/admin-dashboard.tsx](<../app/(protected)/admin/admin-dashboard.tsx>), `GET /api/admin/stats`.
- Team management: list users, promote/demote role - `GET /api/admin/users`, `PATCH /api/admin/users/:id/role` in [api-fly/src/index.ts](../api-fly/src/index.ts).
- CSV export for district reporting.

## Pain points the code reveals

- No audit trail despite the "audit trail for every case" pitch in [docs/YC-NARRATIVE.md](../docs/YC-NARRATIVE.md).
- No SLA/escalation visibility (overdue pending cases are invisible).
- WhatsApp delivery rate is spot-checked by hand per [docs/PILOT-OPERATING-LOG.md](../docs/PILOT-OPERATING-LOG.md).
- Stats are global; no per-village/district/clinic or per-cardiologist breakdown.
- No date-range filtering; CSV is the only way to slice data.

## Expansion features

### ADM-1 Case audit timeline (high)
- `AuditLog`-backed per-case timeline + filterable audit view. Makes the headline differentiator real. (Mirrors p1-audit.)

### ADM-2 SLA / overdue board (high)
- Live "overdue pending" count and list; escalation status per case. Pairs with p1-sla.

### ADM-3 Delivery-rate panel (high)
- Read from `NotificationLog` (MSG91 message IDs + status) to show real WhatsApp/email delivery instead of manual checks.

### ADM-4 Segmented analytics + date range (medium)
- Filter by date range, district/village, severity, and cardiologist; per-reviewer median response and per-district volume. Server-side aggregation extends `GET /api/admin/stats`.

### ADM-5 Multi-tenant / clinic scoping (medium)
- `Clinic`/`Org` entity; scope dashboards and CSV per district for per-clinic SaaS billing. (Mirrors p4-tenant.)

### ADM-6 Consent + compliance view (medium)
- Surface `consentGivenAt`/version per patient; flag missing consent. Supports DPDP story.

### ADM-7 Staff invite + onboarding (low)
- Email/WhatsApp invite flow with pre-assigned role instead of sign-up-then-promote; removes a pilot onboarding step.

### ADM-8 Scheduled report export (low)
- Weekly CSV/email summary auto-sent (feeds the Friday pilot summary in the operating log).

## Suggested order
ADM-1 -> ADM-2 -> ADM-3 -> ADM-4 -> ADM-6 -> ADM-5 -> ADM-7 -> ADM-8
