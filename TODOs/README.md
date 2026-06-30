# HridLink TODOs

Product expansion planning. The first demo runs on the existing loop (capture -> route -> review -> close -> measure); everything here is post-demo expansion.

## Files

- [hridlink-feature-roadmap.md](hridlink-feature-roadmap.md) - cross-cutting 4-phase roadmap (audit, SLA, consent, claim, data moat, reliability, network/multi-tenant).
- [role-health-worker.md](role-health-worker.md) - field capture role: offline-first, multi-image, acknowledge, localization.
- [role-cardiologist.md](role-cardiologist.md) - reviewer role: claim/lock, patient history, structured findings, smart queue.
- [role-admin.md](role-admin.md) - operator role: audit timeline, SLA board, delivery rate, segmented analytics, multi-tenant.
- [role-future-new-roles.md](role-future-new-roles.md) - net-new personas: Patient, District Officer, on-call senior cardiologist, referral coordinator, platform super-admin.

## How these relate

The cross-cutting roadmap defines shared building blocks (e.g. `AuditLog`, SLA fields, `EcgAttachment`, multi-tenant). The role files reference those blocks (e.g. CARD-1 == p1-claim) and add role-specific UX on top.

## Priority for "Demo+1"

1. Phase 1 of the main roadmap (makes the YC pitch true).
2. HW-1 offline capture + HW-3 acknowledge (proves rural reliability + loop closure).
3. CARD-1 claim + CARD-2 history (enables a real multi-cardiologist pilot).
4. ADM-1/ADM-2/ADM-3 (audit + SLA + delivery on the admin dashboard).
