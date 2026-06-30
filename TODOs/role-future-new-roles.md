# Role deep dive - Future new roles (post-demo expansion)

New personas to introduce as HridLink grows beyond the 3 seeded roles (`HEALTH_WORKER`, `CARDIOLOGIST`, `ADMIN` in [prisma/schema.prisma](../prisma/schema.prisma)). None are needed for the first demo. Each would extend the `UserRole` enum and the role gating in [api-fly/src/index.ts](../api-fly/src/index.ts).

## NR-1 Patient (self-service) - medium

The patient currently has no login; they exist only as a `Patient` record.

- Read-only access to their own ECG results + recommendation (link via verified phone OTP).
- Consent management (view/withdraw) supporting DPDP rights.
- Schema: link `Patient` to an optional auth identity; scope reads to own records only.
- Value: closes the loop directly with the patient, not just the health worker.

## NR-2 District Health Officer / Supervisor - high (Phase 2 wedge)

A read-only oversight role above Admin-per-clinic.

- Cross-clinic dashboards (volume, median response, urgent counts) once multi-tenant (p4-tenant) lands.
- No PHI editing; aggregate + export only.
- Value: this is the buyer persona for per-district SaaS - build once there are 2+ clinics.

## NR-3 Senior / on-call Cardiologist (escalation tier) - medium

A second reviewer tier for escalations and second opinions.

- Receives SLA escalations (p1-sla) and explicit "second opinion" requests.
- Can add an addendum (CARD-5) to another reviewer's finding.
- Schema: on-call roster (p4-routing) + escalation routing rules.

## NR-4 Referral hospital coordinator - low

Receives URGENT referrals downstream of a finding.

- Sees only URGENT cases routed to their facility + patient contact.
- Acknowledge "referral received / patient arrived" -> extends close-the-loop chain.
- Value: turns an URGENT finding into a tracked referral, strong outcome evidence for YC.

## NR-5 Operator / super-admin (platform) - low

Internal HridLink staff managing clinics/orgs, billing, and feature flags across tenants. Needed only once multi-tenant + billing exist.

## Cross-cutting prerequisites
- RBAC: most new roles need finer-grained permissions than the current 3-value enum - consider a capabilities/permissions layer before NR-2/NR-5.
- Multi-tenant (`Clinic`/`Org`) underpins NR-2 and NR-5.
- Audit trail (p1-audit) should exist before any oversight role to make reports trustworthy.

## Suggested order
NR-2 (after multi-tenant) -> NR-1 -> NR-3 -> NR-4 -> NR-5
